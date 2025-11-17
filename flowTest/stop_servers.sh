#!/bin/bash

# Stop all flowTest servers
echo "Stopping flowTest servers..."

# Read PIDs from files if they exist
if [ -f /tmp/flowtest_tee.pid ]; then
    TEE_PID=$(cat /tmp/flowtest_tee.pid)
    if kill -0 $TEE_PID 2>/dev/null; then
        echo "Stopping TEE server (PID: $TEE_PID)..."
        kill $TEE_PID
    fi
    rm /tmp/flowtest_tee.pid
fi

if [ -f /tmp/flowtest_models.pid ]; then
    MODELS_PID=$(cat /tmp/flowtest_models.pid)
    if kill -0 $MODELS_PID 2>/dev/null; then
        echo "Stopping Tiny Models server (PID: $MODELS_PID)..."
        kill $MODELS_PID
    fi
    rm /tmp/flowtest_models.pid
fi

# Also check ports directly
echo "Checking ports..."
lsof -ti:5001 | xargs kill -9 2>/dev/null && echo "Killed process on port 5001"
lsof -ti:8001 | xargs kill -9 2>/dev/null && echo "Killed process on port 8001"

echo "✅ All servers stopped!"