package repository

import (
	"clase05-solr/internal/dao"
	"clase05-solr/internal/domain"
	"context"
	"errors"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// MongoProductosRepository implementa el repositorio de productos con MongoDB
type MongoProductosRepository struct {
	col *mongo.Collection
}

// NewMongoProductosRepository crea una nueva instancia del repository
func NewMongoProductosRepository(ctx context.Context, uri, dbName, collectionName string) *MongoProductosRepository {
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

	log.Println("✅ Conexión exitosa a MongoDB (Products)")

	return &MongoProductosRepository{
		col: client.Database(dbName).Collection(collectionName),
	}
}

// Create inserta un nuevo producto
func (r *MongoProductosRepository) Create(ctx context.Context, producto domain.Producto) (domain.Producto, error) {
	productoDAO := dao.FromDomain(producto)
	productoDAO.ID = primitive.NewObjectID()
	productoDAO.CreatedAt = time.Now().UTC()
	productoDAO.UpdatedAt = time.Now().UTC()
	
	if producto.Disponible == false && producto.PrecioBase > 0 {
		productoDAO.Disponible = true
	}

	res, err := r.col.InsertOne(ctx, productoDAO)
	if err != nil {
		return domain.Producto{}, err
	}

	if oid, ok := res.InsertedID.(primitive.ObjectID); ok {
		productoDAO.ID = oid
	} else {
		return domain.Producto{}, errors.New("failed to convert inserted ID to ObjectID")
	}

	return productoDAO.ToDomain(), nil
}

// GetByID busca un producto por su ID
func (r *MongoProductosRepository) GetByID(ctx context.Context, id string) (domain.Producto, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return domain.Producto{}, errors.New("invalid ObjectID format")
	}

	var productoDAO dao.Producto
	filter := bson.M{"_id": objectID}
	err = r.col.FindOne(ctx, filter).Decode(&productoDAO)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return domain.Producto{}, errors.New("producto no encontrado")
		}
		return domain.Producto{}, err
	}

	return productoDAO.ToDomain(), nil
}

// List retorna productos con filtros y paginación
func (r *MongoProductosRepository) List(ctx context.Context, filters domain.SearchFilters) (domain.PaginatedResponse, error) {
	// Construir filtro de búsqueda
	filter := bson.M{}

	if filters.NegocioID != "" {
		filter["negocio_id"] = filters.NegocioID
	}

	if filters.SucursalID != "" {
		filter["sucursal_id"] = filters.SucursalID
	}

	if filters.Categoria != "" {
		filter["categoria"] = filters.Categoria
	}

	if filters.Nombre != "" {
		filter["nombre"] = bson.M{"$regex": filters.Nombre, "$options": "i"} // búsqueda case-insensitive
	}

	if len(filters.Tags) > 0 {
		filter["tags"] = bson.M{"$in": filters.Tags}
	}

	if filters.Disponible != nil {
		filter["disponible"] = *filters.Disponible
	}

	// Configurar paginación
	page := filters.Page
	if page < 1 {
		page = 1
	}
	limit := filters.Limit
	if limit < 1 {
		limit = 10
	}

	skip := int64((page - 1) * limit)

	// Contar total de documentos
	total, err := r.col.CountDocuments(ctx, filter)
	if err != nil {
		return domain.PaginatedResponse{}, err
	}

	// Buscar documentos con paginación
	opts := options.Find().SetSkip(skip).SetLimit(int64(limit)).SetSort(bson.D{{Key: "created_at", Value: -1}})
	cur, err := r.col.Find(ctx, filter, opts)
	if err != nil {
		return domain.PaginatedResponse{}, err
	}
	defer cur.Close(ctx)

	var productosDAO []dao.Producto
	if err := cur.All(ctx, &productosDAO); err != nil {
		return domain.PaginatedResponse{}, err
	}

	// Convertir a domain
	productos := make([]domain.Producto, len(productosDAO))
	for i, p := range productosDAO {
		productos[i] = p.ToDomain()
	}

	return domain.PaginatedResponse{
		Page:    page,
		Limit:   limit,
		Total:   total,
		Results: productos,
	}, nil
}

