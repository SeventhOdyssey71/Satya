#!/usr/bin/env python3
"""
Demo script showing ML attestation results being prepared for on-chain verification
"""

import requests
import json
import hashlib
import time

def test_onchain_verification():
    """Test the complete ML attestation -> on-chain verification flow"""
    print("🚀 Testing ML Attestation -> On-Chain Verification Flow")
    print("=" * 60)
    
    # Test different models to show varying quality scores
    test_cases = [
        ("high_quality_model.pkl", "high_quality_test.csv", "Expected: ~90% quality"),
        ("medium_quality_model.pkl", "medium_quality_test.csv", "Expected: ~86% quality"), 
        ("low_quality_model.pkl", "low_quality_test.csv", "Expected: ~83% quality"),
        ("neural_network_model.pkl", "neural_network_test.csv", "Expected: ~87% quality")
    ]
    
    verification_results = []
    
    for model_file, dataset_file, description in test_cases:
        print(f"\n📊 Testing: {model_file}")
        print(f"📁 Dataset: {dataset_file}")
        print(f"🎯 {description}")
        print("-" * 40)
        
        # Call ML evaluator
        url = "http://127.0.0.1:3333/test_evaluate/{}/{}".format(model_file, dataset_file)
        
        try:
            response = requests.get(url, timeout=30)
            if response.status_code == 200:
                result = response.json()
                evaluation = result['evaluation']
                
                # Extract key metrics
                quality_score = evaluation['quality_score']
                f1_score = evaluation['accuracy_metrics']['f1_score'] / 10000  # Convert from scaled
                precision = evaluation['accuracy_metrics']['precision'] / 10000
                recall = evaluation['accuracy_metrics']['recall'] / 10000
                fairness_score = evaluation['bias_assessment']['fairness_score']
                data_integrity = evaluation['data_integrity_score']
                model_hash = evaluation['model_hash']
                
                print(f"✅ Quality Score: {quality_score}%")
                print(f"📈 F1 Score: {f1_score:.2f}%")
                print(f"🎯 Precision: {precision:.2f}%")
                print(f"🔍 Recall: {recall:.2f}%")
                print(f"⚖️  Fairness Score: {fairness_score}%")
                print(f"🛡️  Data Integrity: {data_integrity}%")
                print(f"🔐 Model Hash: {model_hash[:16]}...")
                
                # Simulate blockchain transaction data
                blockchain_data = prepare_blockchain_transaction(evaluation, model_file)
                verification_results.append({
                    'model': model_file,
                    'quality_score': quality_score,
                    'blockchain_data': blockchain_data
                })
                
                print(f"🔗 Blockchain TX Prepared: {blockchain_data['tx_digest']}")
                
            else:
                print(f"❌ Failed to evaluate: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 VERIFICATION SUMMARY")
    print("=" * 60)
    
    for result in verification_results:
        model = result['model']
        score = result['quality_score']
        tx_digest = result['blockchain_data']['tx_digest']
        
        # Quality assessment
        if score >= 90:
            quality_label = "🟢 EXCELLENT"
        elif score >= 85:
            quality_label = "🟡 GOOD"
        elif score >= 80:
            quality_label = "🟠 ACCEPTABLE"
        else:
            quality_label = "🔴 POOR"
            
        print(f"{quality_label} | {model:<25} | {score:>3}% | TX: {tx_digest}")
    
    print("\n💡 These results would be published to the Sui blockchain via:")
    print("   satya_marketplace::complete_verification() function")
    print("   with real quality scores instead of fake 66% values!")

def prepare_blockchain_transaction(evaluation, model_name):
    """Prepare the data that would be submitted to blockchain"""
    
    # Simulate blockchain transaction preparation
    model_hash = evaluation['model_hash']
    dataset_hash = evaluation['dataset_hash']
    quality_score = evaluation['quality_score']
    
    # Create attestation hash (same as TEE would generate)
    attestation_data = {
        'model_hash': model_hash,
        'dataset_hash': dataset_hash,
        'quality_score': quality_score,
        'accuracy_metrics': evaluation['accuracy_metrics'],
        'bias_assessment': evaluation['bias_assessment'],
        'timestamp': int(time.time() * 1000)
    }
    
    attestation_json = json.dumps(attestation_data, sort_keys=True)
    attestation_hash = hashlib.sha256(attestation_json.encode()).hexdigest()
    
    # Simulate Move function call data
    blockchain_transaction = {
        'package_id': '0x123...abc',  # Marketplace package ID
        'module': 'satya_marketplace',
        'function': 'complete_verification',
        'arguments': [
            'PENDING_MODEL_ID',  # model: &mut PendingModel
            'REGISTRY_ID',       # registry: &mut MarketplaceRegistry
            'nautilus-tee-v1',   # enclave_id: String
            quality_score,       # quality_score: u64
            f"ML Assessment - F1: {evaluation['accuracy_metrics']['f1_score']/10000:.1f}%, Fairness: {evaluation['bias_assessment']['fairness_score']}%",  # security_assessment
            attestation_hash,    # attestation_hash: vector<u8>
            'SIGNATURE_PLACEHOLDER',  # verifier_signature: vector<u8>
            'CLOCK_ID'          # clock: &Clock
        ],
        'tx_digest': f"0x{attestation_hash[:32]}",  # Simulated transaction digest
        'attestation_hash': attestation_hash,
        'model_name': model_name
    }
    
    return blockchain_transaction

if __name__ == "__main__":
    print("🔬 Satya ML Marketplace - On-Chain Verification Demo")
    print("This demo shows how real ML attestation results are prepared")
    print("for publication to the Sui blockchain smart contract.")
    print("")
    
    # Check if ML evaluator is running
    try:
        health_response = requests.get("http://127.0.0.1:3333/health", timeout=5)
        if health_response.status_code == 200:
            print("✅ ML Evaluator is running on localhost:3333")
            test_onchain_verification()
        else:
            print("❌ ML Evaluator not responding properly")
    except requests.exceptions.ConnectionError:
        print("❌ ML Evaluator not running on localhost:3333")
        print("   Please start it with: python3 ml_attestation_server.py")
    except Exception as e:
        print(f"❌ Error connecting to ML Evaluator: {e}")