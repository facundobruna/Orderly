package controllers

import (
	"context"
	"net/http"
	"products-api/internal/domain"
	"strconv"

	"github.com/gin-gonic/gin"
)

// ProductosService define la lógica de negocio para productos
type ProductosService interface {
	Create(ctx context.Context, req domain.CreateProductoRequest) (domain.Producto, error)
	GetByID(ctx context.Context, id string) (domain.Producto, error)
	List(ctx context.Context, filters domain.SearchFilters) (domain.PaginatedResponse, error)
	Update(ctx context.Context, id string, req domain.UpdateProductoRequest) (domain.Producto, error)
	Delete(ctx context.Context, id string) error
	Quote(ctx context.Context, id string, varianteNombre string, modificadoresNombres []string) (float64, error)
	SearchProducts(ctx context.Context, query string, filters map[string]string) ([]domain.Producto, error)
}

// ProductosController maneja las peticiones HTTP para productos
type ProductosController struct {
	service ProductosService
}

// NewProductosController crea una nueva instancia del controller
func NewProductosController(service ProductosService) *ProductosController {
	return &ProductosController{service: service}
}

// Create maneja POST /products
func (c *ProductosController) Create(ctx *gin.Context) {
	var req domain.CreateProductoRequest

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error":   "Datos de entrada inválidos",
			"details": err.Error(),
		})
		return
	}

	producto, err := c.service.Create(ctx.Request.Context(), req)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "el ID del negocio es requerido" ||
			err.Error() == "el ID de la sucursal es requerido" ||
			err.Error() == "el nombre del producto es requerido" ||
			err.Error() == "el precio base debe ser mayor o igual a 0" ||
			err.Error() == "la categoría es requerida" {
			statusCode = http.StatusBadRequest
		}

		ctx.JSON(statusCode, gin.H{
			"error":   "Error al crear producto",
			"details": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message":  "Producto creado exitosamente",
		"producto": producto,
	})
}

// GetByID maneja GET /products/:id
func (c *ProductosController) GetByID(ctx *gin.Context) {
	id := ctx.Param("id")

	producto, err := c.service.GetByID(ctx.Request.Context(), id)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "producto no encontrado" || err.Error() == "invalid ObjectID format" {
			statusCode = http.StatusNotFound
		}

		ctx.JSON(statusCode, gin.H{
			"error":   "Error al obtener producto",
			"details": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, producto)
}

// List maneja GET /products
func (c *ProductosController) List(ctx *gin.Context) {
	filters := domain.SearchFilters{
		NegocioID:  ctx.Query("negocio_id"),
		SucursalID: ctx.Query("sucursal_id"),
		Categoria:  ctx.Query("categoria"),
		Nombre:     ctx.Query("nombre"),
	}

	// Parse disponible
	if disponibleStr := ctx.Query("disponible"); disponibleStr != "" {
		disponible := disponibleStr == "true"
		filters.Disponible = &disponible
	}

	// Parse tags
	if tagsStr := ctx.Query("tags"); tagsStr != "" {
		// Asumimos tags separados por comas: ?tags=vegetariano,picante
		filters.Tags = []string{tagsStr}
	}

	// Parse paginación
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))
	filters.Page = page
	filters.Limit = limit

	response, err := c.service.List(ctx.Request.Context(), filters)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Error al listar productos",
			"details": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, response)
}

// Update maneja PUT /products/:id
func (c *ProductosController) Update(ctx *gin.Context) {
	id := ctx.Param("id")

	var req domain.UpdateProductoRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error":   "Datos de entrada inválidos",
			"details": err.Error(),
		})
		return
	}

	producto, err := c.service.Update(ctx.Request.Context(), id, req)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "producto no encontrado" || err.Error() == "invalid ObjectID format" {
			statusCode = http.StatusNotFound
		} else if err.Error() == "debe proporcionar al menos un campo para actualizar" ||
			err.Error() == "el precio base debe ser mayor o igual a 0" {
			statusCode = http.StatusBadRequest
		}

		ctx.JSON(statusCode, gin.H{
			"error":   "Error al actualizar producto",
			"details": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message":  "Producto actualizado exitosamente",
		"producto": producto,
	})
}

// Delete maneja DELETE /products/:id
func (c *ProductosController) Delete(ctx *gin.Context) {
	id := ctx.Param("id")

	if err := c.service.Delete(ctx.Request.Context(), id); err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "producto no encontrado" || err.Error() == "invalid ObjectID format" {
			statusCode = http.StatusNotFound
		}

		ctx.JSON(statusCode, gin.H{
			"error":   "Error al eliminar producto",
			"details": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Producto eliminado exitosamente",
	})
}

// Quote maneja POST /products/:id/quote
func (c *ProductosController) Quote(ctx *gin.Context) {
	id := ctx.Param("id")

	var req struct {
		Variante      string   `json:"variante"`
		Modificadores []string `json:"modificadores"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error":   "Datos de entrada inválidos",
			"details": err.Error(),
		})
		return
	}

	total, err := c.service.Quote(ctx.Request.Context(), id, req.Variante, req.Modificadores)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "producto no encontrado" || err.Error() == "invalid ObjectID format" {
			statusCode = http.StatusNotFound
		} else if err.Error() == "variante no encontrada" ||
			err.Error() == "modificador no encontrado" {
			statusCode = http.StatusBadRequest
		}

		ctx.JSON(statusCode, gin.H{
			"error":   "Error al calcular precio",
			"details": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"producto_id":   id,
		"variante":      req.Variante,
		"modificadores": req.Modificadores,
		"precio_total":  total,
	})
}
func (c *ProductosController) SearchProducts(ctx *gin.Context) {
	query := ctx.Query("q") // Query de búsqueda
	if query == "" {
		query = "*:*" // Todos si no hay query
	}

	// Filtros opcionales
	filters := make(map[string]string)
	if categoria := ctx.Query("categoria"); categoria != "" {
		filters["categoria"] = categoria
	}
	if negocioID := ctx.Query("negocio_id"); negocioID != "" {
		filters["negocio_id"] = negocioID
	}

	// Buscar en Solr (necesitas agregar método Search al servicio)
	resultados, err := c.service.SearchProducts(ctx, query, filters)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"query":   query,
		"results": resultados,
	})
}
