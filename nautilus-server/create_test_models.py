#!/usr/bin/env python3
"""
Create test ML models and datasets with varying performance levels
for real attestation testing in the Satya marketplace
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from sklearn.datasets import make_classification, make_regression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.preprocessing import StandardScaler
import joblib

# Create test_models directory
os.makedirs('test_models', exist_ok=True)
os.makedirs('test_datasets', exist_ok=True)

def create_classification_dataset(n_samples=1000, n_features=20, n_classes=3, noise_level=0.1):
    """Create a classification dataset with specified noise level"""
    X, y = make_classification(
        n_samples=n_samples,
        n_features=n_features,
        n_classes=n_classes,
        n_informative=int(n_features * 0.8),
        n_redundant=int(n_features * 0.1),
        n_clusters_per_class=1,
        flip_y=noise_level,
        random_state=42
    )
    return X, y

def create_high_quality_model():
    """Create a high-performance model (90%+ accuracy)"""
    print("Creating high-quality model...")
    
    # Generate clean, well-separated data
    X, y = create_classification_dataset(n_samples=2000, n_features=15, noise_level=0.05)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)
    
    # Use Random Forest which typically performs well
    model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    scaler = StandardScaler()
    
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    model.fit(X_train_scaled, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='weighted')
    recall = recall_score(y_test, y_pred, average='weighted')
    f1 = f1_score(y_test, y_pred, average='weighted')
    
    print(f"High-quality model metrics: Accuracy={accuracy:.3f}, F1={f1:.3f}")
    
    # Save model and scaler together using joblib (safer than pickle)
    model_data = {
        'model': model,
        'scaler': scaler,
        'metadata': {
            'model_type': 'random_forest',
            'n_features': 15,
            'n_classes': 3,
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1
        }
    }
    
    joblib.dump(model_data, 'test_models/high_quality_model.pkl')
    
    # Save test dataset
    test_data = pd.DataFrame(X_test_scaled, columns=[f'feature_{i}' for i in range(15)])
    test_data['label'] = y_test
    test_data.to_csv('test_datasets/high_quality_test.csv', index=False)
    
    return accuracy, f1

def create_medium_quality_model():
    """Create a medium-performance model (75-85% accuracy)"""
    print("Creating medium-quality model...")
    
    # Generate data with some noise
    X, y = create_classification_dataset(n_samples=1500, n_features=12, noise_level=0.15)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)
    
    # Use simpler model with limited complexity
    model = LogisticRegression(max_iter=1000, random_state=42)
    scaler = StandardScaler()
    
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    model.fit(X_train_scaled, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='weighted')
    recall = recall_score(y_test, y_pred, average='weighted')
    f1 = f1_score(y_test, y_pred, average='weighted')
    
    print(f"Medium-quality model metrics: Accuracy={accuracy:.3f}, F1={f1:.3f}")
    
    # Save model using joblib
    model_data = {
        'model': model,
        'scaler': scaler,
        'metadata': {
            'model_type': 'logistic_regression',
            'n_features': 12,
            'n_classes': 3,
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1
        }
    }
    
    joblib.dump(model_data, 'test_models/medium_quality_model.pkl')
    
    # Save test dataset
    test_data = pd.DataFrame(X_test_scaled, columns=[f'feature_{i}' for i in range(12)])
    test_data['label'] = y_test
    test_data.to_csv('test_datasets/medium_quality_test.csv', index=False)
    
    return accuracy, f1

def create_low_quality_model():
    """Create a low-performance model (60-70% accuracy)"""
    print("Creating low-quality model...")
    
    # Generate noisy data that's hard to classify
    X, y = create_classification_dataset(n_samples=800, n_features=8, noise_level=0.3)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)
    
    # Use overly simple model
    model = LogisticRegression(C=0.01, max_iter=50, random_state=42)  # Underfitted
    scaler = StandardScaler()
    
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    model.fit(X_train_scaled, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='weighted')
    recall = recall_score(y_test, y_pred, average='weighted')
    f1 = f1_score(y_test, y_pred, average='weighted')
    
    print(f"Low-quality model metrics: Accuracy={accuracy:.3f}, F1={f1:.3f}")
    
    # Save model using joblib
    model_data = {
        'model': model,
        'scaler': scaler,
        'metadata': {
            'model_type': 'logistic_regression_simple',
            'n_features': 8,
            'n_classes': 3,
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1
        }
    }
    
    joblib.dump(model_data, 'test_models/low_quality_model.pkl')
    
    # Save test dataset
    test_data = pd.DataFrame(X_test_scaled, columns=[f'feature_{i}' for i in range(8)])
    test_data['label'] = y_test
    test_data.to_csv('test_datasets/low_quality_test.csv', index=False)
    
    return accuracy, f1

def create_neural_network_model():
    """Create a neural network model with intermediate performance"""
    print("Creating neural network model...")
    
    X, y = create_classification_dataset(n_samples=1200, n_features=20, noise_level=0.1)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)
    
    # Neural network
    model = MLPClassifier(
        hidden_layer_sizes=(100, 50),
        max_iter=500,
        random_state=42,
        learning_rate_init=0.001
    )
    scaler = StandardScaler()
    
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    model.fit(X_train_scaled, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='weighted')
    recall = recall_score(y_test, y_pred, average='weighted')
    f1 = f1_score(y_test, y_pred, average='weighted')
    
    print(f"Neural network model metrics: Accuracy={accuracy:.3f}, F1={f1:.3f}")
    
    # Save model using joblib
    model_data = {
        'model': model,
        'scaler': scaler,
        'metadata': {
            'model_type': 'neural_network',
            'n_features': 20,
            'n_classes': 3,
            'hidden_layers': [100, 50],
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1
        }
    }
    
    joblib.dump(model_data, 'test_models/neural_network_model.pkl')
    
    # Save test dataset
    test_data = pd.DataFrame(X_test_scaled, columns=[f'feature_{i}' for i in range(20)])
    test_data['label'] = y_test
    test_data.to_csv('test_datasets/neural_network_test.csv', index=False)
    
    return accuracy, f1

def create_biased_dataset():
    """Create a dataset with obvious bias for testing bias detection"""
    print("Creating biased dataset...")
    
    # Create dataset where one feature strongly correlates with both the target and a protected attribute
    np.random.seed(42)
    n_samples = 1000
    
    # Protected attribute (e.g., gender: 0=female, 1=male)
    protected_attr = np.random.binomial(1, 0.5, n_samples)
    
    # Features that correlate with protected attribute
    X = np.random.randn(n_samples, 10)
    # Make first feature correlate with protected attribute
    X[:, 0] = X[:, 0] + 2 * protected_attr
    
    # Target that's biased towards one group
    y = (X[:, 0] + X[:, 1] + np.random.randn(n_samples) * 0.5 > 1).astype(int)
    # Artificially increase bias: if protected_attr=0, reduce positive outcomes
    bias_mask = (protected_attr == 0) & (y == 1)
    y[bias_mask] = np.random.binomial(1, 0.3, bias_mask.sum())  # Reduce positive rate for group 0
    
    # Create DataFrame
    feature_cols = [f'feature_{i}' for i in range(10)]
    df = pd.DataFrame(X, columns=feature_cols)
    df['protected_attribute'] = protected_attr
    df['label'] = y
    
    df.to_csv('test_datasets/biased_dataset.csv', index=False)
    
    # Calculate bias metrics
    group_0_positive_rate = df[df['protected_attribute'] == 0]['label'].mean()
    group_1_positive_rate = df[df['protected_attribute'] == 1]['label'].mean()
    demographic_parity_diff = abs(group_1_positive_rate - group_0_positive_rate)
    
    print(f"Bias dataset created - Demographic parity difference: {demographic_parity_diff:.3f}")
    
    return demographic_parity_diff

def create_model_manifest():
    """Create a manifest file with all model information"""
    manifest = {
        "models": {
            "high_quality_model": {
                "file": "high_quality_model.pkl",
                "expected_accuracy": 0.90,
                "expected_f1": 0.90,
                "model_type": "random_forest",
                "test_dataset": "high_quality_test.csv",
                "description": "High-performance Random Forest model with clean data"
            },
            "medium_quality_model": {
                "file": "medium_quality_model.pkl", 
                "expected_accuracy": 0.80,
                "expected_f1": 0.80,
                "model_type": "logistic_regression",
                "test_dataset": "medium_quality_test.csv",
                "description": "Medium-performance Logistic Regression model"
            },
            "low_quality_model": {
                "file": "low_quality_model.pkl",
                "expected_accuracy": 0.65,
                "expected_f1": 0.65,
                "model_type": "logistic_regression_simple", 
                "test_dataset": "low_quality_test.csv",
                "description": "Low-performance underfitted model with noisy data"
            },
            "neural_network_model": {
                "file": "neural_network_model.pkl",
                "expected_accuracy": 0.85,
                "expected_f1": 0.85,
                "model_type": "neural_network",
                "test_dataset": "neural_network_test.csv",
                "description": "Multi-layer perceptron neural network"
            }
        },
        "datasets": {
            "biased_dataset": {
                "file": "biased_dataset.csv",
                "bias_level": "high",
                "description": "Dataset with demographic bias for testing bias detection"
            }
        }
    }
    
    with open('test_models/manifest.json', 'w') as f:
        json.dump(manifest, f, indent=2)

if __name__ == "__main__":
    print("Creating test ML models and datasets...")
    print("=" * 50)
    
    # Create models with different quality levels
    high_acc, high_f1 = create_high_quality_model()
    medium_acc, medium_f1 = create_medium_quality_model() 
    low_acc, low_f1 = create_low_quality_model()
    nn_acc, nn_f1 = create_neural_network_model()
    
    # Create biased dataset
    bias_level = create_biased_dataset()
    
    # Create manifest
    create_model_manifest()
    
    print("=" * 50)
    print("Summary of created models:")
    print(f"High Quality:    Acc={high_acc:.3f}, F1={high_f1:.3f}")
    print(f"Medium Quality:  Acc={medium_acc:.3f}, F1={medium_f1:.3f}")  
    print(f"Low Quality:     Acc={low_acc:.3f}, F1={low_f1:.3f}")
    print(f"Neural Network:  Acc={nn_acc:.3f}, F1={nn_f1:.3f}")
    print(f"Bias Level:      {bias_level:.3f}")
    print("\nFiles created in test_models/ and test_datasets/")
    print("Run the server with these models for real attestation!")