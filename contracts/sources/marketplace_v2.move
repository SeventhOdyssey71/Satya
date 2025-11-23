/// Real AI Marketplace with Seal Encryption and Walrus Storage
/// 
/// This marketplace allows creators to:
/// 1. Upload encrypted AI models to Walrus 
/// 2. Create marketplace listings with download prices
/// 3. Buyers pay SUI to get decryption keys
/// 4. Secure key distribution through Seal encryption
#[allow(duplicate_alias, unused_variable)]
module marketplace::marketplace_v2 {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::event;
    use sui::clock::{Self, Clock};
    use sui::table::{Self, Table};
    use std::string::String;

    // ======= Errors =======
    #[error]
    const ENotAuthorized: vector<u8> = b"Caller not authorized";
    #[error]
    const EInvalidPrice: vector<u8> = b"Price must be greater than zero";
    #[error]
    const EInsufficientPayment: vector<u8> = b"Insufficient payment provided";
    #[error]
    const EListingNotActive: vector<u8> = b"Listing is not active";
    #[error]
    const EMarketplacePaused: vector<u8> = b"Marketplace is paused";

    // ======= Constants =======
    const PLATFORM_FEE_PERCENTAGE: u64 = 250; // 2.5%
    const FEE_DENOMINATOR: u64 = 10000;

    // ======= Main Structs =======
    
    /// Admin capability for marketplace management
    public struct AdminCap has key, store {
        id: UID,
        marketplace_id: ID,
    }

    /// Main marketplace registry
    public struct Marketplace has key {
        id: UID,
        version: u64,
        treasury: address,
        platform_fee_percentage: u64,
        paused: bool,
        total_listings: u64,
        total_volume: u64,
        creator_fees: Table<address, u64>, // Track fees earned by creators
    }

    /// Creator capability for managing listings
    public struct CreatorCap has key, store {
        id: UID,
        creator: address,
    }

    /// AI model listing with encrypted content
    public struct AIListing has key, store {
        id: UID,
        creator: address,
        title: String,
        description: String,
        category: String,
        
        // Storage info
        encrypted_walrus_blob_id: String,
        encryption_key_ciphertext: vector<u8>, // Encrypted with Seal
        seal_namespace: vector<u8>,
        
        // Pricing
        download_price: u64,
        currency: String, // "SUI" for now
        
        // Stats
        total_downloads: u64,
        created_at: u64,
        updated_at: u64,
        active: bool,
    }

    /// Purchase receipt and key access
    public struct PurchaseKey has key, store {
        id: UID,
        listing_id: ID,
        buyer: address,
        price_paid: u64,
        purchased_at: u64,
        
        // Decryption data
        decryption_key_ciphertext: vector<u8>, // Key encrypted for buyer
        access_granted: bool,
    }

    // ======= Events =======
    
    public struct MarketplaceCreated has copy, drop {
        marketplace_id: ID,
        admin: address,
        timestamp: u64,
    }

    public struct ListingCreated has copy, drop {
        listing_id: ID,
        creator: address,
        title: String,
        download_price: u64,
        walrus_blob_id: String,
        timestamp: u64,
    }

    public struct ListingPurchased has copy, drop {
        listing_id: ID,
        buyer: address,
        creator: address,
        price_paid: u64,
        purchase_key_id: ID,
        timestamp: u64,
    }

    public struct ListingUpdated has copy, drop {
        listing_id: ID,
        creator: address,
        new_price: u64,
        timestamp: u64,
    }

    public struct CreatorCapIssued has copy, drop {
        creator: address,
        creator_cap_id: ID,
        timestamp: u64,
    }

    // ======= Initialization =======
    
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
    
    fun init(ctx: &mut TxContext) {
        let admin = tx_context::sender(ctx);
        
        let marketplace = Marketplace {
            id: object::new(ctx),
            version: 1,
            treasury: admin,
            platform_fee_percentage: PLATFORM_FEE_PERCENTAGE,
            paused: false,
            total_listings: 0,
            total_volume: 0,
            creator_fees: table::new(ctx),
        };

        let marketplace_id = object::id(&marketplace);

        // Create admin capability
        let admin_cap = AdminCap {
            id: object::new(ctx),
            marketplace_id,
        };

        event::emit(MarketplaceCreated {
            marketplace_id,
            admin,
            timestamp: 0, // Will be set when clock is available
        });

        transfer::share_object(marketplace);
        transfer::transfer(admin_cap, admin);
    }

