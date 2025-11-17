#!/bin/bash

# FlowTest Docker Startup Script
echo "🚀 Starting FlowTest Application with Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Set working directory
cd /Users/eromonseleodigie/Satya/flowTest

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env 2>/dev/null || echo "No .env.example found, using defaults"
fi

# Build and start containers
echo "📦 Building Docker containers..."
docker-compose build

echo "🔧 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 5

# Check service health
echo "🔍 Checking service status..."
docker-compose ps

# Show logs
echo ""
echo "✅ FlowTest is starting up!"
echo ""
echo "🌐 Services available at:"
echo "   - Frontend: http://localhost:3000"
echo "   - TEE Server: http://localhost:5001"
echo "   - Models Server: http://localhost:8001"
echo ""
echo "📝 View logs with: docker-compose logs -f"
echo "🛑 Stop services with: ./docker-stop.sh"
echo ""

# Optionally tail logs
read -p "Do you want to view logs now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose logs -f
fi