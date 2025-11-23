/// Satya Marketplace - Comprehensive Smart Contract for TEE-Verified Model Trading
/// This contract manages the complete flow: Upload → Pending → Verification → Marketplace

#[allow(duplicate_alias, unused_variable, unused_const, unused_use)]
module satya::marketplace {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    use sui::table::{Self, Table};
    use std::string::{Self, String};
    use std::option::{Self, Option};

    /// Error codes
    const EInvalidUpload: u64 = 100;
    const ENotOwner: u64 = 101;
    const ENotVerified: u64 = 103;
    const EInsufficientPayment: u64 = 104;
    const EModelNotFound: u64 = 106;

    /// Upload status enum
    const STATUS_PENDING: u8 = 0;
    const STATUS_VERIFYING: u8 = 1;
    const STATUS_VERIFIED: u8 = 2;

    /// Marketplace singleton object for global state
    public struct MarketplaceRegistry has key {
        id: UID,
        pending_models: Table<ID, bool>,
        verified_models: Table<ID, bool>,
        marketplace_models: Table<ID, bool>,
        platform_fee: u64, // basis points (100 = 1%)
    }

    /// Model upload in pending state
    public struct PendingModel has key, store {
        id: UID,
        creator: address,
        title: String,
        description: String,
        category: String,
        tags: vector<String>,
        // Encrypted storage references
        model_blob_id: String,
        dataset_blob_id: Option<String>,
        encryption_policy_id: String,
        seal_metadata: vector<u8>,
        // Pricing
        price: u64,
        max_downloads: Option<u64>,
        // Status tracking
        status: u8,
        created_at: u64,
        updated_at: u64,
        verification_attempts: u64,
    }

    /// TEE verification result
    public struct VerificationResult has key, store {
        id: UID,
        model_id: ID,
        enclave_id: String,
        quality_score: u64,
        security_assessment: String,
        attestation_hash: vector<u8>,
        verified_at: u64,
        verifier_signature: vector<u8>,
    }

    /// Marketplace listing after verification
    public struct MarketplaceModel has key, store {
        id: UID,
        pending_model_id: ID,
        verification_id: ID,
        creator: address,
        title: String,
        description: String,
        category: String,
        tags: vector<String>,
        // Storage references (encrypted)
        model_blob_id: String,
        dataset_blob_id: Option<String>,
        // Verification data
        quality_score: u64,
        tee_verified: bool,
        // Pricing and access
        price: u64,
        max_downloads: Option<u64>,
        current_downloads: u64,
        total_earnings: u64,
        // Metadata
        listed_at: u64,
        last_purchased_at: Option<u64>,
        featured: bool,
    }

    /// Purchase record for buyers
    public struct PurchaseRecord has key, store {
        id: UID,
        buyer: address,
        model_id: ID,
        seller: address,
        amount_paid: u64,
        platform_fee: u64,
        purchased_at: u64,
        expires_at: Option<u64>,
        access_granted: bool,
        download_count: u64,
        access_key: vector<u8>, // SEAL session key for decryption
    }

    /// Events
    public struct ModelUploaded has copy, drop {
        model_id: ID,
        creator: address,
        title: String,
        blob_id: String,
        status: u8,
    }

    public struct VerificationSubmitted has copy, drop {
        model_id: ID,
        verification_id: ID,
        quality_score: u64,
        verified: bool,
    }

    public struct ModelListed has copy, drop {
        model_id: ID,
        marketplace_id: ID,
        creator: address,
        price: u64,
        verified: bool,
    }

    public struct ModelPurchased has copy, drop {
        purchase_id: ID,
        buyer: address,
        model_id: ID,
        amount: u64,
        access_granted: bool,
    }

    /// Initialize marketplace
    fun init(ctx: &mut TxContext) {
        let registry = MarketplaceRegistry {
            id: object::new(ctx),
            pending_models: table::new(ctx),
            verified_models: table::new(ctx),
            marketplace_models: table::new(ctx),
            platform_fee: 250, // 2.5%
        };
        transfer::share_object(registry);
    }

