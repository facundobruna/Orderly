package clients

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/bradfitz/gomemcache/memcache"
)

// MemcachedClient es el cliente para interactuar con Memcached
type MemcachedClient struct {
	client *memcache.Client
	ttl    int32 // Time To Live en segundos
}

// NewMemcachedClient crea una nueva instancia del cliente Memcached
func NewMemcachedClient(addr string, ttl int) *MemcachedClient {
	mc := memcache.New(addr)

	// Configuración del cliente
	mc.Timeout = 100 * time.Millisecond
	mc.MaxIdleConns = 10

	return &MemcachedClient{
		client: mc,
		ttl:    int32(ttl),
	}
}

// Get obtiene un valor de la caché y lo deserializa
// Retorna ErrCacheMiss si la clave no existe
func (c *MemcachedClient) Get(key string, dest interface{}) error {
	item, err := c.client.Get(key)
	if err != nil {
		// Si no existe en caché, retornamos el error de memcache
		return err
	}

	// Deserializar JSON
	if err := json.Unmarshal(item.Value, dest); err != nil {
		return fmt.Errorf("error deserializando de caché: %w", err)
	}

	return nil
}

// Set guarda un valor en la caché serializándolo como JSON
func (c *MemcachedClient) Set(key string, value interface{}) error {
	// Serializar a JSON
	bytes, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("error serializando a JSON: %w", err)
	}

	// Guardar en caché
	item := &memcache.Item{
		Key:        key,
		Value:      bytes,
		Expiration: c.ttl,
	}

	if err := c.client.Set(item); err != nil {
		return fmt.Errorf("error guardando en caché: %w", err)
	}

	return nil
}

// Delete elimina una clave de la caché
func (c *MemcachedClient) Delete(key string) error {
	// Memcached retorna ErrCacheMiss si la clave no existe
	// Pero para nosotros eso no es un error, así que lo ignoramos
	err := c.client.Delete(key)
	if err != nil && err != memcache.ErrCacheMiss {
		return fmt.Errorf("error eliminando de caché: %w", err)
	}
	return nil
}

// Ping verifica que el servidor esté disponible
func (c *MemcachedClient) Ping() error {
	return c.client.Ping()
}

// BuildKey construye una clave con prefijo para evitar colisiones
// Ejemplo: BuildKey("producto", "123") -> "producto:123"
func BuildKey(prefix, id string) string {
	return fmt.Sprintf("%s:%s", prefix, id)
}
