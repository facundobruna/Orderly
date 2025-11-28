package clients

import (
	"context"
	"orders-api/internal/services"
)

type ProductsAPIAdapter struct {
	client *ProductsAPIClient
}

func NewProductsAPIAdapter(client *ProductsAPIClient) *ProductsAPIAdapter {
	return &ProductsAPIAdapter{client: client}
}

func (a *ProductsAPIAdapter) GetProducto(ctx context.Context, productoID string) (services.ProductoDetalle, error) {
	producto, err := a.client.GetProducto(ctx, productoID)
	if err != nil {
		return services.ProductoDetalle{}, err
	}

	variantes := make([]services.ProductoVariante, len(producto.Variantes))
	for i, v := range producto.Variantes {
		variantes[i] = services.ProductoVariante{
			Nombre:          v.Nombre,
			PrecioAdicional: v.PrecioAdicional,
		}
	}
	modificadores := make([]services.ProductoModificador, len(producto.Modificadores))
	for i, m := range producto.Modificadores {
		modificadores[i] = services.ProductoModificador{
			Nombre:          m.Nombre,
			PrecioAdicional: m.PrecioAdicional,
		}
	}

	return services.ProductoDetalle{
		ID:            producto.ID,
		Nombre:        producto.Nombre,
		PrecioBase:    producto.PrecioBase,
		Variantes:     variantes,
		Modificadores: modificadores,
	}, nil
}

func (a *ProductsAPIAdapter) GetQuote(ctx context.Context, productoID string, varianteNombre string, modificadores []string) (services.QuoteResponse, error) {
	quote, err := a.client.GetQuote(ctx, productoID, varianteNombre, modificadores)
	if err != nil {
		return services.QuoteResponse{}, err
	}

	return services.QuoteResponse{
		PrecioTotal: quote.PrecioTotal,
	}, nil
}
