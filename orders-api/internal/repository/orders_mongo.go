package repository

import (
	"context"
	"errors"
	"fmt"
	"log"
	"orders-api/internal/dao"
	"orders-api/internal/domain"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoOrdersRepository struct {
	col        *mongo.Collection
	solrClient SolrSearchClient
}

type SolrSearchClient interface {
	Search(query string, filters map[string]string) ([]string, error)
	Index(orden domain.Orden) error
	Update(orden domain.Orden) error
	Delete(id string) error
}

func NewMongoOrdersRepository(ctx context.Context, uri, dbName, collectionName string, solrClient SolrSearchClient) *MongoOrdersRepository {
	opt := options.Client().ApplyURI(uri)
	opt.SetServerSelectionTimeout(10 * time.Second)

	client, err := mongo.Connect(ctx, opt)
	if err != nil {
		log.Fatalf("Error connecting to MongoDB: %v", err)
		return nil
	}

	pingCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	if err := client.Ping(pingCtx, nil); err != nil {
		log.Fatalf("Error pinging MongoDB: %v", err)
		return nil
	}

	log.Println("Conexión exitosa a MongoDB (Orders)")

	return &MongoOrdersRepository{
		col:        client.Database(dbName).Collection(collectionName),
		solrClient: solrClient,
	}
}

func (r *MongoOrdersRepository) GetByID(ctx context.Context, id string) (domain.Orden, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return domain.Orden{}, errors.New("invalid ObjectID format")
	}
	var ordersDAO dao.Orden
	filter := bson.M{"_id": objectID}
	err = r.col.FindOne(ctx, filter).Decode(&ordersDAO)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return domain.Orden{}, errors.New("orden no encontrada")
		}
		return domain.Orden{}, err
	}
	return ordersDAO.ToDomain(), nil
}

func (r *MongoOrdersRepository) Create(ctx context.Context, orden domain.Orden) (domain.Orden, error) {
	ordersDAO := dao.FromDomain(orden)
	ordersDAO.ID = primitive.NewObjectID()
	ordersDAO.CreatedAt = time.Now().UTC()
	ordersDAO.UpdatedAt = time.Now().UTC()

	if ordersDAO.Estado == "" {
		ordersDAO.Estado = "pendiente"
	}

	res, err := r.col.InsertOne(ctx, ordersDAO)
	if err != nil {
		return domain.Orden{}, err
	}

	if oid, ok := res.InsertedID.(primitive.ObjectID); ok {
		ordersDAO.ID = oid
	} else {
		return domain.Orden{}, errors.New("failed to convert inserted ID to ObjectID")
	}

	created := ordersDAO.ToDomain()

	return created, nil

}

func (r *MongoOrdersRepository) List(ctx context.Context, filters domain.OrderFilters) (domain.PaginatedOrdenResponse, error) {
	filterset := bson.M{}
	if filters.NegocioID != "" {
		filterset["negocio_id"] = filters.NegocioID
	}
	if filters.SucursalID != "" {
		filterset["sucursal_id"] = filters.SucursalID
	}
	if filters.Estado != "" {
		filterset["estado"] = filters.Estado
	}
	if filters.UsuarioID != "" {
		filterset["usuario_id"] = filters.UsuarioID
	}
	if filters.Mesa != "" {
		filterset["mesa"] = filters.Mesa
	}
	page := filters.Page
	if page < 1 {
		page = 1
	}
	limit := filters.Limit
	if limit < 1 {
		limit = 10
	}
	skip := int64((page - 1) * limit)

	total, err := r.col.CountDocuments(ctx, filterset)
	if err != nil {
		return domain.PaginatedOrdenResponse{}, err
	}

	opts := options.Find().SetSkip(skip).SetLimit(int64(limit)).SetSort(bson.D{{Key: "created_at", Value: -1}})
	cursor, err := r.col.Find(ctx, filterset, opts)
	if err != nil {
		return domain.PaginatedOrdenResponse{}, err
	}
	defer cursor.Close(ctx)

	var orders []domain.Orden
	for cursor.Next(ctx) {
		var ordersDAO dao.Orden
		if err := cursor.Decode(&ordersDAO); err != nil {
			return domain.PaginatedOrdenResponse{}, err
		}
		orders = append(orders, ordersDAO.ToDomain())
	}

	if err := cursor.Err(); err != nil {
		return domain.PaginatedOrdenResponse{}, err
	}

	return domain.PaginatedOrdenResponse{
		Page:    page,
		Limit:   limit,
		Total:   total,
		Results: orders,
	}, nil
}

