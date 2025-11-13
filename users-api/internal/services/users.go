package services

import (
	"users-api/internal/dao"
	"users-api/internal/domain"
	"users-api/internal/utils"
	"context"
	"errors"
	"fmt"
	"strings"
)

// UsersRepository define las operaciones de datos para usuarios
type UsersRepository interface {
	CreateUser(ctx context.Context, user dao.Usuario) (dao.Usuario, error)
	GetUserByUsername(ctx context.Context, username string) (dao.Usuario, error)
	GetUserByEmail(ctx context.Context, email string) (dao.Usuario, error)
	GetUserByID(ctx context.Context, id uint64) (dao.Usuario, error)
	CheckUsernameExists(ctx context.Context, username string) (bool, error)
	CheckEmailExists(ctx context.Context, email string) (bool, error)
}

func NewUsersService(repo UsersRepository) *UsersService {
	return &UsersService{repo: repo}
}

// UsersService implementa la lógica de negocio para usuarios
type UsersService struct {
	repo UsersRepository
}

// Register registra un nuevo usuario
func (s *UsersService) Register(ctx context.Context, req domain.RegisterRequest) (domain.Usuario, error) {
	// 1. Validar datos
	if err := s.validateRegisterRequest(req); err != nil {
		return domain.Usuario{}, err
	}

	// 2. Verificar que username no esté en uso
	usernameExists, err := s.repo.CheckUsernameExists(ctx, req.Username)
	if err != nil {
		return domain.Usuario{}, err
	}
	if usernameExists {
		return domain.Usuario{}, errors.New("el username ya está en uso")
	}

	// 3. Verificar que email no esté en uso
	emailExists, err := s.repo.CheckEmailExists(ctx, req.Email)
	if err != nil {
		return domain.Usuario{}, err
	}
	if emailExists {
		return domain.Usuario{}, errors.New("el email ya está registrado")
	}

	// 4. Hashear password
	passwordHash, err := utils.HashPassword(req.Password)
	if err != nil {
		return domain.Usuario{}, errors.New("error al procesar la contraseña")
	}

	// 5. Crear usuario en DB
	userDAO := dao.Usuario{
		Nombre:       req.Nombre,
		Apellido:     req.Apellido,
		Email:        req.Email,
		Username:     req.Username,
		PasswordHash: passwordHash,
		Rol:          req.Rol,
		Activo:       true,
	}

	createdUser, err := s.repo.CreateUser(ctx, userDAO)
	if err != nil {
		return domain.Usuario{}, err
	}

	// 6. Convertir a domain y retornar
	return createdUser.ToDomain(), nil
}

// Login autentica un usuario y retorna un JWT
func (s *UsersService) Login(ctx context.Context, req domain.LoginRequest) (domain.LoginResponse, error) {

	// 1. Buscar usuario por username
	// 2. Verificar contraseña
	// 3. Generar JWT
	// 4. Retornar token y usuario

	userDAO, err := s.repo.GetUserByUsername(ctx, req.Username)
	var usuario domain.Usuario

	usuario.ID = userDAO.IdUsuario
	if err != nil {
		return domain.LoginResponse{}, fmt.Errorf("error getting user: %w", err)
	}

	if !userDAO.Activo {
		return domain.LoginResponse{}, errors.New("Usuario inactivo")
	}

	if !utils.CheckPassword(req.Password, userDAO.PasswordHash) {
		return domain.LoginResponse{}, errors.New("Credenciales incorrectas")
	}
	token, err := utils.GenerateToken(userDAO.IdUsuario, userDAO.Username, userDAO.Rol)
	if err != nil {
		return domain.LoginResponse{}, errors.New("Error al generar token de autenticacion")
	}

	return domain.LoginResponse{
		Token: token,
		User:  userDAO.ToDomain(),
	}, nil
}

// GetUserByID obtiene un usuario por su ID
func (s *UsersService) GetUserByID(ctx context.Context, id uint64) (domain.Usuario, error) {
	userDAO, err := s.repo.GetUserByID(ctx, id)
	if err != nil {
		return domain.Usuario{}, err
	}
	return userDAO.ToDomain(), nil
}

// validateRegisterRequest valida los datos del registro
func (s *UsersService) validateRegisterRequest(req domain.RegisterRequest) error {
	// Validar nombre
	if strings.TrimSpace(req.Nombre) == "" {
		return errors.New("el nombre es obligatorio")
	}

	// Validar apellido
	if strings.TrimSpace(req.Apellido) == "" {
		return errors.New("el apellido es obligatorio")
	}

	// Validar email (básico)
	if !strings.Contains(req.Email, "@") {
		return errors.New("email inválido")
	}

	// Validar username
	if len(req.Username) < 3 {
		return errors.New("el username debe tener al menos 3 caracteres")
	}

	// Validar password
	if len(req.Password) < 8 {
		return errors.New("la contrasenia debe tener al menos 8 caracteres")
	}

	// Validar rol
	if req.Rol != "cliente" && req.Rol != "dueno" {
		return errors.New("rol inválido (debe ser 'cliente' o 'duenio')")
	}

	return nil
}
