#!/usr/bin/env python3
"""
ML Attestation Server for Satya Marketplace
Provides HTTP API for real ML model evaluation
"""

import json
import os
import tempfile
import traceback
import base64
import requests
from pathlib import Path
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from ml_evaluator import MLEvaluator
from seal_client import decrypt_blob_if_needed, get_seal_client

# Load environment variables from parent directory's .env file
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)
print(f"Loading environment from: {env_path}")
print(f"SEAL_PACKAGE_ID: {os.getenv('SEAL_PACKAGE_ID', 'NOT SET')}")
print(f"SEAL_KEY_SERVER_1_OBJECT_ID: {os.getenv('SEAL_KEY_SERVER_1_OBJECT_ID', 'NOT SET')}")

app = Flask(__name__)
CORS(app)

# Initialize evaluator
evaluator = MLEvaluator()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test SEAL client connectivity
        seal_client = get_seal_client()
        seal_status = seal_client.test_key_servers()
        seal_ready = sum(1 for working in seal_status.values() if working) >= seal_client.config.threshold
        
        return jsonify({
            "status": "healthy",
            "service": "ml_attestation_server",
            "version": "1.0.0",
            "evaluator_ready": True,
            "seal_ready": seal_ready,
            "seal_key_servers": seal_status
        })
    except Exception as e:
        return jsonify({
            "status": "healthy",
            "service": "ml_attestation_server", 
            "version": "1.0.0",
            "evaluator_ready": True,
            "seal_ready": False,
            "seal_error": str(e)
        })

