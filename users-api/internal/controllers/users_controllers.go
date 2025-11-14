package controllers

import (
	"users-api/internal/domain"
	"users-api/internal/middleware"
	"context"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// AuthService define la lógica de negocio para autenticación
type AuthService interface {
	Register(ctx context.Context, req domain.RegisterRequest) (domain.LoginResponse, error)
	Login(ctx context.Context, req domain.LoginRequest) (domain.LoginResponse, error)
	GetUserByID(ctx context.Context, id uint64) (domain.Usuario, error)
}

// AuthController maneja las peticiones HTTP de autenticación
type AuthController struct {
	service AuthService
}

// NewAuthController crea una nueva instancia del controller
func NewAuthController(service AuthService) *AuthController {
	return &AuthController{service: service}
}

// Register maneja POST /auth/register
func (c *AuthController) Register(ctx *gin.Context) {
	var req domain.RegisterRequest

	// 1. Validar JSON de entrada
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error":   "Datos de entrada inválidos",
			"details": err.Error(),
		})
		return
	}

	// 2. Llamar al servicio
	response, err := c.service.Register(ctx.Request.Context(), req)
	if err != nil {
		// Determinar código de error apropiado
		statusCode := http.StatusInternalServerError
		if err.Error() == "el username ya está en uso" || err.Error() == "el email ya está registrado" {
			statusCode = http.StatusConflict
		} else if err.Error() == "el nombre es obligatorio" ||
			err.Error() == "el apellido es obligatorio" ||
			err.Error() == "email inválido" ||
			err.Error() == "el username debe tener al menos 3 caracteres" ||
			err.Error() == "la contraseña debe tener al menos 8 caracteres" ||
			err.Error() == "rol inválido (debe ser 'cliente' o 'dueno')" {
			statusCode = http.StatusBadRequest
		}

		ctx.JSON(statusCode, gin.H{
			"error":   "Error al registrar usuario",
			"details": err.Error(),
		})
		return
	}

	// 3. Responder con éxito (token y usuario)
	ctx.JSON(http.StatusCreated, response)
}

// Login maneja POST /auth/login
func (c *AuthController) Login(ctx *gin.Context) {
	var req domain.LoginRequest

	// 1. Validar JSON de entrada
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error":   "Datos de entrada inválidos",
			"details": err.Error(),
		})
		return
	}

	// 2. Llamar al servicio
	response, err := c.service.Login(ctx.Request.Context(), req)
	if err != nil {
		statusCode := http.StatusUnauthorized
		if err.Error() == "TODO: implementar login" {
			statusCode = http.StatusNotImplemented
		}

		ctx.JSON(statusCode, gin.H{
			"error":   "Error al autenticar",
			"details": err.Error(),
		})
		return
	}

	// 3. Responder con token
	ctx.JSON(http.StatusOK, response)
}

// UsersController maneja las peticiones HTTP de usuarios
type UsersController struct {
	service AuthService
}

// NewUsersController crea una nueva instancia del controller
func NewUsersController(service AuthService) *UsersController {
	return &UsersController{service: service}
}

// GetMe maneja GET /users/me - obtiene el perfil del usuario autenticado
func (c *UsersController) GetMe(ctx *gin.Context) {
	// 1. Obtener userID del contexto (inyectado por middleware)
	userID, exists := middleware.GetUserIDFromContext(ctx)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"error": "No se pudo obtener el ID del usuario",
		})
		return
	}

	// 2. Obtener usuario
	user, err := c.service.GetUserByID(ctx.Request.Context(), userID)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "usuario no encontrado" {
			statusCode = http.StatusNotFound
		}

		ctx.JSON(statusCode, gin.H{
			"error":   "Error al obtener usuario",
			"details": err.Error(),
		})
		return
	}

	// 3. Responder con el usuario
	ctx.JSON(http.StatusOK, user)
}

// GetByID maneja GET /users/:id - obtiene un usuario por ID
func (c *UsersController) GetByID(ctx *gin.Context) {
	// 1. Obtener ID del parámetro
	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "ID inválido",
		})
		return
	}

	// 2. Obtener usuario
	user, err := c.service.GetUserByID(ctx.Request.Context(), id)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "usuario no encontrado" {
			statusCode = http.StatusNotFound
		}

		ctx.JSON(statusCode, gin.H{
			"error":   "Error al obtener usuario",
			"details": err.Error(),
		})
		return
	}

	// 3. Responder con el usuario
	ctx.JSON(http.StatusOK, user)
}
