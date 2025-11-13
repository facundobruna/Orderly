package controllers

import (
	"net/http"
	"orders-api/internal/domain"
	"orders-api/internal/services"

	"github.com/gin-gonic/gin"
)

type GroupOrderController struct {
	groupOrderService *services.GroupOrderService
}

func NewGroupOrderController(groupOrderService *services.GroupOrderService) *GroupOrderController {
	return &GroupOrderController{
		groupOrderService: groupOrderService,
	}
}

// CreateGroupOrder godoc
// @Summary Create a group order
// @Description Create a group order for splitting payment among multiple people
// @Tags group_orders
// @Accept json
// @Produce json
// @Param request body domain.CreateGroupOrderRequest true "Group Order Request"
// @Success 201 {object} domain.GroupOrder
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /orders/group [post]
func (c *GroupOrderController) CreateGroupOrder(ctx *gin.Context) {
	var req domain.CreateGroupOrderRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	groupOrder, err := c.groupOrderService.CreateGroupOrder(ctx, &req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, groupOrder)
}

// GetGroupOrder godoc
// @Summary Get a group order
// @Description Get a group order by ID
// @Tags group_orders
// @Accept json
// @Produce json
// @Param id path string true "Group Order ID"
// @Success 200 {object} domain.GroupOrder
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /orders/group/{id} [get]
func (c *GroupOrderController) GetGroupOrder(ctx *gin.Context) {
	id := ctx.Param("id")

	groupOrder, err := c.groupOrderService.GetGroupOrder(ctx, id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, groupOrder)
}

// UpdateSubOrderPayment godoc
// @Summary Update sub-order payment
// @Description Update the payment status of a specific person in a group order
// @Tags group_orders
// @Accept json
// @Produce json
// @Param id path string true "Group Order ID"
// @Param persona_id path string true "Person ID"
// @Param request body domain.UpdateGroupOrderPaymentRequest true "Payment Request"
// @Success 200 {object} domain.GroupOrder
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /orders/group/{id}/payment/{persona_id} [put]
func (c *GroupOrderController) UpdateSubOrderPayment(ctx *gin.Context) {
	id := ctx.Param("id")
	personaID := ctx.Param("persona_id")

	var req domain.UpdateGroupOrderPaymentRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	groupOrder, err := c.groupOrderService.UpdateSubOrderPayment(ctx, id, personaID, &req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, groupOrder)
}
