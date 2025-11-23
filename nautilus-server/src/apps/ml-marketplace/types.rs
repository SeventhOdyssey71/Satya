// Copyright (c) Satya Data Marketplace
// Type definitions for ML marketplace TEE application
// SPDX-License-Identifier: Apache-2.0

use serde::{Deserialize, Serialize};

/// Configuration for the ML marketplace TEE application
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MLMarketplaceConfig {
    pub max_model_size_mb: u64,
    pub max_dataset_size_mb: u64,
    pub supported_model_formats: Vec<String>,
    pub supported_dataset_formats: Vec<String>,
    pub default_timeout_seconds: u64,
    pub quality_threshold: u64, // Minimum quality score to pass
}

impl Default for MLMarketplaceConfig {
    fn default() -> Self {
        Self {
            max_model_size_mb: 500, // 500MB max model size
            max_dataset_size_mb: 2048, // 2GB max dataset size
            supported_model_formats: vec![
                "pytorch".to_string(),
                "tensorflow".to_string(),
                "onnx".to_string(),
                "scikit-learn".to_string(),
            ],
            supported_dataset_formats: vec![
                "csv".to_string(),
                "json".to_string(),
                "parquet".to_string(),
                "npy".to_string(),
            ],
            default_timeout_seconds: 300, // 5 minutes
            quality_threshold: 60, // Minimum 60% quality score
        }
    }
}

/// Error types specific to ML marketplace operations
#[derive(Debug, thiserror::Error)]
pub enum MLMarketplaceError {
    #[error("Model validation failed: {0}")]
    ModelValidationError(String),
    
    #[error("Dataset validation failed: {0}")]
    DatasetValidationError(String),
    
    #[error("Inference execution failed: {0}")]
    InferenceError(String),
    
    #[error("Model size exceeds limit: {actual_mb}MB > {limit_mb}MB")]
    ModelSizeExceeded { actual_mb: u64, limit_mb: u64 },
    
    #[error("Dataset size exceeds limit: {actual_mb}MB > {limit_mb}MB")]
    DatasetSizeExceeded { actual_mb: u64, limit_mb: u64 },
    
    #[error("Unsupported model format: {format}")]
    UnsupportedModelFormat { format: String },
    
    #[error("Unsupported dataset format: {format}")]
    UnsupportedDatasetFormat { format: String },
    
    #[error("Quality threshold not met: {score} < {threshold}")]
    QualityThresholdNotMet { score: u64, threshold: u64 },
    
    #[error("Processing timeout after {seconds} seconds")]
    ProcessingTimeout { seconds: u64 },
    
    #[error("Walrus storage error: {0}")]
    WalrusError(String),
    
    #[error("Cryptographic error: {0}")]
    CryptoError(String),
}

