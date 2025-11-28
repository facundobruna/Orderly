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

func (c *GroupOrderController) GetGroupOrder(ctx *gin.Context) {
	id := ctx.Param("id")

	groupOrder, err := c.groupOrderService.GetGroupOrder(ctx, id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, groupOrder)
}

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
