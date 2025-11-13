package middleware

import (
	"users-api/internal/utils"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware valida el JWT token y extrae los claims
func AuthMiddleware() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		// 1. Obtener el header Authorization
		authHeader := ctx.GetHeader("Authorization")
		if authHeader == "" {
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"error": "Token de autenticación requerido",
			})
			ctx.Abort()
			return
		}

		// 2. Validar formato "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"error": "Formato de token inválido. Use: Bearer <token>",
			})
			ctx.Abort()
			return
		}

		tokenString := parts[1]

		// 3. Validar el token
		claims, err := utils.ValidateToken(tokenString)
		if err != nil {
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Token inválido o expirado",
				"details": err.Error(),
			})
			ctx.Abort()
			return
		}

		// 4. Guardar claims en el contexto para uso posterior
		ctx.Set("user_id", claims.UserID)
		ctx.Set("username", claims.Username)
		ctx.Set("rol", claims.Rol)

		// 5. Continuar con el siguiente handler
		ctx.Next()
	}
}

// GetUserIDFromContext extrae el userID del contexto
func GetUserIDFromContext(ctx *gin.Context) (uint64, bool) {
	userID, exists := ctx.Get("user_id")
	if !exists {
		return 0, false
	}

	id, ok := userID.(uint64)
	return id, ok
}

// GetRolFromContext extrae el rol del contexto
func GetRolFromContext(ctx *gin.Context) (string, bool) {
	rol, exists := ctx.Get("rol")
	if !exists {
		return "", false
	}

	rolStr, ok := rol.(string)
	return rolStr, ok
}

// RequireRole middleware que verifica que el usuario tenga un rol específico
func RequireRole(requiredRole string) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		rol, exists := GetRolFromContext(ctx)
		if !exists {
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"error": "No se pudo obtener el rol del usuario",
			})
			ctx.Abort()
			return
		}

		if rol != requiredRole {
			ctx.JSON(http.StatusForbidden, gin.H{
				"error": "No tienes permisos para acceder a este recurso",
			})
			ctx.Abort()
			return
		}

		ctx.Next()
	}
}
