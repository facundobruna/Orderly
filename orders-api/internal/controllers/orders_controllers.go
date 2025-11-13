package controllers

import (
	"clase05-solr/internal/domain"
	"context"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

// OrdersService define la lógica de negocio
type OrdersService interface {
	CreateOrder(ctx context.Context, req domain.CreateOrdenRequest) (domain.Orden, error)
	GetByID(ctx context.Context, id string) (domain.Orden, error)
	List(ctx context.Context, filters domain.OrderFilters) (domain.PaginatedOrdenResponse, error)
	UpdateStatus(ctx context.Context, id string, nuevoEstado string) (domain.Orden, error)
	CancelOrder(ctx context.Context, id string) error
}

// OrdersController maneja peticiones HTTP de órdenes
type OrdersController struct {
	service OrdersService
}

// NewOrdersController crea una nueva instancia
func NewOrdersController(service OrdersService) *OrdersController {
	return &OrdersController{
		service: service,
	}
}

// Create maneja POST /orders
func (c *OrdersController) Create(ctx *gin.Context) {
	var req domain.CreateOrdenRequest

	// 1. Validar JSON de entrada
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error":   "Datos de entrada inválidos",
			"details": err.Error(),
		})
		return
	}

	// 2. Llamar al service
	orden, err := c.service.CreateOrder(ctx.Request.Context(), req)
	if err != nil {
		// Determinar código de error apropiado
		statusCode := http.StatusInternalServerError

		// Errores de validación → 400
		if isValidationError(err) {
			statusCode = http.StatusBadRequest
		}

		// Negocio/producto no encontrado → 404
		if isNotFoundError(err) {
			statusCode = http.StatusNotFound
		}

		ctx.JSON(statusCode, gin.H{
			"error":   "Error al crear orden",
			"details": err.Error(),
		})
		return
	}

	// 3. Respuesta exitosa
	ctx.JSON(http.StatusCreated, gin.H{
		"message": "Orden creada exitosamente",
		"orden":   orden,
	})
}

// GetByID maneja GET /orders/:id
func (c *OrdersController) GetByID(ctx *gin.Context) {
	// 1. Extraer ID del path param
	id := ctx.Param("id")

	// 2. Llamar al service
	orden, err := c.service.GetByID(ctx.Request.Context(), id)
	if err != nil {
		statusCode := http.StatusInternalServerError

		if isNotFoundError(err) || err.Error() == "invalid ObjectID format" {
			statusCode = http.StatusNotFound
		}

		ctx.JSON(statusCode, gin.H{
			"error":   "Error al obtener orden",
			"details": err.Error(),
		})
		return
	}

	// 3. Respuesta exitosa
	ctx.JSON(http.StatusOK, orden)
}

// List maneja GET /orders
func (c *OrdersController) List(ctx *gin.Context) {
	// 1. Parsear filtros desde query params
	filters := domain.OrderFilters{
		NegocioID:  ctx.Query("negocio_id"),
		SucursalID: ctx.Query("sucursal_id"),
		UsuarioID:  ctx.Query("usuario_id"),
		Estado:     ctx.Query("estado"),
		Mesa:       ctx.Query("mesa"),
	}

	// Parsear paginación
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))
	filters.Page = page
	filters.Limit = limit

	// 2. Llamar al service
	response, err := c.service.List(ctx.Request.Context(), filters)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Error al listar órdenes",
			"details": err.Error(),
		})
		return
	}

	// 3. Respuesta exitosa
	ctx.JSON(http.StatusOK, response)
}

// UpdateStatus maneja PUT /orders/:id/status
func (c *OrdersController) UpdateStatus(ctx *gin.Context) {
	// 1. Extraer ID del path param
	id := ctx.Param("id")

	// 2. Parsear body
	var req domain.UpdateEstadoRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error":   "Datos de entrada inválidos",
			"details": err.Error(),
		})
		return
	}

	// 3. Llamar al service
	orden, err := c.service.UpdateStatus(ctx.Request.Context(), id, req.NuevoEstado)
	if err != nil {
		statusCode := http.StatusInternalServerError

		if isNotFoundError(err) {
			statusCode = http.StatusNotFound
		} else if isValidationError(err) {
			statusCode = http.StatusBadRequest
		}

		ctx.JSON(statusCode, gin.H{
			"error":   "Error al actualizar estado",
			"details": err.Error(),
		})
		return
	}

	// 4. Respuesta exitosa
	ctx.JSON(http.StatusOK, gin.H{
		"message": "Estado actualizado exitosamente",
		"orden":   orden,
	})
}

func (c *OrdersController) Cancel(ctx *gin.Context) {
	// 1. Extraer ID
	id := ctx.Param("id")

	// 2. Llamar al service
	if err := c.service.CancelOrder(ctx.Request.Context(), id); err != nil {
		statusCode := http.StatusInternalServerError

		if isNotFoundError(err) {
			statusCode = http.StatusNotFound
		} else if isValidationError(err) {
			statusCode = http.StatusBadRequest
		}

		ctx.JSON(statusCode, gin.H{
			"error":   "Error al cancelar orden",
			"details": err.Error(),
		})
		return
	}

	// 3. Respuesta exitosa
	ctx.JSON(http.StatusOK, gin.H{
		"message": "Orden cancelada exitosamente",
	})
}

// isValidationError verifica si es un error de validación
func isValidationError(err error) bool {
	errMsg := err.Error()
	return strings.Contains(errMsg, "requerido") ||
		strings.Contains(errMsg, "inválido") ||
		strings.Contains(errMsg, "debe tener") ||
		strings.Contains(errMsg, "no puede") ||
		strings.Contains(errMsg, "transición")
}

// isNotFoundError verifica si es un error de recurso no encontrado
func isNotFoundError(err error) bool {
	errMsg := err.Error()
	return strings.Contains(errMsg, "no encontrad") ||
		strings.Contains(errMsg, "no existe")
}
