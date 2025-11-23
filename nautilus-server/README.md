# Satya ML Marketplace - Real Attestation Server

This server provides real ML model attestation and performance evaluation for the Satya Data Marketplace, replacing fake 66% scores with actual model performance metrics.

## Architecture

The system consists of two components:

1. **Python ML Evaluator** (`ml_attestation_server.py`) - HTTP server on `localhost:3333`
2. **Rust Nautilus Server** (`src/main.rs`) - TEE application that calls the Python evaluator

## Features

- **Real Model Evaluation**: Actual accuracy, precision, recall, F1-score calculation
- **Bias Detection**: Demographic parity and fairness assessment  
- **Data Integrity**: Missing values, duplicates, outlier detection
- **Performance Metrics**: Inference time, memory usage, throughput
- **Walrus Integration**: Downloads models/datasets from Walrus testnet
- **TEE Attestation**: Cryptographic signatures in trusted execution environment

## Quick Start

### 1. Start the ML Evaluation Server

```bash
cd nautilus-server
python3 ml_attestation_server.py
```

The server will start on `http://localhost:3333` with endpoints:
- `GET /health` - Health check
- `POST /evaluate` - Evaluate model on dataset  
- `GET /test_models` - List available test models
- `GET /test_evaluate/<model>/<dataset>` - Test specific combinations

### 2. Test with Pre-built Models

The system includes pre-built models with different performance levels:

```bash
# Test high-quality model (90%+ accuracy)
curl http://localhost:3333/test_evaluate/high_quality_model.pkl/high_quality_test.csv

# Test medium-quality model (80% accuracy)  
curl http://localhost:3333/test_evaluate/medium_quality_model.pkl/medium_quality_test.csv

# Test low-quality model (70% accuracy)
curl http://localhost:3333/test_evaluate/low_quality_model.pkl/low_quality_test.csv
```

### 3. Run the Nautilus TEE Server

```bash
# Set environment variables
export WALRUS_AGGREGATOR_URL="https://aggregator.walrus-testnet.walrus.space"
export ML_EVALUATOR_URL="http://localhost:3333"
export WALRUS_REAL_DOWNLOADS="false"  # Use test models

# Build and run
cargo build --features ml-marketplace
cargo run --features ml-marketplace
```

## Model Performance Levels

The system includes test models with varying performance:

| Model | Accuracy | F1-Score | Description |
|-------|----------|----------|-------------|
| `high_quality_model.pkl` | ~93% | ~93% | Random Forest with clean data |
| `medium_quality_model.pkl` | ~86% | ~86% | Logistic Regression |  
| `low_quality_model.pkl` | ~73% | ~73% | Underfitted model with noisy data |
| `neural_network_model.pkl` | ~87% | ~87% | Multi-layer perceptron |

## API Usage

### Evaluate Model via HTTP

```bash
curl -X POST http://localhost:3333/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "model_file": "test_models/high_quality_model.pkl",
    "dataset_file": "test_datasets/high_quality_test.csv"
  }'
```

### Response Format

```json
{
  "success": true,
  "evaluation": {
    "quality_score": 90,
    "model_hash": "69c6bd56eb8ccca2...",
    "dataset_hash": "ae77b978463543d5...", 
    "accuracy_metrics": {
      "precision": 8860,  // Scaled by 10000 (88.60%)
      "recall": 8860,
      "f1_score": 8860,
      "auc": 9200
    },
    "performance_metrics": {
      "inference_time_ms": 1,
      "memory_usage_mb": 245,
      "throughput_samples_per_second": 10000
    },
    "bias_assessment": {
      "fairness_score": 85,
      "bias_detected": false,
      "demographic_parity": 9500
    },
    "data_integrity_score": 99
  }
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ML_EVALUATOR_URL` | `http://localhost:3333` | Python ML evaluator endpoint |
| `WALRUS_AGGREGATOR_URL` | `https://aggregator.walrus-testnet.walrus.space` | Walrus testnet aggregator |
| `WALRUS_REAL_DOWNLOADS` | `false` | Download from Walrus vs use test models |

