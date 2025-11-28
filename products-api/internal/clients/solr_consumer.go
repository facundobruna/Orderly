package clients

import (
	"context"
	"log"
	"products-api/internal/domain"
	"products-api/internal/services"
)

type ProductoGetter interface {
	GetByID(ctx context.Context, id string) (domain.Producto, error)
}

type SolrConsumer struct {
	rabbitClient   *RabbitMQClient
	solrClient     *SolrClient
	productoGetter ProductoGetter
}

func NewSolrConsumer(rabbitClient *RabbitMQClient, solrClient *SolrClient, productoGetter ProductoGetter) *SolrConsumer {
	return &SolrConsumer{
		rabbitClient:   rabbitClient,
		solrClient:     solrClient,
		productoGetter: productoGetter,
	}
}

func (c *SolrConsumer) Start(ctx context.Context) {
	log.Println("Starting Solr consumer for RabbitMQ events...")

	if err := c.rabbitClient.Consume(ctx, c.handleEvent); err != nil {
		log.Printf("Error in Solr consumer: %v", err)
	}

	log.Println("Solr consumer stopped.")
}

func (c *SolrConsumer) handleEvent(ctx context.Context, event services.ProductoEvent) error {
	log.Printf("Solr consumer processing: action=%s, item_id=%s", event.Action, event.ItemID)

	switch event.Action {
	case "create", "update":
		producto, err := c.productoGetter.GetByID(ctx, event.ItemID)
		if err != nil {
			log.Printf("Error getting product %s for Solr indexing: %v", event.ItemID, err)
			return err
		}
		if err := c.solrClient.Index(producto); err != nil {
			log.Printf("Error indexing product %s in Solr: %v", event.ItemID, err)
			return err
		}

		log.Printf("Product %s indexed in Solr successfully", event.ItemID)

	case "delete":
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
