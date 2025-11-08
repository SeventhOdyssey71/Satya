use anyhow::Result;
use ed25519_dalek::{SigningKey, VerifyingKey};
use rand::{rngs::OsRng, RngCore};
use std::collections::HashMap;
use std::sync::RwLock;

/// Shared application state
pub struct AppState {
    /// Ephemeral key pair for signing attestations
    pub signing_key: SigningKey,
    pub verifying_key: VerifyingKey,
    
    /// Storage for uploaded files (in-memory for TEE)
    pub file_storage: RwLock<HashMap<String, FileEntry>>,
    
    /// Attestation storage
    pub attestations: RwLock<HashMap<String, Attestation>>,
}

/// Represents a stored file in the enclave
#[derive(Clone, Debug)]
pub struct FileEntry {
    pub id: String,
    pub name: String,
    pub data: Vec<u8>,
    pub hash: Vec<u8>,
    pub uploaded_at: chrono::DateTime<chrono::Utc>,
    pub file_type: FileType,
}

#[derive(Clone, Debug)]
pub enum FileType {
    Model,
    Dataset,
    Document,
    Other(String),
}

/// Attestation record
#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct Attestation {
    pub id: String,
    pub file_id: String,
    pub file_hash: String,
    pub operation: String,
    pub timestamp: i64,
    pub signature: Vec<u8>,
    pub metadata: serde_json::Value,
}

impl AppState {
    pub async fn new() -> Result<Self> {
        // Generate ephemeral signing key for this enclave instance
        let mut csprng = OsRng;
        let mut secret_key_bytes = [0u8; 32];
        csprng.fill_bytes(&mut secret_key_bytes);
        let signing_key = SigningKey::from_bytes(&secret_key_bytes);
        let verifying_key = signing_key.verifying_key();

        Ok(Self {
            signing_key,
            verifying_key,
            file_storage: RwLock::new(HashMap::new()),
            attestations: RwLock::new(HashMap::new()),
        })
    }

    /// Store a file in the enclave
    pub fn store_file(&self, file_entry: FileEntry) -> Result<String> {
        let id = file_entry.id.clone();
        self.file_storage
            .write()
            .map_err(|_| anyhow::anyhow!("Failed to acquire write lock"))?
            .insert(id.clone(), file_entry);
        Ok(id)
    }

    /// Retrieve a file from storage
    pub fn get_file(&self, id: &str) -> Result<FileEntry> {
        self.file_storage
            .read()
            .map_err(|_| anyhow::anyhow!("Failed to acquire read lock"))?
            .get(id)
            .cloned()
            .ok_or_else(|| anyhow::anyhow!("File not found: {}", id))
    }

    /// Store an attestation
    pub fn store_attestation(&self, attestation: Attestation) -> Result<String> {
        let id = attestation.id.clone();
        self.attestations
            .write()
            .map_err(|_| anyhow::anyhow!("Failed to acquire write lock"))?
            .insert(id.clone(), attestation);
        Ok(id)
    }

    /// Get attestation by ID
    pub fn get_attestation(&self, id: &str) -> Result<Attestation> {
        self.attestations
            .read()
            .map_err(|_| anyhow::anyhow!("Failed to acquire read lock"))?
            .get(id)
            .cloned()
            .ok_or_else(|| anyhow::anyhow!("Attestation not found: {}", id))
    }
}