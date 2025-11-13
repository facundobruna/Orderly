package controllers

import (
	"users-api/internal/domain"
	"users-api/internal/middleware"
	"context"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// NegociosService define la lógica de negocio para negocios
type NegociosService interface {
	CreateNegocio(ctx context.Context, userID uint64, req domain.CreateNegocioRequest) (domain.Negocio, error)
	GetnegocioByID(ctx context.Context, id uint64) (domain.Negocio, error)
	ListNegociosByUsuario(ctx context.Context, userID uint64) ([]domain.Negocio, error)
	ListAllNegocios(ctx context.Context) ([]domain.Negocio, error)
	UpdateNegocio(ctx context.Context, negocioID uint64, userID uint64, req domain.UpdateNegocioRequest) (domain.Negocio, error)
	DeleteNegocio(ctx context.Context, negocioID uint64, userID uint64) error
	ExistsNegocio(ctx context.Context, id uint64) (bool, error)
}

// NegociosController maneja las peticiones HTTP de negocios
type NegociosController struct {
	service NegociosService
}

// NewNegociosController crea una nueva instancia del controller
func NewNegociosController(service NegociosService) *NegociosController {
	return &NegociosController{service: service}
}

// Create maneja POST /negocios
func (c *NegociosController) Create(ctx *gin.Context) {
	var req domain.CreateNegocioRequest

	// 1. Obtener userID del contexto (inyectado por middleware)
	userID, exists := middleware.GetUserIDFromContext(ctx)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"error": "No se pudo obtener el ID del usuario",
		})
		return
	}

	// 2. Validar JSON de entrada
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error":   "Datos de entrada inválidos",
			"details": err.Error(),
		})
		return
	}

	// 3. Llamar al servicio
	negocio, err := c.service.CreateNegocio(ctx.Request.Context(), userID, req)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "No tienes permisos para crear un negocio" {
			statusCode = http.StatusForbidden
		} else if err.Error() == "Usuario no encontrado" {
			statusCode = http.StatusNotFound
		}

		ctx.JSON(statusCode, gin.H{
			"error":   "Error al crear negocio",
			"details": err.Error(),
		})
		return
	}

	// 4. Responder con éxito
	ctx.JSON(http.StatusCreated, gin.H{
		"message": "Negocio creado exitosamente",
		"negocio": negocio,
	})
}

// ListAll maneja GET /negocios
func (c *NegociosController) ListAll(ctx *gin.Context) {
	negocios, err := c.service.ListAllNegocios(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Error al obtener negocios",
			"details": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"negocios": negocios,
		"total":    len(negocios),
	})
}

// ListMyNegocios maneja GET /negocios/my
func (c *NegociosController) ListMyNegocios(ctx *gin.Context) {
	// 1. Obtener userID del contexto
	userID, exists := middleware.GetUserIDFromContext(ctx)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"error": "No se pudo obtener el ID del usuario",
		})
		return
	}

	// 2. Obtener negocios del usuario
	negocios, err := c.service.ListNegociosByUsuario(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Error al obtener tus negocios",
			"details": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"negocios": negocios,
		"total":    len(negocios),
	})
}

// GetByID maneja GET /negocios/:id
func (c *NegociosController) GetByID(ctx *gin.Context) {
	// 1. Obtener ID del parámetro
	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "ID inválido",
		})
		return
	}

	// 2. Obtener negocio
	negocio, err := c.service.GetnegocioByID(ctx.Request.Context(), id)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "negocio no encontrado" {
			statusCode = http.StatusNotFound
		}

		ctx.JSON(statusCode, gin.H{
			"error":   "Error al obtener negocio",
			"details": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, negocio)
}

// Update maneja PUT /negocios/:id
func (c *NegociosController) Update(ctx *gin.Context) {
	var req domain.UpdateNegocioRequest

	// 1. Obtener ID del parámetro
	idStr := ctx.Param("id")
	negocioID, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "ID inválido",
		})
		return
	}

	// 2. Obtener userID del contexto
	userID, exists := middleware.GetUserIDFromContext(ctx)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"error": "No se pudo obtener el ID del usuario",
		})
		return
	}

	// 3. Validar JSON de entrada
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error":   "Datos de entrada inválidos",
			"details": err.Error(),
		})
		return
	}

	// 4. Llamar al servicio
	negocio, err := c.service.UpdateNegocio(ctx.Request.Context(), negocioID, userID, req)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "No tienes permisos para actualizar este negocio" {
			statusCode = http.StatusForbidden
		} else if err.Error() == "negocio no encontrado" {
			statusCode = http.StatusNotFound
		} else if err.Error() == "No hay campos para actualizar" {
			statusCode = http.StatusBadRequest
		}

		ctx.JSON(statusCode, gin.H{
			"error":   "Error al actualizar negocio",
			"details": err.Error(),
		})
		return
	}

	// 5. Responder con éxito
	ctx.JSON(http.StatusOK, gin.H{
		"message": "Negocio actualizado exitosamente",
		"negocio": negocio,
	})
}

// Delete maneja DELETE /negocios/:id
func (c *NegociosController) Delete(ctx *gin.Context) {
	// 1. Obtener ID del parámetro
	idStr := ctx.Param("id")
	negocioID, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "ID inválido",
		})
		return
	}

	// 2. Obtener userID del contexto
	userID, exists := middleware.GetUserIDFromContext(ctx)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"error": "No se pudo obtener el ID del usuario",
		})
		return
	}

	// 3. Llamar al servicio
	err = c.service.DeleteNegocio(ctx.Request.Context(), negocioID, userID)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "No tienes permisos para eliminar este negocio" {
			statusCode = http.StatusForbidden
		} else if err.Error() == "negocio no encontrado" {
			statusCode = http.StatusNotFound
		}

		ctx.JSON(statusCode, gin.H{
			"error":   "Error al eliminar negocio",
			"details": err.Error(),
		})
		return
	}

	// 4. Responder con éxito
	ctx.JSON(http.StatusOK, gin.H{
		"message": "Negocio eliminado exitosamente",
	})
}

// Exists maneja GET /negocios/:id/exists
func (c *NegociosController) Exists(ctx *gin.Context) {
	// 1. Obtener ID del parámetro
	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error":  "ID inválido",
			"exists": false,
		})
		return
	}

	// 2. Verificar existencia
	exists, err := c.service.ExistsNegocio(ctx.Request.Context(), id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Error al verificar negocio",
			"exists": false,
		})
		return
	}

	if !exists {
		ctx.JSON(http.StatusNotFound, gin.H{
			"exists": false,
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"exists": true,
	})
}
