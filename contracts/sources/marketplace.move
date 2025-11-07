module marketplace::core {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::event;
    use sui::clock::{Self, Clock};
    use std::vector;

    // ======= Constants =======
    const ERROR_INSUFFICIENT_PAYMENT: u64 = 0;
    const ERROR_NOT_AUTHORIZED: u64 = 1;
    const ERROR_ALREADY_PURCHASED: u64 = 2;
    const ERROR_INVALID_PRICE: u64 = 3;
    const ERROR_INVALID_FEE: u64 = 4;
    const ERROR_MARKETPLACE_PAUSED: u64 = 5;
    const ERROR_ASSET_NOT_ACTIVE: u64 = 6;

    const PLATFORM_FEE_PERCENTAGE: u64 = 250; // 2.5%
    const FEE_DENOMINATOR: u64 = 10000;

    // ======= Structs =======
    
    struct Marketplace has key {
        id: UID,
        fee_percentage: u64,
        treasury: address,
        total_volume: u64,
        total_listings: u64,
        paused: bool
    }

    struct Asset has key, store {
        id: UID,
        seller: address,
        walrus_blob_id: vector<u8>,
        seal_policy_id: ID,
        benchmark_hash: vector<u8>,
        verify_fee: u64,
        price: u64,
        total_sales: u64,
        attestations: vector<ID>,
        active: bool,
        created_at: u64
    }

    struct Purchase has key, store {
        id: UID,
        buyer: address,
        asset_id: ID,
        price_paid: u64,
        timestamp: u64,
        decryption_granted: bool
    }

    // ======= Events =======
    
    struct AssetListed has copy, drop {
        asset_id: ID,
        seller: address,
        price: u64,
        verify_fee: u64,
        timestamp: u64
    }

    struct AssetPurchased has copy, drop {
        purchase_id: ID,
        asset_id: ID,
        buyer: address,
        seller: address,
        price: u64,
        timestamp: u64
    }

    struct VerificationRequested has copy, drop {
        asset_id: ID,
        requester: address,
        fee_paid: u64,
        timestamp: u64
    }

    struct AttestationAdded has copy, drop {
        asset_id: ID,
        attestation_id: ID,
        timestamp: u64
    }

    struct DecryptionGranted has copy, drop {
        purchase_id: ID,
        buyer: address,
        timestamp: u64
    }

    // ======= Initialization =======
    
    fun init(ctx: &mut TxContext) {
        let marketplace = Marketplace {
            id: object::new(ctx),
            fee_percentage: PLATFORM_FEE_PERCENTAGE,
            treasury: @0x1, // TODO: Replace with actual treasury address
            total_volume: 0,
            total_listings: 0,
            paused: false
        };
        transfer::share_object(marketplace);
    }

    // ======= Public Functions =======
    
    public fun list_asset(
        marketplace: &mut Marketplace,
        walrus_blob_id: vector<u8>,
        seal_policy_id: ID,
        benchmark_hash: vector<u8>,
        verify_fee: u64,
        price: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ): ID {
        assert!(!marketplace.paused, ERROR_MARKETPLACE_PAUSED);
        assert!(price > 0, ERROR_INVALID_PRICE);
        assert!(verify_fee > 0, ERROR_INVALID_FEE);

        let asset = Asset {
            id: object::new(ctx),
            seller: tx_context::sender(ctx),
            walrus_blob_id,
            seal_policy_id,
            benchmark_hash,
            verify_fee,
            price,
            total_sales: 0,
            attestations: vector::empty(),
            active: true,
            created_at: clock::timestamp_ms(clock)
        };

        let asset_id = object::id(&asset);
        marketplace.total_listings = marketplace.total_listings + 1;

        event::emit(AssetListed {
            asset_id,
            seller: tx_context::sender(ctx),
            price,
            verify_fee,
            timestamp: clock::timestamp_ms(clock)
        });

        transfer::share_object(asset);
        asset_id
    }

    public fun request_verification(
        asset: &Asset,
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(asset.active, ERROR_ASSET_NOT_ACTIVE);
        assert!(
            coin::value(&payment) >= asset.verify_fee,
            ERROR_INSUFFICIENT_PAYMENT
        );

        // Transfer verification fee to seller
        transfer::public_transfer(payment, asset.seller);

        event::emit(VerificationRequested {
            asset_id: object::id(asset),
            requester: tx_context::sender(ctx),
            fee_paid: asset.verify_fee,
            timestamp: clock::timestamp_ms(clock)
        });
    }

    public fun purchase_asset(
        marketplace: &mut Marketplace,
        asset: &mut Asset,
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ): ID {
        assert!(!marketplace.paused, ERROR_MARKETPLACE_PAUSED);
        assert!(asset.active, ERROR_ASSET_NOT_ACTIVE);
        
        let buyer = tx_context::sender(ctx);
        let price = asset.price;
        
        assert!(
            coin::value(&payment) >= price,
            ERROR_INSUFFICIENT_PAYMENT
        );

        // Calculate platform fee
        let fee_amount = (price * marketplace.fee_percentage) / FEE_DENOMINATOR;
        let seller_amount = price - fee_amount;

        // Split payment
        if (fee_amount > 0) {
            let fee_coin = coin::split(&mut payment, fee_amount, ctx);
            transfer::public_transfer(fee_coin, marketplace.treasury);
        };
        transfer::public_transfer(payment, asset.seller);

        // Update stats
        asset.total_sales = asset.total_sales + 1;
        marketplace.total_volume = marketplace.total_volume + price;

        // Create purchase record
        let purchase = Purchase {
            id: object::new(ctx),
            buyer,
            asset_id: object::id(asset),
            price_paid: price,
            timestamp: clock::timestamp_ms(clock),
            decryption_granted: false
        };

        let purchase_id = object::id(&purchase);

        event::emit(AssetPurchased {
            purchase_id,
            asset_id: object::id(asset),
            buyer,
            seller: asset.seller,
            price,
            timestamp: clock::timestamp_ms(clock)
        });

        transfer::transfer(purchase, buyer);
        purchase_id
    }

    public fun add_attestation(
        asset: &mut Asset,
        attestation_id: ID,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        vector::push_back(&mut asset.attestations, attestation_id);
        
        event::emit(AttestationAdded {
            asset_id: object::id(asset),
            attestation_id,
            timestamp: clock::timestamp_ms(clock)
        });
    }

    public fun confirm_decryption_access(
        purchase: &mut Purchase,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        purchase.decryption_granted = true;
        
        event::emit(DecryptionGranted {
            purchase_id: object::id(purchase),
            buyer: purchase.buyer,
            timestamp: clock::timestamp_ms(clock)
        });
    }

    // ======= Admin Functions =======
    
    public fun toggle_marketplace_pause(
        marketplace: &mut Marketplace,
        _ctx: &mut TxContext
    ) {
        // TODO: Add admin capability check
        marketplace.paused = !marketplace.paused;
    }

    public fun update_fee_percentage(
        marketplace: &mut Marketplace,
        new_fee: u64,
        _ctx: &mut TxContext
    ) {
        // TODO: Add admin capability check
        assert!(new_fee <= 1000, ERROR_INVALID_FEE); // Max 10%
        marketplace.fee_percentage = new_fee;
    }

    public fun deactivate_asset(
        asset: &mut Asset,
        ctx: &mut TxContext
    ) {
        assert!(
            tx_context::sender(ctx) == asset.seller,
            ERROR_NOT_AUTHORIZED
        );
        asset.active = false;
    }

    // ======= Getter Functions =======
    
    public fun get_asset_info(asset: &Asset): (
        address, 
        vector<u8>, 
        ID, 
        u64, 
        u64,
        u64,
        bool
    ) {
        (
            asset.seller,
            asset.walrus_blob_id,
            asset.seal_policy_id,
            asset.verify_fee,
            asset.price,
            asset.total_sales,
            asset.active
        )
    }

    public fun get_purchase_info(purchase: &Purchase): (
        address,
        ID,
        u64,
        u64,
        bool
    ) {
        (
            purchase.buyer,
            purchase.asset_id,
            purchase.price_paid,
            purchase.timestamp,
            purchase.decryption_granted
        )
    }

    public fun get_marketplace_stats(marketplace: &Marketplace): (u64, u64, u64) {
        (marketplace.total_volume, marketplace.total_listings, marketplace.fee_percentage)
    }

    public fun get_attestations(asset: &Asset): vector<ID> {
        asset.attestations
    }

    public fun is_marketplace_paused(marketplace: &Marketplace): bool {
        marketplace.paused
    }
}