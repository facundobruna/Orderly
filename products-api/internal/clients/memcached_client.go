package clients

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/bradfitz/gomemcache/memcache"
)

type MemcachedClient struct {
	client *memcache.Client
	ttl    int32 // Time To Live en segundos
}

func NewMemcachedClient(addr string, ttl int) *MemcachedClient {
	mc := memcache.New(addr)

	mc.Timeout = 100 * time.Millisecond
	mc.MaxIdleConns = 10

	return &MemcachedClient{
		client: mc,
		ttl:    int32(ttl),
	}
}

func (c *MemcachedClient) Get(key string, dest interface{}) error {
	item, err := c.client.Get(key)
	if err != nil {
		// Si no existe en caché, retornamos el error de memcache
		return err
	}

	if err := json.Unmarshal(item.Value, dest); err != nil {
		return fmt.Errorf("error deserializando de caché: %w", err)
	}

	return nil
}

func (c *MemcachedClient) Set(key string, value interface{}) error {

	bytes, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("error serializando a JSON: %w", err)
	}

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
func (c *MemcachedClient) Delete(key string) error {
	err := c.client.Delete(key)
	if err != nil && err != memcache.ErrCacheMiss {
		return fmt.Errorf("error eliminando de caché: %w", err)
	}
	return nil
}

func (c *MemcachedClient) Ping() error {
	return c.client.Ping()
}

func BuildKey(prefix, id string) string {
	return fmt.Sprintf("%s:%s", prefix, id)
}
