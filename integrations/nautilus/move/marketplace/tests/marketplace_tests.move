#[test_only]
module marketplace::marketplace_tests;

use marketplace::marketplace::{Self, Marketplace, AdminCap, FileEntry, ProcessingPurchase};
use enclave::enclave::{Self, Enclave, EnclaveCap};
use sui::test_scenario::{Self, Scenario};
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::clock;
use sui::test_utils;
use std::string;

#[test]
fun test_marketplace_initialization() {
    let admin = @0xAA;
    let mut scenario = test_scenario::begin(admin);
    
    // Initialize marketplace
    {
        let ctx = test_scenario::ctx(&mut scenario);
        marketplace::init(marketplace::MARKETPLACE {}, ctx);
    };
    
    // Check if marketplace and admin cap were created
    test_scenario::next_tx(&mut scenario, admin);
    {
        assert!(test_scenario::has_most_recent_shared<Marketplace>(), 0);
        assert!(test_scenario::has_most_recent_for_sender<AdminCap>(&scenario), 1);
        assert!(test_scenario::has_most_recent_for_sender<EnclaveCap<marketplace::MARKETPLACE>>(&scenario), 2);
    };
    
    test_scenario::end(scenario);
}

#[test]
fun test_file_registration() {
    let admin = @0xAA;
    let user = @0xBB;
    let mut scenario = test_scenario::begin(admin);
    
    // Initialize marketplace
    {
        let ctx = test_scenario::ctx(&mut scenario);
        marketplace::init(marketplace::MARKETPLACE {}, ctx);
    };
    
    // Register a file
    test_scenario::next_tx(&mut scenario, user);
    {
        let mut marketplace = test_scenario::take_shared<Marketplace>(&scenario);
        let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        
        let file_id = marketplace::register_file(
            &mut marketplace,
            string::utf8(b"Test File"),
            string::utf8(b"Test Description"),
            b"file_hash_123",
            1024,
            100_000_000, // 0.1 SUI
            string::utf8(b"document"),
            &clock,
            test_scenario::ctx(&mut scenario),
        );
        
        clock::destroy_for_testing(clock);
        test_scenario::return_shared(marketplace);
        
        // Verify file was created
        assert!(object::id_to_bytes(&file_id).length() > 0, 3);
    };
    
    // Check if file entry was transferred to user
    test_scenario::next_tx(&mut scenario, user);
    {
        assert!(test_scenario::has_most_recent_for_sender<FileEntry>(&scenario), 4);
    };
    
    test_scenario::end(scenario);
}

#[test]
fun test_processing_purchase() {
    let admin = @0xAA;
    let file_owner = @0xBB;
    let buyer = @0xCC;
    let mut scenario = test_scenario::begin(admin);
    
    // Initialize marketplace
    {
        let ctx = test_scenario::ctx(&mut scenario);
        marketplace::init(marketplace::MARKETPLACE {}, ctx);
    };
    
    // Register a file
    test_scenario::next_tx(&mut scenario, file_owner);
    {
        let mut marketplace = test_scenario::take_shared<Marketplace>(&scenario);
        let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        
        marketplace::register_file(
            &mut marketplace,
            string::utf8(b"Test File"),
            string::utf8(b"Test Description"),
            b"file_hash_123",
            1024,
            100_000_000, // 0.1 SUI
            string::utf8(b"document"),
            &clock,
            test_scenario::ctx(&mut scenario),
        );
        
        clock::destroy_for_testing(clock);
        test_scenario::return_shared(marketplace);
    };
    
    // Purchase processing
    test_scenario::next_tx(&mut scenario, buyer);
    {
        let mut marketplace = test_scenario::take_shared<Marketplace>(&scenario);
        let file = test_scenario::take_from_sender<FileEntry>(&scenario);
        let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        
        // Create payment coin
        let payment = coin::mint_for_testing<SUI>(100_000_000, test_scenario::ctx(&mut scenario));
        
        let purchase_id = marketplace::purchase_processing(
            &mut marketplace,
            &file,
            string::utf8(b"analysis"),
            payment,
            &clock,
            test_scenario::ctx(&mut scenario),
        );
        
        clock::destroy_for_testing(clock);
        test_scenario::return_to_sender(&scenario, file);
        test_scenario::return_shared(marketplace);
        
        assert!(object::id_to_bytes(&purchase_id).length() > 0, 5);
    };
    
    // Check if purchase was created
    test_scenario::next_tx(&mut scenario, buyer);
    {
        assert!(test_scenario::has_most_recent_shared<ProcessingPurchase>(), 6);
    };
    
    test_scenario::end(scenario);
}