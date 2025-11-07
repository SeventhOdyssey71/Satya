#[allow(duplicate_alias)]
module marketplace::access {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::clock::{Self, Clock};
    use std::vector;
    use std::string::String;

    // ======= Errors =======
    #[error]
    const ENotAuthorized: vector<u8> = b"Caller not authorized";
    #[error]
    const EAlreadyGranted: vector<u8> = b"Access already granted";
    #[error]
    const EExpiredAccess: vector<u8> = b"Access has expired";
    #[error]
    const EPolicyNotActive: vector<u8> = b"Policy is not active";
    #[error]
    const EInsufficientThreshold: vector<u8> = b"Insufficient threshold for key servers";

    const DEFAULT_ACCESS_DURATION_MS: u64 = 2592000000; // 30 days

    // ======= Structs =======
    
    public struct AccessRegistry has key {
        id: UID,
        total_policies: u64,
        total_grants: u64
    }

    public struct AccessPolicy has key, store {
        id: UID,
        asset_id: ID,
        seal_policy_id: ID,
        creator: address,
        threshold: u64,
        key_servers: vector<KeyServer>,
        active: bool,
        created_at: u64
    }

    public struct KeyServer has store, drop, copy {
        object_id: ID,
        url: String,
        active: bool
    }

    public struct AccessGrant has key, store {
        id: UID,
        policy_id: ID,
        grantee: address,
        asset_id: ID,
        granted_at: u64,
        expires_at: u64,
        revoked: bool
    }

    public struct DecryptionRequest has key, store {
        id: UID,
        grant_id: ID,
        requester: address,
        asset_id: ID,
        seal_policy_id: ID,
        status: u8, // 0 = pending, 1 = approved, 2 = denied
        created_at: u64
    }

    // ======= Events =======
    
    public struct PolicyCreated has copy, drop {
        policy_id: ID,
        asset_id: ID,
        seal_policy_id: ID,
        threshold: u64,
        timestamp: u64
    }

    public struct AccessGranted has copy, drop {
        grant_id: ID,
        policy_id: ID,
        grantee: address,
        asset_id: ID,
        expires_at: u64,
        timestamp: u64
    }

    public struct AccessRevoked has copy, drop {
        grant_id: ID,
        grantee: address,
        timestamp: u64
    }

    public struct DecryptionRequested has copy, drop {
        request_id: ID,
        grant_id: ID,
        requester: address,
        asset_id: ID,
        timestamp: u64
    }

    public struct DecryptionApproved has copy, drop {
        request_id: ID,
        requester: address,
        timestamp: u64
    }

    // ======= Initialization =======
    
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
    
    fun init(ctx: &mut TxContext) {
        let registry = AccessRegistry {
            id: object::new(ctx),
            total_policies: 0,
            total_grants: 0
        };
        transfer::share_object(registry);
    }

    // ======= Public Functions =======
    
    public fun create_access_policy(
        registry: &mut AccessRegistry,
        asset_id: ID,
        seal_policy_id: ID,
        threshold: u64,
        key_servers: vector<KeyServer>,
        clock: &Clock,
        ctx: &mut TxContext
    ): ID {
        assert!(threshold > 0, EInsufficientThreshold);
        assert!(
            vector::length(&key_servers) >= threshold,
            EInsufficientThreshold
        );

        let policy = AccessPolicy {
            id: object::new(ctx),
            asset_id,
            seal_policy_id,
            creator: tx_context::sender(ctx),
            threshold,
            key_servers,
            active: true,
            created_at: clock::timestamp_ms(clock)
        };

        let policy_id = object::id(&policy);
        registry.total_policies = registry.total_policies + 1;

        event::emit(PolicyCreated {
            policy_id,
            asset_id,
            seal_policy_id,
            threshold,
            timestamp: clock::timestamp_ms(clock)
        });

        transfer::share_object(policy);
        policy_id
    }

    public fun grant_access(
        registry: &mut AccessRegistry,
        policy: &AccessPolicy,
        grantee: address,
        duration_ms: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ): ID {
        assert!(policy.active, EPolicyNotActive);
        assert!(
            tx_context::sender(ctx) == policy.creator,
            ENotAuthorized
        );

        let current_time = clock::timestamp_ms(clock);
        let duration = if (duration_ms == 0) {
            DEFAULT_ACCESS_DURATION_MS
        } else {
            duration_ms
        };

        let grant = AccessGrant {
            id: object::new(ctx),
            policy_id: object::id(policy),
            grantee,
            asset_id: policy.asset_id,
            granted_at: current_time,
            expires_at: current_time + duration,
            revoked: false
        };

        let grant_id = object::id(&grant);
        registry.total_grants = registry.total_grants + 1;

        event::emit(AccessGranted {
            grant_id,
            policy_id: object::id(policy),
            grantee,
            asset_id: policy.asset_id,
            expires_at: grant.expires_at,
            timestamp: current_time
        });

        transfer::transfer(grant, grantee);
        grant_id
    }

