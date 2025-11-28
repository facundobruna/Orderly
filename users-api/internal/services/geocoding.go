package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"
	"users-api/internal/config"
)

type GeocodingService struct {
	client *http.Client
	config config.MapboxConfig
}

type Coordenadas struct {
	Latitud  float64
	Longitud float64
}

type MapboxResponse struct {
	Type     string          `json:"type"`
	Features []MapboxFeature `json:"features"`
}

type MapboxFeature struct {
	ID         string    `json:"id"`
	Type       string    `json:"type"`
	PlaceType  []string  `json:"place_type"`
	PlaceName  string    `json:"place_name"`
	Center     []float64 `json:"center"` // [longitude, latitude]
	Properties struct {
		Accuracy string `json:"accuracy"`
	} `json:"properties"`
}

func NewGeocodingService(cfg config.MapboxConfig) *GeocodingService {
	return &GeocodingService{
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
		config: cfg,
	}
}

func (s *GeocodingService) Geocode(direccion string) (*Coordenadas, error) {

	encodedAddress := url.PathEscape(direccion)
	fullURL := fmt.Sprintf("%s/%s.json", s.config.BaseURL, encodedAddress)

	params := url.Values{}
	params.Add("access_token", s.config.ApiKey)
	params.Add("country", "ar")
	params.Add("limit", "1")
	params.Add("language", "es")

	fullURL = fmt.Sprintf("%s?%s", fullURL, params.Encode())

	req, err := http.NewRequest("GET", fullURL, nil)
	if err != nil {
		return nil, fmt.Errorf("error creando request: %w", err)
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error haciendo request a Mapbox: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("mapbox respondió con status %d", resp.StatusCode)
	}

	var result MapboxResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("error parseando respuesta: %w", err)
	}

	if len(result.Features) == 0 {
		return nil, fmt.Errorf("no se encontraron coordenadas para la dirección: %s", direccion)
	}

	feature := result.Features[0]
	if len(feature.Center) < 2 {
		return nil, fmt.Errorf("formato de coordenadas inválido")
	}

	return &Coordenadas{
		Longitud: feature.Center[0],
		Latitud:  feature.Center[1],
	}, nil
}

type AddressSuggestion struct {
	DisplayName string  `json:"display_name"`
	Latitud     float64 `json:"latitud"`
	Longitud    float64 `json:"longitud"`
	PlaceID     int64   `json:"place_id"`
}

func (s *GeocodingService) SearchAddresses(query string) ([]AddressSuggestion, error) {

	encodedQuery := url.PathEscape(query)
	fullURL := fmt.Sprintf("%s/%s.json", s.config.BaseURL, encodedQuery)

	params := url.Values{}
	params.Add("access_token", s.config.ApiKey)
	params.Add("country", "ar")
	params.Add("limit", "5")
	params.Add("language", "es")
	params.Add("autocomplete", "true")

	fullURL = fmt.Sprintf("%s?%s", fullURL, params.Encode())

	req, err := http.NewRequest("GET", fullURL, nil)
	if err != nil {
		return nil, fmt.Errorf("error creando request: %w", err)
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error haciendo request a Mapbox: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("mapbox respondió con status %d", resp.StatusCode)
	}

	var result MapboxResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("error parseando respuesta: %w", err)
	}

	suggestions := make([]AddressSuggestion, 0, len(result.Features))
	for _, feature := range result.Features {
		if len(feature.Center) < 2 {
			continue
		}

		var placeID int64
		for i, ch := range feature.ID {
			placeID += int64(ch) * int64(i+1)
		}

		suggestions = append(suggestions, AddressSuggestion{
			DisplayName: feature.PlaceName,
			Latitud:     feature.Center[1],
			Longitud:    feature.Center[0],
			PlaceID:     placeID,
		})
	}

	return suggestions, nil
}
