#!/bin/bash

# FlowTest Docker Stop Script
echo "🛑 Stopping FlowTest Application..."

# Set working directory
cd /Users/eromonseleodigie/Satya/flowTest

# Stop containers
echo "📦 Stopping Docker containers..."
docker-compose down

# Optional: Remove volumes (uncomment if needed)
# read -p "Do you want to remove data volumes? (y/n) " -n 1 -r
# echo
# if [[ $REPLY =~ ^[Yy]$ ]]; then
#     docker-compose down -v
#     echo "📁 Volumes removed"
# fi

echo "✅ FlowTest services stopped!"