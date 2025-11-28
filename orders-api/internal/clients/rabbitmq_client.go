package clients

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
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
	user       string
	password   string
	queueName  string
	host       string
	port       string
}

func NewRabbitMQClient(user, password, queueName, host, port string) *RabbitMQClient {
	client := &RabbitMQClient{
		user:      user,
		password:  password,
		queueName: queueName,
		host:      host,
		port:      port,
	}

	if err := client.connect(); err != nil {
		log.Fatalf("failed to connect to RabbitMQ: %v", err)
	}

	return client
}

func (r *RabbitMQClient) connect() error {
	connStr := fmt.Sprintf("amqp://%s:%s@%s:%s/", r.user, r.password, r.host, r.port)
	connection, err := amqp091.Dial(connStr)
	if err != nil {
		return fmt.Errorf("failed to dial RabbitMQ: %w", err)
	}

	channel, err := connection.Channel()
	if err != nil {
		connection.Close()
		return fmt.Errorf("failed to open channel: %w", err)
	}

	queue, err := channel.QueueDeclare(r.queueName, false, false, false, false, nil)
	if err != nil {
		channel.Close()
		connection.Close()
		return fmt.Errorf("failed to declare queue: %w", err)
	}

	r.connection = connection
	r.channel = channel
	r.queue = &queue

	log.Printf("Connected to RabbitMQ: %s:%s", r.host, r.port)
	return nil
}

func (r *RabbitMQClient) ensureConnection() error {

	if r.connection == nil || r.connection.IsClosed() {
		log.Println("RabbitMQ connection is closed, reconnecting...")
		return r.connect()
	}

	if r.channel == nil || r.channel.IsClosed() {
		log.Println("RabbitMQ channel is closed, reopening...")
		channel, err := r.connection.Channel()
		if err != nil {
			log.Println("Failed to reopen channel, reconnecting...")
			return r.connect()
		}
		r.channel = channel
	}

	return nil
}

func (r *RabbitMQClient) Publish(ctx context.Context, action string, orderID string) error {

	if err := r.ensureConnection(); err != nil {
		return fmt.Errorf("failed to ensure RabbitMQ connection: %w", err)
	}

	message := map[string]interface{}{
		"action":   action,
		"order_id": orderID,
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
		AppId:           "orders-api",
		Body:            bytes,
	}); err != nil {
		return fmt.Errorf("error publishing message to RabbitMQ: %w", err)
	}
	return nil
}

type OrderEvent struct {
	Action  string `json:"action"`
	OrderID string `json:"order_id"`
}

func (r *RabbitMQClient) Consume(ctx context.Context, handler func(context.Context, OrderEvent) error) error {
	// Configurar el consumer
	msgs, err := r.channel.Consume(
		r.queue.Name,
		"",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return fmt.Errorf("failed to register consumer: %w", err)
	}

	log.Printf("Consumer registered for queue: %s", r.queue.Name)
	for {
		select {
		case <-ctx.Done():
			log.Println("Consumer context cancelled")
			return ctx.Err()

		case msg := <-msgs:

			var event OrderEvent
			if err := json.Unmarshal(msg.Body, &event); err != nil {
				log.Printf("Error unmarshalling message: %v", err)
				continue
			}

			if err := handler(ctx, event); err != nil {
				log.Printf("Error handling message: %v", err)
			}
		}
	}
}
