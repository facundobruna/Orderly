package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/rabbitmq/amqp091-go"
)

// Evento representa el mensaje publicado por products-api
type Evento struct {
	Action string `json:"action"`
	ItemID string `json:"item_id"`
}

func main() {
	// Conectar a RabbitMQ
	connStr := "amqp://admin:admin@localhost:5672/"
	conn, err := amqp091.Dial(connStr)
	if err != nil {
		log.Fatalf("Error conectando a RabbitMQ: %v", err)
	}
	defer conn.Close()
	log.Println("Conectado a RabbitMQ")

	// Abrir canal
	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("Error abriendo canal: %v", err)
	}
	defer ch.Close()

	// Nombre de la cola (debe coincidir con la del publisher)
	queueName := "productos-events"

	// Declarar la cola (idempotente, no la recrea si ya existe)
	q, err := ch.QueueDeclare(
		queueName, // name
		false,     // durable
		false,     // delete when unused
		false,     // exclusive
		false,     // no-wait
		nil,       // arguments
	)
	if err != nil {
		log.Fatalf("Error declarando cola: %v", err)
	}

	// Consumir mensajes
	msgs, err := ch.Consume(
		q.Name, // queue
		"",     // consumer (nombre vacío = autogenerado)
		true,   // auto-ack (confirma automáticamente)
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
	if err != nil {
		log.Fatalf("Error consumiendo mensajes: %v", err)
	}

	// Canal para manejar señales del sistema (Ctrl+C)
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	fmt.Println("\n┌─────────────────────────────────────────┐")
	fmt.Println("│  Consumidor de eventos de productos    │")
	fmt.Println("│  Escuchando cola: productos-events     │")
	fmt.Println("│  Presiona Ctrl+C para salir            │")
	fmt.Println("└─────────────────────────────────────────┘\n")

	// Procesar mensajes en una goroutine
	go func() {
		for msg := range msgs {
			// Parsear el mensaje JSON
			var evento Evento
			if err := json.Unmarshal(msg.Body, &evento); err != nil {
				log.Printf("Error parseando mensaje: %v", err)
				continue
			}

			// Mostrar el evento con formato bonito
			emoji := getActionEmoji(evento.Action)
			fmt.Printf("%s Evento recibido:\n", emoji)
			fmt.Printf("   └─ Acción: %s\n", evento.Action)
			fmt.Printf("   └─ ID del producto: %s\n", evento.ItemID)
			fmt.Printf("   └─ Timestamp: %s\n", msg.Timestamp)
			fmt.Println()

			// Aquí puedes agregar tu lógica de negocio
			// Por ejemplo: actualizar caché, enviar notificaciones, etc.
			handleEvent(evento)
		}
	}()

	// Esperar señal de terminación
	<-sigChan
	fmt.Println("\n\nCerrando consumidor...")
}

// handleEvent procesa el evento según su tipo
func handleEvent(evento Evento) {
	switch evento.Action {
	case "create":
		fmt.Println("   💡 Acción sugerida: Indexar en Solr, actualizar caché")
	case "update":
		fmt.Println("   💡 Acción sugerida: Actualizar índice en Solr, invalidar caché")
	case "delete":
		fmt.Println("   💡 Acción sugerida: Eliminar de Solr, eliminar de caché")
	default:
		fmt.Println("   ⚠️  Acción desconocida")
	}
}

// getActionEmoji devuelve un emoji según la acción
func getActionEmoji(action string) string {
	switch action {
	case "create":
		return "✨"
	case "update":
		return "🔄"
	case "delete":
		return "🗑️ "
	default:
		return "📩"
	}
}