/// Model metadata extracted from the model file
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModelMetadata {
    pub model_type: String,
    pub framework: String,
    pub version: String,
    pub input_schema: Vec<InputField>,
    pub output_schema: Vec<OutputField>,
    pub parameters_count: u64,
    pub model_size_bytes: u64,
    pub training_metadata: Option<TrainingMetadata>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InputField {
    pub name: String,
    pub data_type: String,
    pub shape: Vec<u64>,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OutputField {
    pub name: String,
    pub data_type: String,
    pub shape: Vec<u64>,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TrainingMetadata {
    pub training_accuracy: Option<f64>,
    pub validation_accuracy: Option<f64>,
    pub loss_function: Option<String>,
    pub optimizer: Option<String>,
    pub epochs_trained: Option<u64>,
    pub training_time_hours: Option<f64>,
}

/// Dataset metadata extracted from the dataset file
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DatasetMetadata {
    pub format: String,
    pub size_bytes: u64,
    pub row_count: u64,
    pub column_count: u64,
    pub schema: Vec<DatasetField>,
    pub statistics: Option<DatasetStatistics>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DatasetField {
    pub name: String,
    pub data_type: String,
    pub nullable: bool,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DatasetStatistics {
    pub completeness_ratio: f64,  // 0.0 - 1.0
    pub duplicates_ratio: f64,    // 0.0 - 1.0
    pub null_values_ratio: f64,   // 0.0 - 1.0
    pub outliers_ratio: f64,      // 0.0 - 1.0
    pub class_balance: Option<ClassBalance>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClassBalance {
    pub is_balanced: bool,
    pub class_distribution: std::collections::HashMap<String, u64>,
    pub imbalance_ratio: f64, // Most frequent / least frequent
}

/// Comprehensive quality assessment report
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct QualityAssessmentReport {
    pub overall_score: u64,         // 0-100 overall quality
    pub model_quality: ModelQuality,
    pub dataset_quality: DatasetQuality,
    pub compatibility: CompatibilityAssessment,
    pub performance: PerformanceAssessment,
    pub security: SecurityAssessment,
    pub reproducibility: ReproducibilityAssessment,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModelQuality {
    pub architecture_score: u64,    // 0-100
    pub parameter_efficiency: u64,  // 0-100
    pub generalization_ability: u64, // 0-100
    pub robustness_score: u64,      // 0-100
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DatasetQuality {
    pub completeness_score: u64,    // 0-100
    pub consistency_score: u64,     // 0-100
    pub accuracy_score: u64,        // 0-100
    pub relevance_score: u64,       // 0-100
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CompatibilityAssessment {
    pub model_dataset_compatibility: u64, // 0-100
    pub schema_alignment_score: u64,       // 0-100
    pub type_compatibility_score: u64,     // 0-100
    pub dimensionality_match: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PerformanceAssessment {
    pub inference_latency_ms: u64,
    pub memory_efficiency_score: u64, // 0-100
    pub computational_complexity: ComputationalComplexity,
    pub scalability_score: u64,       // 0-100
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ComputationalComplexity {
    Low,     // O(n) or better
    Medium,  // O(n log n) or O(n^2)
    High,    // O(n^3) or worse
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SecurityAssessment {
    pub privacy_protection_score: u64, // 0-100
    pub data_sanitization_score: u64,  // 0-100
    pub model_extraction_resistance: u64, // 0-100
    pub adversarial_robustness: u64,   // 0-100
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReproducibilityAssessment {
    pub determinism_score: u64,        // 0-100
    pub environment_independence: u64,  // 0-100
    pub version_compatibility: u64,    // 0-100
    pub documentation_completeness: u64, // 0-100
}

/// Attestation-specific data that will be signed by the TEE
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TEEAttestation {
    pub enclave_measurement: String,    // PCR values
    pub timestamp: u64,                 // Unix timestamp in milliseconds
    pub model_hash: String,            // SHA-256 of model data
    pub dataset_hash: String,          // SHA-256 of dataset data
    pub assessment_hash: String,       // SHA-256 of assessment parameters
    pub quality_report: QualityAssessmentReport,
    pub processing_metadata: ProcessingMetadata,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProcessingMetadata {
    pub processing_time_ms: u64,
    pub memory_peak_usage_mb: u64,
    pub cpu_utilization_percent: f64,
    pub enclave_version: String,
    pub algorithm_versions: std::collections::HashMap<String, String>,
}

/// Request types for different assessment operations
#[derive(Debug, Serialize, Deserialize)]
pub enum AssessmentOperation {
    /// Basic validation - check format, size, basic integrity
    Validate {
        model_blob_id: String,
        dataset_blob_id: String,
    },
    
    /// Quick assessment - basic metrics without full inference
    QuickAssess {
        model_blob_id: String,
        dataset_blob_id: String,
        metrics: Vec<String>,
    },
    
    /// Full assessment - comprehensive quality analysis
    FullAssess {
        model_blob_id: String,
        dataset_blob_id: String,
        assessment_config: AssessmentConfig,
    },
    
    /// Benchmark - compare multiple models on same dataset
    Benchmark {
        model_blob_ids: Vec<String>,
        dataset_blob_id: String,
        benchmark_config: BenchmarkConfig,
    },
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AssessmentConfig {
    pub timeout_seconds: Option<u64>,
    pub quality_metrics: Vec<String>,
    pub performance_metrics: Vec<String>,
    pub security_checks: Vec<String>,
    pub bias_analysis: bool,
    pub reproducibility_tests: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BenchmarkConfig {
    pub metrics: Vec<String>,
    pub iterations: u32,
    pub cross_validation_folds: Option<u32>,
    pub timeout_per_model_seconds: u64,
}

/// Response types for the marketplace API
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AssessmentResponse {
    pub request_id: String,
    pub status: AssessmentStatus,
    pub attestation: Option<TEEAttestation>,
    pub error_message: Option<String>,
    pub estimated_completion_time: Option<u64>, // Unix timestamp
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum AssessmentStatus {
    Pending,
    Processing,
    Completed,
    Failed,
    Timeout,
}

/// Marketplace-specific extensions to the base Nautilus types
pub mod marketplace_extensions {
    use super::*;
    
    /// Extended intent message for marketplace operations
    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct MarketplaceIntent {
        pub operation: String,
        pub seller_id: String,
        pub marketplace_transaction_id: String,
        pub quality_requirements: QualityRequirements,
    }
    
    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct QualityRequirements {
        pub minimum_quality_score: u64,
        pub required_metrics: Vec<String>,
        pub bias_tolerance: f64,
        pub performance_requirements: PerformanceRequirements,
    }
    
    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct PerformanceRequirements {
        pub max_inference_time_ms: u64,
        pub max_memory_usage_mb: u64,
        pub min_throughput_samples_per_second: f64,
    }
}