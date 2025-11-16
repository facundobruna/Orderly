package repository

import (
	"context"
	"fmt"
	"orders-api/internal/domain"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type GroupOrderRepository struct {
	collection *mongo.Collection
}

func NewGroupOrderRepository(db *mongo.Database) *GroupOrderRepository {
	return &GroupOrderRepository{
		collection: db.Collection("group_orders"),
	}
}

func (r *GroupOrderRepository) Create(ctx context.Context, groupOrder *domain.GroupOrder) error {
	groupOrder.CreatedAt = time.Now()
	groupOrder.UpdatedAt = time.Now()

	result, err := r.collection.InsertOne(ctx, groupOrder)
	if err != nil {
		return fmt.Errorf("error creating group order: %w", err)
	}

	groupOrder.ID = result.InsertedID.(primitive.ObjectID).Hex()
	return nil
}

func (r *GroupOrderRepository) FindByID(ctx context.Context, id string) (*domain.GroupOrder, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, fmt.Errorf("invalid id: %w", err)
	}

	var groupOrder domain.GroupOrder
	err = r.collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&groupOrder)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("group order not found")
		}
		return nil, fmt.Errorf("error finding group order: %w", err)
	}

	groupOrder.ID = objectID.Hex()
	return &groupOrder, nil
}

func (r *GroupOrderRepository) FindByOrdenID(ctx context.Context, ordenID string) (*domain.GroupOrder, error) {
	var groupOrder domain.GroupOrder
	err := r.collection.FindOne(ctx, bson.M{"orden_original_id": ordenID}).Decode(&groupOrder)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, fmt.Errorf("error finding group order: %w", err)
	}

	return &groupOrder, nil
}

func (r *GroupOrderRepository) Update(ctx context.Context, groupOrder *domain.GroupOrder) error {
	objectID, err := primitive.ObjectIDFromHex(groupOrder.ID)
	if err != nil {
		return fmt.Errorf("invalid id: %w", err)
	}

	groupOrder.UpdatedAt = time.Now()

	update := bson.M{
		"$set": bson.M{
			"sub_ordenes": groupOrder.SubOrdenes,
			"completado":  groupOrder.Completado,
			"updated_at":  groupOrder.UpdatedAt,
		},
	}

	_, err = r.collection.UpdateOne(ctx, bson.M{"_id": objectID}, update)
	if err != nil {
		return fmt.Errorf("error updating group order: %w", err)
	}

	return nil
}