    /// Phase 1: Upload model to pending state (entry function version)
    #[allow(lint(public_entry))]
    public entry fun upload_model_entry(
        title: String,
        description: String,
        category: String,
        tags: vector<String>,
        model_blob_id: String,
        dataset_blob_id: Option<String>,
        encryption_policy_id: String,
        seal_metadata: vector<u8>,
        price: u64,
        max_downloads: Option<u64>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let model = upload_model(
            title,
            description,
            category,
            tags,
            model_blob_id,
            dataset_blob_id,
            encryption_policy_id,
            seal_metadata,
            price,
            max_downloads,
            clock,
            ctx
        );
        
        // Auto-transfer to sender
        transfer::public_transfer(model, tx_context::sender(ctx));
    }

    /// Phase 1: Upload model to pending state (helper function)
    public fun upload_model(
        title: String,
        description: String,
        category: String,
        tags: vector<String>,
        model_blob_id: String,
        dataset_blob_id: Option<String>,
        encryption_policy_id: String,
        seal_metadata: vector<u8>,
        price: u64,
        max_downloads: Option<u64>,
        clock: &Clock,
        ctx: &mut TxContext
    ): PendingModel {
        let now = clock::timestamp_ms(clock);
        let model = PendingModel {
            id: object::new(ctx),
            creator: tx_context::sender(ctx),
            title,
            description,
            category,
            tags,
            model_blob_id,
            dataset_blob_id,
            encryption_policy_id,
            seal_metadata,
            price,
            max_downloads,
            status: STATUS_PENDING,
            created_at: now,
            updated_at: now,
            verification_attempts: 0,
        };

        event::emit(ModelUploaded {
            model_id: object::uid_to_inner(&model.id),
            creator: tx_context::sender(ctx),
            title: model.title,
            blob_id: model.model_blob_id,
            status: STATUS_PENDING,
        });

        model
    }

    /// Phase 2: Submit for TEE verification
    public fun submit_for_verification(
        model: &mut PendingModel,
        registry: &mut MarketplaceRegistry,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(model.creator == tx_context::sender(ctx), ENotOwner);
        assert!(model.status == STATUS_PENDING, EInvalidUpload);

        model.status = STATUS_VERIFYING;
        model.updated_at = clock::timestamp_ms(clock);
        model.verification_attempts = model.verification_attempts + 1;

        let model_id = object::uid_to_inner(&model.id);
        table::add(&mut registry.pending_models, model_id, true);
    }

    /// Phase 3: Complete TEE verification (called by TEE service)
    public fun complete_verification(
        model: &mut PendingModel,
        registry: &mut MarketplaceRegistry,
        enclave_id: String,
        quality_score: u64,
        security_assessment: String,
        attestation_hash: vector<u8>,
        verifier_signature: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ): VerificationResult {
        let model_id = object::uid_to_inner(&model.id);
        assert!(table::contains(&registry.pending_models, model_id), EModelNotFound);
        assert!(model.status == STATUS_VERIFYING, EInvalidUpload);

        model.status = STATUS_VERIFIED;
        model.updated_at = clock::timestamp_ms(clock);

        let verification = VerificationResult {
            id: object::new(ctx),
            model_id,
            enclave_id,
            quality_score,
            security_assessment,
            attestation_hash,
            verified_at: clock::timestamp_ms(clock),
            verifier_signature,
        };

        let verification_id = object::uid_to_inner(&verification.id);
        table::add(&mut registry.verified_models, model_id, true);

        event::emit(VerificationSubmitted {
            model_id,
            verification_id,
            quality_score,
            verified: true,
        });

        verification
    }