    // ======= Creator Functions =======
    
    /// Issue a creator capability to an address
    public fun issue_creator_cap(
        marketplace: &Marketplace,
        _admin_cap: &AdminCap,
        recipient: address,
        clock: &Clock,
        ctx: &mut TxContext
    ): ID {
        assert!(!marketplace.paused, EMarketplacePaused);
        
        let creator_cap = CreatorCap {
            id: object::new(ctx),
            creator: recipient,
        };

        let cap_id = object::id(&creator_cap);

        event::emit(CreatorCapIssued {
            creator: recipient,
            creator_cap_id: cap_id,
            timestamp: clock::timestamp_ms(clock),
        });

        transfer::transfer(creator_cap, recipient);
        cap_id
    }

    /// Create a new AI model listing
    public fun create_listing(
        marketplace: &mut Marketplace,
        creator_cap: &CreatorCap,
        title: String,
        description: String,
        category: String,
        encrypted_walrus_blob_id: String,
        encryption_key_ciphertext: vector<u8>,
        seal_namespace: vector<u8>,
        download_price: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ): ID {
        assert!(!marketplace.paused, EMarketplacePaused);
        assert!(download_price > 0, EInvalidPrice);
        
        let creator = creator_cap.creator;
        let timestamp = clock::timestamp_ms(clock);

        let listing = AIListing {
            id: object::new(ctx),
            creator,
            title,
            description,
            category,
            encrypted_walrus_blob_id,
            encryption_key_ciphertext,
            seal_namespace,
            download_price,
            currency: std::string::utf8(b"SUI"),
            total_downloads: 0,
            created_at: timestamp,
            updated_at: timestamp,
            active: true,
        };

        let listing_id = object::id(&listing);
        marketplace.total_listings = marketplace.total_listings + 1;

        event::emit(ListingCreated {
            listing_id,
            creator,
            title,
            download_price,
            walrus_blob_id: encrypted_walrus_blob_id,
            timestamp,
        });

        transfer::share_object(listing);
        listing_id
    }

