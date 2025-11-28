package utils

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID   uint64 `json:"user_id"`
	Username string `json:"username"`
	Rol      string `json:"rol"`
	jwt.RegisteredClaims
}

func getJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "CuartetoDinamico2025"
	}
	return []byte(secret)
}

func GenerateToken(userID uint64, username string, rol string) (string, error) {

	claims := Claims{
		UserID:   userID,
		Username: username,
		Rol:      rol,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)), // expira en 24 horas
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "orderly-users-api",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	tokenString, err := token.SignedString(getJWTSecret())
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

func ValidateToken(tokenString string) (*Claims, error) {

	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// Verificar que el método de firma sea HMAC
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("método de firma inválido")
		}
		return getJWTSecret(), nil
	})

	if err != nil {
		return nil, err
	}

	// Extraer claims
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("token inválido")
}
