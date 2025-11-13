#!/usr/bin/env python3
"""
Tiny Models Server - Serves our real tiny models
Simple server to provide metadata about our tiny_models
"""
import json
import joblib
import numpy as np
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import uvicorn

app = FastAPI(title="Tiny Models Server", description="Serves real tiny models metadata")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths to our tiny models
TINY_MODELS_DIR = Path("tiny_models")
TINY_DATASETS_DIR = Path("tiny_datasets")

class TinyModel(BaseModel):
    id: str
    name: str
    file: str
    type: str
    input_shape: List
    output_classes: int
    class_names: List[str]
    accuracy: float
    model_size: int
    test_data: str
    test_labels: str
    test_samples: int
    feature_names: List[str]

class TinyModelsResponse(BaseModel):
    models: List[TinyModel]
    count: int

@app.get("/")
async def root():
    return {
        "name": "Tiny Models Server",
        "description": "Serves real trained tiny models for TEE testing",
        "endpoints": [
            "GET /models - List available tiny models",
            "GET /model/{model_id} - Get specific model info",
            "POST /inference/{model_id} - Run inference with model"
        ]
    }

@app.get("/models", response_model=TinyModelsResponse)
async def get_tiny_models():
    """Get list of available tiny models"""
    
    models = []
    
    # Logistic Regression Model
    if (TINY_MODELS_DIR / "logistic_regression.pkl").exists():
        models.append(TinyModel(
            id="tiny_lr",
            name="Tiny Logistic Regression",
            file="tiny_models/logistic_regression.pkl",
            type="sklearn.LogisticRegression",
            input_shape=[10],
            output_classes=2,
            class_names=["class_0", "class_1"],
            accuracy=0.859,
            model_size=943,
            test_data="tiny_datasets/test_features.npy",
            test_labels="tiny_datasets/test_labels.npy", 
            test_samples=50,
            feature_names=[f"feature_{i}" for i in range(10)]
        ))
    
    # Random Forest Model
    if (TINY_MODELS_DIR / "random_forest_small.pkl").exists():
        models.append(TinyModel(
            id="tiny_rf",
            name="Tiny Random Forest",
            file="tiny_models/random_forest_small.pkl", 
            type="sklearn.RandomForestClassifier",
            input_shape=[10],
            output_classes=2,
            class_names=["negative", "positive"],
            accuracy=0.913,
            model_size=39209,
            test_data="tiny_datasets/test_features.npy",
            test_labels="tiny_datasets/test_labels.npy",
            test_samples=50,
            feature_names=[f"feature_{i}" for i in range(10)]
        ))
    
    # Text Sentiment Model
    if (TINY_MODELS_DIR / "text_sentiment.pkl").exists():
        models.append(TinyModel(
            id="tiny_sentiment",
            name="Tiny Text Sentiment",
            file="tiny_models/text_sentiment.pkl",
            type="sklearn.Pipeline",
            input_shape=["text"],
            output_classes=2,
            class_names=["negative", "positive"], 
            accuracy=1.000,
            model_size=3457,
            test_data="tiny_datasets/test_texts.npy",
            test_labels="tiny_datasets/test_text_labels.npy",
            test_samples=20,
            feature_names=["text_input"]
        ))
    
    return TinyModelsResponse(models=models, count=len(models))

@app.get("/model/{model_id}")
async def get_model_info(model_id: str):
    """Get detailed info about a specific tiny model"""
    
    models_response = await get_tiny_models()
    
    for model in models_response.models:
        if model.id == model_id:
            return model.dict()
    
    return {"error": f"Model {model_id} not found"}

@app.post("/inference/{model_id}")
async def run_inference(model_id: str, input_data: dict):
    """Run inference with a tiny model"""
    
    try:
        # Find the model
        models_response = await get_tiny_models()
        target_model = None
        
        for model in models_response.models:
            if model.id == model_id:
                target_model = model
                break
                
        if not target_model:
            return {"error": f"Model {model_id} not found"}
        
        # Load the model
        model_path = Path(target_model.file)
        loaded_model = joblib.load(model_path)
        
        # Get input data
        inputs = input_data.get("inputs", [])
        if not inputs:
            return {"error": "No input data provided"}
        
        # Run prediction
        if "text" in target_model.input_shape:
            # Text model
            predictions = loaded_model.predict(inputs)
            probabilities = loaded_model.predict_proba(inputs)
        else:
            # Numeric model
            predictions = loaded_model.predict(np.array(inputs))
            probabilities = loaded_model.predict_proba(np.array(inputs))
        
        return {
            "model_id": model_id,
            "model_name": target_model.name,
            "predictions": predictions.tolist(),
            "probabilities": probabilities.tolist(),
            "confidence_scores": [max(prob) for prob in probabilities],
            "input_shape": inputs[0] if len(inputs) > 0 else [],
            "timestamp": "2025-11-13T11:08:00Z",
            "real_model": True
        }
        
    except Exception as e:
        return {"error": f"Inference failed: {str(e)}"}

if __name__ == "__main__":
    print("🤖 Starting Tiny Models Server...")
    print("📂 Serving models from:", TINY_MODELS_DIR.absolute())
    print("📊 Serving datasets from:", TINY_DATASETS_DIR.absolute()) 
    print("🌐 Server will run on: http://localhost:8001")
    
    uvicorn.run(app, host="0.0.0.0", port=8001)