// Update actualiza un producto existente
func (r *MongoProductosRepository) Update(ctx context.Context, id string, req domain.UpdateProductoRequest) (domain.Producto, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return domain.Producto{}, errors.New("invalid ObjectID format")
	}

	// Construir update dinámico
	update := bson.M{
		"$set": bson.M{
			"updated_at": time.Now().UTC(),
		},
	}

	setFields := update["$set"].(bson.M)

	if req.Nombre != nil {
		setFields["nombre"] = *req.Nombre
	}
	if req.Descripcion != nil {
		setFields["descripcion"] = *req.Descripcion
	}
	if req.PrecioBase != nil {
		setFields["precio_base"] = *req.PrecioBase
	}
	if req.Categoria != nil {
		setFields["categoria"] = *req.Categoria
	}
	if req.ImagenURL != nil {
		setFields["imagen_url"] = *req.ImagenURL
	}
	if req.Disponible != nil {
		setFields["disponible"] = *req.Disponible
	}
	if req.Variantes != nil {
		// Convertir variantes domain a DAO
		variantes := make([]dao.Variante, len(*req.Variantes))
		for i, v := range *req.Variantes {
			variantes[i] = dao.Variante{
				Nombre:          v.Nombre,
				PrecioAdicional: v.PrecioAdicional,
			}
		}
		setFields["variantes"] = variantes
	}
	if req.Modificadores != nil {
		// Convertir modificadores domain a DAO
		modificadores := make([]dao.Modificador, len(*req.Modificadores))
		for i, m := range *req.Modificadores {
			modificadores[i] = dao.Modificador{
				Nombre:          m.Nombre,
				PrecioAdicional: m.PrecioAdicional,
				EsObligatorio:   m.EsObligatorio,
			}
		}
		setFields["modificadores"] = modificadores
	}
	if req.Tags != nil {
		setFields["tags"] = *req.Tags
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
			return domain.Producto{}, errors.New("producto no encontrado")
		}
		return domain.Producto{}, result.Err()
	}

	var productoDAO dao.Producto
	if err := result.Decode(&productoDAO); err != nil {
		return domain.Producto{}, err
	}

	return productoDAO.ToDomain(), nil
}

// Delete elimina un producto por ID
func (r *MongoProductosRepository) Delete(ctx context.Context, id string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return errors.New("invalid ObjectID format")
	}

	filter := bson.M{"_id": objectID}
	result, err := r.col.DeleteOne(ctx, filter)
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return errors.New("producto no encontrado")
	}

	return nil
}

// Quote calcula el precio total de un producto con variantes y modificadores seleccionados
func (r *MongoProductosRepository) Quote(ctx context.Context, id string, varianteNombre string, modificadoresNombres []string) (float64, error) {
	producto, err := r.GetByID(ctx, id)
	if err != nil {
		return 0, err
	}

	total := producto.PrecioBase

	// Agregar precio de variante seleccionada
	if varianteNombre != "" {
		encontrada := false
		for _, v := range producto.Variantes {
			if v.Nombre == varianteNombre {
				total += v.PrecioAdicional
				encontrada = true
				break
			}
		}
		if !encontrada {
			return 0, errors.New("variante no encontrada")
		}
	}

	// Agregar precios de modificadores seleccionados
	for _, nombreMod := range modificadoresNombres {
		encontrado := false
		for _, m := range producto.Modificadores {
			if m.Nombre == nombreMod {
				total += m.PrecioAdicional
				encontrado = true
				break
			}
		}
		if !encontrado {
			return 0, errors.New("modificador '" + nombreMod + "' no encontrado")
		}
	}

	return total, nil
}
