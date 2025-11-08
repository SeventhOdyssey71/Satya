use anyhow::Result;
use sha2::{Digest, Sha256};
use tracing::debug;

/// Secure storage configuration
pub struct SecureStorageConfig {
    pub max_file_size: usize,
    pub allowed_extensions: Vec<String>,
    pub encryption_enabled: bool,
}

impl Default for SecureStorageConfig {
    fn default() -> Self {
        Self {
            max_file_size: 100 * 1024 * 1024, // 100MB
            allowed_extensions: vec![
                "json".to_string(),
                "model".to_string(),
                "csv".to_string(),
                "data".to_string(),
                "txt".to_string(),
                "pdf".to_string(),
            ],
            encryption_enabled: true,
        }
    }
}

/// Validate file before storage
pub fn validate_file(
    file_data: &[u8],
    file_name: &str,
    config: &SecureStorageConfig,
) -> Result<()> {
    // Check file size
    if file_data.len() > config.max_file_size {
        return Err(anyhow::anyhow!(
            "File size exceeds maximum allowed size of {} bytes",
            config.max_file_size
        ));
    }

    // Check file extension
    if let Some(extension) = file_name.split('.').last() {
        if !config.allowed_extensions.contains(&extension.to_lowercase()) {
            return Err(anyhow::anyhow!(
                "File extension '{}' is not allowed",
                extension
            ));
        }
    }

    // Additional validation can be added here (e.g., file format verification)
    
    Ok(())
}

/// Encrypt file data (simplified for now, would use AES-256-GCM in production)
pub fn encrypt_file_data(data: &[u8], key: &[u8]) -> Result<Vec<u8>> {
    // In production, this would use proper encryption like AES-256-GCM
    // For now, we'll just XOR with a derived key for demonstration
    
    let mut encrypted = Vec::with_capacity(data.len());
    let key_len = key.len();
    
    for (i, byte) in data.iter().enumerate() {
        encrypted.push(byte ^ key[i % key_len]);
    }
    
    debug!("Encrypted {} bytes of data", data.len());
    Ok(encrypted)
}

/// Decrypt file data
pub fn decrypt_file_data(encrypted_data: &[u8], key: &[u8]) -> Result<Vec<u8>> {
    // Since we're using XOR for demonstration, decryption is the same as encryption
    encrypt_file_data(encrypted_data, key)
}

/// Generate a deterministic storage key from file hash
pub fn generate_storage_key(file_hash: &[u8]) -> Vec<u8> {
    let mut hasher = Sha256::new();
    hasher.update(b"SATYA_STORAGE_KEY_");
    hasher.update(file_hash);
    hasher.finalize().to_vec()
}

/// Secure deletion of sensitive data
pub fn secure_delete(data: &mut [u8]) {
    // Overwrite with random data multiple times
    for _ in 0..3 {
        for byte in data.iter_mut() {
            *byte = rand::random();
        }
    }
    // Final overwrite with zeros
    for byte in data.iter_mut() {
        *byte = 0;
    }
}

/// File integrity verification
pub fn verify_file_integrity(file_data: &[u8], expected_hash: &[u8]) -> bool {
    let mut hasher = Sha256::new();
    hasher.update(file_data);
    let computed_hash = hasher.finalize();
    
    computed_hash[..] == *expected_hash
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_file_validation() {
        let config = SecureStorageConfig::default();
        let valid_file = vec![0u8; 1000];
        let large_file = vec![0u8; 200 * 1024 * 1024];
        
        assert!(validate_file(&valid_file, "test.json", &config).is_ok());
        assert!(validate_file(&large_file, "test.json", &config).is_err());
        assert!(validate_file(&valid_file, "test.exe", &config).is_err());
    }

    #[test]
    fn test_encryption_decryption() {
        let data = b"Hello, Satya Marketplace!";
        let key = b"test_encryption_key_32_bytes_ok!";
        
        let encrypted = encrypt_file_data(data, key).unwrap();
        assert_ne!(&encrypted[..], data);
        
        let decrypted = decrypt_file_data(&encrypted, key).unwrap();
        assert_eq!(&decrypted[..], data);
    }

    #[test]
    fn test_file_integrity() {
        let data = b"Test file content";
        let mut hasher = Sha256::new();
        hasher.update(data);
        let hash = hasher.finalize().to_vec();
        
        assert!(verify_file_integrity(data, &hash));
        assert!(!verify_file_integrity(b"Modified content", &hash));
    }
}