#!/bin/bash

# Satya Marketplace Full Stack Stop Script

echo "🛑 Stopping Satya Marketplace Full Stack..."

# Stop backend if PID file exists
if [ -f "backend.pid" ]; then
    BACKEND_PID=$(cat backend.pid)
    if ps -p $BACKEND_PID > /dev/null; then
        echo "🔄 Stopping Backend API (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        echo "✅ Backend stopped"
    else
        echo "⚠️  Backend was not running"
    fi
    rm backend.pid
else
    echo "⚠️  No backend PID file found"
fi

# Stop frontend if PID file exists
if [ -f "frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null; then
        echo "🔄 Stopping Frontend App (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        echo "✅ Frontend stopped"
    else
        echo "⚠️  Frontend was not running"
    fi
    rm frontend.pid
else
    echo "⚠️  No frontend PID file found"
fi

# Kill any remaining processes on the ports
echo "🧹 Cleaning up any remaining processes..."
lsof -ti:3001 | xargs -r kill -9 2>/dev/null && echo "✅ Cleaned up port 3001" || true
lsof -ti:3000 | xargs -r kill -9 2>/dev/null && echo "✅ Cleaned up port 3000" || true

echo "✅ All services stopped!"
echo "📊 Logs preserved in /Users/eromonseleodigie/Satya/logs/"