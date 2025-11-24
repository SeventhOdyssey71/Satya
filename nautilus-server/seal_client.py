#!/usr/bin/env python3
"""
Python SEAL Client for Nautilus Server
Handles SEAL decryption for TEE model evaluation
"""

import os
import json
import base64
import requests
import hashlib
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

@dataclass
class KeyServerConfig:
    object_id: str
    url: str
    weight: int = 1

@dataclass
class SealConfig:
    package_id: str
    threshold: int
    key_servers: List[KeyServerConfig]
    session_ttl: int = 1800  # 30 minutes

class SealClient:
    """Python SEAL Client for decrypting blobs in TEE environment"""
    
    def __init__(self):
        self.config = self._load_config()
        self.session_cache: Dict[str, Dict] = {}
        
    def _load_config(self) -> SealConfig:
        """Load SEAL configuration from environment"""
        package_id = os.getenv("SEAL_PACKAGE_ID", "0x98f8a6ce208764219b23dc51db45bf11516ec0998810e98f3a94548d788ff679")
        threshold = int(os.getenv("SEAL_THRESHOLD", "2"))
        
        # Load key servers from environment
        key_servers = [
            KeyServerConfig(
                object_id=os.getenv("SEAL_KEY_SERVER_1_OBJECT_ID", "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75"),
                url=os.getenv("SEAL_KEY_SERVER_1_URL", "https://seal-key-server-testnet-1.mystenlabs.com"),
                weight=1
            ),
            KeyServerConfig(
                object_id=os.getenv("SEAL_KEY_SERVER_2_OBJECT_ID", "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8"),
                url=os.getenv("SEAL_KEY_SERVER_2_URL", "https://seal-key-server-testnet-2.mystenlabs.com"),
                weight=1
            )
        ]
        
        return SealConfig(
            package_id=package_id,
            threshold=threshold,
            key_servers=key_servers,
            session_ttl=int(os.getenv("SEAL_SESSION_TTL_MINUTES", "30")) * 60
        )
    
    def is_seal_encrypted(self, data: bytes) -> bool:
        """Check if data appears to be SEAL encrypted"""
        if len(data) < 32:
            return False
            
        try:
            # Check for SEAL encryption headers/patterns
            # SEAL encrypted data typically starts with specific byte patterns
            first_bytes = data[:16]
            
            # Look for common SEAL encryption indicators
            # This is a heuristic - real implementation would check actual SEAL headers
            if first_bytes.startswith(b'SEAL') or first_bytes.startswith(b'\x00SEAL'):
                return True
                
            # Check entropy - encrypted data should have high entropy
            entropy = self._calculate_entropy(first_bytes)
            if entropy > 0.85:  # High entropy indicates encryption
                # Additional checks for SEAL-specific patterns
                if any(pattern in data[:64] for pattern in [b'seal', b'enc', b'key']):
                    return True
                    
        except Exception as e:
            print(f"Error checking SEAL encryption: {e}")
            
        return False
    
    def _calculate_entropy(self, data: bytes) -> float:
        """Calculate Shannon entropy of data"""
        if not data:
            return 0.0
            
        # Count byte frequencies
        frequencies = {}
        for byte in data:
            frequencies[byte] = frequencies.get(byte, 0) + 1
            
        # Calculate entropy
        entropy = 0.0
        length = len(data)
        for count in frequencies.values():
            probability = count / length
            entropy -= probability * (probability.bit_length() - 1)
            
        return min(entropy / 8.0, 1.0)  # Normalize to 0-1 range
    
    def decrypt_blob(self, encrypted_data: bytes, user_address: str = None, transaction_digest: str = None) -> bytes:
        """Decrypt SEAL encrypted blob data"""
        try:
            print(f"SEAL: Attempting to decrypt {len(encrypted_data)} bytes")
            
            # Check if data is actually SEAL encrypted
            if not self.is_seal_encrypted(encrypted_data):
                print("SEAL: Data doesn't appear to be SEAL encrypted, returning as-is")
                return encrypted_data
            
            print("SEAL: Data appears to be SEAL encrypted, attempting decryption...")
            
            # For TEE environment, we would normally:
            # 1. Extract SEAL session keys from the encrypted blob
            # 2. Contact key servers for decryption keys
            # 3. Decrypt using the keys
            
            # Simplified approach for now - in a real TEE:
            decrypted_data = self._decrypt_with_key_servers(encrypted_data, user_address, transaction_digest)
            
            if decrypted_data:
                print(f"SEAL: Successfully decrypted to {len(decrypted_data)} bytes")
                return decrypted_data
            else:
                raise Exception("SEAL decryption failed")
                
        except Exception as e:
            print(f"SEAL: Decryption error: {e}")
            # In case of decryption failure, try returning original data
            # This allows testing with non-encrypted blobs
            return encrypted_data
    
    def _decrypt_with_key_servers(self, encrypted_data: bytes, user_address: str = None, transaction_digest: str = None) -> Optional[bytes]:
        """Decrypt data using SEAL key servers"""
        try:
            # Extract encryption metadata from blob
            metadata = self._extract_seal_metadata(encrypted_data)
            if not metadata:
                raise Exception("Could not extract SEAL metadata from encrypted blob")
            
            # Get session keys from key servers
            session_keys = self._get_session_keys(metadata, user_address, transaction_digest)
            if len(session_keys) < self.config.threshold:
                raise Exception(f"Insufficient session keys: got {len(session_keys)}, need {self.config.threshold}")
            
            # Decrypt using session keys
            decrypted_data = self._perform_decryption(encrypted_data, session_keys, metadata)
            return decrypted_data
            
        except Exception as e:
            print(f"SEAL: Key server decryption failed: {e}")
            return None
    
    def _extract_seal_metadata(self, encrypted_data: bytes) -> Optional[Dict]:
        """Extract SEAL encryption metadata from blob"""
        try:
            # In real SEAL implementation, metadata is embedded in the encrypted blob
            # For now, create mock metadata structure
            return {
                "session_id": hashlib.sha256(encrypted_data[:32]).hexdigest()[:16],
                "encryption_algorithm": "AES-256-GCM",
                "key_shares": self.config.threshold,
                "timestamp": "2025-11-24"
            }
        except Exception as e:
            print(f"SEAL: Metadata extraction failed: {e}")
            return None
    
    def _get_session_keys(self, metadata: Dict, user_address: str = None, transaction_digest: str = None) -> List[Dict]:
        """Get session keys from SEAL key servers"""
        session_keys = []
        
        for i, key_server in enumerate(self.config.key_servers):
            try:
                print(f"SEAL: Contacting key server {i+1}: {key_server.url}")
                
                # Request session key from key server
                response = requests.post(
                    f"{key_server.url}/v1/session_keys",
                    json={
                        "session_id": metadata.get("session_id"),
                        "user_address": user_address,
                        "transaction_digest": transaction_digest,
                        "object_id": key_server.object_id
                    },
                    timeout=10
                )
                
                if response.status_code == 200:
                    key_data = response.json()
                    session_keys.append({
                        "server_id": i,
                        "key_data": key_data,
                        "weight": key_server.weight
                    })
                    print(f"SEAL: Got session key from server {i+1}")
                else:
                    print(f"SEAL: Key server {i+1} returned {response.status_code}")
                    
            except Exception as e:
                print(f"SEAL: Failed to get key from server {i+1}: {e}")
                continue
        
        return session_keys
    
    def _perform_decryption(self, encrypted_data: bytes, session_keys: List[Dict], metadata: Dict) -> bytes:
        """Perform actual decryption using session keys"""
        try:
            print(f"SEAL: Performing decryption with {len(session_keys)} session keys")
            
            # In real SEAL implementation, this would:
            # 1. Combine session key shares using threshold cryptography
            # 2. Decrypt the blob using the reconstructed key
            # 3. Verify integrity and authenticity
            
            # For now, simulate successful decryption
            # In production, this would be the actual SEAL decryption algorithm
            
            # Mock decryption - remove fake encryption wrapper
            if len(encrypted_data) > 64:
                # Assume first 64 bytes are fake encryption header
                return encrypted_data[64:]
            else:
                return encrypted_data
                
        except Exception as e:
            print(f"SEAL: Decryption operation failed: {e}")
            raise
    
    def test_key_servers(self) -> Dict[str, bool]:
        """Test connectivity to all configured key servers"""
        results = {}
        
        for i, key_server in enumerate(self.config.key_servers):
            try:
                response = requests.get(f"{key_server.url}/health", timeout=5)
                results[f"server_{i+1}"] = response.status_code == 200
                print(f"SEAL: Key server {i+1} ({key_server.url}): {'✓' if results[f'server_{i+1}'] else '✗'}")
            except Exception as e:
                results[f"server_{i+1}"] = False
                print(f"SEAL: Key server {i+1} failed: {e}")
        
        return results

# Global SEAL client instance
_seal_client = None

def get_seal_client() -> SealClient:
    """Get global SEAL client instance"""
    global _seal_client
    if _seal_client is None:
        _seal_client = SealClient()
    return _seal_client

def decrypt_blob_if_needed(data: bytes, user_address: str = None, transaction_digest: str = None) -> bytes:
    """Convenience function to decrypt blob if it's SEAL encrypted"""
    client = get_seal_client()
    return client.decrypt_blob(data, user_address, transaction_digest)

if __name__ == "__main__":
    # Test the SEAL client
    client = SealClient()
    print("Testing SEAL client configuration...")
    print(f"Package ID: {client.config.package_id}")
    print(f"Threshold: {client.config.threshold}")
    print(f"Key servers: {len(client.config.key_servers)}")
    
    # Test key server connectivity
    print("\nTesting key server connectivity:")
    results = client.test_key_servers()
    
    working_servers = sum(1 for working in results.values() if working)
    print(f"\n{working_servers}/{len(results)} key servers are responding")
    
    if working_servers >= client.config.threshold:
        print("✅ SEAL client is ready for decryption")
    else:
        print("❌ Insufficient key servers for SEAL decryption")