package consumers

import (
	"context"
	"log"
	"orders-api/internal/clients"
	"orders-api/internal/domain"
)

type OrderRepository interface {
	GetByID(ctx context.Context, id string) (domain.Orden, error)
}

type SolrIndexer interface {
	Index(orden domain.Orden) error
	Update(orden domain.Orden) error
	Delete(id string) error
}

type SolrIndexerConsumer struct {
	orderRepo   OrderRepository
	solrIndexer SolrIndexer
}

func NewSolrIndexerConsumer(orderRepo OrderRepository, solrIndexer SolrIndexer) *SolrIndexerConsumer {
	return &SolrIndexerConsumer{
		orderRepo:   orderRepo,
		solrIndexer: solrIndexer,
	}
}

func (c *SolrIndexerConsumer) HandleEvent(ctx context.Context, event clients.OrderEvent) error {
	log.Printf("Procesando evento: %s para orden %s", event.Action, event.OrderID)

	switch event.Action {
	case "order_created", "order_status_changed":
		// Obtener la orden de MongoDB
		orden, err := c.orderRepo.GetByID(ctx, event.OrderID)
		if err != nil {
			log.Printf("Error obteniendo orden %s: %v", event.OrderID, err)
			return err
		}

		var indexErr error
		if event.Action == "order_created" {
			indexErr = c.solrIndexer.Index(orden)
		} else {
			indexErr = c.solrIndexer.Update(orden)
		}

		if indexErr != nil {
			log.Printf("Error indexando orden %s en Solr: %v", event.OrderID, indexErr)
			return indexErr
		}

		log.Printf("Orden %s indexada exitosamente en Solr", event.OrderID)

	case "order_cancelled":

		if err := c.solrIndexer.Delete(event.OrderID); err != nil {
			log.Printf("Error eliminando orden %s de Solr: %v", event.OrderID, err)
			return err
		}

		log.Printf(" Orden %s eliminada de Solr", event.OrderID)

	default:
		log.Printf(" Acción desconocida: %s", event.Action)
	}

	return nil
}
