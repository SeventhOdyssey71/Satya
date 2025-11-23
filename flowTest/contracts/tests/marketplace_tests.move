#[test_only]
module marketplace::marketplace_tests {
    use marketplace::core::{Self, Marketplace, Asset, Purchase};
    use sui::test_scenario::{Self as test};
    use sui::coin::{Self};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock}; 
    use sui::test_utils::assert_eq;

    // Test addresses
    const ADMIN: address = @0x7;
    const SELLER: address = @0xA;
    const BUYER: address = @0xB;

    #[test]
    fun test_marketplace_initialization() {
        let mut scenario = test::begin(ADMIN);
        
        // Initialize marketplace
        core::init_for_testing(test::ctx(&mut scenario));
        
        test::next_tx(&mut scenario, ADMIN);
        {
            let marketplace = test::take_shared<Marketplace>(&scenario);
            let (volume, listings, _fee) = core::get_marketplace_stats(&marketplace);
            
            assert_eq(volume, 0);
            assert_eq(listings, 0);
            assert_eq(_fee, 250); // 2.5%
            assert!(!core::is_marketplace_paused(&marketplace));
            
            test::return_shared(marketplace);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_successful_asset_listing() {
        let mut scenario = test::begin(SELLER);
        
        // Initialize marketplace and clock
        core::init_for_testing(test::ctx(&mut scenario));
        
        test::next_tx(&mut scenario, SELLER);
        {
            let clock = clock::create_for_testing(test::ctx(&mut scenario));
            clock::share_for_testing(clock);
        };
        
        test::next_tx(&mut scenario, SELLER);
        {
            let mut marketplace = test::take_shared<Marketplace>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            
            let _asset_id = core::list_asset(
                &mut marketplace,
                b"test_walrus_blob_123", 
                object::id_from_address(@0x999),
                b"test_benchmark_hash",
                100, // verify_fee
                1000, // price
                &clock,
                test::ctx(&mut scenario)
            );
            
            // Verify marketplace stats updated
            let (volume, listings, _fee) = core::get_marketplace_stats(&marketplace);
            assert_eq(listings, 1);
            assert_eq(volume, 0); // No sales yet
            
            test::return_shared(marketplace);
            test::return_shared(clock);
        };
        
        // Verify asset was created and has correct properties
        test::next_tx(&mut scenario, SELLER);
        {
            let asset = test::take_shared<Asset>(&scenario);
            let (seller, blob_id, _policy_id, verify_fee, price, sales, active) = 
                core::get_asset_info(&asset);
            
            assert_eq(seller, SELLER);
            assert_eq(blob_id, b"test_walrus_blob_123");
            assert_eq(verify_fee, 100);
            assert_eq(price, 1000);
            assert_eq(sales, 0);
            assert!(active);
            
            test::return_shared(asset);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_verification_request() {
        let mut scenario = test::begin(SELLER);
        
        // Setup marketplace and asset
        setup_marketplace_with_asset(&mut scenario, SELLER, 100, 1000);
        
        // Request verification
        test::next_tx(&mut scenario, BUYER);
        {
            let asset = test::take_shared<Asset>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            let payment = coin::mint_for_testing<SUI>(100, test::ctx(&mut scenario));
            
            core::request_verification(
                &asset,
                payment,
                &clock,
                test::ctx(&mut scenario)
            );
            
            test::return_shared(asset);
            test::return_shared(clock);
        };
        
        test::end(scenario);
    }

    #[test] 
    fun test_successful_purchase() {
        let mut scenario = test::begin(SELLER);
        
        // Setup marketplace and asset  
        setup_marketplace_with_asset(&mut scenario, SELLER, 100, 1000);
        
        // Purchase asset
        test::next_tx(&mut scenario, BUYER);
        {
            let mut marketplace = test::take_shared<Marketplace>(&scenario);
            let mut asset = test::take_shared<Asset>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            let payment = coin::mint_for_testing<SUI>(1000, test::ctx(&mut scenario));
            
            let _purchase_id = core::purchase_asset(
                &mut marketplace,
                &mut asset,
                payment,
                &clock,
                test::ctx(&mut scenario)
            );
            
            // Verify marketplace stats updated
            let (volume, _listings, _fee) = core::get_marketplace_stats(&marketplace);
            assert_eq(volume, 1000);
            
            // Verify asset stats updated
            let (_, _, _, _, _, sales, _) = core::get_asset_info(&asset);
            assert_eq(sales, 1);
            
            test::return_shared(marketplace);
            test::return_shared(asset);
            test::return_shared(clock);
        };
        
        // Verify purchase record created
        test::next_tx(&mut scenario, BUYER);
        {
            let purchase = test::take_from_sender<Purchase>(&scenario);
            let (buyer, _asset_id, price_paid, _timestamp, granted) = 
                core::get_purchase_info(&purchase);
            
            assert_eq(buyer, BUYER);
            assert_eq(price_paid, 1000);
            assert!(!granted); // Not granted initially
            
            test::return_to_sender(&scenario, purchase);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_add_attestation() {
        let mut scenario = test::begin(SELLER);
        
        // Setup marketplace and asset
        setup_marketplace_with_asset(&mut scenario, SELLER, 100, 1000);
        
        // Add attestation
        test::next_tx(&mut scenario, ADMIN);
        {
            let mut asset = test::take_shared<Asset>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            let attestation_id = object::id_from_address(@0xAAA);
            
            core::add_attestation(
                &mut asset,
                attestation_id,
                &clock,
                test::ctx(&mut scenario)
            );
            
            let attestations = core::get_attestations(&asset);
            assert!(vector::length(&attestations) == 1);
            assert!(vector::borrow(&attestations, 0) == &attestation_id);
            
            test::return_shared(asset);
            test::return_shared(clock);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_confirm_decryption_access() {
        let mut scenario = test::begin(SELLER);
        
        // Setup and purchase
        setup_marketplace_with_asset(&mut scenario, SELLER, 100, 1000);
        purchase_asset(&mut scenario, BUYER, 1000);
        
        // Confirm decryption access
        test::next_tx(&mut scenario, BUYER);
        {
            let mut purchase = test::take_from_sender<Purchase>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            
            core::confirm_decryption_access(
                &mut purchase,
                &clock,
                test::ctx(&mut scenario)
            );
            
            let (_, _, _, _, granted) = core::get_purchase_info(&purchase);
            assert!(granted);
            
            test::return_to_sender(&scenario, purchase);
            test::return_shared(clock);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_deactivate_asset() {
        let mut scenario = test::begin(SELLER);
        
        // Setup marketplace and asset
        setup_marketplace_with_asset(&mut scenario, SELLER, 100, 1000);
        
        // Deactivate asset
        test::next_tx(&mut scenario, SELLER);
        {
            let mut asset = test::take_shared<Asset>(&scenario);
            
            core::deactivate_asset(&mut asset, test::ctx(&mut scenario));
            
            let (_, _, _, _, _, _, active) = core::get_asset_info(&asset);
            assert!(!active);
            
            test::return_shared(asset);
        };
        
        test::end(scenario);
    }

    // ======= Error Test Cases =======

    #[test]
    #[expected_failure(abort_code = core::EInvalidPrice)]
    fun test_list_asset_zero_price() {
        let mut scenario = test::begin(SELLER);
        
        // Initialize marketplace
        core::init_for_testing(test::ctx(&mut scenario));
        
        test::next_tx(&mut scenario, SELLER);
        {
            let clock = clock::create_for_testing(test::ctx(&mut scenario));
            clock::share_for_testing(clock);
        };
        
        test::next_tx(&mut scenario, SELLER);
        {
            let mut marketplace = test::take_shared<Marketplace>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            
            core::list_asset(
                &mut marketplace,
                b"test_blob",
                object::id_from_address(@0x999),
                b"test_hash",
                100,
                0, // Invalid zero price
                &clock,
                test::ctx(&mut scenario)
            );
            
            test::return_shared(marketplace);
            test::return_shared(clock);
        };
        
        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = core::EInvalidFee)]
    fun test_list_asset_zero_verify_fee() {
        let mut scenario = test::begin(SELLER);
        
        // Initialize marketplace
        core::init_for_testing(test::ctx(&mut scenario));
        
        test::next_tx(&mut scenario, SELLER);
        {
            let clock = clock::create_for_testing(test::ctx(&mut scenario));
            clock::share_for_testing(clock);
        };
        
        test::next_tx(&mut scenario, SELLER);
        {
            let mut marketplace = test::take_shared<Marketplace>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            
            core::list_asset(
                &mut marketplace,
                b"test_blob",
                object::id_from_address(@0x999),
                b"test_hash",
                0, // Invalid zero verify fee
                1000,
                &clock,
                test::ctx(&mut scenario)
            );
            
            test::return_shared(marketplace);
            test::return_shared(clock);
        };
        
        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = core::EInsufficientPayment)]
    fun test_purchase_insufficient_payment() {
        let mut scenario = test::begin(SELLER);
        
        // Setup marketplace and asset
        setup_marketplace_with_asset(&mut scenario, SELLER, 100, 1000);
        
        // Try to purchase with insufficient payment
        test::next_tx(&mut scenario, BUYER);
        {
            let mut marketplace = test::take_shared<Marketplace>(&scenario);
            let mut asset = test::take_shared<Asset>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            let payment = coin::mint_for_testing<SUI>(999, test::ctx(&mut scenario)); // 1 less than price
            
            core::purchase_asset(
                &mut marketplace,
                &mut asset,
                payment,
                &clock,
                test::ctx(&mut scenario)
            );
            
            test::return_shared(marketplace);
            test::return_shared(asset);
            test::return_shared(clock);
        };
        
        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = core::EInsufficientPayment)]
    fun test_verification_insufficient_payment() {
        let mut scenario = test::begin(SELLER);
        
        // Setup marketplace and asset
        setup_marketplace_with_asset(&mut scenario, SELLER, 100, 1000);
        
        // Try verification with insufficient payment
        test::next_tx(&mut scenario, BUYER);
        {
            let asset = test::take_shared<Asset>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            let payment = coin::mint_for_testing<SUI>(99, test::ctx(&mut scenario)); // 1 less than verify fee
            
            core::request_verification(
                &asset,
                payment,
                &clock,
                test::ctx(&mut scenario)
            );
            
            test::return_shared(asset);
            test::return_shared(clock);
        };
        
        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = core::ENotAuthorized)]
    fun test_deactivate_asset_unauthorized() {
        let mut scenario = test::begin(SELLER);
        
        // Setup marketplace and asset
        setup_marketplace_with_asset(&mut scenario, SELLER, 100, 1000);
        
        // Try to deactivate as non-owner
        test::next_tx(&mut scenario, BUYER);
        {
            let mut asset = test::take_shared<Asset>(&scenario);
            
            core::deactivate_asset(&mut asset, test::ctx(&mut scenario));
            
            test::return_shared(asset);
        };
        
        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = core::EAssetNotActive)]
    fun test_purchase_inactive_asset() {
        let mut scenario = test::begin(SELLER);
        
        // Setup marketplace and asset
        setup_marketplace_with_asset(&mut scenario, SELLER, 100, 1000);
        
        // Deactivate asset
        test::next_tx(&mut scenario, SELLER);
        {
            let mut asset = test::take_shared<Asset>(&scenario);
            core::deactivate_asset(&mut asset, test::ctx(&mut scenario));
            test::return_shared(asset);
        };
        
        // Try to purchase deactivated asset
        test::next_tx(&mut scenario, BUYER);
        {
            let mut marketplace = test::take_shared<Marketplace>(&scenario);
            let mut asset = test::take_shared<Asset>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            let payment = coin::mint_for_testing<SUI>(1000, test::ctx(&mut scenario));
            
            core::purchase_asset(
                &mut marketplace,
                &mut asset,
                payment,
                &clock,
                test::ctx(&mut scenario)
            );
            
            test::return_shared(marketplace);
            test::return_shared(asset);
            test::return_shared(clock);
        };
        
        test::end(scenario);
    }

    // ======= Helper Functions =======

    fun setup_marketplace_with_asset(
        scenario: &mut test::Scenario,
        seller: address,
        verify_fee: u64,
        price: u64
    ) {
        // Initialize marketplace
        core::init_for_testing(test::ctx(scenario));
        
        test::next_tx(scenario, seller);
        {
            let clock = clock::create_for_testing(test::ctx(scenario));
            clock::share_for_testing(clock);
        };
        
        test::next_tx(scenario, seller);
        {
            let mut marketplace = test::take_shared<Marketplace>(scenario);
            let clock = test::take_shared<Clock>(scenario);
            
            core::list_asset(
                &mut marketplace,
                b"test_walrus_blob_123",
                object::id_from_address(@0x999),
                b"test_benchmark_hash",
                verify_fee,
                price,
                &clock,
                test::ctx(scenario)
            );
            
            test::return_shared(marketplace);
            test::return_shared(clock);
        };
    }

    fun purchase_asset(
        scenario: &mut test::Scenario,
        buyer: address,
        price: u64
    ) {
        test::next_tx(scenario, buyer);
        {
            let mut marketplace = test::take_shared<Marketplace>(scenario);
            let mut asset = test::take_shared<Asset>(scenario);
            let clock = test::take_shared<Clock>(scenario);
            let payment = coin::mint_for_testing<SUI>(price, test::ctx(scenario));
            
            core::purchase_asset(
                &mut marketplace,
                &mut asset,
                payment,
                &clock,
                test::ctx(scenario)
            );
            
            test::return_shared(marketplace);
            test::return_shared(asset);
            test::return_shared(clock);
        };
    }
}