@app.route('/evaluate', methods=['POST'])
def evaluate_model():
    """
    Evaluate a model on a dataset
    
    Request format:
    {
        "model_data": "base64_encoded_model_data",  # or model_url
        "dataset_data": "base64_encoded_dataset_data",  # or dataset_url
        "model_url": "http://...",  # Alternative to model_data
        "dataset_url": "http://...",  # Alternative to dataset_data
        "use_walrus": true,  # Whether to download from Walrus
        "model_blob_id": "walrus_blob_id",  # For Walrus downloads
        "dataset_blob_id": "walrus_blob_id"  # For Walrus downloads
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        print(f"Received evaluation request: {list(data.keys())}")
        
        # Get model data
        model_data = None
        user_address = data.get("user_address")
        transaction_digest = data.get("transaction_digest")
        
        if data.get("use_walrus") and data.get("model_blob_id"):
            model_data = download_from_walrus(
                data["model_blob_id"], 
                user_address=user_address, 
                transaction_digest=transaction_digest
            )
        elif data.get("model_url"):
            model_data = download_from_url(data["model_url"])
        elif data.get("model_data"):
            model_data = base64.b64decode(data["model_data"])
        else:
            # Use local test model for demonstration
            model_file = data.get("model_file", "test_models/high_quality_model.pkl")
            if os.path.exists(model_file):
                with open(model_file, 'rb') as f:
                    model_data = f.read()
        
        if not model_data:
            return jsonify({"error": "Could not obtain model data"}), 400
        
        # Get dataset data
        dataset_data = None
        if data.get("use_walrus") and data.get("dataset_blob_id"):
            dataset_data = download_from_walrus(
                data["dataset_blob_id"], 
                user_address=user_address, 
                transaction_digest=transaction_digest
            )
        elif data.get("dataset_url"):
            dataset_data = download_from_url(data["dataset_url"])
        elif data.get("dataset_data"):
            dataset_data = base64.b64decode(data["dataset_data"])
        else:
            # Use local test dataset for demonstration
            dataset_file = data.get("dataset_file", "test_datasets/high_quality_test.csv")
            if os.path.exists(dataset_file):
                with open(dataset_file, 'rb') as f:
                    dataset_data = f.read()
        
        if not dataset_data:
            return jsonify({"error": "Could not obtain dataset data"}), 400
        
        print(f"Evaluating model ({len(model_data)} bytes) on dataset ({len(dataset_data)} bytes)")
        
        # Perform evaluation
        result = evaluator.evaluate_model_on_dataset(model_data, dataset_data)
        
        if result:
            return jsonify({
                "success": True,
                "evaluation": result
            })
        else:
            print("ERROR: Evaluation returned None/False")
            return jsonify({"error": "Evaluation failed - no result returned"}), 500
            
    except Exception as e:
        print(f"Evaluation error: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/test_models', methods=['GET'])
def list_test_models():
    """List available test models"""
    try:
        models_dir = "test_models"
        datasets_dir = "test_datasets"
        
        models = []
        datasets = []
        
        if os.path.exists(models_dir):
            for f in os.listdir(models_dir):
                if f.endswith('.pkl'):
                    models.append(f)
        
        if os.path.exists(datasets_dir):
            for f in os.listdir(datasets_dir):
                if f.endswith('.csv'):
                    datasets.append(f)
        
        # Load manifest if available
        manifest = {}
        manifest_path = os.path.join(models_dir, "manifest.json")
        if os.path.exists(manifest_path):
            with open(manifest_path, 'r') as f:
                manifest = json.load(f)
        
        return jsonify({
            "models": models,
            "datasets": datasets,
            "manifest": manifest
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/test_evaluate/<model_name>/<dataset_name>', methods=['GET'])
def test_evaluate(model_name, dataset_name):
    """Test evaluation with specific model and dataset"""
    try:
        model_file = f"test_models/{model_name}"
        dataset_file = f"test_datasets/{dataset_name}"
        
        if not os.path.exists(model_file):
            return jsonify({"error": f"Model {model_name} not found"}), 404
        if not os.path.exists(dataset_file):
            return jsonify({"error": f"Dataset {dataset_name} not found"}), 404
        
        with open(model_file, 'rb') as f:
            model_data = f.read()
        with open(dataset_file, 'rb') as f:
            dataset_data = f.read()
        
        result = evaluator.evaluate_model_on_dataset(model_data, dataset_data)
        
        if result:
            return jsonify({
                "success": True,
                "model": model_name,
                "dataset": dataset_name,
                "evaluation": result
            })
        else:
            return jsonify({"error": "Evaluation failed"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/download_model/<model_name>', methods=['GET'])
def download_model(model_name):
    """Download a test model"""
    try:
        model_file = f"test_models/{model_name}"
        if not os.path.exists(model_file):
            return jsonify({"error": f"Model {model_name} not found"}), 404
        
        return send_file(model_file, as_attachment=True)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/download_dataset/<dataset_name>', methods=['GET'])
def download_dataset(dataset_name):
    """Download a test dataset"""
    try:
        dataset_file = f"test_datasets/{dataset_name}"
        if not os.path.exists(dataset_file):
            return jsonify({"error": f"Dataset {dataset_name} not found"}), 404
        
        return send_file(dataset_file, as_attachment=True)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def download_from_walrus(blob_id, user_address=None, transaction_digest=None):
    """Download and decrypt blob from Walrus aggregator with SEAL support"""
    aggregator_url = os.environ.get("WALRUS_AGGREGATOR_URL", "https://aggregator.walrus-testnet.walrus.space")
    url = f"{aggregator_url}/v1/blobs/{blob_id}"

    print(f"Downloading from Walrus: {url}")

    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()

        blob_data = response.content
        if not blob_data:
            raise Exception("Downloaded blob is empty")

        print(f"Downloaded {len(blob_data)} bytes from Walrus")

        # Check if blob has metadata header
        # Format: [metadata_length(4 bytes)] [metadata_json] [encrypted_data]
        if len(blob_data) < 4:
            print("Blob too small for metadata header, treating as raw encrypted data")
            encrypted_data = blob_data
            metadata = None
        else:
            # Read metadata length from first 4 bytes (little-endian)
            metadata_length = int.from_bytes(blob_data[0:4], byteorder='little')

            # Sanity check metadata length
            if metadata_length > 0 and metadata_length < len(blob_data) - 4:
                try:
                    # Extract and parse metadata JSON
                    metadata_bytes = blob_data[4:4 + metadata_length]
                    metadata_string = metadata_bytes.decode('utf-8')
                    metadata = json.loads(metadata_string)

                    # Extract encrypted data after metadata
                    encrypted_data = blob_data[4 + metadata_length:]

                    print(f"Parsed SEAL metadata: policy_id={metadata.get('policy_id')}, " +
                          f"algorithm={metadata.get('encryption_algorithm')}")
                    print(f"Encrypted data size: {len(encrypted_data)} bytes")
                except Exception as e:
                    print(f"Failed to parse metadata header: {e}, treating as raw encrypted data")
                    encrypted_data = blob_data
                    metadata = None
            else:
                print(f"Invalid metadata length {metadata_length}, treating as raw encrypted data")
                encrypted_data = blob_data
                metadata = None

        # Decrypt with SEAL if metadata is present
        if metadata:
            print("Decrypting with SEAL using metadata...")
            decrypted_data = decrypt_with_seal_metadata(
                encrypted_data,
                metadata,
                user_address=user_address,
                transaction_digest=transaction_digest
            )
        else:
            print("No metadata found, attempting generic SEAL decryption...")
            decrypted_data = decrypt_blob_if_needed(
                encrypted_data,
                user_address=user_address,
                transaction_digest=transaction_digest
            )

        print(f"Decryption result: {len(decrypted_data)} bytes")
        return decrypted_data

    except Exception as e:
        print(f"Failed to download/decrypt from Walrus: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

def decrypt_with_seal_metadata(encrypted_data, metadata, user_address=None, transaction_digest=None):
    """Decrypt data using SEAL metadata (encrypted DEK, policy ID, IV)"""
    try:
        print("Decrypting with SEAL metadata...")

        # Extract metadata fields
        encrypted_dek_base64 = metadata.get('encrypted_dek_base64')
        policy_id = metadata.get('policy_id')
        iv_base64 = metadata.get('iv_base64')

        if not all([encrypted_dek_base64, policy_id, iv_base64]):
            raise Exception(f"Missing required metadata fields: " +
                          f"encrypted_dek={bool(encrypted_dek_base64)}, " +
                          f"policy_id={bool(policy_id)}, " +
                          f"iv={bool(iv_base64)}")

        # Decode base64 fields
        encrypted_dek = base64.b64decode(encrypted_dek_base64)
        iv = base64.b64decode(iv_base64)

        print(f"Encrypted DEK size: {len(encrypted_dek)} bytes")
        print(f"IV size: {len(iv)} bytes")
        print(f"Policy ID: {policy_id}")

        # Step 1: Decrypt the DEK using SEAL
        # In a real TEE environment, this would contact SEAL key servers
        # For now, we'll use the seal_client's decryption
        seal_client = get_seal_client()

        # The encrypted DEK needs to be decrypted by SEAL to get the plaintext DEK
        # This requires authorization (user_address, transaction_digest)
        print(f"Requesting DEK decryption from SEAL (user={user_address})")

        # For now, since we don't have full SEAL decryption implementation,
        # we'll try the generic decryption on the full encrypted data
        # TODO: Implement proper SEAL DEK decryption when SEAL SDK is available
        plaintext_data = seal_client.decrypt_blob(encrypted_data, user_address, transaction_digest)

        return plaintext_data

    except Exception as e:
        print(f"SEAL metadata decryption failed: {e}")
        import traceback
        traceback.print_exc()
        raise

def download_from_url(url):
    """Download data from URL"""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.content
    except Exception as e:
        print(f"Failed to download from URL: {str(e)}")
        raise

if __name__ == '__main__':
    print("Starting ML Attestation Server...")
    print("Available endpoints:")
    print("  GET  /health - Health check")
    print("  POST /evaluate - Evaluate model on dataset")
    print("  GET  /test_models - List available test models")
    print("  GET  /test_evaluate/<model>/<dataset> - Test with specific model/dataset")
    print("  GET  /download_model/<model> - Download test model")
    print("  GET  /download_dataset/<dataset> - Download test dataset")
    print("")
    print("Starting server on localhost:3333...")
    
    # Production-safe configuration
    import os
    debug_mode = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    host = os.getenv('FLASK_HOST', 'localhost')  # Use 'localhost' for consistency
    port = int(os.getenv('FLASK_PORT', '3333'))
    
    if debug_mode:
        print("⚠️  WARNING: Debug mode enabled! Not suitable for production.")
    
    app.run(host=host, port=port, debug=debug_mode)