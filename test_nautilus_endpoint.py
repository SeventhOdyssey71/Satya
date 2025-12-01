#!/usr/bin/env python3
"""
Quick Nautilus TEE Endpoint Tester
Tests all endpoints and displays results
"""

import requests
import json
import sys
from typing import Dict, Any

# ANSI color codes
GREEN = '\033[0;32m'
RED = '\033[0;31m'
YELLOW = '\033[1;33m'
BLUE = '\033[0;34m'
NC = '\033[0m'  # No Color

BASE_URL = "http://localhost:3333"

def print_header(text: str):
    print(f"\n{BLUE}{'='*60}{NC}")
    print(f"{BLUE}{text}{NC}")
    print(f"{BLUE}{'='*60}{NC}\n")

def print_success(text: str):
    print(f"{GREEN}✓ {text}{NC}")

def print_error(text: str):
    print(f"{RED}✗ {text}{NC}")

def print_info(text: str):
    print(f"{YELLOW}ℹ {text}{NC}")

def test_health() -> bool:
    """Test health endpoint"""
    print_header("1️⃣  Health Check")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        response.raise_for_status()
        data = response.json()

        print(json.dumps(data, indent=2))

        if data.get("status") == "healthy":
            print_success(f"Server healthy - Version {data.get('version')}")
            print_success(f"Evaluator ready: {data.get('evaluator_ready')}")
            print_success(f"SEAL ready: {data.get('seal_ready')}")
            return True
        else:
            print_error("Server not healthy")
            return False
    except Exception as e:
        print_error(f"Health check failed: {e}")
        return False

def test_list_models() -> bool:
    """Test listing models"""
    print_header("2️⃣  List Test Models")
    try:
        response = requests.get(f"{BASE_URL}/test_models", timeout=5)
        response.raise_for_status()
        data = response.json()

        print(f"Available Models: {len(data.get('models', []))}")
        for model in data.get('models', []):
            print(f"  • {model}")

        print(f"\nAvailable Datasets: {len(data.get('datasets', []))}")
        for dataset in data.get('datasets', []):
            print(f"  • {dataset}")

        return True
    except Exception as e:
        print_error(f"Failed to list models: {e}")
        return False

def test_evaluate_model(model_name: str, dataset_name: str, expected_range: tuple) -> Dict[str, Any]:
    """Test model evaluation"""
    model_type = model_name.replace('_model.pkl', '').replace('_', ' ').title()
    print_header(f"Testing {model_type}")

    try:
        url = f"{BASE_URL}/test_evaluate/{model_name}/{dataset_name}"
        print_info(f"Request: GET /test_evaluate/{model_name}/{dataset_name}")

        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()

        if not data.get('success'):
            print_error(f"Evaluation failed: {data.get('error', 'Unknown error')}")
            return None

        evaluation = data.get('evaluation', {})
        quality_score = evaluation.get('quality_score', 0)

        # Display results
        print(f"\n{YELLOW}Results:{NC}")
        print(f"  Quality Score: {quality_score}% (expected: {expected_range[0]}-{expected_range[1]}%)")

        # Check if in expected range
        if expected_range[0] <= quality_score <= expected_range[1]:
            print_success(f"Score within expected range!")
        else:
            print_error(f"Score outside expected range!")

        # Show detailed metrics
        accuracy = evaluation.get('accuracy_metrics', {})
        print(f"\n  Accuracy Metrics:")
        print(f"    • Precision: {accuracy.get('precision', 0)/100:.2f}%")
        print(f"    • Recall: {accuracy.get('recall', 0)/100:.2f}%")
        print(f"    • F1 Score: {accuracy.get('f1_score', 0)/100:.2f}%")
        print(f"    • AUC: {accuracy.get('auc', 0)/100:.2f}%")

        performance = evaluation.get('performance_metrics', {})
        print(f"\n  Performance Metrics:")
        print(f"    • Inference Time: {performance.get('inference_time_ms', 0)}ms")
        print(f"    • Memory Usage: {performance.get('memory_usage_mb', 0)}MB")
        print(f"    • Throughput: {performance.get('throughput_samples_per_second', 0)} samples/sec")

        bias = evaluation.get('bias_assessment', {})
        print(f"\n  Bias Assessment:")
        print(f"    • Fairness Score: {bias.get('fairness_score', 0)}%")
        print(f"    • Bias Detected: {bias.get('bias_detected', False)}")
        print(f"    • Demographic Parity: {bias.get('demographic_parity', 0)/100:.2f}%")

        print(f"\n  Data Integrity Score: {evaluation.get('data_integrity_score', 0)}%")

        return evaluation

    except Exception as e:
        print_error(f"Evaluation failed: {e}")
        return None

def test_post_evaluate() -> bool:
    """Test POST /evaluate endpoint"""
    print_header("5️⃣  Test POST Evaluation")

    try:
        payload = {
            "model_file": "test_models/high_quality_model.pkl",
            "dataset_file": "test_datasets/high_quality_test.csv"
        }

        print_info("Sending POST request with JSON payload...")
        print(f"Payload: {json.dumps(payload, indent=2)}")

        response = requests.post(
            f"{BASE_URL}/evaluate",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        response.raise_for_status()
        data = response.json()

        if data.get('success'):
            quality_score = data.get('evaluation', {}).get('quality_score', 0)
            print_success(f"POST evaluation successful! Quality Score: {quality_score}%")
            return True
        else:
            print_error(f"POST evaluation failed: {data.get('error')}")
            return False

    except Exception as e:
        print_error(f"POST evaluation failed: {e}")
        return False

def main():
    print(f"\n{GREEN}🧪 Nautilus TEE Endpoint Testing Suite{NC}")
    print(f"{GREEN}{'='*60}{NC}")
    print(f"Base URL: {BASE_URL}\n")

    # Test 1: Health check
    if not test_health():
        print_error("\n❌ Server is not running!")
        print_info("\nTo start the server:")
        print_info("  cd nautilus-server")
        print_info("  python3 ml_attestation_server.py")
        sys.exit(1)

    # Test 2: List models
    test_list_models()

    # Test 3: Evaluate different quality models
    tests = [
        ("high_quality_model.pkl", "high_quality_test.csv", (90, 95)),
        ("medium_quality_model.pkl", "medium_quality_test.csv", (80, 88)),
        ("low_quality_model.pkl", "low_quality_test.csv", (70, 78)),
        ("neural_network_model.pkl", "neural_network_test.csv", (85, 90))
    ]

    results = []
    for model, dataset, expected_range in tests:
        result = test_evaluate_model(model, dataset, expected_range)
        if result:
            results.append({
                'model': model,
                'score': result.get('quality_score', 0),
                'expected': expected_range
            })

    # Test 4: POST endpoint
    test_post_evaluate()

    # Summary
    print_header("📊 Test Summary")
    print(f"Total tests: {len(results)}")
    passed = sum(1 for r in results if r['expected'][0] <= r['score'] <= r['expected'][1])
    print_success(f"Passed: {passed}/{len(results)}")

    if passed == len(results):
        print(f"\n{GREEN}✅ All tests passed! Nautilus endpoint is working correctly.{NC}\n")
    else:
        print(f"\n{YELLOW}⚠️  Some tests failed. Check the output above for details.{NC}\n")

    print_info("For more testing options, see: TESTING_NAUTILUS.md")

if __name__ == "__main__":
    main()