    /// Update listing price
    public fun update_listing_price(
        listing: &mut AIListing,
        creator_cap: &CreatorCap,
        new_price: u64,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        assert!(listing.creator == creator_cap.creator, ENotAuthorized);
        assert!(new_price > 0, EInvalidPrice);
        assert!(listing.active, EListingNotActive);

        listing.download_price = new_price;
        listing.updated_at = clock::timestamp_ms(clock);

        event::emit(ListingUpdated {
            listing_id: object::id(listing),
            creator: listing.creator,
            new_price,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    /// Deactivate a listing
    public fun deactivate_listing(
        listing: &mut AIListing,
        creator_cap: &CreatorCap,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        assert!(listing.creator == creator_cap.creator, ENotAuthorized);
        listing.active = false;
        listing.updated_at = clock::timestamp_ms(clock);
    }

    // ======= Purchase Functions =======
    
    /// Purchase access to an AI model
    public fun purchase_listing(
        marketplace: &mut Marketplace,
        listing: &mut AIListing,
        mut payment: Coin<SUI>,
        _buyer_seal_key_id: vector<u8>, // Buyer's Seal key ID for encryption
        clock: &Clock,
        ctx: &mut TxContext
    ): PurchaseKey {
        assert!(!marketplace.paused, EMarketplacePaused);
        assert!(listing.active, EListingNotActive);
        
        let buyer = tx_context::sender(ctx);
        let payment_value = coin::value(&payment);
        let required_price = listing.download_price;
        
        assert!(payment_value >= required_price, EInsufficientPayment);

        // Calculate platform fee and creator payment
        let platform_fee = (required_price * marketplace.platform_fee_percentage) / FEE_DENOMINATOR;
        let creator_amount = required_price - platform_fee;

        // Split payment
        let platform_fee_coin = coin::split(&mut payment, platform_fee, ctx);
        let creator_payment = payment;

        // Transfer payments
        transfer::public_transfer(platform_fee_coin, marketplace.treasury);
        transfer::public_transfer(creator_payment, listing.creator);

        // Update creator fees tracking
        if (!table::contains(&marketplace.creator_fees, listing.creator)) {
            table::add(&mut marketplace.creator_fees, listing.creator, 0);
        };
        let creator_total = table::borrow_mut(&mut marketplace.creator_fees, listing.creator);
        *creator_total = *creator_total + creator_amount;

        // Update stats
        listing.total_downloads = listing.total_downloads + 1;
        marketplace.total_volume = marketplace.total_volume + required_price;

        let timestamp = clock::timestamp_ms(clock);
        listing.updated_at = timestamp;

        // Create purchase key with encrypted decryption data
        // In real implementation, this would use Seal SDK to encrypt the key for the buyer
        let purchase_key = PurchaseKey {
            id: object::new(ctx),
            listing_id: object::id(listing),
            buyer,
            price_paid: required_price,
            purchased_at: timestamp,
            decryption_key_ciphertext: listing.encryption_key_ciphertext, // Simplified for now
            access_granted: true,
        };

        let purchase_key_id = object::id(&purchase_key);

        event::emit(ListingPurchased {
            listing_id: object::id(listing),
            buyer,
            creator: listing.creator,
            price_paid: required_price,
            purchase_key_id,
            timestamp,
        });

        purchase_key
    }

    // ======= Admin Functions =======
    
    /// Toggle marketplace pause
    public fun toggle_marketplace_pause(
        marketplace: &mut Marketplace,
        _admin_cap: &AdminCap,
    ) {
        marketplace.paused = !marketplace.paused;
    }

    /// Update platform fee
    public fun update_platform_fee(
        marketplace: &mut Marketplace,
        new_fee_percentage: u64,
        _admin_cap: &AdminCap,
    ) {
        assert!(new_fee_percentage <= 1000, EInvalidPrice); // Max 10%
        marketplace.platform_fee_percentage = new_fee_percentage;
    }

    /// Update treasury address
    public fun update_treasury(
        marketplace: &mut Marketplace,
        new_treasury: address,
        _admin_cap: &AdminCap,
    ) {
        marketplace.treasury = new_treasury;
    }

    // ======= Getter Functions =======
    
    public fun get_marketplace_info(marketplace: &Marketplace): (u64, u64, u64, bool, address) {
        (
            marketplace.total_listings,
            marketplace.total_volume,
            marketplace.platform_fee_percentage,
            marketplace.paused,
            marketplace.treasury
        )
    }

    public fun get_listing_info(listing: &AIListing): (
        address, String, String, String, String, u64, String, u64, u64, bool
    ) {
        (
            listing.creator,
            listing.title,
            listing.description,
            listing.category,
            listing.encrypted_walrus_blob_id,
            listing.download_price,
            listing.currency,
            listing.total_downloads,
            listing.created_at,
            listing.active
        )
    }

    public fun get_purchase_key_info(key: &PurchaseKey): (
        ID, address, u64, u64, vector<u8>, bool
    ) {
        (
            key.listing_id,
            key.buyer,
            key.price_paid,
            key.purchased_at,
            key.decryption_key_ciphertext,
            key.access_granted
        )
    }

    public fun get_creator_earnings(marketplace: &Marketplace, creator: address): u64 {
        if (table::contains(&marketplace.creator_fees, creator)) {
            *table::borrow(&marketplace.creator_fees, creator)
        } else {
            0
        }
    }

    // ======= Helper Functions =======
    
    /// Check if a user has purchased a specific listing
    public fun has_purchase_key(key: &PurchaseKey, listing_id: ID): bool {
        key.listing_id == listing_id && key.access_granted
    }

    /// Verify creator owns listing
    public fun verify_creator(listing: &AIListing, creator_cap: &CreatorCap): bool {
        listing.creator == creator_cap.creator
    }

    // ======= Test Helper Functions =======
    
    #[test_only]
    public fun create_test_marketplace(ctx: &mut TxContext): (Marketplace, AdminCap) {
        let marketplace = Marketplace {
            id: object::new(ctx),
            version: 1,
            treasury: tx_context::sender(ctx),
            platform_fee_percentage: PLATFORM_FEE_PERCENTAGE,
            paused: false,
            total_listings: 0,
            total_volume: 0,
            creator_fees: table::new(ctx),
        };

        let admin_cap = AdminCap {
            id: object::new(ctx),
            marketplace_id: object::id(&marketplace),
        };

        (marketplace, admin_cap)
    }

    #[test_only]
    public fun create_test_creator_cap(creator: address, ctx: &mut TxContext): CreatorCap {
        CreatorCap {
            id: object::new(ctx),
            creator,
        }
    }
}