## How ML Computation Works

### 1. Model Loading and Validation

```python
# Detect model format (PyTorch, ONNX, TensorFlow, scikit-learn)
model_data = pickle.loads(model_blob_data)
model = model_data['model']
scaler = model_data.get('scaler')  # For feature scaling
```

### 2. Dataset Processing

```python
# Support multiple formats: CSV, JSON, NumPy, Parquet
dataset = pd.read_csv(dataset_blob_data)
X = dataset.drop('label', axis=1)  # Features
y = dataset['label']  # Target
```

### 3. Real Performance Evaluation

```python
# Apply preprocessing if needed
if scaler:
    X_scaled = scaler.transform(X)

# Get predictions
y_pred = model.predict(X_scaled)

# Calculate metrics
accuracy = accuracy_score(y, y_pred)
precision = precision_score(y, y_pred, average='weighted')
recall = recall_score(y, y_pred, average='weighted')
f1 = f1_score(y, y_pred, average='weighted')
```

### 4. Bias Detection

```python
# Check for protected attributes
if 'protected_attribute' in dataset.columns:
    # Calculate demographic parity
    group_0_rate = np.mean(y_pred[protected == 0])
    group_1_rate = np.mean(y_pred[protected == 1])
    bias_detected = abs(group_1_rate - group_0_rate) > 0.1
```

### 5. Performance Measurement

```python
# Time inference on sample data
start = time.time()
model.predict(X_sample)
inference_time = (time.time() - start) / len(X_sample)

# Memory usage monitoring
memory_mb = psutil.Process().memory_info().rss / 1024 / 1024
```

## Creating Custom Models

### Generate New Test Models

```bash
python3 create_test_models.py
```

This creates models in `test_models/` and datasets in `test_datasets/` with different performance characteristics.

### Model Requirements

Models should be pickled with this structure:

```python
model_data = {
    'model': trained_sklearn_model,
    'scaler': StandardScaler(),  # Optional preprocessing
    'metadata': {
        'model_type': 'random_forest',
        'accuracy': 0.92,
        'n_features': 15
    }
}
```

### Dataset Requirements

Datasets should be CSV format with:
- Feature columns: `feature_0`, `feature_1`, etc.
- Target column: `label` 
- Optional bias column: `protected_attribute`

## Testing with Walrus

### 1. Upload Model to Walrus Testnet

```bash
# Upload your model file
walrus store /path/to/model.pkl

# Note the returned blob ID: "ABC123..."
```

### 2. Test with Real Walrus Downloads

```bash
export WALRUS_REAL_DOWNLOADS="true"

curl -X POST http://localhost:3333/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "use_walrus": true,
    "model_blob_id": "ABC123...",
    "dataset_blob_id": "DEF456..."
  }'
```

## Troubleshooting

### Python Evaluator Issues

```bash
# Check if server is running
curl http://localhost:3333/health

# View server logs
python3 ml_attestation_server.py

# Test with minimal model
curl http://localhost:3333/test_models
```

### Model Evaluation Errors

Common issues:
- **Feature mismatch**: Model expects different number of features than dataset
- **Missing scaler**: Model needs preprocessing but scaler not provided
- **Format issues**: Unsupported model or dataset format

### Performance Issues

- Models take 50ms-30s to evaluate depending on complexity
- Large datasets (>100MB) may timeout 
- Memory usage scales with model size

## Security Considerations

- TEE attestation provides cryptographic proof of computation
- Model and dataset integrity verified via SHA-256 hashes
- Bias detection helps ensure fairness
- All computation happens in isolated environment

## Production Deployment

For production use:

1. Deploy Python evaluator on secure infrastructure
2. Configure proper authentication between Rust and Python services
3. Set up monitoring and logging
4. Use real Walrus blob IDs for model/dataset downloads
5. Enable TEE remote attestation verification

## Support

For issues with:
- ML evaluation: Check Python server logs
- TEE attestation: Check Rust server logs  
- Walrus integration: Verify blob IDs and network connectivity