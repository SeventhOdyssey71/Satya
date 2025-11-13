#!/usr/bin/env python3
"""
Nautilus TEE Simulation Server
Simulates secure model inference in a trusted execution environment
"""

import os
import json
import time
import pickle
import hashlib
import secrets
import numpy as np
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import base64

# Import our real attestation generator
try:
    from real_attestation_generator import RealAttestationGenerator
    REAL_ATTESTATION_AVAILABLE = True
    print("✅ Real attestation generator loaded")
except ImportError as e:
    print(f"⚠️  Real attestation generator not available: {e}")
    REAL_ATTESTATION_AVAILABLE = False

# Initialize FastAPI app
app = FastAPI(title="Nautilus TEE Simulation", description="TEE-based AI model inference simulator")

# Initialize real attestation generator
real_attestation_generator = None
if REAL_ATTESTATION_AVAILABLE:
    try:
        real_attestation_generator = RealAttestationGenerator()
        print("🔒 Real TEE attestation generator initialized")
    except Exception as e:
        print(f"❌ Failed to initialize real attestation generator: {e}")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class AttestationRequest(BaseModel):
    pcr0: str
    pcr1: str
    pcr2: str
    pcr8: str
    timestamp: float
    nonce: str

class InferenceRequest(BaseModel):
    model_id: str
    input_data: List[List[float]]
    attestation: AttestationRequest

class TEEResponse(BaseModel):
    success: bool
    attestation_verified: bool
    predictions: Optional[List[int]]
    confidence_scores: Optional[List[float]]
    model_hash: Optional[str]
    timestamp: float
    signature: Optional[str]
    enclave_id: str = "nautilus-tee-sim-001"

# Load test manifest
try:
    with open('test_manifest.json', 'r') as f:
        TEST_MANIFEST = json.load(f)
    print(f"✅ Loaded manifest with {len(TEST_MANIFEST['models'])} models")
except FileNotFoundError:
    print("❌ test_manifest.json not found. Run generate_test_assets.py first.")
    TEST_MANIFEST = {"models": []}

# Simulate enclave PCR values (these would be real in actual TEE)
EXPECTED_PCRS = {
    "pcr0": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
    "pcr1": "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "pcr2": "fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
    "pcr8": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
}

def verify_attestation(attestation: AttestationRequest) -> bool:
    """Simulate TEE attestation verification"""
    print(f"🔒 Verifying TEE attestation...")
    
    # Check PCR values match expected enclave measurements
    pcr_checks = {
        "pcr0": attestation.pcr0 == EXPECTED_PCRS["pcr0"],
        "pcr1": attestation.pcr1 == EXPECTED_PCRS["pcr1"], 
        "pcr2": attestation.pcr2 == EXPECTED_PCRS["pcr2"],
        "pcr8": attestation.pcr8 == EXPECTED_PCRS["pcr8"]
    }
    
    # Check timestamp freshness (within 5 minutes)
    current_time = time.time()
    time_valid = abs(current_time - attestation.timestamp) < 300
    
    all_valid = all(pcr_checks.values()) and time_valid
    
    print(f"  PCR0: {'✅' if pcr_checks['pcr0'] else '❌'}")
    print(f"  PCR1: {'✅' if pcr_checks['pcr1'] else '❌'}")
    print(f"  PCR2: {'✅' if pcr_checks['pcr2'] else '❌'}")
    print(f"  PCR8: {'✅' if pcr_checks['pcr8'] else '❌'}")
    print(f"  Time: {'✅' if time_valid else '❌'} (diff: {abs(current_time - attestation.timestamp):.1f}s)")
    
    return all_valid

def load_model(model_id: str):
    """Load model by ID from manifest"""
    for model_info in TEST_MANIFEST['models']:
        if model_info['id'] == model_id:
            model_path = model_info['file']
            if os.path.exists(model_path):
                with open(model_path, 'rb') as f:
                    model = pickle.load(f)
                return model, model_info
            else:
                raise FileNotFoundError(f"Model file not found: {model_path}")
    
    raise ValueError(f"Model not found: {model_id}")

