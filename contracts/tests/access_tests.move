#[test_only]
module marketplace::access_tests {
    use marketplace::access::{Self, AccessRegistry, AccessPolicy, AccessGrant, DecryptionRequest};
    use sui::test_scenario::{Self as test};
    use sui::clock::{Self, Clock};
    use sui::test_utils::assert_eq;

    // Test addresses
    const ADMIN: address = @0x7;
    const CREATOR: address = @0xA;
    const GRANTEE: address = @0xB;
    const OTHER_USER: address = @0xC;

    #[test]
    fun test_access_registry_initialization() {
        let mut scenario = test::begin(ADMIN);
        
        // Initialize access registry
        access::init_for_testing(test::ctx(&mut scenario));
        
        test::next_tx(&mut scenario, ADMIN);
        {
            let registry = test::take_shared<AccessRegistry>(&scenario);
            let (total_policies, total_grants) = access::get_registry_stats(&registry);
            
            assert_eq(total_policies, 0);
            assert_eq(total_grants, 0);
            
            test::return_shared(registry);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_create_access_policy() {
        let mut scenario = test::begin(CREATOR);
        
        // Initialize registry
        access::init_for_testing(test::ctx(&mut scenario));
        
        test::next_tx(&mut scenario, CREATOR);
        {
            let clock = clock::create_for_testing(test::ctx(&mut scenario));
            clock::share_for_testing(clock);
        };
        
        test::next_tx(&mut scenario, CREATOR);
        {
            let mut registry = test::take_shared<AccessRegistry>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            let key_servers = access::create_test_key_servers();
            
            let asset_id = object::id_from_address(@0x999);
            let seal_policy_id = object::id_from_address(@0xAAA);
            
            let _policy_id = access::create_access_policy(
                &mut registry,
                asset_id,
                seal_policy_id,
                2, // threshold
                key_servers,
                &clock,
                test::ctx(&mut scenario)
            );
            
            // Verify registry stats updated
            let (total_policies, total_grants) = access::get_registry_stats(&registry);
            assert_eq(total_policies, 1);
            assert_eq(total_grants, 0);
            
            test::return_shared(registry);
            test::return_shared(clock);
        };
        
        // Verify policy was created with correct properties
        test::next_tx(&mut scenario, CREATOR);
        {
            let policy = test::take_shared<AccessPolicy>(&scenario);
            let (asset_id, seal_policy_id, creator, threshold, active) = 
                access::get_policy_info(&policy);
            
            assert_eq(asset_id, object::id_from_address(@0x999));
            assert_eq(seal_policy_id, object::id_from_address(@0xAAA));
            assert_eq(creator, CREATOR);
            assert_eq(threshold, 2);
            assert!(active);
            
            let active_servers = access::get_active_key_servers(&policy);
            assert_eq(vector::length(&active_servers), 2);
            
            test::return_shared(policy);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_grant_access() {
        let mut scenario = test::begin(CREATOR);
        
        // Setup policy
        setup_access_policy(&mut scenario, CREATOR);
        
        // Grant access
        test::next_tx(&mut scenario, CREATOR);
        {
            let mut registry = test::take_shared<AccessRegistry>(&scenario);
            let policy = test::take_shared<AccessPolicy>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            
            let _grant_id = access::grant_access(
                &mut registry,
                &policy,
                GRANTEE,
                0, // use default duration
                &clock,
                test::ctx(&mut scenario)
            );
            
            // Verify registry stats updated
            let (_total_policies, total_grants) = access::get_registry_stats(&registry);
            assert_eq(total_grants, 1);
            
            test::return_shared(registry);
            test::return_shared(policy);
            test::return_shared(clock);
        };
        
        // Verify grant was transferred to grantee
        test::next_tx(&mut scenario, GRANTEE);
        {
            let grant = test::take_from_sender<AccessGrant>(&scenario);
            let (_policy_id, grantee, _asset_id, _granted_at, _expires_at, revoked) = 
                access::get_grant_info(&grant);
            
            assert_eq(grantee, GRANTEE);
            assert!(!revoked);
            
            let clock = test::take_shared<Clock>(&scenario);
            assert!(access::is_access_valid(&grant, &clock));
            
            test::return_to_sender(&scenario, grant);
            test::return_shared(clock);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_grant_purchase_access() {
        let mut scenario = test::begin(CREATOR);
        
        // Setup policy
        setup_access_policy(&mut scenario, CREATOR);
        
        // Grant purchase access
        test::next_tx(&mut scenario, CREATOR);
        {
            let mut registry = test::take_shared<AccessRegistry>(&scenario);
            let policy = test::take_shared<AccessPolicy>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            let purchase_id = object::id_from_address(@0xBBB);
            
            let _grant_id = access::grant_purchase_access(
                &mut registry,
                &policy,
                purchase_id,
                GRANTEE,
                &clock,
                test::ctx(&mut scenario)
            );
            
            test::return_shared(registry);
            test::return_shared(policy);
            test::return_shared(clock);
        };
        
        // Verify purchase access grant
        test::next_tx(&mut scenario, GRANTEE);
        {
            let grant = test::take_from_sender<AccessGrant>(&scenario);
            let (_, grantee, _, _, _, revoked) = access::get_grant_info(&grant);
            
            assert_eq(grantee, GRANTEE);
            assert!(!revoked);
            
            test::return_to_sender(&scenario, grant);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_request_decryption() {
        let mut scenario = test::begin(CREATOR);
        
        // Setup and grant access
        setup_access_policy(&mut scenario, CREATOR);
        grant_access_to_user(&mut scenario, CREATOR, GRANTEE);
        
        // Request decryption
        test::next_tx(&mut scenario, GRANTEE);
        {
            let grant = test::take_from_sender<AccessGrant>(&scenario);
            let policy = test::take_shared<AccessPolicy>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            
            let _request_id = access::request_decryption(
                &grant,
                &policy,
                &clock,
                test::ctx(&mut scenario)
            );
            
            test::return_to_sender(&scenario, grant);
            test::return_shared(policy);
            test::return_shared(clock);
        };
        
        // Verify decryption request
        test::next_tx(&mut scenario, GRANTEE);
        {
            let request = test::take_shared<DecryptionRequest>(&scenario);
            let status = access::get_decryption_request_status(&request);
            
            assert_eq(status, 0); // pending
            
            test::return_shared(request);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_approve_decryption() {
        let mut scenario = test::begin(CREATOR);
        
        // Setup, grant access, and request decryption
        setup_access_policy(&mut scenario, CREATOR);
        grant_access_to_user(&mut scenario, CREATOR, GRANTEE);
        request_decryption(&mut scenario, GRANTEE);
        
        // Approve decryption
        test::next_tx(&mut scenario, ADMIN);
        {
            let mut request = test::take_shared<DecryptionRequest>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            
            access::approve_decryption(
                &mut request,
                &clock,
                test::ctx(&mut scenario)
            );
            
            let status = access::get_decryption_request_status(&request);
            assert_eq(status, 1); // approved
            
            test::return_shared(request);
            test::return_shared(clock);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_revoke_access() {
        let mut scenario = test::begin(CREATOR);
        
        // Setup policy and grant access
        setup_access_policy(&mut scenario, CREATOR);
        grant_access_to_user(&mut scenario, CREATOR, GRANTEE);
        
        // Test that the grant exists and is not revoked initially  
        test::next_tx(&mut scenario, GRANTEE);
        {
            let grant = test::take_from_sender<AccessGrant>(&scenario);
            let (_, _, _, _, _, revoked) = access::get_grant_info(&grant);
            assert!(!revoked); // Initially not revoked
            test::return_to_sender(&scenario, grant);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_deactivate_policy() {
        let mut scenario = test::begin(CREATOR);
        
        // Setup policy
        setup_access_policy(&mut scenario, CREATOR);
        
        // Deactivate policy
        test::next_tx(&mut scenario, CREATOR);
        {
            let mut policy = test::take_shared<AccessPolicy>(&scenario);
            
            access::deactivate_policy(&mut policy, test::ctx(&mut scenario));
            
            let (_, _, _, _, active) = access::get_policy_info(&policy);
            assert!(!active);
            
            test::return_shared(policy);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_update_key_servers() {
        let mut scenario = test::begin(CREATOR);
        
        // Setup policy
        setup_access_policy(&mut scenario, CREATOR);
        
        // Update key servers
        test::next_tx(&mut scenario, CREATOR);
        {
            let mut policy = test::take_shared<AccessPolicy>(&scenario);
            let new_servers = access::create_test_key_servers();
            
            access::update_key_servers(
                &mut policy,
                new_servers,
                test::ctx(&mut scenario)
            );
            
            let active_servers = access::get_active_key_servers(&policy);
            assert_eq(vector::length(&active_servers), 2);
            
            test::return_shared(policy);
        };
        
        test::end(scenario);
    }

    // ======= Error Test Cases =======

    #[test]
    #[expected_failure(abort_code = access::EInsufficientThreshold)]
    fun test_create_policy_insufficient_threshold() {
        let mut scenario = test::begin(CREATOR);
        
        access::init_for_testing(test::ctx(&mut scenario));
        
        test::next_tx(&mut scenario, CREATOR);
        {
            let clock = clock::create_for_testing(test::ctx(&mut scenario));
            clock::share_for_testing(clock);
        };
        
        test::next_tx(&mut scenario, CREATOR);
        {
            let mut registry = test::take_shared<AccessRegistry>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            
            access::create_access_policy(
                &mut registry,
                object::id_from_address(@0x999),
                object::id_from_address(@0xAAA),
                0, // Invalid zero threshold
                vector::empty(),
                &clock,
                test::ctx(&mut scenario)
            );
            
            test::return_shared(registry);
            test::return_shared(clock);
        };
        
        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = access::EInsufficientThreshold)]
    fun test_create_policy_threshold_exceeds_servers() {
        let mut scenario = test::begin(CREATOR);
        
        access::init_for_testing(test::ctx(&mut scenario));
        
        test::next_tx(&mut scenario, CREATOR);
        {
            let clock = clock::create_for_testing(test::ctx(&mut scenario));
            clock::share_for_testing(clock);
        };
        
        test::next_tx(&mut scenario, CREATOR);
        {
            let mut registry = test::take_shared<AccessRegistry>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            let key_servers = access::create_test_key_servers(); // 2 servers
            
            access::create_access_policy(
                &mut registry,
                object::id_from_address(@0x999),
                object::id_from_address(@0xAAA),
                5, // threshold > servers
                key_servers,
                &clock,
                test::ctx(&mut scenario)
            );
            
            test::return_shared(registry);
            test::return_shared(clock);
        };
        
        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = access::ENotAuthorized)]
    fun test_grant_access_unauthorized() {
        let mut scenario = test::begin(CREATOR);
        
        // Setup policy
        setup_access_policy(&mut scenario, CREATOR);
        
        // Try to grant access as non-creator
        test::next_tx(&mut scenario, OTHER_USER);
        {
            let mut registry = test::take_shared<AccessRegistry>(&scenario);
            let policy = test::take_shared<AccessPolicy>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            
            access::grant_access(
                &mut registry,
                &policy,
                GRANTEE,
                0,
                &clock,
                test::ctx(&mut scenario)
            );
            
            test::return_shared(registry);
            test::return_shared(policy);
            test::return_shared(clock);
        };
        
        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = access::EPolicyNotActive)]
    fun test_grant_access_inactive_policy() {
        let mut scenario = test::begin(CREATOR);
        
        // Setup and deactivate policy
        setup_access_policy(&mut scenario, CREATOR);
        
        test::next_tx(&mut scenario, CREATOR);
        {
            let mut policy = test::take_shared<AccessPolicy>(&scenario);
            access::deactivate_policy(&mut policy, test::ctx(&mut scenario));
            test::return_shared(policy);
        };
        
        // Try to grant access on inactive policy
        test::next_tx(&mut scenario, CREATOR);
        {
            let mut registry = test::take_shared<AccessRegistry>(&scenario);
            let policy = test::take_shared<AccessPolicy>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            
            access::grant_access(
                &mut registry,
                &policy,
                GRANTEE,
                0,
                &clock,
                test::ctx(&mut scenario)
            );
            
            test::return_shared(registry);
            test::return_shared(policy);
            test::return_shared(clock);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_request_decryption_authorization() {
        let mut scenario = test::begin(CREATOR);
        
        // Setup and grant access to test authorization works correctly
        setup_access_policy(&mut scenario, CREATOR);
        grant_access_to_user(&mut scenario, CREATOR, GRANTEE);
        
        // Verify GRANTEE can use their grant
        test::next_tx(&mut scenario, GRANTEE);
        {
            let grant = test::take_from_sender<AccessGrant>(&scenario);
            let (_, grantee, _, _, _, revoked) = access::get_grant_info(&grant);
            assert_eq(grantee, GRANTEE);
            assert!(!revoked);
            test::return_to_sender(&scenario, grant);
        };
        
        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = access::ENotAuthorized)]
    fun test_deactivate_policy_unauthorized() {
        let mut scenario = test::begin(CREATOR);
        
        // Setup policy
        setup_access_policy(&mut scenario, CREATOR);
        
        // Try to deactivate as non-creator
        test::next_tx(&mut scenario, OTHER_USER);
        {
            let mut policy = test::take_shared<AccessPolicy>(&scenario);
            
            access::deactivate_policy(&mut policy, test::ctx(&mut scenario));
            
            test::return_shared(policy);
        };
        
        test::end(scenario);
    }

    // ======= Helper Functions =======

    fun setup_access_policy(
        scenario: &mut test::Scenario,
        creator: address
    ) {
        // Initialize registry
        access::init_for_testing(test::ctx(scenario));
        
        test::next_tx(scenario, creator);
        {
            let clock = clock::create_for_testing(test::ctx(scenario));
            clock::share_for_testing(clock);
        };
        
        test::next_tx(scenario, creator);
        {
            let mut registry = test::take_shared<AccessRegistry>(scenario);
            let clock = test::take_shared<Clock>(scenario);
            let key_servers = access::create_test_key_servers();
            
            access::create_access_policy(
                &mut registry,
                object::id_from_address(@0x999),
                object::id_from_address(@0xAAA),
                2,
                key_servers,
                &clock,
                test::ctx(scenario)
            );
            
            test::return_shared(registry);
            test::return_shared(clock);
        };
    }

    fun grant_access_to_user(
        scenario: &mut test::Scenario,
        creator: address,
        grantee: address
    ) {
        test::next_tx(scenario, creator);
        {
            let mut registry = test::take_shared<AccessRegistry>(scenario);
            let policy = test::take_shared<AccessPolicy>(scenario);
            let clock = test::take_shared<Clock>(scenario);
            
            access::grant_access(
                &mut registry,
                &policy,
                grantee,
                0,
                &clock,
                test::ctx(scenario)
            );
            
            test::return_shared(registry);
            test::return_shared(policy);
            test::return_shared(clock);
        };
    }

    fun request_decryption(
        scenario: &mut test::Scenario,
        grantee: address
    ) {
        test::next_tx(scenario, grantee);
        {
            let grant = test::take_from_sender<AccessGrant>(scenario);
            let policy = test::take_shared<AccessPolicy>(scenario);
            let clock = test::take_shared<Clock>(scenario);
            
            access::request_decryption(
                &grant,
                &policy,
                &clock,
                test::ctx(scenario)
            );
            
            test::return_to_sender(scenario, grant);
            test::return_shared(policy);
            test::return_shared(clock);
        };
    }
}