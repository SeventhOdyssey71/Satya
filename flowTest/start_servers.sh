#!/bin/bash

# Start all servers for flowTest application
echo "Starting flowTest servers..."

# Function to check if a port is in use
check_port() {
    lsof -i:$1 > /dev/null 2>&1
    return $?
}

# Kill existing servers if running
echo "Checking for existing servers..."
if check_port 5001; then
    echo "Killing existing TEE server on port 5001..."
    lsof -ti:5001 | xargs kill -9 2>/dev/null
fi

if check_port 8001; then
    echo "Killing existing Tiny Models server on port 8001..."
    lsof -ti:8001 | xargs kill -9 2>/dev/null
fi

# Start TEE server
echo "Starting TEE server on port 5001..."
cd /Users/eromonseleodigie/Satya/flowTest
python3 tee_server.py &
TEE_PID=$!
echo "TEE server started with PID: $TEE_PID"

# Wait a moment for TEE server to start
sleep 2

# Start Tiny Models server
echo "Starting Tiny Models server on port 8001..."
python3 tiny_models_server.py &
MODELS_PID=$!
echo "Tiny Models server started with PID: $MODELS_PID"

# Save PIDs to file for later shutdown
echo $TEE_PID > /tmp/flowtest_tee.pid
echo $MODELS_PID > /tmp/flowtest_models.pid

echo ""
echo "✅ All servers started successfully!"
echo ""
echo "Servers running:"
echo "  - TEE Server: http://localhost:5001 (PID: $TEE_PID)"
echo "  - Tiny Models Server: http://localhost:8001 (PID: $MODELS_PID)"
echo ""
echo "To stop servers, run: ./stop_servers.sh"
echo ""

# Keep script running
echo "Press Ctrl+C to stop all servers..."
trap "echo 'Stopping servers...'; kill $TEE_PID $MODELS_PID; exit" INT
wait