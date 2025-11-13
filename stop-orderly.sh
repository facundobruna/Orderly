#!/bin/bash

# Orderly System Stop Script
# This script stops all components of the Orderly system

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║            ORDERLY SYSTEM - STOP SCRIPT                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to stop a service
stop_service() {
    local pid_file=$1
    local name=$2

    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "${YELLOW}Stopping ${name} (PID: ${pid})...${NC}"
            kill $pid 2>/dev/null
            sleep 2
            # Force kill if still running
            if ps -p $pid > /dev/null 2>&1; then
                kill -9 $pid 2>/dev/null
            fi
            rm -f "$pid_file"
            echo -e "${GREEN}✅ ${name} stopped${NC}"
        else
            echo -e "${YELLOW}⚠️  ${name} is not running${NC}"
            rm -f "$pid_file"
        fi
    else
        echo -e "${YELLOW}⚠️  No PID file found for ${name}${NC}"
    fi
}

# Stop frontend
echo -e "${BLUE}🎨 Stopping frontend...${NC}"
stop_service "/tmp/orderly-frontend.pid" "Frontend"
echo ""

# Stop backend APIs
echo -e "${BLUE}🛑 Stopping backend APIs...${NC}"
stop_service "/tmp/orderly-users-api.pid" "Users API"
stop_service "/tmp/orderly-products-api.pid" "Products API"
stop_service "/tmp/orderly-orders-api.pid" "Orders API"
stop_service "/tmp/orderly-payments-api.pid" "Payments API"
echo ""

# Ask about Docker services
echo -e "${BLUE}🗄️  Docker services:${NC}"
if command -v docker &> /dev/null && docker compose ps | grep -q "Up"; then
    echo -e "${YELLOW}Database services are running in Docker.${NC}"
    echo -e "${YELLOW}Do you want to stop them? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "${YELLOW}Stopping Docker services...${NC}"
        docker compose stop
        echo -e "${GREEN}✅ Docker services stopped${NC}"
    else
        echo -e "${YELLOW}⚠️  Docker services left running${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No Docker services found or Docker not installed${NC}"
fi
echo ""

# Clean up log files
echo -e "${BLUE}🧹 Cleaning up...${NC}"
rm -f /tmp/orderly-*.log
echo -e "${GREEN}✅ Log files removed${NC}"
echo ""

echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ✅ ORDERLY SYSTEM HAS BEEN STOPPED           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}To start the system again, run:${NC}"
echo -e "   ${YELLOW}./start-orderly.sh${NC}"
echo ""
