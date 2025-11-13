#!/bin/bash

# Orderly System Startup Script
# This script starts all components of the Orderly system

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║            ORDERLY SYSTEM - STARTUP SCRIPT             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running in project root
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

# Function to wait for API to be ready
wait_for_api() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=0

    echo -ne "${YELLOW}⏳ Waiting for ${name}...${NC}"

    while [ $attempt -lt $max_attempts ]; do
        if curl -s -f "${url}/healthz" > /dev/null 2>&1; then
            echo -e "\r${GREEN}✅ ${name} is ready                          ${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
        echo -ne "\r${YELLOW}⏳ Waiting for ${name}... (${attempt}/${max_attempts})${NC}"
    done

    echo -e "\r${RED}❌ ${name} failed to start                          ${NC}"
    return 1
fi

# Step 1: Check Docker
echo -e "${BLUE}📦 Step 1: Checking Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker not found${NC}"
    echo -e "${YELLOW}   You'll need to install databases manually${NC}"
    echo -e "${YELLOW}   See TESTING_INSTRUCTIONS.md for details${NC}"
    USE_DOCKER=false
else
    echo -e "${GREEN}✅ Docker is installed${NC}"
    USE_DOCKER=true
fi
echo ""

# Step 2: Start databases
if [ "$USE_DOCKER" = true ]; then
    echo -e "${BLUE}🗄️  Step 2: Starting databases with Docker Compose...${NC}"
    docker compose up -d

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Databases started successfully${NC}"
        echo -e "${YELLOW}⏳ Waiting 10 seconds for databases to initialize...${NC}"
        sleep 10
    else
        echo -e "${RED}❌ Failed to start databases${NC}"
        exit 1
    fi
else
    echo -e "${BLUE}🗄️  Step 2: Skipping Docker (not installed)${NC}"
    echo -e "${YELLOW}⚠️  Make sure your databases are running:${NC}"
    echo -e "   - MySQL on port 3307"
    echo -e "   - MongoDB on port 27017"
    echo -e "   - MongoDB on port 27018"
    echo -e "   - RabbitMQ on port 5672"
    echo -e "   - Memcached on port 11211"
    echo -e "   - Solr on port 8983"
    read -p "Press Enter when databases are ready..."
fi
echo ""

# Step 3: Check for existing processes on required ports
echo -e "${BLUE}🔍 Step 3: Checking for processes on required ports...${NC}"
PORTS_TO_CHECK="8080 8081 8082 8083 3000"
PORTS_IN_USE=""

for port in $PORTS_TO_CHECK; do
    if port_in_use $port; then
        PORTS_IN_USE="$PORTS_IN_USE $port"
    fi
done

if [ -n "$PORTS_IN_USE" ]; then
    echo -e "${YELLOW}⚠️  The following ports are already in use:${PORTS_IN_USE}${NC}"
    echo -e "${YELLOW}   Do you want to kill the processes using these ports? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        for port in $PORTS_IN_USE; do
            echo -e "${YELLOW}   Killing process on port $port...${NC}"
            lsof -ti :$port | xargs kill -9 2>/dev/null
        done
        echo -e "${GREEN}✅ Ports cleared${NC}"
    else
        echo -e "${RED}❌ Cannot start - ports in use${NC}"
        exit 1
    fi
fi
echo ""

# Step 4: Build backend APIs
echo -e "${BLUE}🔨 Step 4: Building backend APIs...${NC}"

# Build users-api
echo -e "${YELLOW}Building users-api...${NC}"
cd users-api && go build -o bin/users-api cmd/api/main.go
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ users-api built successfully${NC}"
else
    echo -e "${RED}❌ Failed to build users-api${NC}"
    exit 1
fi
cd ..

# Build products-api
echo -e "${YELLOW}Building products-api...${NC}"
cd products-api && go build -o bin/products-api cmd/api/main.go
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ products-api built successfully${NC}"
else
    echo -e "${RED}❌ Failed to build products-api${NC}"
    exit 1
fi
cd ..

# Build orders-api
echo -e "${YELLOW}Building orders-api...${NC}"
cd orders-api && go build -o bin/orders-api cmd/api/main.go
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ orders-api built successfully${NC}"
else
    echo -e "${RED}❌ Failed to build orders-api${NC}"
    exit 1
fi
cd ..

