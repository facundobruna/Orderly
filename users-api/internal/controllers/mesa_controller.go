package controllers

import (
	"net/http"
	"strconv"
	"users-api/internal/domain"
	"users-api/internal/services"

	"github.com/gin-gonic/gin"
)

type MesaController struct {
	mesaService *services.MesaService
}

func NewMesaController(mesaService *services.MesaService) *MesaController {
	return &MesaController{
		mesaService: mesaService,
	}
}

// CreateMesa godoc
// @Summary Create a new mesa
// @Description Create a new mesa for a negocio with QR code generation
// @Tags mesas
// @Accept json
// @Produce json
// @Param negocio_id path int true "Negocio ID"
// @Param request body domain.CreateMesaRequest true "Mesa Request"
// @Success 201 {object} domain.MesaResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /negocios/{negocio_id}/mesas [post]
func (c *MesaController) CreateMesa(ctx *gin.Context) {
	negocioIDStr := ctx.Param("negocio_id")
	negocioID, err := strconv.ParseUint(negocioIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid negocio_id"})
		return
	}

	var req domain.CreateMesaRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	mesa, err := c.mesaService.CreateMesa(negocioID, &req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, mesa)
}

// GetMesasByNegocio godoc
// @Summary Get all mesas for a negocio
// @Description Get all mesas for a specific negocio
// @Tags mesas
// @Accept json
// @Produce json
// @Param negocio_id path int true "Negocio ID"
// @Success 200 {array} domain.MesaResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /negocios/{negocio_id}/mesas [get]
func (c *MesaController) GetMesasByNegocio(ctx *gin.Context) {
	negocioIDStr := ctx.Param("negocio_id")
	negocioID, err := strconv.ParseUint(negocioIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid negocio_id"})
		return
	}

	mesas, err := c.mesaService.GetMesasByNegocio(negocioID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, mesas)
}

// GetMesa godoc
// @Summary Get a mesa by ID
// @Description Get a specific mesa by ID
// @Tags mesas
// @Accept json
// @Produce json
// @Param negocio_id path int true "Negocio ID"
// @Param mesa_id path int true "Mesa ID"
// @Success 200 {object} domain.MesaResponse
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /negocios/{negocio_id}/mesas/{mesa_id} [get]
func (c *MesaController) GetMesa(ctx *gin.Context) {
	mesaIDStr := ctx.Param("mesa_id")
	mesaID, err := strconv.ParseUint(mesaIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid mesa_id"})
		return
	}

	mesa, err := c.mesaService.GetMesaByID(mesaID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, mesa)
}

// UpdateMesa godoc
// @Summary Update a mesa
// @Description Update a mesa and regenerate QR code
// @Tags mesas
// @Accept json
// @Produce json
// @Param negocio_id path int true "Negocio ID"
// @Param mesa_id path int true "Mesa ID"
// @Param request body domain.CreateMesaRequest true "Mesa Request"
// @Success 200 {object} domain.MesaResponse
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /negocios/{negocio_id}/mesas/{mesa_id} [put]
func (c *MesaController) UpdateMesa(ctx *gin.Context) {
	mesaIDStr := ctx.Param("mesa_id")
	mesaID, err := strconv.ParseUint(mesaIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid mesa_id"})
		return
	}

	var req domain.CreateMesaRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	mesa, err := c.mesaService.UpdateMesa(mesaID, &req)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, mesa)
}

// DeleteMesa godoc
// @Summary Delete a mesa
// @Description Delete a mesa by ID
// @Tags mesas
// @Accept json
// @Produce json
// @Param negocio_id path int true "Negocio ID"
// @Param mesa_id path int true "Mesa ID"
// @Success 204
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /negocios/{negocio_id}/mesas/{mesa_id} [delete]
func (c *MesaController) DeleteMesa(ctx *gin.Context) {
	mesaIDStr := ctx.Param("mesa_id")
	mesaID, err := strconv.ParseUint(mesaIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid mesa_id"})
		return
	}

	if err := c.mesaService.DeleteMesa(mesaID); err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	ctx.Status(http.StatusNoContent)
}