    /// Phase 4: List verified model on marketplace
    public fun list_on_marketplace(
        model: PendingModel,
        verification: VerificationResult,
        registry: &mut MarketplaceRegistry,
        clock: &Clock,
        ctx: &mut TxContext
    ): MarketplaceModel {
        assert!(model.creator == tx_context::sender(ctx), ENotOwner);
        assert!(model.status == STATUS_VERIFIED, ENotVerified);

        let model_id = object::uid_to_inner(&model.id);
        let verification_id = object::uid_to_inner(&verification.id);

        let marketplace_model = MarketplaceModel {
            id: object::new(ctx),
            pending_model_id: model_id,
            verification_id,
            creator: model.creator,
            title: model.title,
            description: model.description,
            category: model.category,
            tags: model.tags,
            model_blob_id: model.model_blob_id,
            dataset_blob_id: model.dataset_blob_id,
            quality_score: verification.quality_score,
            tee_verified: true,
            price: model.price,
            max_downloads: model.max_downloads,
            current_downloads: 0,
            total_earnings: 0,
            listed_at: clock::timestamp_ms(clock),
            last_purchased_at: option::none(),
            featured: false,
        };

        let marketplace_id = object::uid_to_inner(&marketplace_model.id);
        table::add(&mut registry.marketplace_models, marketplace_id, true);

        event::emit(ModelListed {
            model_id,
            marketplace_id,
            creator: model.creator,
            price: model.price,
            verified: true,
        });

        let creator = model.creator;
        
        // Clean up pending state
        table::remove(&mut registry.pending_models, model_id);
        table::remove(&mut registry.verified_models, model_id);

        // Transfer objects to creator
        transfer::public_transfer(model, creator);
        transfer::public_transfer(verification, creator);

        marketplace_model
    }

    /// Phase 5: Purchase model from marketplace
    public fun purchase_model(
        marketplace_model: &mut MarketplaceModel,
        registry: &mut MarketplaceRegistry,
        mut payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ): PurchaseRecord {
        let buyer = tx_context::sender(ctx);
        let payment_amount = coin::value(&payment);
        
        assert!(payment_amount >= marketplace_model.price, EInsufficientPayment);
        assert!(buyer != marketplace_model.creator, EInvalidUpload);

        // Check download limits
        if (option::is_some(&marketplace_model.max_downloads)) {
            let max_dl = *option::borrow(&marketplace_model.max_downloads);
            assert!(marketplace_model.current_downloads < max_dl, EInvalidUpload);
        };

        // Calculate fees
        let platform_fee = (marketplace_model.price * registry.platform_fee) / 10000;
        let seller_amount = marketplace_model.price - platform_fee;

        // Update marketplace model stats
        marketplace_model.current_downloads = marketplace_model.current_downloads + 1;
        marketplace_model.total_earnings = marketplace_model.total_earnings + seller_amount;
        marketplace_model.last_purchased_at = option::some(clock::timestamp_ms(clock));

        // Create purchase record
        let purchase_record = PurchaseRecord {
            id: object::new(ctx),
            buyer,
            model_id: object::uid_to_inner(&marketplace_model.id),
            seller: marketplace_model.creator,
            amount_paid: marketplace_model.price,
            platform_fee,
            purchased_at: clock::timestamp_ms(clock),
            expires_at: option::none(),
            access_granted: true,
            download_count: 0,
            access_key: vector::empty(), // Will be set by SEAL service
        };

        // Transfer payments
        let platform_payment = coin::split(&mut payment, platform_fee, ctx);
        transfer::public_transfer(payment, marketplace_model.creator);
        transfer::public_transfer(platform_payment, @satya); // Platform address

        let purchase_id = object::uid_to_inner(&purchase_record.id);

        event::emit(ModelPurchased {
            purchase_id,
            buyer,
            model_id: object::uid_to_inner(&marketplace_model.id),
            amount: marketplace_model.price,
            access_granted: true,
        });

        purchase_record
    }

    /// Grant access key for SEAL decryption (called by SEAL service)
    public fun grant_access_key(
        purchase_record: &mut PurchaseRecord,
        access_key: vector<u8>,
        _ctx: &mut TxContext
    ) {
        // Only SEAL service can call this (add proper access control)
        purchase_record.access_key = access_key;
    }

    /// Update download count
    public fun increment_download(
        purchase_record: &mut PurchaseRecord,
        _ctx: &mut TxContext
    ) {
        purchase_record.download_count = purchase_record.download_count + 1;
    }

    /// Getters for frontend
    public fun get_pending_status(model: &PendingModel): u8 { model.status }
    public fun get_model_price(model: &MarketplaceModel): u64 { model.price }
    public fun get_quality_score(model: &MarketplaceModel): u64 { model.quality_score }
    public fun is_verified(model: &MarketplaceModel): bool { model.tee_verified }
    public fun get_purchase_access_key(record: &PurchaseRecord): &vector<u8> { &record.access_key }
}