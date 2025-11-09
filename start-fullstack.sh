#!/bin/bash

# Satya Marketplace Full Stack Startup Script

echo "🚀 Starting Satya Marketplace Full Stack..."

# Check if backend is already running
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend API is already running on port 3001"
else
    echo "🔄 Starting Backend API..."
    cd /Users/eromonseleodigie/Satya/api
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing backend dependencies..."
        npm install
    fi
    
    # Build if needed
    if [ ! -d "dist" ]; then
        echo "🏗️  Building backend..."
        npm run build
    fi
    
    # Start backend in background
    echo "▶️  Starting backend server..."
    nohup npm start > ../logs/backend.log 2>&1 &
    echo $! > ../backend.pid
    
    # Wait for backend to start
    echo "⏳ Waiting for backend to start..."
    for i in {1..30}; do
        if curl -s http://localhost:3001/health > /dev/null; then
            echo "✅ Backend API is healthy!"
            break
        fi
        sleep 1
        echo -n "."
    done
fi

# Check if frontend is already running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is already running on port 3000"
else
    echo "🔄 Starting Frontend App..."
    cd /Users/eromonseleodigie/Satya/test-app
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing frontend dependencies..."
        pnpm install
    fi
    
    # Start frontend in background
    echo "▶️  Starting frontend server..."
    nohup pnpm dev > ../logs/frontend.log 2>&1 &
    echo $! > ../frontend.pid
    
    # Wait for frontend to start
    echo "⏳ Waiting for frontend to start..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null; then
            echo "✅ Frontend is ready!"
            break
        fi
        sleep 1
        echo -n "."
    done
fi

echo ""
echo "🎉 Satya Marketplace is now running!"
echo ""
echo "📊 Backend API:  http://localhost:3001"
echo "🌐 Frontend App: http://localhost:3000"
echo ""
echo "💰 Features Available:"
echo "  • Connect Sui wallet"
echo "  • Browse data marketplace"
echo "  • Create and sell data listings"
echo "  • Purchase datasets with SUI tokens"
echo "  • Walrus storage integration"
echo "  • Nautilus TEE verification"
echo "  • SEAL encryption"
echo ""
echo "🛠️  Logs:"
echo "  Backend: tail -f /Users/eromonseleodigie/Satya/logs/backend.log"
echo "  Frontend: tail -f /Users/eromonseleodigie/Satya/logs/frontend.log"
echo ""
echo "🛑 To stop all services: ./stop-fullstack.sh"
echo ""
echo "✨ Ready to use! Open http://localhost:3000 in your browser"