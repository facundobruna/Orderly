package repository

import (
	"users-api/internal/domain"

	"gorm.io/gorm"
)

type MesaRepository struct {
	db *gorm.DB
}

func NewMesaRepository(db *gorm.DB) *MesaRepository {
	return &MesaRepository{db: db}
}

func (r *MesaRepository) Create(mesa *domain.Mesa) error {
	return r.db.Create(mesa).Error
}

func (r *MesaRepository) FindByID(id uint64) (*domain.Mesa, error) {
	var mesa domain.Mesa
	err := r.db.First(&mesa, id).Error
	if err != nil {
		return nil, err
	}
	return &mesa, nil
}

func (r *MesaRepository) FindByNegocio(negocioID uint64) ([]domain.Mesa, error) {
	var mesas []domain.Mesa
	err := r.db.Where("negocio_id = ?", negocioID).Find(&mesas).Error
	if err != nil {
		return nil, err
	}
	return mesas, nil
}

func (r *MesaRepository) FindByQRCode(qrCode string) (*domain.Mesa, error) {
	var mesa domain.Mesa
	err := r.db.Where("qr_code = ?", qrCode).First(&mesa).Error
	if err != nil {
		return nil, err
	}
	return &mesa, nil
}

func (r *MesaRepository) Update(mesa *domain.Mesa) error {
	return r.db.Save(mesa).Error
}

func (r *MesaRepository) Delete(id uint64) error {
	return r.db.Delete(&domain.Mesa{}, id).Error
}