    public fun grant_purchase_access(
        registry: &mut AccessRegistry,
        policy: &AccessPolicy,
        _purchase_id: ID,
        buyer: address,
        clock: &Clock,
        ctx: &mut TxContext
    ): ID {
        assert!(policy.active, EPolicyNotActive);
        // This would typically be called by the marketplace contract
        // after a successful purchase
        
        let current_time = clock::timestamp_ms(clock);
        let grant = AccessGrant {
            id: object::new(ctx),
            policy_id: object::id(policy),
            grantee: buyer,
            asset_id: policy.asset_id,
            granted_at: current_time,
            expires_at: current_time + DEFAULT_ACCESS_DURATION_MS,
            revoked: false
        };

        let grant_id = object::id(&grant);
        registry.total_grants = registry.total_grants + 1;

        event::emit(AccessGranted {
            grant_id,
            policy_id: object::id(policy),
            grantee: buyer,
            asset_id: policy.asset_id,
            expires_at: grant.expires_at,
            timestamp: current_time
        });

        transfer::transfer(grant, buyer);
        grant_id
    }

    public fun request_decryption(
        grant: &AccessGrant,
        policy: &AccessPolicy,
        clock: &Clock,
        ctx: &mut TxContext
    ): ID {
        let requester = tx_context::sender(ctx);
        assert!(requester == grant.grantee, ENotAuthorized);
        assert!(!grant.revoked, ENotAuthorized);
        assert!(
            clock::timestamp_ms(clock) < grant.expires_at,
            EExpiredAccess
        );
        assert!(policy.active, EPolicyNotActive);

        let request = DecryptionRequest {
            id: object::new(ctx),
            grant_id: object::id(grant),
            requester,
            asset_id: grant.asset_id,
            seal_policy_id: policy.seal_policy_id,
            status: 0, // pending
            created_at: clock::timestamp_ms(clock)
        };

        let request_id = object::id(&request);

        event::emit(DecryptionRequested {
            request_id,
            grant_id: object::id(grant),
            requester,
            asset_id: grant.asset_id,
            timestamp: clock::timestamp_ms(clock)
        });

        transfer::share_object(request);
        request_id
    }

    public fun approve_decryption(
        request: &mut DecryptionRequest,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        // This would typically be called by an authorized service
        // after validating the request with Seal
        assert!(request.status == 0, EAlreadyGranted);
        
        request.status = 1; // approved

        event::emit(DecryptionApproved {
            request_id: object::id(request),
            requester: request.requester,
            timestamp: clock::timestamp_ms(clock)
        });
    }

    public fun revoke_access(
        grant: &mut AccessGrant,
        policy: &AccessPolicy,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(
            tx_context::sender(ctx) == policy.creator,
            ENotAuthorized
        );
        assert!(!grant.revoked, EAlreadyGranted);

        grant.revoked = true;

        event::emit(AccessRevoked {
            grant_id: object::id(grant),
            grantee: grant.grantee,
            timestamp: clock::timestamp_ms(clock)
        });
    }

    // ======= Admin Functions =======
    
    public fun deactivate_policy(
        policy: &mut AccessPolicy,
        ctx: &mut TxContext
    ) {
        assert!(
            tx_context::sender(ctx) == policy.creator,
            ENotAuthorized
        );
        policy.active = false;
    }

    public fun update_key_servers(
        policy: &mut AccessPolicy,
        new_key_servers: vector<KeyServer>,
        ctx: &mut TxContext
    ) {
        assert!(
            tx_context::sender(ctx) == policy.creator,
            ENotAuthorized
        );
        assert!(
            vector::length(&new_key_servers) >= policy.threshold,
            EInsufficientThreshold
        );
        policy.key_servers = new_key_servers;
    }

    // ======= Helper Functions =======
    
    public fun is_access_valid(
        grant: &AccessGrant,
        clock: &Clock
    ): bool {
        !grant.revoked && clock::timestamp_ms(clock) < grant.expires_at
    }

    public fun get_active_key_servers(policy: &AccessPolicy): vector<KeyServer> {
        let mut servers = vector::empty<KeyServer>();
        let mut i = 0;
        let len = vector::length(&policy.key_servers);
        
        while (i < len) {
            let server = vector::borrow(&policy.key_servers, i);
            if (server.active) {
                vector::push_back(&mut servers, *server);
            };
            i = i + 1;
        };
        servers
    }

    // ======= Getter Functions =======
    
    public fun get_policy_info(policy: &AccessPolicy): (
        ID,
        ID,
        address,
        u64,
        bool
    ) {
        (
            policy.asset_id,
            policy.seal_policy_id,
            policy.creator,
            policy.threshold,
            policy.active
        )
    }

    public fun get_grant_info(grant: &AccessGrant): (
        ID,
        address,
        ID,
        u64,
        u64,
        bool
    ) {
        (
            grant.policy_id,
            grant.grantee,
            grant.asset_id,
            grant.granted_at,
            grant.expires_at,
            grant.revoked
        )
    }

    public fun get_decryption_request_status(request: &DecryptionRequest): u8 {
        request.status
    }

    public fun get_registry_stats(registry: &AccessRegistry): (u64, u64) {
        (registry.total_policies, registry.total_grants)
    }

    // ======= Test Helper Functions =======
    
    #[test_only]
    public fun create_test_key_servers(): vector<KeyServer> {
        use std::string;
        
        let mut servers = vector::empty<KeyServer>();
        vector::push_back(&mut servers, KeyServer {
            object_id: object::id_from_address(@0x1),
            url: string::utf8(b"https://seal-testnet-1.example.com"),
            active: true
        });
        vector::push_back(&mut servers, KeyServer {
            object_id: object::id_from_address(@0x2),
            url: string::utf8(b"https://seal-testnet-2.example.com"),
            active: true
        });
        servers
    }
}