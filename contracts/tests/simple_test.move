#[test_only]
module marketplace::simple_test {
    use marketplace::core;
    use marketplace::verifier;
    use marketplace::access;
    use sui::test_scenario::{Self as test};
    use sui::coin;
    use sui::sui::SUI;

    const SELLER: address = @0xA;
    const BUYER: address = @0xB;
    const ADMIN: address = @0xC;

    #[test]
    fun test_basic_coin_operations() {
        let mut scenario = test::begin(SELLER);
        
        // Test basic coin operations
        {
            let payment = coin::mint_for_testing<SUI>(1000, test::ctx(&mut scenario));
            assert!(coin::value(&payment) == 1000, 0);
            coin::burn_for_testing(payment);
        };
        
        test::end(scenario);
    }
    
    #[test]
    fun test_address_constants() {
        // Test that our address constants are different
        assert!(SELLER != BUYER, 0);
        assert!(BUYER != ADMIN, 1);
        assert!(SELLER != ADMIN, 2);
    }
}