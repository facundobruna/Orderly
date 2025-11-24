package clients

import (
	"context"
	"log"
	"orders-api/internal/domain"
)

// OrderGetter define la interfaz para obtener órdenes
type OrderGetter interface {
	GetByID(ctx context.Context, id string) (domain.Orden, error)
}

// SolrConsumer consume eventos de RabbitMQ e indexa en Solr
type SolrConsumer struct {
	rabbitClient *RabbitMQClient
	solrClient   *SolrClient
	orderGetter  OrderGetter
}

// NewSolrConsumer crea una nueva instancia del consumer
func NewSolrConsumer(rabbitClient *RabbitMQClient, solrClient *SolrClient, orderGetter OrderGetter) *SolrConsumer {
	return &SolrConsumer{
		rabbitClient: rabbitClient,
		solrClient:   solrClient,
		orderGetter:  orderGetter,
	}
}

// Start inicia el consumer de RabbitMQ para indexar en Solr
func (c *SolrConsumer) Start(ctx context.Context) {
	log.Println("Starting Solr consumer for orders events...")

	if err := c.rabbitClient.Consume(ctx, c.handleEvent); err != nil {
		log.Printf("Error in Solr consumer: %v", err)
	}

	log.Println("Solr consumer stopped.")
}

// handleEvent procesa los eventos de órdenes e indexa en Solr
func (c *SolrConsumer) handleEvent(ctx context.Context, event OrderEvent) error {
	log.Printf("Solr consumer processing: action=%s, order_id=%s", event.Action, event.OrderID)

	switch event.Action {
	case "order_created", "order_status_changed", "create", "update", "status_update":
		// Obtener orden completa de MongoDB
		orden, err := c.orderGetter.GetByID(ctx, event.OrderID)
		if err != nil {
			log.Printf("Error getting order %s for Solr indexing: %v", event.OrderID, err)
			return err
		}

		// Indexar en Solr
		if err := c.solrClient.Index(orden); err != nil {
			log.Printf("Error indexing order %s in Solr: %v", event.OrderID, err)
			return err
		}

		log.Printf("Order %s indexed in Solr successfully", event.OrderID)

	case "order_cancelled", "delete", "cancel":
		// Para cancelaciones, actualizamos el índice (no eliminamos)
		orden, err := c.orderGetter.GetByID(ctx, event.OrderID)
		if err != nil {
			log.Printf("Error getting order %s for Solr update: %v", event.OrderID, err)
			return err
		}

		if err := c.solrClient.Index(orden); err != nil {
			log.Printf("Error updating order %s in Solr: %v", event.OrderID, err)
			return err
		}

		log.Printf("Order %s updated in Solr (cancelled)", event.OrderID)

	default:
		log.Printf("Unknown action for Solr consumer: %s", event.Action)
	}

	return nil
}