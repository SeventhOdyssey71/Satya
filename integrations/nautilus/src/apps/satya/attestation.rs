use anyhow::Result;
use base64::prelude::*;
use ed25519_dalek::{Signature, Signer, Verifier};
use serde_json::json;
use std::sync::Arc;
use uuid::Uuid;

use crate::common::{AppState, Attestation};

/// Generate attestation for file upload
pub fn generate_upload_attestation(
    state: &Arc<AppState>,
    file_id: &str,
    file_hash: &[u8],
    file_name: &str,
    file_size: u64,
) -> Result<Attestation> {
    let attestation_id = Uuid::new_v4().to_string();
    let timestamp = chrono::Utc::now().timestamp();
    
    // Create attestation data
    let attestation_data = json!({
        "file_id": file_id,
        "file_hash": hex::encode(file_hash),
        "file_name": file_name,
        "file_size": file_size,
        "operation": "upload",
        "timestamp": timestamp,
        "enclave_id": get_enclave_id(),
    });
    
    // Serialize and sign
    let data_bytes = serde_json::to_vec(&attestation_data)?;
    let signature = sign_data(&state.signing_key, &data_bytes)?;
    
    Ok(Attestation {
        id: attestation_id,
        file_id: file_id.to_string(),
        file_hash: hex::encode(file_hash),
        operation: "upload".to_string(),
        timestamp,
        signature: signature.to_vec(),
        metadata: attestation_data,
    })
}

/// Generate attestation for a specific operation
pub fn generate_operation_attestation(
    state: &Arc<AppState>,
    file_id: &str,
    file_hash: &[u8],
    operation: &str,
    metadata: Option<serde_json::Value>,
) -> Result<Attestation> {
    let attestation_id = Uuid::new_v4().to_string();
    let timestamp = chrono::Utc::now().timestamp();
    
    // Create attestation data
    let mut attestation_data = json!({
        "file_id": file_id,
        "file_hash": hex::encode(file_hash),
        "operation": operation,
        "timestamp": timestamp,
        "enclave_id": get_enclave_id(),
    });
    
    // Add custom metadata if provided
    if let Some(meta) = metadata {
        attestation_data["metadata"] = meta;
    }
    
    // Serialize and sign
    let data_bytes = serde_json::to_vec(&attestation_data)?;
    let signature = sign_data(&state.signing_key, &data_bytes)?;
    
    Ok(Attestation {
        id: attestation_id,
        file_id: file_id.to_string(),
        file_hash: hex::encode(file_hash),
        operation: operation.to_string(),
        timestamp,
        signature: signature.to_vec(),
        metadata: attestation_data,
    })
}

/// Sign data using the enclave's signing key
fn sign_data(signing_key: &ed25519_dalek::SigningKey, data: &[u8]) -> Result<Signature> {
    Ok(signing_key.sign(data))
}

/// Verify attestation signature
pub fn verify_attestation_signature(
    state: &Arc<AppState>,
    attestation: &Attestation,
) -> Result<bool> {
    // Recreate the data that was signed
    let data_bytes = serde_json::to_vec(&attestation.metadata)?;
    
    // Convert signature bytes back to Signature type
    let signature = Signature::from_bytes(
        attestation.signature
            .as_slice()
            .try_into()
            .map_err(|_| anyhow::anyhow!("Invalid signature length"))?
    );
    
    // Verify signature
    Ok(state.verifying_key.verify(&data_bytes, &signature).is_ok())
}

/// Get enclave ID (would be derived from PCR values in production)
fn get_enclave_id() -> String {
    // In production, this would be derived from actual PCR values
    // For now, we'll use a static ID
    "satya-enclave-v1".to_string()
}

/// Generate PCR values for the enclave
pub fn get_pcr_values() -> (Vec<u8>, Vec<u8>, Vec<u8>) {
    // In production, these would be actual PCR measurements from AWS Nitro
    // For testing, we'll generate deterministic values
    let pcr0 = vec![0u8; 48]; // PCR0: Enclave image
    let pcr1 = vec![1u8; 48]; // PCR1: Linux kernel and bootstrap
    let pcr2 = vec![2u8; 48]; // PCR2: Application
    
    (pcr0, pcr1, pcr2)
}

/// Generate attestation document (simplified version)
pub fn generate_attestation_document(
    state: &Arc<AppState>,
    user_data: Option<Vec<u8>>,
) -> Result<Vec<u8>> {
    let (pcr0, pcr1, pcr2) = get_pcr_values();
    
    let doc = json!({
        "module_id": get_enclave_id(),
        "timestamp": chrono::Utc::now().timestamp(),
        "pcrs": {
            "pcr0": hex::encode(&pcr0),
            "pcr1": hex::encode(&pcr1),
            "pcr2": hex::encode(&pcr2),
        },
        "public_key": hex::encode(state.verifying_key.as_bytes()),
        "user_data": user_data.map(|d| base64::prelude::BASE64_STANDARD.encode(d)),
    });
    
    let doc_bytes = serde_json::to_vec(&doc)?;
    
    // Sign the document
    let signature = sign_data(&state.signing_key, &doc_bytes)?;
    
    // Create final attestation document
    let final_doc = json!({
        "document": base64::prelude::BASE64_STANDARD.encode(&doc_bytes),
        "signature": hex::encode(signature.to_bytes()),
    });
    
    Ok(serde_json::to_vec(&final_doc)?)
}

#[cfg(test)]
mod tests {
    use super::*;
    use ed25519_dalek::SigningKey;
    use rand::rngs::OsRng;

    #[tokio::test]
    async fn test_attestation_generation() {
        let state = Arc::new(AppState::new().await.unwrap());
        
        let file_id = "test-file-123";
        let file_hash = b"test_hash";
        let file_name = "test.json";
        let file_size = 1024;
        
        let attestation = generate_upload_attestation(
            &state,
            file_id,
            file_hash,
            file_name,
            file_size,
        ).unwrap();
        
        assert_eq!(attestation.file_id, file_id);
        assert_eq!(attestation.operation, "upload");
        assert!(!attestation.signature.is_empty());
    }

    #[tokio::test]
    async fn test_signature_verification() {
        let state = Arc::new(AppState::new().await.unwrap());
        
        let file_id = "test-file-456";
        let file_hash = b"another_hash";
        let file_name = "test2.csv";
        let file_size = 2048;
        
        let attestation = generate_upload_attestation(
            &state,
            file_id,
            file_hash,
            file_name,
            file_size,
        ).unwrap();
        
        let is_valid = verify_attestation_signature(&state, &attestation).unwrap();
        assert!(is_valid);
        
        // Test with tampered attestation
        let mut tampered = attestation.clone();
        tampered.metadata["file_size"] = json!(9999);
        let is_valid = verify_attestation_signature(&state, &tampered).unwrap();
        assert!(!is_valid);
    }
}