package clients

import (
	"context"
	"log"
	"products-api/internal/domain"
	"products-api/internal/services"
)

// ProductoGetter define la interfaz para obtener productos
type ProductoGetter interface {
	GetByID(ctx context.Context, id string) (domain.Producto, error)
}

// SolrConsumer consume eventos de RabbitMQ e indexa en Solr
type SolrConsumer struct {
	rabbitClient   *RabbitMQClient
	solrClient     *SolrClient
	productoGetter ProductoGetter
}

// NewSolrConsumer crea una nueva instancia del consumer
func NewSolrConsumer(rabbitClient *RabbitMQClient, solrClient *SolrClient, productoGetter ProductoGetter) *SolrConsumer {
	return &SolrConsumer{
		rabbitClient:   rabbitClient,
		solrClient:     solrClient,
		productoGetter: productoGetter,
	}
}

// Start inicia el consumer de RabbitMQ para indexar en Solr
func (c *SolrConsumer) Start(ctx context.Context) {
	log.Println("Starting Solr consumer for RabbitMQ events...")

	if err := c.rabbitClient.Consume(ctx, c.handleEvent); err != nil {
		log.Printf("Error in Solr consumer: %v", err)
	}

	log.Println("Solr consumer stopped.")
}

// handleEvent procesa los eventos de productos e indexa en Solr
func (c *SolrConsumer) handleEvent(ctx context.Context, event services.ProductoEvent) error {
	log.Printf("Solr consumer processing: action=%s, item_id=%s", event.Action, event.ItemID)

	switch event.Action {
	case "create", "update":
		// Obtener producto completo de MongoDB
		producto, err := c.productoGetter.GetByID(ctx, event.ItemID)
		if err != nil {
			log.Printf("Error getting product %s for Solr indexing: %v", event.ItemID, err)
			return err
		}

		// Indexar en Solr
		if err := c.solrClient.Index(producto); err != nil {
			log.Printf("Error indexing product %s in Solr: %v", event.ItemID, err)
			return err
		}

		log.Printf("Product %s indexed in Solr successfully", event.ItemID)

	case "delete":
		// Eliminar de Solr
		if err := c.solrClient.Delete(event.ItemID); err != nil {
			log.Printf("Error deleting product %s from Solr: %v", event.ItemID, err)
			return err
		}

		log.Printf("Product %s deleted from Solr successfully", event.ItemID)

	default:
		log.Printf("Unknown action for Solr consumer: %s", event.Action)
	}

	return nil
}