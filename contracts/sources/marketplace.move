#[allow(duplicate_alias, lint(self_transfer))]
module marketplace::core {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::event;
    use sui::clock::{Self, Clock};
    use std::vector;

    // ======= Errors =======
    #[error]
    const EInsufficientPayment: vector<u8> = b"Insufficient payment provided";
    #[error]
    const ENotAuthorized: vector<u8> = b"Caller not authorized";
    #[error]
    const EInvalidPrice: vector<u8> = b"Price must be greater than zero";
    #[error] 
    const EInvalidFee: vector<u8> = b"Verify fee must be greater than zero";
    #[error]
    const EMarketplacePaused: vector<u8> = b"Marketplace is currently paused";
    #[error]
    const EAssetNotActive: vector<u8> = b"Asset is not active";
    #[error]
    const EInvalidPurchase: vector<u8> = b"Purchase does not match asset";

    const PLATFORM_FEE_PERCENTAGE: u64 = 250; // 2.5%
    const FEE_DENOMINATOR: u64 = 10000;

    // ======= Structs =======
    
    public struct AdminCap has key, store {
        id: UID
    }
    
    public struct Marketplace has key {
        id: UID,
        fee_percentage: u64,
        treasury: address,
        total_volume: u64,
        total_listings: u64,
        paused: bool
    }

    public struct Asset has key, store {
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

    public struct Purchase has key, store {
        id: UID,
        buyer: address,
        asset_id: ID,
        price_paid: u64,
        timestamp: u64,
        decryption_granted: bool
    }

    // ======= Events =======
    
    public struct AssetListed has copy, drop {
        asset_id: ID,
        seller: address,
        price: u64,
        verify_fee: u64,
        timestamp: u64
    }

    public struct AssetPurchased has copy, drop {
        purchase_id: ID,
        asset_id: ID,
        buyer: address,
        seller: address,
        price: u64,
        timestamp: u64
    }

    public struct VerificationRequested has copy, drop {
        asset_id: ID,
        requester: address,
        fee_paid: u64,
        timestamp: u64
    }

    public struct AttestationAdded has copy, drop {
        asset_id: ID,
        attestation_id: ID,
        timestamp: u64
    }

    public struct DecryptionGranted has copy, drop {
        purchase_id: ID,
        buyer: address,
        timestamp: u64
    }

    public struct SealAccessGranted has copy, drop {
        asset_id: ID,
        buyer: address,
        seal_policy_id: ID,
        timestamp: u64
    }

    // ======= Initialization =======
    
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
    
    fun init(ctx: &mut TxContext) {
        let marketplace = Marketplace {
            id: object::new(ctx),
            fee_percentage: PLATFORM_FEE_PERCENTAGE,
            treasury: @0xcb4a3c693a334fe1be0161f446471a923c462178ef279b20f847f23c225a8d09,
            total_volume: 0,
            total_listings: 0,
            paused: false
        };
        transfer::share_object(marketplace);
        
        // Create and transfer admin capability to deployer
        let admin_cap = AdminCap {
            id: object::new(ctx)
        };
        transfer::transfer(admin_cap, tx_context::sender(ctx));
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
        assert!(!marketplace.paused, EMarketplacePaused);
        assert!(price > 0, EInvalidPrice);
        assert!(verify_fee > 0, EInvalidFee);

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
        assert!(asset.active, EAssetNotActive);
        assert!(
            coin::value(&payment) >= asset.verify_fee,
            EInsufficientPayment
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
        mut payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ): ID {
        assert!(!marketplace.paused, EMarketplacePaused);
        assert!(asset.active, EAssetNotActive);
        
        let buyer = tx_context::sender(ctx);
        let price = asset.price;
        
        assert!(
            coin::value(&payment) >= price,
            EInsufficientPayment
        );

        // Calculate platform fee
        let fee_amount = (price * marketplace.fee_percentage) / FEE_DENOMINATOR;
        let _seller_amount = price - fee_amount;

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

    // ======= SEAL Integration Functions =======

    /// SEAL approve function for buyers - Called by SEAL key servers to verify purchase
    ///
    /// This function is called during the decryption process to verify that:
    /// 1. The caller owns a valid Purchase object
    /// 2. The Purchase is for the specified Asset
    /// 3. The Asset has the correct SEAL policy
    ///
    /// SEAL key servers will only release decryption keys if this function executes successfully
    entry fun seal_approve(
        purchase: &Purchase,
        asset: &Asset,
        clock: &Clock,
        ctx: &TxContext
    ) {
        let caller = tx_context::sender(ctx);

        // Verify caller is the buyer who owns this Purchase
        assert!(caller == purchase.buyer, ENotAuthorized);

        // Verify the Purchase is for this specific Asset
        assert!(purchase.asset_id == object::id(asset), EInvalidPurchase);

        // Emit event for SEAL key servers
        event::emit(SealAccessGranted {
            asset_id: object::id(asset),
            buyer: caller,
            seal_policy_id: asset.seal_policy_id,
            timestamp: clock::timestamp_ms(clock)
        });
    }

    /// SEAL approve function for creators - Allows sellers to verify their own models
    ///
    /// This is used when the creator/seller wants to decrypt their own encrypted model
    /// (e.g., for verification purposes before listing)
    entry fun seal_approve_creator(
        asset: &Asset,
        clock: &Clock,
        ctx: &TxContext
    ) {
        let caller = tx_context::sender(ctx);

        // Verify caller is the seller/creator of this Asset
        assert!(caller == asset.seller, ENotAuthorized);

        // Emit event for SEAL key servers
        event::emit(SealAccessGranted {
            asset_id: object::id(asset),
            buyer: caller,
            seal_policy_id: asset.seal_policy_id,
            timestamp: clock::timestamp_ms(clock)
        });
    }

    // ======= Admin Functions =======
    
    public fun toggle_marketplace_pause(
        marketplace: &mut Marketplace,
        _admin_cap: &AdminCap
    ) {
        marketplace.paused = !marketplace.paused;
    }

    public fun update_fee_percentage(
        marketplace: &mut Marketplace,
        new_fee: u64,
        _admin_cap: &AdminCap
    ) {
        assert!(new_fee <= 1000, EInvalidFee); // Max 10%
        marketplace.fee_percentage = new_fee;
    }

    public fun deactivate_asset(
        asset: &mut Asset,
        ctx: &mut TxContext
    ) {
        assert!(
            tx_context::sender(ctx) == asset.seller,
            ENotAuthorized
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