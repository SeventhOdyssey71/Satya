/// Satya Enclave verification module for secure file processing and attestation
module enclave::enclave;

use sui::object::UID;
use sui::transfer;
use sui::tx_context::TxContext;
use sui::ed25519;
use sui::clock::{Self, Clock};
use sui::bcs;
use std::vector;
use std::string::String;

/// Enclave configuration and public key registry
public struct Enclave<phantom T> has key {
    id: UID,
    name: String,
    public_key: vector<u8>,
    pcr0: vector<u8>,
    pcr1: vector<u8>, 
    pcr2: vector<u8>,
    created_at: u64,
}

/// Capability for creating enclave configurations
public struct EnclaveCap<phantom T> has key, store {
    id: UID,
}

/// File attestation record
public struct FileAttestation<phantom T> has key, store {
    id: UID,
    file_id: String,
    file_hash: vector<u8>,
    operation: String,
    timestamp: u64,
    enclave_signature: vector<u8>,
    metadata: String,
}

/// Create new enclave capability (called by package deployer)
public fun new_cap<T: drop>(_: T, ctx: &mut TxContext): EnclaveCap<T> {
    EnclaveCap<T> {
        id: object::new(ctx)
    }
}

/// Create enclave configuration with PCR values
public fun create_enclave_config<T>(
    _cap: &EnclaveCap<T>,
    name: String,
    pcr0: vector<u8>,
    pcr1: vector<u8>,
    pcr2: vector<u8>,
    ctx: &mut TxContext,
) {
    let enclave = Enclave<T> {
        id: object::new(ctx),
        name,
        public_key: vector::empty(),
        pcr0,
        pcr1,
        pcr2,
        created_at: 0,
    };
    
    transfer::share_object(enclave);
}

/// Register enclave public key after attestation verification
public fun register_public_key<T>(
    enclave: &mut Enclave<T>,
    public_key: vector<u8>,
    attestation_doc: vector<u8>,
    clock: &Clock,
    _ctx: &TxContext,
) {
    // Verify attestation document contains expected PCR values
    // In production, this would include full attestation verification
    assert!(vector::length(&attestation_doc) > 0, 0);
    
    enclave.public_key = public_key;
    enclave.created_at = clock::timestamp_ms(clock);
}

/// Submit file attestation from enclave
public fun submit_file_attestation<T>(
    enclave: &Enclave<T>,
    file_id: String,
    file_hash: vector<u8>,
    operation: String,
    metadata: String,
    signature: &vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
): FileAttestation<T> {
    let timestamp = clock::timestamp_ms(clock);
    
    // Verify enclave signature
    let is_verified = verify_file_signature<T>(
        enclave,
        &file_id,
        &file_hash,
        &operation,
        timestamp,
        signature,
    );
    assert!(is_verified, 1);
    
    FileAttestation<T> {
        id: object::new(ctx),
        file_id,
        file_hash,
        operation,
        timestamp,
        enclave_signature: *signature,
        metadata,
    }
}

/// Verify signature using registered public key
public fun verify_file_signature<T>(
    enclave: &Enclave<T>,
    _file_id: &String,
    file_hash: &vector<u8>,
    _operation: &String,
    _timestamp: u64,
    signature: &vector<u8>,
): bool {
    // Simplified verification - in production would include all parameters
    // Verify signature using Ed25519 with file hash as message
    ed25519::ed25519_verify(signature, &enclave.public_key, file_hash)
}

/// Get enclave public key
public fun public_key<T>(enclave: &Enclave<T>): vector<u8> {
    enclave.public_key
}

/// Get enclave PCR values for verification
public fun pcr_values<T>(enclave: &Enclave<T>): (vector<u8>, vector<u8>, vector<u8>) {
    (enclave.pcr0, enclave.pcr1, enclave.pcr2)
}

/// Get file attestation details
public fun attestation_details<T>(attestation: &FileAttestation<T>): (String, vector<u8>, String, u64) {
    (attestation.file_id, attestation.file_hash, attestation.operation, attestation.timestamp)
}

#[test_only]
/// Create test enclave for unit tests
public fun create_test_enclave<T: drop>(
    witness: T,
    ctx: &mut TxContext
): Enclave<T> {
    Enclave<T> {
        id: object::new(ctx),
        name: b"Test Enclave".to_string(),
        public_key: x"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        pcr0: x"0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        pcr1: x"0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        pcr2: x"0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        created_at: 0,
    }
}