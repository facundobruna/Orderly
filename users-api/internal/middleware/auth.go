package middleware

import (
	"net/http"
	"strings"
	"users-api/internal/utils"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware valida el JWT token y extrae los claims
func AuthMiddleware() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		authHeader := ctx.GetHeader("Authorization")
		if authHeader == "" {
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"error": "Token de autenticación requerido",
			})
			ctx.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"error": "Formato de token inválido. Use: Bearer <token>",
			})
			ctx.Abort()
			return
		}

		tokenString := parts[1]

		claims, err := utils.ValidateToken(tokenString)
		if err != nil {
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Token inválido o expirado",
				"details": err.Error(),
			})
			ctx.Abort()
			return
		}

		ctx.Set("user_id", claims.UserID)
		ctx.Set("username", claims.Username)
		ctx.Set("rol", claims.Rol)

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