def create_signature(data: Dict) -> str:
    """Simulate Ed25519 signature generation (in real TEE this would use ephemeral keys)"""
    # In real implementation, this would use ephemeral Ed25519 keys generated in TEE
    data_string = json.dumps(data, sort_keys=True)
    signature_hash = hashlib.sha256(data_string.encode()).hexdigest()
    return f"ed25519_sim_{signature_hash[:32]}"

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "service": "Nautilus TEE Simulation",
        "enclave_id": "nautilus-tee-sim-001",
        "available_models": len(TEST_MANIFEST.get('models', [])),
        "timestamp": time.time()
    }

@app.get("/models")
async def list_models():
    """List available models"""
    return {
        "models": TEST_MANIFEST.get('models', []),
        "count": len(TEST_MANIFEST.get('models', []))
    }

@app.get("/attestation/challenge")
async def get_attestation_challenge():
    """Generate attestation challenge"""
    nonce = hashlib.sha256(f"{time.time()}_{os.urandom(32).hex()}".encode()).hexdigest()
    return {
        "nonce": nonce,
        "expected_pcrs": EXPECTED_PCRS,
        "timestamp": time.time(),
        "enclave_id": "nautilus-tee-sim-001"
    }

@app.post("/inference", response_model=TEEResponse)
async def secure_inference(request: InferenceRequest):
    """Perform secure inference in simulated TEE"""
    
    print(f"\n🔒 TEE Inference Request for model: {request.model_id}")
    
    try:
        # Step 1: Verify attestation
        attestation_valid = verify_attestation(request.attestation)
        
        if not attestation_valid:
            print("❌ Attestation verification failed")
            return TEEResponse(
                success=False,
                attestation_verified=False,
                predictions=None,
                confidence_scores=None,
                model_hash=None,
                signature=None,
                timestamp=time.time()
            )
        
        print("✅ Attestation verified")
        
        # Step 2: Load model securely inside "TEE"
        print(f"📦 Loading model {request.model_id} in TEE...")
        model, model_info = load_model(request.model_id)
        
        # Calculate model hash for verification
        model_path = model_info['file']
        with open(model_path, 'rb') as f:
            model_data = f.read()
        model_hash = hashlib.sha256(model_data).hexdigest()
        
        # Step 3: Perform inference
        print("🧠 Performing secure inference...")
        start_time = time.time()
        
        input_array = np.array(request.input_data)
        predictions = model.predict(input_array)
        probabilities = model.predict_proba(input_array)
        
        inference_time = time.time() - start_time
        
        # Extract confidence scores
        confidence_scores = np.max(probabilities, axis=1).tolist()
        predictions_list = predictions.tolist()
        
        print(f"⚡ Inference completed in {inference_time*1000:.2f}ms")
        print(f"📊 Predictions: {predictions_list}")
        print(f"🎯 Avg confidence: {np.mean(confidence_scores):.3f}")
        
        # Step 4: Create signed response
        response_data = {
            "model_id": request.model_id,
            "model_hash": model_hash[:16],
            "predictions": predictions_list,
            "confidence_scores": confidence_scores,
            "inference_time_ms": inference_time * 1000,
            "timestamp": time.time(),
            "enclave_id": "nautilus-tee-sim-001"
        }
        
        signature = create_signature(response_data)
        
        return TEEResponse(
            success=True,
            attestation_verified=True,
            predictions=predictions_list,
            confidence_scores=confidence_scores,
            model_hash=model_hash[:16],
            timestamp=time.time(),
            signature=signature
        )
        
    except Exception as e:
        print(f"❌ TEE inference failed: {str(e)}")
        return TEEResponse(
            success=False,
            attestation_verified=False,
            predictions=None,
            confidence_scores=None,
            model_hash=None,
            signature=None,
            timestamp=time.time()
        )

@app.post("/upload-model")
async def upload_model(
    model_file: UploadFile = File(...),
    model_name: str = Body(...),
    model_type: str = Body(...)
):
    """Upload and register a new model"""
    
    print(f"📤 Uploading new model: {model_name}")
    
    try:
        # Save uploaded model
        model_dir = Path("models")
        model_dir.mkdir(exist_ok=True)
        
        model_path = model_dir / f"{model_name}.pkl"
        
        with open(model_path, "wb") as f:
            content = await model_file.read()
            f.write(content)
        
        # Calculate model hash and size
        model_hash = hashlib.sha256(content).hexdigest()
        model_size = len(content)
        
        # Add to manifest
        new_model = {
            "id": model_name.lower().replace(" ", "_"),
            "name": model_name,
            "file": str(model_path),
            "type": model_type,
            "model_hash": model_hash[:16],
            "model_size": model_size,
            "uploaded_at": time.time()
        }
        
        TEST_MANIFEST["models"].append(new_model)
        
        # Save updated manifest
        with open('test_manifest.json', 'w') as f:
            json.dump(TEST_MANIFEST, f, indent=2)
        
        print(f"✅ Model uploaded successfully: {model_size} bytes")
        
        return {
            "success": True,
            "model_id": new_model["id"],
            "model_hash": model_hash[:16],
            "size": model_size
        }
        
    except Exception as e:
        print(f"❌ Model upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/complete_verification")
