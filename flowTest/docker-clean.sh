#!/bin/bash

# FlowTest Docker Cleanup Script
echo "🧹 Cleaning up FlowTest Docker resources..."

# Set working directory
cd /Users/eromonseleodigie/Satya/flowTest

# Stop and remove containers
echo "📦 Stopping and removing containers..."
docker-compose down

# Remove images
echo "🖼️  Removing Docker images..."
docker-compose down --rmi all

# Remove volumes
echo "📁 Removing Docker volumes..."
docker-compose down -v

# Prune unused Docker resources
echo "🗑️  Pruning unused Docker resources..."
docker system prune -f

echo "✅ Docker cleanup complete!"
echo ""
echo "To rebuild and start fresh, run: ./docker-start.sh"