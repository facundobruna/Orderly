package clients

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"products-api/internal/services"
	"time"

	"github.com/google/uuid"
	"github.com/rabbitmq/amqp091-go"
)

const (
	encodingJSON = "application/json"
	encodingUTF8 = "UTF-8"
)

type RabbitMQClient struct {
	connection *amqp091.Connection
	channel    *amqp091.Channel
	queue      *amqp091.Queue
}

func NewRabbitMQClient(user, password, queueName, host, port string) *RabbitMQClient {
	connStr := fmt.Sprintf("amqp://%s:%s@%s:%s/", user, password, host, port)
	connection, err := amqp091.Dial(connStr)
	if err != nil {
		log.Fatalf("failed to connect to RabbitMQ: %v", err)
	}
	channel, err := connection.Channel()
	if err != nil {
		log.Fatalf("failed to open a channel: %v", err)
	}
	queue, err := channel.QueueDeclare(queueName, false, false, false, false, nil)
	if err != nil {
		log.Fatalf("failed to declare a queue: %v", err)
	}
	log.Printf("RabbitMQ client initialized - Queue: %s", queueName)
	return &RabbitMQClient{connection: connection, channel: channel, queue: &queue}
}

func (r *RabbitMQClient) Publish(ctx context.Context, action string, itemID string) error {
	message := map[string]interface{}{
		"action":  action,
		"item_id": itemID,
	}

	bytes, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("error marshalling message to JSON: %w", err)
	}

	if err := r.channel.PublishWithContext(ctx, "", r.queue.Name, false, false, amqp091.Publishing{
		ContentType:     encodingJSON,
		ContentEncoding: encodingUTF8,
		DeliveryMode:    amqp091.Transient,
		MessageId:       uuid.New().String(),
		Timestamp:       time.Now().UTC(),
		AppId:           "products-api",
		Body:            bytes,
	}); err != nil {
		return fmt.Errorf("error publishing message to RabbitMQ: %w", err)
	}

	log.Printf("Published to RabbitMQ: action=%s, item_id=%s", action, itemID)
	return nil
}

// Consume inicia el consumo de mensajes de la cola
func (r *RabbitMQClient) Consume(ctx context.Context, handler func(context.Context, services.ProductoEvent) error) error {
	// Configurar el consumer
	msgs, err := r.channel.Consume(
		r.queue.Name, // queue
		"",           // consumer
		true,         // auto-ack
		false,        // exclusive
		false,        // no-local
		false,        // no-wait
		nil,          // args
	)
	if err != nil {
		return fmt.Errorf("failed to register consumer: %w", err)
	}

	log.Printf("Consumer registered for queue: %s", r.queue.Name)

	// Loop infinito para consumir mensajes
	for {
		select {
		case <-ctx.Done():
			log.Println("Consumer context cancelled")
			return ctx.Err()

		case msg := <-msgs:
			// Deserializar mensaje
			var event services.ProductoEvent
			if err := json.Unmarshal(msg.Body, &event); err != nil {
				log.Printf("Error unmarshalling message: %v", err)
				continue
			}

			log.Printf("Received message: action=%s, item_id=%s", event.Action, event.ItemID)

			// Procesar mensaje
			if err := handler(ctx, event); err != nil {
				log.Printf("Error handling message: %v", err)
			}
		}
	}
}