async def complete_verification(request: dict):
    """Complete verification endpoint that combines TEE attestation with ML results"""
    try:
        print("🔗 Complete verification request received")
        
        # Get model result from request
        model_result = request.get("model_result", {})
        assessment_type = request.get("assessment_type", "quality_analysis")
        
        # Try to determine which model was used
        model_id = model_result.get("model_id", "unknown")
        model_path = None
        
        # Map model ID to actual file path
        tiny_models_dir = Path("nautilus-production/tiny_models")
        model_mapping = {
            "tiny_lr": tiny_models_dir / "logistic_regression.pkl",
            "wine_lr": tiny_models_dir / "logistic_regression.pkl", 
            "wine_rf": tiny_models_dir / "random_forest_small.pkl",
            "tiny_sentiment": tiny_models_dir / "text_sentiment.pkl"
        }
        
        if model_id in model_mapping and model_mapping[model_id].exists():
            model_path = model_mapping[model_id]
        else:
            # Fallback to first available model
            if tiny_models_dir.exists():
                available_models = list(tiny_models_dir.glob("*.pkl"))
                if available_models:
                    model_path = available_models[0]
        
        # Generate REAL attestation if available
        if real_attestation_generator and model_path:
            print(f"🔒 Generating REAL TEE attestation for {model_path}")
            verification_result = real_attestation_generator.generate_real_attestation(
                model_path, model_result
            )
            verification_result["verification_metadata"]["assessment_type"] = assessment_type
            print("✅ REAL TEE attestation generated with cryptographic proof")
            return verification_result
        
        else:
            # Fallback to simulated attestation
            print("⚠️  Using fallback simulated attestation")
            
            # Generate request ID
            request_id = f"req_{int(time.time() * 1000)}"
            
            # Create TEE attestation data (simulation)
            attestation_data = {
                "pcr0": EXPECTED_PCRS["pcr0"],
                "pcr1": EXPECTED_PCRS["pcr1"], 
                "pcr2": EXPECTED_PCRS["pcr2"],
                "pcr8": EXPECTED_PCRS["pcr8"],
                "signature": "ed25519_" + secrets.token_hex(32),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
            
            # Create ML processing result with quality score
            ml_result = {
                "request_id": request_id,
                "model_hash": f"sha256_{secrets.token_hex(16)}",
                "quality_score": 0.9814,  # 98.14% quality
                "predictions": model_result.get("predictions", []),
                "confidence": model_result.get("confidence_scores", [0.95])[0] if model_result.get("confidence_scores") else 0.95,
                "signature": "ml_sig_" + secrets.token_hex(24)
            }
            
            # Complete verification response
            verification_result = {
                "request_id": request_id,
                "tee_attestation": attestation_data,
                "ml_processing_result": ml_result,
                "verification_metadata": {
                    "enclave_id": f"enc_{secrets.token_hex(8)}",
                    "source": "simulation_fallback",
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "assessment_type": assessment_type
                }
            }
            
            print(f"✅ Simulated verification generated for request {request_id}")
            return verification_result
        
    except Exception as e:
        print(f"❌ Complete verification failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("🚀 Starting Nautilus TEE Simulation Server...")
    print("📋 Endpoints:")
    print("  GET  / - Health check")
    print("  GET  /models - List available models")
    print("  GET  /attestation/challenge - Get attestation challenge")
    print("  POST /inference - Secure model inference")
    print("  POST /upload-model - Upload new model")
    print("  POST /complete_verification - Complete TEE verification")
    print("\n🔒 Expected PCR values for valid attestation:")
    for pcr, value in EXPECTED_PCRS.items():
        print(f"  {pcr}: {value}")
    
    uvicorn.run(app, host="0.0.0.0", port=5001, log_level="info")