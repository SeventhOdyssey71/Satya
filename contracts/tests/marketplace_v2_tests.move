#[test_only]
#[allow(unused_variable, unused_const)]
module marketplace::marketplace_v2_tests {
    use marketplace::marketplace_v2::{Self as mp, Marketplace, AdminCap, CreatorCap, AIListing};
    use sui::test_scenario::{Self as test};
    use sui::coin::Self;
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    use sui::test_utils::assert_eq;
    use std::string;

    // Test addresses
    const ADMIN: address = @0xA;
    const CREATOR: address = @0xB;
    const BUYER: address = @0xC;

    #[test]
    fun test_marketplace_initialization() {
        let mut scenario = test::begin(ADMIN);
        
        // Initialize marketplace
        mp::init_for_testing(test::ctx(&mut scenario));
        
        test::next_tx(&mut scenario, ADMIN);
        {
            let marketplace = test::take_shared<Marketplace>(&scenario);
            let admin_cap = test::take_from_sender<AdminCap>(&scenario);
            
            let (total_listings, total_volume, fee_percentage, paused, treasury) = mp::get_marketplace_info(&marketplace);
            assert_eq(total_listings, 0);
            assert_eq(total_volume, 0);
            assert_eq(fee_percentage, 250); // 2.5%
            assert_eq(paused, false);
            assert_eq(treasury, ADMIN);
            
            test::return_shared(marketplace);
            test::return_to_sender(&scenario, admin_cap);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_creator_cap_issuance() {
        let mut scenario = test::begin(ADMIN);
        
        // Initialize marketplace
        mp::init_for_testing(test::ctx(&mut scenario));
        
        test::next_tx(&mut scenario, ADMIN);
        {
            let clock = clock::create_for_testing(test::ctx(&mut scenario));
            clock::share_for_testing(clock);
        };
        
        test::next_tx(&mut scenario, ADMIN);
        {
            let marketplace = test::take_shared<Marketplace>(&scenario);
            let admin_cap = test::take_from_sender<AdminCap>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            
            mp::issue_creator_cap(&marketplace, &admin_cap, CREATOR, &clock, test::ctx(&mut scenario));
            
            test::return_shared(marketplace);
            test::return_to_sender(&scenario, admin_cap);
            test::return_shared(clock);
        };
        
        test::next_tx(&mut scenario, CREATOR);
        {
            let creator_cap = test::take_from_sender<CreatorCap>(&scenario);
            test::return_to_sender(&scenario, creator_cap);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_create_listing() {
        let mut scenario = test::begin(ADMIN);
        
        // Setup marketplace and creator cap
        setup_marketplace_and_creator(&mut scenario);
        
        test::next_tx(&mut scenario, CREATOR);
        {
            let mut marketplace = test::take_shared<Marketplace>(&scenario);
            let creator_cap = test::take_from_sender<CreatorCap>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            
            let _listing_id = mp::create_listing(
                &mut marketplace,
                &creator_cap,
                string::utf8(b"GPT-4 Clone"),
                string::utf8(b"A powerful language model"),
                string::utf8(b"NLP"),
                string::utf8(b"walrus_blob_id_123"),
                b"encrypted_key_data",
                b"seal_namespace_123",
                1000000000, // 1 SUI
                &clock,
                test::ctx(&mut scenario)
            );
            
            // Check marketplace stats updated
            let (total_listings, _, _, _, _) = mp::get_marketplace_info(&marketplace);
            assert_eq(total_listings, 1);
            
            test::return_shared(marketplace);
            test::return_to_sender(&scenario, creator_cap);
            test::return_shared(clock);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_successful_purchase() {
        let mut scenario = test::begin(ADMIN);
        
        // Setup marketplace, creator, and listing
        setup_marketplace_and_listing(&mut scenario);
        
        test::next_tx(&mut scenario, BUYER);
        {
            let mut marketplace = test::take_shared<Marketplace>(&scenario);
            let mut listing = test::take_shared<AIListing>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            
            // Create payment
            let payment = coin::mint_for_testing<SUI>(1000000000, test::ctx(&mut scenario)); // 1 SUI
            
            // Purchase listing
            let purchase_key = mp::purchase_listing(
                &mut marketplace,
                &mut listing,
                payment,
                b"buyer_seal_key_id",
                &clock,
                test::ctx(&mut scenario)
            );
            
            // Verify purchase key
            let (_listing_id, buyer, price_paid, _, _decryption_key, access_granted) = mp::get_purchase_key_info(&purchase_key);
            assert_eq(buyer, BUYER);
            assert_eq(price_paid, 1000000000);
            assert_eq(access_granted, true);
            
            // Check listing stats
            let (_, _, _, _, _, _, _, downloads, _, _) = mp::get_listing_info(&listing);
            assert_eq(downloads, 1);
            
            // Check marketplace volume
            let (_, total_volume, _, _, _) = mp::get_marketplace_info(&marketplace);
            assert_eq(total_volume, 1000000000);
            
            test::return_shared(marketplace);
            test::return_shared(listing);
            test::return_shared(clock);
            transfer::public_transfer(purchase_key, BUYER);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_update_listing_price() {
        let mut scenario = test::begin(ADMIN);
        
        // Setup marketplace, creator, and listing
        setup_marketplace_and_listing(&mut scenario);
        
        test::next_tx(&mut scenario, CREATOR);
        {
            let mut listing = test::take_shared<AIListing>(&scenario);
            let creator_cap = test::take_from_sender<CreatorCap>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            
            // Update price
            mp::update_listing_price(&mut listing, &creator_cap, 2000000000, &clock, test::ctx(&mut scenario)); // 2 SUI
            
            // Verify price updated
            let (_, _, _, _, _, new_price, _, _, _, _) = mp::get_listing_info(&listing);
            assert_eq(new_price, 2000000000);
            
            test::return_shared(listing);
            test::return_to_sender(&scenario, creator_cap);
            test::return_shared(clock);
        };
        
        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = mp::EInsufficientPayment)]
    fun test_purchase_insufficient_payment() {
        let mut scenario = test::begin(ADMIN);
        
        // Setup marketplace, creator, and listing
        setup_marketplace_and_listing(&mut scenario);
        
        test::next_tx(&mut scenario, BUYER);
        {
            let mut marketplace = test::take_shared<Marketplace>(&scenario);
            let mut listing = test::take_shared<AIListing>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            
            // Try to pay less than required
            let payment = coin::mint_for_testing<SUI>(500000000, test::ctx(&mut scenario)); // 0.5 SUI (insufficient)
            
            let purchase_key = mp::purchase_listing(
                &mut marketplace,
                &mut listing,
                payment,
                b"buyer_seal_key_id",
                &clock,
                test::ctx(&mut scenario)
            );
            
            test::return_shared(marketplace);
            test::return_shared(listing);
            test::return_shared(clock);
            transfer::public_transfer(purchase_key, BUYER);
        };
        
        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = mp::ENotAuthorized)]
    fun test_unauthorized_price_update() {
        let mut scenario = test::begin(ADMIN);
        
        // Setup marketplace, creator, and listing
        setup_marketplace_and_listing(&mut scenario);
        
        // Issue creator cap to different user
        test::next_tx(&mut scenario, ADMIN);
        {
            let marketplace = test::take_shared<Marketplace>(&scenario);
            let admin_cap = test::take_from_sender<AdminCap>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            
            mp::issue_creator_cap(&marketplace, &admin_cap, BUYER, &clock, test::ctx(&mut scenario));
            
            test::return_shared(marketplace);
            test::return_to_sender(&scenario, admin_cap);
            test::return_shared(clock);
        };
        
        test::next_tx(&mut scenario, BUYER);
        {
            let mut listing = test::take_shared<AIListing>(&scenario);
            let buyer_creator_cap = test::take_from_sender<CreatorCap>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            
            // Try to update price with wrong creator cap
            mp::update_listing_price(&mut listing, &buyer_creator_cap, 2000000000, &clock, test::ctx(&mut scenario));
            
            test::return_shared(listing);
            test::return_to_sender(&scenario, buyer_creator_cap);
            test::return_shared(clock);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_marketplace_pause_functionality() {
        let mut scenario = test::begin(ADMIN);
        
        // Initialize marketplace
        mp::init_for_testing(test::ctx(&mut scenario));
        
        test::next_tx(&mut scenario, ADMIN);
        {
            let mut marketplace = test::take_shared<Marketplace>(&scenario);
            let admin_cap = test::take_from_sender<AdminCap>(&scenario);
            
            // Pause marketplace
            mp::toggle_marketplace_pause(&mut marketplace, &admin_cap);
            
            let (_, _, _, paused, _) = mp::get_marketplace_info(&marketplace);
            assert_eq(paused, true);
            
            // Unpause marketplace
            mp::toggle_marketplace_pause(&mut marketplace, &admin_cap);
            
            let (_, _, _, paused_again, _) = mp::get_marketplace_info(&marketplace);
            assert_eq(paused_again, false);
            
            test::return_shared(marketplace);
            test::return_to_sender(&scenario, admin_cap);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_creator_earnings_tracking() {
        let mut scenario = test::begin(ADMIN);
        
        // Setup and make purchase
        setup_marketplace_and_listing(&mut scenario);
        
        test::next_tx(&mut scenario, BUYER);
        {
            let mut marketplace = test::take_shared<Marketplace>(&scenario);
            let mut listing = test::take_shared<AIListing>(&scenario);
            let clock = test::take_shared<Clock>(&scenario);
            
            let payment = coin::mint_for_testing<SUI>(1000000000, test::ctx(&mut scenario)); // 1 SUI
            
            let purchase_key = mp::purchase_listing(
                &mut marketplace,
                &mut listing,
                payment,
                b"buyer_seal_key_id",
                &clock,
                test::ctx(&mut scenario)
            );
            
            // Check creator earnings (after platform fee)
            let creator_earnings = mp::get_creator_earnings(&marketplace, CREATOR);
            let expected_earnings = 1000000000 - (1000000000 * 250 / 10000); // 1 SUI - 2.5% fee
            assert_eq(creator_earnings, expected_earnings);
            
            test::return_shared(marketplace);
            test::return_shared(listing);
            test::return_shared(clock);
            transfer::public_transfer(purchase_key, BUYER);
        };
        
        test::end(scenario);
    }

    // ======= Helper Functions =======
    
    fun setup_marketplace_and_creator(scenario: &mut test::Scenario) {
        // Initialize marketplace
        mp::init_for_testing(test::ctx(scenario));
        
        test::next_tx(scenario, ADMIN);
        {
            let clock = clock::create_for_testing(test::ctx(scenario));
            clock::share_for_testing(clock);
        };
        
        test::next_tx(scenario, ADMIN);
        {
            let marketplace = test::take_shared<Marketplace>(scenario);
            let admin_cap = test::take_from_sender<AdminCap>(scenario);
            let clock = test::take_shared<Clock>(scenario);
            
            // Issue creator cap
            mp::issue_creator_cap(&marketplace, &admin_cap, CREATOR, &clock, test::ctx(scenario));
            
            test::return_shared(marketplace);
            test::return_to_sender(scenario, admin_cap);
            test::return_shared(clock);
        };
    }

    fun setup_marketplace_and_listing(scenario: &mut test::Scenario) {
        setup_marketplace_and_creator(scenario);
        
        test::next_tx(scenario, CREATOR);
        {
            let mut marketplace = test::take_shared<Marketplace>(scenario);
            let creator_cap = test::take_from_sender<CreatorCap>(scenario);
            let clock = test::take_shared<Clock>(scenario);
            
            // Create listing
            mp::create_listing(
                &mut marketplace,
                &creator_cap,
                string::utf8(b"Test AI Model"),
                string::utf8(b"Test Description"),
                string::utf8(b"ML"),
                string::utf8(b"test_walrus_blob"),
                b"test_encrypted_key",
                b"test_namespace",
                1000000000, // 1 SUI
                &clock,
                test::ctx(scenario)
            );
            
            test::return_shared(marketplace);
            test::return_to_sender(scenario, creator_cap);
            test::return_shared(clock);
        };
    }
}