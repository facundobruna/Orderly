package repository

import (
	"clase05-solr/internal/dao"
	"clase05-solr/internal/domain"
	"context"
	"errors"
	"fmt"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"log"
	"time"
)

//Archivo: internal/repository/orders_mongo.go
//
//Qué debe hacer:
//- Conectarse a MongoDB usando el driver oficial go.mongodb.org/mongo-driver
//- Implementar métodos:
//- Create(orden *domain.Orden) error
//- GetByID(id string) (*domain.Orden, error)
//- List(filters) ([]domain.Orden, error) - filtrar por negocio, sucursal, estado, usuario
//- Update(id string, orden *domain.Orden) error
//- UpdateStatus(id string, nuevoEstado string) error
//- Delete(id string) error (si es necesario)

type MongoOrdersRepository struct {
	col *mongo.Collection
}

func NewMongoOrdersRepository(ctx context.Context, uri, dbName, collectionName string) *MongoOrdersRepository {
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
		col: client.Database(dbName).Collection(collectionName),
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

	// Insertar en MongoDB
	res, err := r.col.InsertOne(ctx, ordersDAO)
	if err != nil {
		return domain.Orden{}, err
	}

	// Verificar que se insertó correctamente y obtener el ID
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

	// Contar total de documentos que coinciden con los filtros
	total, err := r.col.CountDocuments(ctx, filterset)
	if err != nil {
		return domain.PaginatedOrdenResponse{}, err
	}

	// Buscar con paginación
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

	// Retornar estructura paginada
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

	// Convertir a DAO
	ordersDAO := dao.FromDomain(orden)
	ordersDAO.ID = objectID
	ordersDAO.UpdatedAt = time.Now().UTC()

	// Construir update
	update := bson.M{
		"$set": bson.M{
			"items":         ordersDAO.Items,
			"subtotal":      ordersDAO.Subtotal,
			"total":         ordersDAO.Total,
			"observaciones": ordersDAO.Observaciones,
			"updated_at":    ordersDAO.UpdatedAt,
		},
	}

	// Ejecutar update en MongoDB
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

// UpdateStatus actualiza solo el estado de una orden
func (r *MongoOrdersRepository) UpdateStatus(ctx context.Context, id string, nuevoEstado string) (domain.Orden, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return domain.Orden{}, errors.New("invalid ObjectID format")
	}
	if !domain.ValidarEstado(nuevoEstado) {
		return domain.Orden{}, fmt.Errorf("estado inválido: %s", nuevoEstado)
	}
	// Construir update solo del estado
	update := bson.M{
		"$set": bson.M{
			"estado":     nuevoEstado,
			"updated_at": time.Now().UTC(),
		},
	}

	// Ejecutar update
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

func (r *MongoOrdersRepository) Delete(ctx context.Context, id string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return errors.New("invalid ObjectID format")
	}

	// En vez de eliminar, cambiar estado a "cancelado"
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
