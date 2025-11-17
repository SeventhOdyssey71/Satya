# FlowTest Server Setup

All server components have been consolidated into the flowTest directory for easier management.

## Directory Structure

```
flowTest/
├── nautilus-server/       # Nautilus enclave server (Rust)
├── tiny_models/          # Tiny ML models for testing
├── tiny_datasets/        # Sample datasets for testing
├── tee_server.py         # TEE attestation server (Port 5001)
├── tiny_models_server.py # ML models metadata server (Port 8001)
├── start_servers.sh      # Start all servers
└── stop_servers.sh       # Stop all servers
```

## Starting the Servers

### Quick Start (Recommended)
```bash
cd /Users/eromonseleodigie/Satya/flowTest
./start_servers.sh
```

This will start:
- TEE Server on http://localhost:5001
- Tiny Models Server on http://localhost:8001

### Manual Start
```bash
# Start TEE server
python3 tee_server.py

# In another terminal, start Tiny Models server
python3 tiny_models_server.py
```

## Stopping the Servers

```bash
./stop_servers.sh
```

Or press Ctrl+C if running start_servers.sh

## Server Endpoints

### TEE Server (Port 5001)
- `POST /complete_verification` - Complete TEE verification with attestation
- `POST /generate_attestation` - Generate TEE attestation
- `GET /health` - Health check

### Tiny Models Server (Port 8001)
- `GET /models` - List all available models
- `GET /models/{model_id}` - Get specific model details
- `POST /inference` - Run model inference
- `GET /health` - Health check

## Dependencies

Make sure you have Python 3.8+ and the following packages installed:
```bash
pip install fastapi uvicorn numpy scikit-learn joblib pydantic
```

## Testing the Servers

```bash
# Test TEE server
curl http://localhost:5001/health

# Test Tiny Models server
curl http://localhost:8001/models
```

## Troubleshooting

If servers fail to start:
1. Check if ports 5001 and 8001 are already in use
2. Run `./stop_servers.sh` to kill any existing processes
3. Ensure all Python dependencies are installed
4. Check server logs for specific error messages