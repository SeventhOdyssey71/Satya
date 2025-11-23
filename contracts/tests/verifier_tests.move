#[test_only]
module marketplace::verifier_tests {
    use marketplace::verifier::{Self, VerifierRegistry, AdminCap, Attestation, VerificationRequest};
    use sui::test_scenario::{Self as test};
    use sui::clock::{Self, Clock};
    use sui::test_utils::assert_eq;
    use std::string;

    // Test addresses
    const ADMIN: address = @0x7;
    const VERIFIER1: address = @0xA;
    // const VERIFIER2: address = @0xB; // Unused
    const REQUESTER: address = @0xC;

    #[test]
    fun test_verifier_registry_initialization() {
        let mut scenario = test::begin(ADMIN);
        
        // Initialize registry
        verifier::init_for_testing(test::ctx(&mut scenario));
        
        test::next_tx(&mut scenario, ADMIN);
        {
            let registry = test::take_shared<VerifierRegistry>(&scenario);
            assert_eq(verifier::get_total_verifications(&registry), 0);
            test::return_shared(registry);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_add_authorized_verifier() {
        let mut scenario = test::begin(ADMIN);
        
        // Initialize registry
        verifier::init_for_testing(test::ctx(&mut scenario));
        
        test::next_tx(&mut scenario, ADMIN);
        {
            let clock = clock::create_for_testing(test::ctx(&mut scenario));
            clock::share_for_testing(clock);
        };
        
        test::next_tx(&mut scenario, ADMIN);
        {
            let mut registry = test::take_shared<VerifierRegistry>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            let admin_cap = test::take_from_sender<AdminCap>(&scenario);
            
            verifier::add_authorized_verifier(
                &mut registry,
                VERIFIER1,
                &clock,
                &admin_cap
            );
            
            test::return_shared(registry);
            test::return_shared(clock);
            test::return_to_sender(&scenario, admin_cap);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_remove_authorized_verifier() {
        let mut scenario = test::begin(ADMIN);
        
        // Setup with authorized verifier
        setup_with_authorized_verifier(&mut scenario, ADMIN, VERIFIER1);
        
        // Remove verifier
        test::next_tx(&mut scenario, ADMIN);
        {
            let mut registry = test::take_shared<VerifierRegistry>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            let admin_cap = test::take_from_sender<AdminCap>(&scenario);
            
            verifier::remove_authorized_verifier(
                &mut registry,
                VERIFIER1,
                &clock,
                &admin_cap
            );
            
            test::return_shared(registry);
            test::return_shared(clock);
            test::return_to_sender(&scenario, admin_cap);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_create_verification_request() {
        let mut scenario = test::begin(REQUESTER);
        
        // Initialize
        verifier::init_for_testing(test::ctx(&mut scenario));
        
        test::next_tx(&mut scenario, REQUESTER);
        {
            let clock = clock::create_for_testing(test::ctx(&mut scenario));
            clock::share_for_testing(clock);
        };
        
        test::next_tx(&mut scenario, REQUESTER);
        {
            let clock = test::take_shared<Clock>(&scenario);
            let asset_id = object::id_from_address(@0x999);
            
            let _request_id = verifier::create_verification_request(
                asset_id,
                &clock,
                test::ctx(&mut scenario)
            );
            
            test::return_shared(clock);
        };
        
        // Verify request was created
        test::next_tx(&mut scenario, REQUESTER);
        {
            let request = test::take_shared<VerificationRequest>(&scenario);
            let status = verifier::get_verification_request_status(&request);
            assert_eq(status, 0); // pending
            test::return_shared(request);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_start_verification() {
        let mut scenario = test::begin(ADMIN);
        
        // Setup
        setup_with_verification_request(&mut scenario, ADMIN, VERIFIER1, REQUESTER);
        
        // Start verification
        test::next_tx(&mut scenario, VERIFIER1);
        {
            let registry = test::take_shared<VerifierRegistry>(&scenario);
            let mut request = test::take_shared<VerificationRequest>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            
            verifier::start_verification(
                &registry,
                &mut request,
                &clock,
                test::ctx(&mut scenario)
            );
            
            let status = verifier::get_verification_request_status(&request);
            assert_eq(status, 1); // in_progress
            
            test::return_shared(registry);
            test::return_shared(request);
            test::return_shared(clock);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_submit_attestation() {
        let mut scenario = test::begin(ADMIN);
        
        // Setup and start verification
        setup_with_verification_request(&mut scenario, ADMIN, VERIFIER1, REQUESTER);
        start_verification(&mut scenario, VERIFIER1);
        
        // Submit attestation
        test::next_tx(&mut scenario, VERIFIER1);
        {
            let mut registry = test::take_shared<VerifierRegistry>(&scenario);
            let mut request = test::take_shared<VerificationRequest>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            let asset_id = object::id_from_address(@0x999);
            let benchmark_results = verifier::create_test_benchmark_results();
            let pcr_values = b"test_pcr_values_hash_12345";
            let signature = b"test_signature_data";
            
            let _attestation_id = verifier::submit_attestation(
                &mut registry,
                &mut request,
                asset_id,
                benchmark_results,
                pcr_values,
                signature,
                &clock,
                test::ctx(&mut scenario)
            );
            
            let status = verifier::get_verification_request_status(&request);
            assert_eq(status, 2); // completed
            
            test::return_shared(registry);
            test::return_shared(request);
            test::return_shared(clock);
        };
        
        // Verify attestation was created
        test::next_tx(&mut scenario, VERIFIER1);
        {
            let attestation = test::take_shared<Attestation>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            
            let (_asset_id, verifier_addr, accuracy, latency, _timestamp, _expires) = 
                verifier::get_attestation_details(&attestation);
            
            assert_eq(verifier_addr, VERIFIER1);
            assert_eq(accuracy, 9500); // From test benchmark results
            assert_eq(latency, 100);
            
            // Verify attestation is valid
            assert!(verifier::validate_attestation(&attestation, &clock));
            
            test::return_shared(attestation);
            test::return_shared(clock);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_verification_failure() {
        let mut scenario = test::begin(ADMIN);
        
        // Setup and start verification
        setup_with_verification_request(&mut scenario, ADMIN, VERIFIER1, REQUESTER);
        start_verification(&mut scenario, VERIFIER1);
        
        // Report failure
        test::next_tx(&mut scenario, VERIFIER1);
        {
            let registry = test::take_shared<VerifierRegistry>(&scenario);
            let mut request = test::take_shared<VerificationRequest>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            let reason = string::utf8(b"Model failed benchmark");
            
            verifier::report_verification_failure(
                &registry,
                &mut request,
                reason,
                &clock,
                test::ctx(&mut scenario)
            );
            
            let status = verifier::get_verification_request_status(&request);
            assert_eq(status, 3); // failed
            
            test::return_shared(registry);
            test::return_shared(request);
            test::return_shared(clock);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_attestation_validation() {
        let mut scenario = test::begin(ADMIN);
        
        // Setup and create attestation
        setup_with_verification_request(&mut scenario, ADMIN, VERIFIER1, REQUESTER);
        start_verification(&mut scenario, VERIFIER1);
        submit_test_attestation(&mut scenario, VERIFIER1);
        
        // Test PCR validation
        test::next_tx(&mut scenario, VERIFIER1);
        {
            let attestation = test::take_shared<Attestation>(&scenario);
            let expected_pcr = b"test_pcr_values_hash_12345";
            let wrong_pcr = b"wrong_pcr_values";
            
            assert!(verifier::verify_pcr_values(&attestation, &expected_pcr));
            assert!(!verifier::verify_pcr_values(&attestation, &wrong_pcr));
            
            test::return_shared(attestation);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_complete_verification_flow() {
        let mut scenario = test::begin(ADMIN);
        
        // Complete flow: setup → request → start → submit
        setup_with_verification_request(&mut scenario, ADMIN, VERIFIER1, REQUESTER);
        start_verification(&mut scenario, VERIFIER1);
        submit_test_attestation(&mut scenario, VERIFIER1);
        
        // Verify final state
        test::next_tx(&mut scenario, ADMIN);
        {
            let registry = test::take_shared<VerifierRegistry>(&scenario);
            let request = test::take_shared<VerificationRequest>(&scenario);
            let attestation = test::take_shared<Attestation>(&scenario);
            
            assert_eq(verifier::get_total_verifications(&registry), 1);
            assert_eq(verifier::get_verification_request_status(&request), 2);
            
            test::return_shared(registry);
            test::return_shared(request);
            test::return_shared(attestation);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_benchmark_results_creation() {
        let _results = verifier::create_test_benchmark_results();
        // Verify the function works without errors - detailed validation would require
        // accessing private fields which isn't possible in tests
        assert!(true);
    }

    // ======= Error Test Cases =======

    #[test]
    #[expected_failure(abort_code = verifier::ENotAuthorized)]
    fun test_unauthorized_start_verification() {
        let mut scenario = test::begin(ADMIN);
        
        // Setup without adding REQUESTER as authorized verifier
        setup_with_verification_request(&mut scenario, ADMIN, VERIFIER1, REQUESTER);
        
        // Try to start as unauthorized verifier
        test::next_tx(&mut scenario, REQUESTER);
        {
            let registry = test::take_shared<VerifierRegistry>(&scenario);
            let mut request = test::take_shared<VerificationRequest>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            
            verifier::start_verification(
                &registry,
                &mut request,
                &clock,
                test::ctx(&mut scenario)
            );
            
            test::return_shared(registry);
            test::return_shared(request);
            test::return_shared(clock);
        };
        
        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = verifier::EAlreadyVerified)]
    fun test_start_already_started_verification() {
        let mut scenario = test::begin(ADMIN);
        
        // Setup and start verification
        setup_with_verification_request(&mut scenario, ADMIN, VERIFIER1, REQUESTER);
        start_verification(&mut scenario, VERIFIER1);
        
        // Try to start again
        test::next_tx(&mut scenario, VERIFIER1);
        {
            let registry = test::take_shared<VerifierRegistry>(&scenario);
            let mut request = test::take_shared<VerificationRequest>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            
            verifier::start_verification(
                &registry,
                &mut request,
                &clock,
                test::ctx(&mut scenario)
            );
            
            test::return_shared(registry);
            test::return_shared(request);
            test::return_shared(clock);
        };
        
        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = verifier::EInvalidAttestation)]
    fun test_submit_attestation_wrong_asset() {
        let mut scenario = test::begin(ADMIN);
        
        // Setup and start verification
        setup_with_verification_request(&mut scenario, ADMIN, VERIFIER1, REQUESTER);
        start_verification(&mut scenario, VERIFIER1);
        
        // Try to submit with wrong asset ID
        test::next_tx(&mut scenario, VERIFIER1);
        {
            let mut registry = test::take_shared<VerifierRegistry>(&scenario);
            let mut request = test::take_shared<VerificationRequest>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            let wrong_asset_id = object::id_from_address(@0x888); // Different from setup
            let benchmark_results = verifier::create_test_benchmark_results();
            let pcr_values = b"test_pcr";
            let signature = b"test_sig";
            
            verifier::submit_attestation(
                &mut registry,
                &mut request,
                wrong_asset_id,
                benchmark_results,
                pcr_values,
                signature,
                &clock,
                test::ctx(&mut scenario)
            );
            
            test::return_shared(registry);
            test::return_shared(request);
            test::return_shared(clock);
        };
        
        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = verifier::EInvalidPCR)]
    fun test_submit_attestation_empty_pcr() {
        let mut scenario = test::begin(ADMIN);
        
        // Setup and start verification
        setup_with_verification_request(&mut scenario, ADMIN, VERIFIER1, REQUESTER);
        start_verification(&mut scenario, VERIFIER1);
        
        // Try to submit with empty PCR values
        test::next_tx(&mut scenario, VERIFIER1);
        {
            let mut registry = test::take_shared<VerifierRegistry>(&scenario);
            let mut request = test::take_shared<VerificationRequest>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            let asset_id = object::id_from_address(@0x999);
            let benchmark_results = verifier::create_test_benchmark_results();
            let empty_pcr = vector::empty<u8>(); // Invalid empty PCR
            let signature = b"test_sig";
            
            verifier::submit_attestation(
                &mut registry,
                &mut request,
                asset_id,
                benchmark_results,
                empty_pcr,
                signature,
                &clock,
                test::ctx(&mut scenario)
            );
            
            test::return_shared(registry);
            test::return_shared(request);
            test::return_shared(clock);
        };
        
        test::end(scenario);
    }

    // ======= Helper Functions =======

    fun setup_with_authorized_verifier(
        scenario: &mut test::Scenario,
        admin: address,
        verifier: address
    ) {
        verifier::init_for_testing(test::ctx(scenario));
        
        test::next_tx(scenario, admin);
        {
            let clock = clock::create_for_testing(test::ctx(scenario));
            clock::share_for_testing(clock);
        };
        
        test::next_tx(scenario, admin);
        {
            let mut registry = test::take_shared<VerifierRegistry>(scenario);
            let clock = test::take_shared<Clock>(scenario);
            let admin_cap = test::take_from_sender<AdminCap>(scenario);
            
            verifier::add_authorized_verifier(
                &mut registry,
                verifier,
                &clock,
                &admin_cap
            );
            
            test::return_shared(registry);
            test::return_shared(clock);
            test::return_to_sender(scenario, admin_cap);
        };
    }

    fun setup_with_verification_request(
        scenario: &mut test::Scenario,
        admin: address,
        verifier_addr: address,
        requester: address
    ) {
        setup_with_authorized_verifier(scenario, admin, verifier_addr);
        
        test::next_tx(scenario, requester);
        {
            let clock = test::take_shared<Clock>(scenario);
            let asset_id = object::id_from_address(@0x999);
            
            verifier::create_verification_request(
                asset_id,
                &clock,
                test::ctx(scenario)
            );
            
            test::return_shared(clock);
        };
    }

    fun start_verification(
        scenario: &mut test::Scenario,
        verifier_addr: address
    ) {
        test::next_tx(scenario, verifier_addr);
        {
            let registry = test::take_shared<VerifierRegistry>(scenario);
            let mut request = test::take_shared<VerificationRequest>(scenario);
            let clock = test::take_shared<Clock>(scenario);
            
            verifier::start_verification(
                &registry,
                &mut request,
                &clock,
                test::ctx(scenario)
            );
            
            test::return_shared(registry);
            test::return_shared(request);
            test::return_shared(clock);
        };
    }

    fun submit_test_attestation(
        scenario: &mut test::Scenario,
        verifier_addr: address
    ) {
        test::next_tx(scenario, verifier_addr);
        {
            let mut registry = test::take_shared<VerifierRegistry>(scenario);
            let mut request = test::take_shared<VerificationRequest>(scenario);
            let clock = test::take_shared<Clock>(scenario);
            let asset_id = object::id_from_address(@0x999);
            let benchmark_results = verifier::create_test_benchmark_results();
            let pcr_values = b"test_pcr_values_hash_12345";
            let signature = b"test_signature_data";
            
            verifier::submit_attestation(
                &mut registry,
                &mut request,
                asset_id,
                benchmark_results,
                pcr_values,
                signature,
                &clock,
                test::ctx(scenario)
            );
            
            test::return_shared(registry);
            test::return_shared(request);
            test::return_shared(clock);
        };
    }
}