# Build payments-api
echo -e "${YELLOW}Building payments-api...${NC}"
cd payments-api && go build -o bin/payments-api cmd/api/main.go
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ payments-api built successfully${NC}"
else
    echo -e "${RED}❌ Failed to build payments-api${NC}"
    exit 1
fi
cd ..

echo ""

# Step 5: Start backend APIs
echo -e "${BLUE}🚀 Step 5: Starting backend APIs...${NC}"

# Start users-api
echo -e "${YELLOW}Starting users-api on port 8080...${NC}"
cd users-api
./bin/users-api > /tmp/orderly-users-api.log 2>&1 &
echo $! > /tmp/orderly-users-api.pid
cd ..

# Start products-api
echo -e "${YELLOW}Starting products-api on port 8081...${NC}"
cd products-api
./bin/products-api > /tmp/orderly-products-api.log 2>&1 &
echo $! > /tmp/orderly-products-api.pid
cd ..

# Start orders-api
echo -e "${YELLOW}Starting orders-api on port 8082...${NC}"
cd orders-api
./bin/orders-api > /tmp/orderly-orders-api.log 2>&1 &
echo $! > /tmp/orderly-orders-api.pid
cd ..

# Start payments-api
echo -e "${YELLOW}Starting payments-api on port 8083...${NC}"
cd payments-api
./bin/payments-api > /tmp/orderly-payments-api.log 2>&1 &
echo $! > /tmp/orderly-payments-api.pid
cd ..

echo ""

# Step 6: Wait for APIs to be ready
echo -e "${BLUE}⏳ Step 6: Waiting for APIs to be ready...${NC}"
wait_for_api "http://localhost:8080" "Users API"
wait_for_api "http://localhost:8081" "Products API"
wait_for_api "http://localhost:8082" "Orders API"
wait_for_api "http://localhost:8083" "Payments API"
echo ""

# Step 7: Start frontend
echo -e "${BLUE}🎨 Step 7: Starting frontend...${NC}"
cd orderly-customer

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⏳ Installing frontend dependencies...${NC}"
    npm install
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  Creating .env.local from .env.example...${NC}"
    cp .env.example .env.local
fi

# Start Next.js in development mode
echo -e "${YELLOW}Starting Next.js development server...${NC}"
npm run dev > /tmp/orderly-frontend.log 2>&1 &
echo $! > /tmp/orderly-frontend.pid
cd ..

# Wait for frontend to be ready
sleep 5
echo -e "${GREEN}✅ Frontend started on http://localhost:3000${NC}"
echo ""

# Final summary
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ✅ ORDERLY SYSTEM IS RUNNING              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 Service Status:${NC}"
echo -e "   ${GREEN}✅ Users API${NC}       - http://localhost:8080"
echo -e "   ${GREEN}✅ Products API${NC}    - http://localhost:8081"
echo -e "   ${GREEN}✅ Orders API${NC}      - http://localhost:8082"
echo -e "   ${GREEN}✅ Payments API${NC}    - http://localhost:8083"
echo -e "   ${GREEN}✅ Frontend${NC}        - http://localhost:3000"
echo ""
echo -e "${BLUE}📝 Logs:${NC}"
echo -e "   - Users API:    ${YELLOW}tail -f /tmp/orderly-users-api.log${NC}"
echo -e "   - Products API: ${YELLOW}tail -f /tmp/orderly-products-api.log${NC}"
echo -e "   - Orders API:   ${YELLOW}tail -f /tmp/orderly-orders-api.log${NC}"
echo -e "   - Payments API: ${YELLOW}tail -f /tmp/orderly-payments-api.log${NC}"
echo -e "   - Frontend:     ${YELLOW}tail -f /tmp/orderly-frontend.log${NC}"
echo ""
echo -e "${BLUE}🛑 To stop all services:${NC}"
echo -e "   ${YELLOW}./stop-orderly.sh${NC}"
echo ""
echo -e "${BLUE}📖 Next steps:${NC}"
echo -e "   1. Open your browser at ${GREEN}http://localhost:3000${NC}"
echo -e "   2. Use Postman to populate test data (see ${YELLOW}POSTMAN_TESTING.md${NC})"
echo -e "   3. Or run the populate script: ${YELLOW}./populate-database.sh${NC}"
echo ""
echo -e "${GREEN}🎉 Ready to go!${NC}"
