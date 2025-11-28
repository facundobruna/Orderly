package controllers

import (
	"context"
	"net/http"
	"orders-api/internal/domain"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type OrdersService interface {
	CreateOrder(ctx context.Context, req domain.CreateOrdenRequest) (domain.Orden, error)
	GetByID(ctx context.Context, id string) (domain.Orden, error)
	List(ctx context.Context, filters domain.OrderFilters) (domain.PaginatedOrdenResponse, error)
	UpdateStatus(ctx context.Context, id string, nuevoEstado string) (domain.Orden, error)
	CancelOrder(ctx context.Context, id string) error
	Search(ctx context.Context, query string, filters map[string]string) ([]domain.Orden, error)
	ReindexAll(ctx context.Context) (int, error)
}

type OrdersController struct {
	service OrdersService
}

func NewOrdersController(service OrdersService) *OrdersController {
	return &OrdersController{
		service: service,
	}
}

func (c *OrdersController) Create(ctx *gin.Context) {
	var req domain.CreateOrdenRequest

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error":   "Datos de entrada inválidos",
			"details": err.Error(),
		})
		return
	}

	orden, err := c.service.CreateOrder(ctx.Request.Context(), req)
	if err != nil {
		statusCode := http.StatusInternalServerError

		if isValidationError(err) {
			statusCode = http.StatusBadRequest
		}

		if isNotFoundError(err) {
			statusCode = http.StatusNotFound
		}

		ctx.JSON(statusCode, gin.H{
			"error":   "Error al crear orden",
			"details": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "Orden creada exitosamente",
		"orden":   orden,
	})
}

func (c *OrdersController) GetByID(ctx *gin.Context) {
	id := ctx.Param("id")
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

	ctx.JSON(http.StatusOK, orden)
}

func (c *OrdersController) List(ctx *gin.Context) {
	filters := domain.OrderFilters{
		NegocioID:  ctx.Query("negocio_id"),
		SucursalID: ctx.Query("sucursal_id"),
		UsuarioID:  ctx.Query("usuario_id"),
		Estado:     ctx.Query("estado"),
		Mesa:       ctx.Query("mesa"),
	}

	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))
	filters.Page = page
	filters.Limit = limit

	response, err := c.service.List(ctx.Request.Context(), filters)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Error al listar órdenes",
			"details": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, response)
}

func (c *OrdersController) UpdateStatus(ctx *gin.Context) {
	id := ctx.Param("id")
	var req domain.UpdateEstadoRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error":   "Datos de entrada inválidos",
			"details": err.Error(),
		})
		return
	}

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

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Estado actualizado exitosamente",
		"orden":   orden,
	})
}

func (c *OrdersController) Cancel(ctx *gin.Context) {
	id := ctx.Param("id")

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

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Orden cancelada exitosamente",
	})
}

func isValidationError(err error) bool {
	errMsg := err.Error()
	return strings.Contains(errMsg, "requerido") ||
		strings.Contains(errMsg, "inválido") ||
		strings.Contains(errMsg, "debe tener") ||
		strings.Contains(errMsg, "no puede") ||
		strings.Contains(errMsg, "transición")
}

func isNotFoundError(err error) bool {
	errMsg := err.Error()
	return strings.Contains(errMsg, "no encontrad") ||
		strings.Contains(errMsg, "no existe")
}

func (c *OrdersController) Search(ctx *gin.Context) {
	query := ctx.Query("q")
	if query == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "El parámetro 'q' es requerido",
		})
		return
	}

	filters := make(map[string]string)
	if negocioID := ctx.Query("negocio_id"); negocioID != "" {
		filters["negocio_id"] = negocioID
	}
	if sucursalID := ctx.Query("sucursal_id"); sucursalID != "" {
		filters["sucursal_id"] = sucursalID
	}
	if estado := ctx.Query("estado"); estado != "" {
		filters["estado"] = estado
	}

	ordenes, err := c.service.Search(ctx.Request.Context(), query, filters)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Error al buscar órdenes",
			"details": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"results": ordenes,
		"total":   len(ordenes),
	})
}

func (c *OrdersController) Reindex(ctx *gin.Context) {
	count, err := c.service.ReindexAll(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Error al re-indexar órdenes",
			"details": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Órdenes re-indexadas exitosamente",
		"count":   count,
	})
}
