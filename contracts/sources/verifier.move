module marketplace::verifier {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::clock::{Self, Clock};
    use std::vector;
    use std::string::{Self, String};
    use std::option::{Self, Option};

    // ======= Constants =======
    const ERROR_INVALID_ATTESTATION: u64 = 0;
    const ERROR_NOT_AUTHORIZED: u64 = 1;
    const ERROR_ALREADY_VERIFIED: u64 = 2;
    const ERROR_INVALID_PCR: u64 = 3;

    const ATTESTATION_VALIDITY_MS: u64 = 86400000; // 24 hours

    // ======= Structs =======
    
    public struct VerifierRegistry has key {
        id: UID,
        authorized_verifiers: vector<address>,
        total_verifications: u64
    }

    public struct Attestation has key, store {
        id: UID,
        asset_id: ID,
        verifier: address,
        benchmark_results: BenchmarkResults,
        pcr_values: vector<u8>,
        signature: vector<u8>,
        timestamp: u64,
        expires_at: u64
    }

    public struct BenchmarkResults has store, drop, copy {
        accuracy_score: u64,      // Score out of 10000 (e.g., 9500 = 95%)
        latency_ms: u64,          // Average latency in milliseconds
        throughput: u64,          // Requests per second
        memory_usage_mb: u64,     // Memory usage in MB
        model_size_bytes: u64,    // Model size in bytes
        dataset_used: String,     // Name of benchmark dataset
        additional_metrics: vector<u8> // JSON encoded additional metrics
    }

    public struct VerificationRequest has key, store {
        id: UID,
        asset_id: ID,
        requester: address,
        status: u8, // 0 = pending, 1 = in_progress, 2 = completed, 3 = failed
        attestation_id: Option<ID>,
        created_at: u64,
        updated_at: u64
    }

    // ======= Events =======
    
    public struct VerificationStarted has copy, drop {
        request_id: ID,
        asset_id: ID,
        verifier: address,
        timestamp: u64
    }

    public struct VerificationCompleted has copy, drop {
        request_id: ID,
        attestation_id: ID,
        asset_id: ID,
        accuracy_score: u64,
        timestamp: u64
    }

    public struct VerificationFailed has copy, drop {
        request_id: ID,
        asset_id: ID,
        reason: String,
        timestamp: u64
    }

    public struct VerifierAdded has copy, drop {
        verifier: address,
        timestamp: u64
    }

    public struct VerifierRemoved has copy, drop {
        verifier: address,
        timestamp: u64
    }

    // ======= Initialization =======
    
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
    
    fun init(ctx: &mut TxContext) {
        let registry = VerifierRegistry {
            id: object::new(ctx),
            authorized_verifiers: vector::empty(),
            total_verifications: 0
        };
        transfer::share_object(registry);
    }

    // ======= Public Functions =======
    
    public fun create_verification_request(
        asset_id: ID,
        clock: &Clock,
        ctx: &mut TxContext
    ): ID {
        let request = VerificationRequest {
            id: object::new(ctx),
            asset_id,
            requester: tx_context::sender(ctx),
            status: 0, // pending
            attestation_id: option::none(),
            created_at: clock::timestamp_ms(clock),
            updated_at: clock::timestamp_ms(clock)
        };

        let request_id = object::id(&request);
        transfer::share_object(request);
        request_id
    }

    public fun start_verification(
        registry: &VerifierRegistry,
        request: &mut VerificationRequest,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let verifier = tx_context::sender(ctx);
        assert!(
            is_authorized_verifier(registry, verifier),
            ERROR_NOT_AUTHORIZED
        );
        assert!(request.status == 0, ERROR_ALREADY_VERIFIED);

        request.status = 1; // in_progress
        request.updated_at = clock::timestamp_ms(clock);

        event::emit(VerificationStarted {
            request_id: object::id(request),
            asset_id: request.asset_id,
            verifier,
            timestamp: clock::timestamp_ms(clock)
        });
    }

    public fun submit_attestation(
        registry: &mut VerifierRegistry,
        request: &mut VerificationRequest,
        asset_id: ID,
        benchmark_results: BenchmarkResults,
        pcr_values: vector<u8>,
        signature: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ): ID {
        let verifier = tx_context::sender(ctx);
        assert!(
            is_authorized_verifier(registry, verifier),
            ERROR_NOT_AUTHORIZED
        );
        assert!(request.asset_id == asset_id, ERROR_INVALID_ATTESTATION);
        assert!(request.status == 1, ERROR_INVALID_ATTESTATION);

        // Validate PCR values (simplified for hackathon)
        assert!(vector::length(&pcr_values) > 0, ERROR_INVALID_PCR);

        let current_time = clock::timestamp_ms(clock);
        let attestation = Attestation {
            id: object::new(ctx),
            asset_id,
            verifier,
            benchmark_results,
            pcr_values,
            signature,
            timestamp: current_time,
            expires_at: current_time + ATTESTATION_VALIDITY_MS
        };

        let attestation_id = object::id(&attestation);
        
        // Update request
        request.status = 2; // completed
        request.attestation_id = option::some(attestation_id);
        request.updated_at = current_time;

        // Update registry stats
        registry.total_verifications = registry.total_verifications + 1;

        event::emit(VerificationCompleted {
            request_id: object::id(request),
            attestation_id,
            asset_id,
            accuracy_score: benchmark_results.accuracy_score,
            timestamp: current_time
        });

        transfer::share_object(attestation);
        attestation_id
    }

    public fun report_verification_failure(
        registry: &VerifierRegistry,
        request: &mut VerificationRequest,
        reason: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let verifier = tx_context::sender(ctx);
        assert!(
            is_authorized_verifier(registry, verifier),
            ERROR_NOT_AUTHORIZED
        );
        assert!(request.status == 1, ERROR_INVALID_ATTESTATION);

        request.status = 3; // failed
        request.updated_at = clock::timestamp_ms(clock);

        event::emit(VerificationFailed {
            request_id: object::id(request),
            asset_id: request.asset_id,
            reason,
            timestamp: clock::timestamp_ms(clock)
        });
    }

    // ======= Admin Functions =======
    
    public fun add_authorized_verifier(
        registry: &mut VerifierRegistry,
        verifier: address,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        // TODO: Add admin capability check
        if (!is_authorized_verifier(registry, verifier)) {
            vector::push_back(&mut registry.authorized_verifiers, verifier);
            
            event::emit(VerifierAdded {
                verifier,
                timestamp: clock::timestamp_ms(clock)
            });
        }
    }

    public fun remove_authorized_verifier(
        registry: &mut VerifierRegistry,
        verifier: address,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        // TODO: Add admin capability check
        let (found, index) = vector::index_of(&registry.authorized_verifiers, &verifier);
        if (found) {
            vector::remove(&mut registry.authorized_verifiers, index);
            
            event::emit(VerifierRemoved {
                verifier,
                timestamp: clock::timestamp_ms(clock)
            });
        }
    }

    // ======= Validation Functions =======
    
    public fun validate_attestation(
        attestation: &Attestation,
        clock: &Clock
    ): bool {
        let current_time = clock::timestamp_ms(clock);
        current_time <= attestation.expires_at
    }

    public fun verify_pcr_values(
        attestation: &Attestation,
        expected_pcr: &vector<u8>
    ): bool {
        &attestation.pcr_values == expected_pcr
    }

    // ======= Helper Functions =======
    
    fun is_authorized_verifier(
        registry: &VerifierRegistry,
        verifier: address
    ): bool {
        vector::contains(&registry.authorized_verifiers, &verifier)
    }

    // ======= Getter Functions =======
    
    public fun get_attestation_details(attestation: &Attestation): (
        ID,
        address,
        u64,
        u64,
        u64,
        u64
    ) {
        (
            attestation.asset_id,
            attestation.verifier,
            attestation.benchmark_results.accuracy_score,
            attestation.benchmark_results.latency_ms,
            attestation.timestamp,
            attestation.expires_at
        )
    }

    public fun get_benchmark_results(attestation: &Attestation): &BenchmarkResults {
        &attestation.benchmark_results
    }

    public fun get_verification_request_status(request: &VerificationRequest): u8 {
        request.status
    }

    public fun get_total_verifications(registry: &VerifierRegistry): u64 {
        registry.total_verifications
    }

    public fun is_attestation_valid(
        attestation: &Attestation,
        clock: &Clock
    ): bool {
        clock::timestamp_ms(clock) <= attestation.expires_at
    }

    // ======= Test Helper Functions =======
    
    #[test_only]
    public fun create_test_benchmark_results(): BenchmarkResults {
        BenchmarkResults {
            accuracy_score: 9500,
            latency_ms: 100,
            throughput: 1000,
            memory_usage_mb: 512,
            model_size_bytes: 1048576,
            dataset_used: string::utf8(b"MNIST"),
            additional_metrics: vector::empty()
        }
    }
}