func (r *MongoOrdersRepository) Update(ctx context.Context, id string, orden domain.Orden) (domain.Orden, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return domain.Orden{}, errors.New("invalid ObjectID format")
	}

	ordersDAO := dao.FromDomain(orden)
	ordersDAO.ID = objectID
	ordersDAO.UpdatedAt = time.Now().UTC()

	update := bson.M{
		"$set": bson.M{
			"items":         ordersDAO.Items,
			"subtotal":      ordersDAO.Subtotal,
			"total":         ordersDAO.Total,
			"observaciones": ordersDAO.Observaciones,
			"updated_at":    ordersDAO.UpdatedAt,
		},
	}

	filter := bson.M{"_id": objectID}
	result := r.col.FindOneAndUpdate(
		ctx,
		filter,
		update,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)

	if result.Err() != nil {
		if errors.Is(result.Err(), mongo.ErrNoDocuments) {
			return domain.Orden{}, errors.New("orden no encontrada")
		}
		return domain.Orden{}, result.Err()
	}

	var updatedDAO dao.Orden
	if err := result.Decode(&updatedDAO); err != nil {
		return domain.Orden{}, err
	}

	return updatedDAO.ToDomain(), nil
}

func (r *MongoOrdersRepository) UpdateStatus(ctx context.Context, id string, nuevoEstado string) (domain.Orden, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return domain.Orden{}, errors.New("invalid ObjectID format")
	}
	if !domain.ValidarEstado(nuevoEstado) {
		return domain.Orden{}, fmt.Errorf("estado inválido: %s", nuevoEstado)
	}

	update := bson.M{
		"$set": bson.M{
			"estado":     nuevoEstado,
			"updated_at": time.Now().UTC(),
		},
	}

	filter := bson.M{"_id": objectID}
	result := r.col.FindOneAndUpdate(
		ctx,
		filter,
		update,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)

	if result.Err() != nil {
		if errors.Is(result.Err(), mongo.ErrNoDocuments) {
			return domain.Orden{}, errors.New("orden no encontrada")
		}
		return domain.Orden{}, result.Err()
	}

	var updatedDAO dao.Orden
	if err := result.Decode(&updatedDAO); err != nil {
		return domain.Orden{}, err
	}

	updated := updatedDAO.ToDomain()

	return updated, nil
}

func (r *MongoOrdersRepository) Delete(ctx context.Context, id string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return errors.New("invalid ObjectID format")
	}

	update := bson.M{
		"$set": bson.M{
			"estado":     "cancelado",
			"updated_at": time.Now().UTC(),
		},
	}

	filter := bson.M{"_id": objectID}
	result, err := r.col.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return errors.New("orden no encontrada")
	}

	return nil
}

func (r *MongoOrdersRepository) FindByID(ctx context.Context, id string) (*domain.Orden, error) {
	orden, err := r.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return &orden, nil
}

func (r *MongoOrdersRepository) UpdateOrden(ctx context.Context, orden *domain.Orden) error {
	objectID, err := primitive.ObjectIDFromHex(orden.ID)
	if err != nil {
		return fmt.Errorf("invalid id: %w", err)
	}

	ordenDAO := dao.FromDomain(*orden)
	ordenDAO.ID = objectID
	ordenDAO.UpdatedAt = time.Now().UTC()

	update := bson.M{
		"$set": ordenDAO,
	}

	_, err = r.col.UpdateOne(ctx, bson.M{"_id": objectID}, update)
	if err != nil {
		return fmt.Errorf("error updating orden: %w", err)
	}

	return nil
}

func (r *MongoOrdersRepository) Search(ctx context.Context, query string, filters map[string]string) ([]domain.Orden, error) {
	if r.solrClient == nil {
		return nil, errors.New("solr client not configured")
	}

	ids, err := r.solrClient.Search(query, filters)
	if err != nil {
		return nil, fmt.Errorf("error buscando en Solr: %w", err)
	}

	if len(ids) == 0 {
		return []domain.Orden{}, nil
	}

	objectIDs := make([]primitive.ObjectID, 0, len(ids))
	for _, id := range ids {
		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			log.Printf("Error convirtiendo ID %s a ObjectID: %v", id, err)
			continue
		}
		objectIDs = append(objectIDs, objectID)
	}

	filter := bson.M{"_id": bson.M{"$in": objectIDs}}
	cursor, err := r.col.Find(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("error buscando en MongoDB: %w", err)
	}
	defer cursor.Close(ctx)

	var ordenes []domain.Orden
	for cursor.Next(ctx) {
		var ordenDAO dao.Orden
		if err := cursor.Decode(&ordenDAO); err != nil {
			return nil, err
		}
		ordenes = append(ordenes, ordenDAO.ToDomain())
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return ordenes, nil
}
