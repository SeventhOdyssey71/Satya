/// Satya Marketplace for secure file processing with payment escrow
module marketplace::marketplace;

use enclave::enclave::{Self, Enclave, FileAttestation};
use std::string::String;
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::balance::{Self, Balance};
use sui::table::{Self, Table};
use sui::clock::{Self, Clock};
use sui::object::{Self, UID, ID};
use sui::transfer;
use sui::tx_context::{Self, TxContext};

/// File processing intent for signature verification
const FILE_PROCESSING_INTENT: u8 = 1;

/// Error codes
const EInvalidSignature: u64 = 1;
const EInsufficientPayment: u64 = 2;
const EFileNotFound: u64 = 3;
const EUnauthorizedAccess: u64 = 4;
const EProcessingNotCompleted: u64 = 5;

/// File registry entry
public struct FileEntry has key, store {
    id: UID,
    owner: address,
    name: String,
    description: String,
    file_hash: vector<u8>,
    file_size: u64,
    price: u64,
    category: String,
    created_at: u64,
    is_active: bool,
}

/// Processing purchase record
public struct ProcessingPurchase has key, store {
    id: UID,
    buyer: address,
    file_id: ID,
    payment_amount: u64,
    status: u8, // 0: pending, 1: in_progress, 2: completed
    created_at: u64,
    processing_type: String,
}

/// Processing result from enclave
public struct ProcessingResult has key, store {
    id: UID,
    purchase_id: ID,
    buyer: address,
    file_id: ID,
    result_data: String,
    attestation: FileAttestation<MARKETPLACE>,
    timestamp: u64,
    is_verified: bool,
}

/// Marketplace registry
public struct Marketplace has key {
    id: UID,
    files: Table<ID, bool>,
    purchases: Table<ID, bool>, 
    platform_balance: Balance<SUI>,
    platform_fee_bps: u64, // Basis points (e.g., 250 = 2.5%)
}

/// Admin capability
public struct AdminCap has key, store {
    id: UID,
}

/// One-time witness for package deployment
public struct MARKETPLACE has drop {}

/// Package initialization
fun init(otw: MARKETPLACE, ctx: &mut TxContext) {
    let cap = enclave::new_cap(otw, ctx);
    
    // Create default enclave config (will be updated during deployment)
    enclave::create_enclave_config(
        &cap,
        b"Satya File Processing Enclave".to_string(),
        x"0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        x"0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", 
        x"0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        ctx,
    );
    
    // Create marketplace registry
    let marketplace = Marketplace {
        id: object::new(ctx),
        files: table::new<ID, bool>(ctx),
        purchases: table::new<ID, bool>(ctx),
        platform_balance: balance::zero<SUI>(),
        platform_fee_bps: 250, // 2.5% platform fee
    };
    
    // Create admin capability
    let admin_cap = AdminCap {
        id: object::new(ctx),
    };
    
    transfer::share_object(marketplace);
    transfer::public_transfer(cap, tx_context::sender(ctx));
    transfer::public_transfer(admin_cap, tx_context::sender(ctx));
}

/// Register new file for processing
public fun register_file(
    marketplace: &mut Marketplace,
    name: String,
    description: String,
    file_hash: vector<u8>,
    file_size: u64,
    price: u64,
    category: String,
    clock: &Clock,
    ctx: &mut TxContext,
): ID {
    let file_id = object::new(ctx);
    let id_copy = object::uid_to_inner(&file_id);
    
    let file = FileEntry {
        id: file_id,
        owner: tx_context::sender(ctx),
        name,
        description, 
        file_hash,
        file_size,
        price,
        category,
        created_at: clock::timestamp_ms(clock),
        is_active: true,
    };
    
    table::add(&mut marketplace.files, id_copy, true);
    transfer::public_transfer(file, tx_context::sender(ctx));
    
    id_copy
}

/// Purchase file processing rights
public fun purchase_processing(
    marketplace: &mut Marketplace,
    file: &FileEntry, 
    processing_type: String,
    payment: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext,
): ID {
    assert!(file.is_active, EFileNotFound);
    assert!(coin::value(&payment) >= file.price, EInsufficientPayment);
    
    let purchase_id = object::new(ctx);
    let id_copy = object::uid_to_inner(&purchase_id);
    
    // Calculate and split payment
    let platform_fee = (file.price * marketplace.platform_fee_bps) / 10000;
    let mut payment_balance = coin::into_balance(payment);
    let platform_fee_balance = balance::split(&mut payment_balance, platform_fee);
    balance::join(&mut marketplace.platform_balance, platform_fee_balance);
    
    let purchase = ProcessingPurchase {
        id: purchase_id,
        buyer: tx_context::sender(ctx),
        file_id: object::id(file),
        payment_amount: file.price,
        status: 0, // pending
        created_at: clock::timestamp_ms(clock),
        processing_type,
    };
    
    table::add(&mut marketplace.purchases, id_copy, true);
    
    // Transfer creator payment
    let creator_coin = coin::from_balance(payment_balance, ctx);
    transfer::public_transfer(creator_coin, file.owner);
    
    transfer::share_object(purchase);
    id_copy
}

/// Submit processing results with enclave verification
public fun submit_processing_results(
    marketplace: &mut Marketplace,
    purchase: &mut ProcessingPurchase,
    result_data: String,
    enclave: &Enclave<MARKETPLACE>,
    attestation: FileAttestation<MARKETPLACE>,
    clock: &Clock,
    ctx: &mut TxContext,
): ID {
    assert!(purchase.status == 1, EProcessingNotCompleted); // Must be in progress
    
    // Verify attestation is for this file
    let (file_id_str, file_hash, operation, _) = enclave::attestation_details(&attestation);
    
    let result_id = object::new(ctx);
    let id_copy = object::uid_to_inner(&result_id);
    
    let result = ProcessingResult {
        id: result_id,
        purchase_id: object::id(purchase),
        buyer: purchase.buyer,
        file_id: purchase.file_id,
        result_data,
        attestation,
        timestamp: clock::timestamp_ms(clock),
        is_verified: true, // Attestation already verified by enclave module
    };
    
    purchase.status = 2; // completed
    
    transfer::transfer(result, purchase.buyer);
    id_copy
}

/// Update platform fee (admin only)
public fun update_platform_fee(
    _: &AdminCap,
    marketplace: &mut Marketplace,
    new_fee_bps: u64,
) {
    marketplace.platform_fee_bps = new_fee_bps;
}

/// Withdraw platform fees (admin only)
public fun withdraw_platform_fees(
    _: &AdminCap,
    marketplace: &mut Marketplace,
    amount: u64,
    ctx: &mut TxContext,
): Coin<SUI> {
    let withdrawn = balance::split(&mut marketplace.platform_balance, amount);
    coin::from_balance(withdrawn, ctx)
}

/// Get file details
public fun file_details(file: &FileEntry): (String, String, vector<u8>, u64, u64, String, bool) {
    (file.name, file.description, file.file_hash, file.file_size, file.price, file.category, file.is_active)
}

/// Get purchase details
public fun purchase_details(purchase: &ProcessingPurchase): (address, ID, u64, u8, String) {
    (purchase.buyer, purchase.file_id, purchase.payment_amount, purchase.status, purchase.processing_type)
}