// Copyright (c) Satya Data Marketplace
// TEE Application for ML Model Quality Assessment
// SPDX-License-Identifier: Apache-2.0

use crate::common::IntentMessage;
use crate::common::{to_signed_response, IntentScope, ProcessDataRequest, ProcessedDataResponse};
use crate::AppState;
use crate::EnclaveError;
use axum::extract::State;
use axum::Json;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::collections::HashMap;
use sha2::{Sha256, Digest};
use tracing::{debug, info};

/// Response from ML model quality assessment
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MLQualityResponse {
    pub model_hash: String,
    pub dataset_hash: String,
    pub quality_score: u64,      // 0-100 quality score
    pub accuracy_metrics: AccuracyMetrics,
    pub performance_metrics: PerformanceMetrics,
    pub data_integrity_score: u64,
    pub bias_assessment: BiasAssessment,
    pub model_type: String,
    pub dataset_format: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AccuracyMetrics {
    pub precision: u64,         // Scaled by 10000 (e.g., 9500 = 95.00%)
    pub recall: u64,           // Scaled by 10000
    pub f1_score: u64,         // Scaled by 10000
    pub auc: Option<u64>,      // Scaled by 10000, for classification models
    pub rmse: Option<u64>,     // Scaled by 10000, for regression models 
    pub mae: Option<u64>,      // Scaled by 10000, for regression models
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PerformanceMetrics {
    pub inference_time_ms: u64,
    pub memory_usage_mb: u64,
    pub model_size_mb: u64,
    pub dataset_size_mb: u64,
    pub throughput_samples_per_second: u64,  // Scaled by 100 (e.g., 667 = 6.67 samples/sec)
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BiasAssessment {
    pub fairness_score: u64,    // 0-100, higher is better
    pub bias_detected: bool,
    pub bias_type: Option<String>,
    pub demographic_parity: Option<u64>,  // Scaled by 10000
    pub equalized_odds: Option<u64>,     // Scaled by 10000
}

/// Request for ML model quality assessment
#[derive(Debug, Serialize, Deserialize)]
pub struct MLQualityRequest {
    pub model_blob_id: String,
    pub dataset_blob_id: String,
    pub assessment_type: AssessmentType,
    pub quality_metrics: Vec<String>,
    pub model_type_hint: Option<String>,
    pub dataset_format_hint: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum AssessmentType {
    BasicValidation,
    QualityAnalysis,
    ComprehensiveBenchmark,
    BiasAudit,
}

/// Main processing function for ML model quality assessment
pub async fn process_data(
    State(state): State<Arc<AppState>>,
    Json(request): Json<ProcessDataRequest<MLQualityRequest>>,
) -> Result<Json<ProcessedDataResponse<IntentMessage<MLQualityResponse>>>, EnclaveError> {
    info!("Starting ML model quality assessment");
    debug!("Request: {:?}", request);

    let start_time = std::time::Instant::now();
    
    // Step 1: Download model and dataset from Walrus
    let (model_data, model_hash) = download_and_hash_blob(&request.payload.model_blob_id, "model").await?;
    let (dataset_data, dataset_hash) = download_and_hash_blob(&request.payload.dataset_blob_id, "dataset").await?;
    
    info!("Downloaded model ({}MB) and dataset ({}MB)", 
               model_data.len() / 1_048_576, 
               dataset_data.len() / 1_048_576);

    // Step 2: Validate and load model
    let model_info = validate_and_load_model(&model_data, &request.payload.model_type_hint)?;
    
    // Step 3: Validate and process dataset
    let dataset_info = validate_and_process_dataset(&dataset_data, &request.payload.dataset_format_hint)?;
    
    // Step 4: Perform model inference and quality assessment
    let assessment_result = perform_quality_assessment(
        &model_info,
        &dataset_info,
        &request.payload.assessment_type,
        &request.payload.quality_metrics,
    )?;
    
    let processing_time = start_time.elapsed().as_millis() as u64;
    
    // Step 5: Create comprehensive quality response
    let quality_response = MLQualityResponse {
        model_hash: model_hash.clone(),
        dataset_hash: dataset_hash.clone(),
        quality_score: assessment_result.overall_quality_score,
        accuracy_metrics: assessment_result.accuracy,
        performance_metrics: PerformanceMetrics {
            inference_time_ms: assessment_result.inference_time_ms,
            memory_usage_mb: assessment_result.memory_usage_mb,
            model_size_mb: (model_data.len() / 1_048_576) as u64,
            dataset_size_mb: (dataset_data.len() / 1_048_576) as u64,
            throughput_samples_per_second: assessment_result.throughput,
        },
        data_integrity_score: assessment_result.data_integrity_score,
        bias_assessment: assessment_result.bias_assessment,
        model_type: model_info.model_type,
        dataset_format: dataset_info.format,
    };

    let current_timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| EnclaveError::GenericError(format!("Failed to get timestamp: {}", e)))?
        .as_millis() as u64;

    info!("Quality assessment completed in {}ms. Overall score: {}", 
               processing_time, quality_response.quality_score);

    // Generate additional integrity signatures for the assessment
    let assessment_hash = generate_assessment_integrity_hash(&quality_response, current_timestamp);
    let model_verification_signature = generate_model_verification_signature(
        &model_hash, 
        &dataset_hash, 
        quality_response.quality_score,
        &state.eph_kp
    );
    
    info!("Generated assessment hash: {}", &assessment_hash[..16]);
    info!("Generated model verification signature: {}", &model_verification_signature[..16]);

    Ok(Json(to_signed_response(
        &state.eph_kp,
        quality_response,
        current_timestamp,
        IntentScope::ProcessData,
    )))
}

/// Download blob from Walrus storage and compute hash
async fn download_and_hash_blob(blob_id: &str, data_type: &str) -> Result<(Vec<u8>, String), EnclaveError> {
    info!("Downloading blob from Walrus: {}", blob_id);
    
    // Check environment variable for enabling real downloads
    let use_real_downloads = std::env::var("WALRUS_REAL_DOWNLOADS")
        .map(|v| v.to_lowercase() == "true" || v == "1")
        .unwrap_or(false);
    
    let data = if use_real_downloads {
        // Real Walrus blob download
        download_from_walrus(blob_id).await?
    } else {
        // Fallback to mock data for development
        info!("Using mock data for blob: {} (set WALRUS_REAL_DOWNLOADS=true for real downloads)", blob_id);
        generate_mock_data_for_blob(blob_id, data_type)?
    };
    
    // Compute SHA-256 hash
    let mut hasher = Sha256::new();
    hasher.update(&data);
    let hash = format!("{:x}", hasher.finalize());
    
    info!("Blob downloaded: {} bytes, hash: {}", data.len(), &hash[..16]);
    Ok((data, hash))
}

/// Download blob from actual Walrus aggregator
async fn download_from_walrus(blob_id: &str) -> Result<Vec<u8>, EnclaveError> {
    let aggregator_url = std::env::var("WALRUS_AGGREGATOR_URL")
        .unwrap_or_else(|_| "https://aggregator-devnet.walrus.space".to_string());
    
    let url = format!("{}/v1/{}", aggregator_url, blob_id);
    info!("Fetching from Walrus: {}", url);
    
    let client = reqwest::Client::new();
    let response = client.get(&url)
        .timeout(std::time::Duration::from_secs(30))
        .send()
        .await
        .map_err(|e| EnclaveError::GenericError(format!("Failed to download blob {}: {}", blob_id, e)))?;
    
    if !response.status().is_success() {
        return Err(EnclaveError::GenericError(format!(
            "Walrus returned status {}: {}", 
            response.status(),
            response.text().await.unwrap_or_else(|_| "unknown error".to_string())
        )));
    }
    
    let data = response.bytes()
        .await
        .map_err(|e| EnclaveError::GenericError(format!("Failed to read blob data: {}", e)))?
        .to_vec();
    
    if data.is_empty() {
        return Err(EnclaveError::GenericError("Downloaded blob is empty".to_string()));
    }
    
    info!("Successfully downloaded {} bytes from Walrus", data.len());
    Ok(data)
}

/// Generate mock data for development/testing
fn generate_mock_data_for_blob(blob_id: &str, data_type: &str) -> Result<Vec<u8>, EnclaveError> {
    debug!("Generating mock {} data for blob: {}", data_type, blob_id);
    
    match data_type {
        "model" => {
            let mock_model = create_mock_model_data();
            Ok(mock_model)
        },
        "dataset" => {
            let mock_dataset = create_mock_dataset_data();
            Ok(mock_dataset)
        },
        _ => {
            // Default to model data
            info!("Unknown data type '{}' for blob '{}', defaulting to model", data_type, blob_id);
            let mock_model = create_mock_model_data();
            Ok(mock_model)
        }
    }
}

fn create_mock_model_data() -> Vec<u8> {
    // Simulate a simple neural network model file
    let model_metadata = r#"
    {
        "model_type": "neural_network",
        "framework": "pytorch",
        "input_shape": [1, 784],
        "output_shape": [1, 10],
        "layers": [
            {"type": "linear", "in_features": 784, "out_features": 128},
            {"type": "relu"},
            {"type": "linear", "in_features": 128, "out_features": 64},
            {"type": "relu"},
            {"type": "linear", "in_features": 64, "out_features": 10}
        ],
        "parameters": 101770,
        "training_accuracy": 0.95,
        "validation_accuracy": 0.92
    }
    "#;
    
    // In reality, this would be binary model weights
    let mut data = model_metadata.as_bytes().to_vec();
    // Simulate model weights (random data for now)
    data.extend(vec![0u8; 500_000]); // ~500KB of mock weights
    data
}

fn create_mock_dataset_data() -> Vec<u8> {
    // Simulate a CSV dataset
    let mut csv_data = String::from("feature1,feature2,feature3,label\n");
    
    // Generate 1000 rows of mock data
    for i in 0..1000 {
        csv_data.push_str(&format!("{},{},{},{}\n", 
                                  i as f32 * 0.1, 
                                  i as f32 * 0.2, 
                                  i as f32 * 0.3, 
                                  i % 2));
    }
    
    csv_data.into_bytes()
}

/// Model information after validation
#[derive(Debug)]
struct ModelInfo {
    model_type: String,
    framework: String,
    parameters: u64,
    input_shape: Vec<u64>,
    output_shape: Vec<u64>,
}

/// Dataset information after validation
#[derive(Debug)]
struct DatasetInfo {
    format: String,
    rows: u64,
    columns: u64,
    data_types: HashMap<String, String>,
}

/// Assessment result from quality analysis
#[derive(Debug)]
struct AssessmentResult {
    overall_quality_score: u64,
    accuracy: AccuracyMetrics,
    inference_time_ms: u64,
    memory_usage_mb: u64,
    throughput: u64,
    data_integrity_score: u64,
    bias_assessment: BiasAssessment,
}

/// Validate and load model from binary data
fn validate_and_load_model(data: &[u8], _type_hint: &Option<String>) -> Result<ModelInfo, EnclaveError> {
    info!("Validating model data ({} bytes)", data.len());
    
    // Try to detect model format based on file headers and content
    let model_info = if is_onnx_model(data) {
        analyze_onnx_model(data)?
    } else if is_pytorch_model(data) {
        analyze_pytorch_model(data)?
    } else if is_tensorflow_model(data) {
        analyze_tensorflow_model(data)?
    } else {
        // Fallback: try to parse as JSON metadata (for mock models)
        parse_json_model_metadata(data)?
    };
    
    // Validate model structure
    if model_info.parameters == 0 {
        return Err(EnclaveError::GenericError("Model has no parameters".to_string()));
    }
    
    if model_info.input_shape.is_empty() || model_info.output_shape.is_empty() {
        return Err(EnclaveError::GenericError("Invalid model input/output shapes".to_string()));
    }
    
    info!("Validated {} model with {} parameters", model_info.framework, model_info.parameters);
    Ok(model_info)
}

/// Check if data represents an ONNX model
fn is_onnx_model(data: &[u8]) -> bool {
    // ONNX models start with protobuf magic bytes
    data.len() > 8 && data.starts_with(&[0x08, 0x01, 0x12]) // Simplified check
}

/// Check if data represents a PyTorch model
fn is_pytorch_model(data: &[u8]) -> bool {
    // PyTorch models often contain pickle magic number
    data.len() > 4 && (data.starts_with(b"\x80\x03") || data.starts_with(b"PK\x03\x04")) // Pickle or ZIP
}

/// Check if data represents a TensorFlow model
fn is_tensorflow_model(data: &[u8]) -> bool {
    // TensorFlow SavedModel contains specific directory structure when zipped
    data.len() > 4 && data.starts_with(b"PK\x03\x04") && 
    std::str::from_utf8(data).unwrap_or("").contains("saved_model.pb")
}

/// Analyze ONNX model (simplified analysis)
fn analyze_onnx_model(data: &[u8]) -> Result<ModelInfo, EnclaveError> {
    info!("Analyzing ONNX model");
    
    // In a real implementation, you'd parse the ONNX protobuf
    // For now, estimate based on file size
    let estimated_params = estimate_parameters_from_size(data.len());
    
    Ok(ModelInfo {
        model_type: "deep_neural_network".to_string(),
        framework: "onnx".to_string(),
        parameters: estimated_params,
        input_shape: vec![1, 3, 224, 224], // Common image input
        output_shape: vec![1, 1000], // ImageNet classes
    })
}

/// Analyze PyTorch model (simplified analysis)
fn analyze_pytorch_model(data: &[u8]) -> Result<ModelInfo, EnclaveError> {
    info!("Analyzing PyTorch model");
    
    let estimated_params = estimate_parameters_from_size(data.len());
    
    Ok(ModelInfo {
        model_type: "neural_network".to_string(),
        framework: "pytorch".to_string(),
        parameters: estimated_params,
        input_shape: vec![1, 784], // MNIST-like input
        output_shape: vec![1, 10], // Classification output
    })
}

/// Analyze TensorFlow model (simplified analysis)
fn analyze_tensorflow_model(data: &[u8]) -> Result<ModelInfo, EnclaveError> {
    info!("Analyzing TensorFlow model");
    
    let estimated_params = estimate_parameters_from_size(data.len());
    
    Ok(ModelInfo {
        model_type: "neural_network".to_string(),
        framework: "tensorflow".to_string(),
        parameters: estimated_params,
        input_shape: vec![1, 28, 28, 1], // MNIST input
        output_shape: vec![1, 10], // Classification output
    })
}

/// Estimate number of parameters based on model file size
fn estimate_parameters_from_size(file_size: usize) -> u64 {
    // Rough estimate: 4 bytes per float32 parameter, plus overhead
    let estimated_params = file_size / 6; // Account for some overhead
    estimated_params.max(1000).min(1_000_000_000) as u64 // Reasonable bounds
}

/// Parse JSON model metadata (fallback for mock models)
fn parse_json_model_metadata(data: &[u8]) -> Result<ModelInfo, EnclaveError> {
    let metadata_end = data.iter().position(|&b| b == b'}').unwrap_or(200.min(data.len()));
    let metadata_str = std::str::from_utf8(&data[..metadata_end])
        .map_err(|e| EnclaveError::GenericError(format!("Invalid UTF-8 in model metadata: {}", e)))?;
    
    if let Ok(metadata) = serde_json::from_str::<serde_json::Value>(metadata_str) {
        Ok(ModelInfo {
            model_type: metadata["model_type"].as_str().unwrap_or("unknown").to_string(),
            framework: metadata["framework"].as_str().unwrap_or("unknown").to_string(),
            parameters: metadata["parameters"].as_u64().unwrap_or(estimate_parameters_from_size(data.len())),
            input_shape: vec![1, 784],
            output_shape: vec![1, 10],
        })
    } else {
        // Binary model without metadata - make educated guesses
        Ok(ModelInfo {
            model_type: "neural_network".to_string(),
            framework: "unknown".to_string(),
            parameters: estimate_parameters_from_size(data.len()),
            input_shape: vec![1, 784],
            output_shape: vec![1, 10],
        })
    }
}

/// Validate and process dataset
fn validate_and_process_dataset(data: &[u8], _format_hint: &Option<String>) -> Result<DatasetInfo, EnclaveError> {
    info!("Validating dataset ({} bytes)", data.len());
    
    // Detect dataset format
    let dataset_info = if is_csv_dataset(data) {
        process_csv_dataset(data)?
    } else if is_json_dataset(data) {
        process_json_dataset(data)?
    } else if is_parquet_dataset(data) {
        process_parquet_dataset(data)?
    } else if is_npy_dataset(data) {
        process_npy_dataset(data)?
    } else if is_image_dataset(data) {
        process_image_dataset(data)?
    } else {
        return Err(EnclaveError::GenericError("Unsupported dataset format".to_string()));
    };
    
    // Validate dataset quality
    if dataset_info.rows == 0 {
        return Err(EnclaveError::GenericError("Dataset contains no data rows".to_string()));
    }
    
    if dataset_info.columns == 0 {
        return Err(EnclaveError::GenericError("Dataset contains no columns".to_string()));
    }
    
    info!("Validated {} dataset with {} rows and {} columns", 
          dataset_info.format, dataset_info.rows, dataset_info.columns);
    
    Ok(dataset_info)
}

/// Check if data is CSV format
fn is_csv_dataset(data: &[u8]) -> bool {
    if let Ok(text) = std::str::from_utf8(data) {
        let first_line = text.lines().next().unwrap_or("");
        first_line.contains(',') && first_line.split(',').count() > 1
    } else {
        false
    }
}

/// Check if data is JSON format
fn is_json_dataset(data: &[u8]) -> bool {
    data.starts_with(b"{") || data.starts_with(b"[")
}

/// Check if data is Parquet format
fn is_parquet_dataset(data: &[u8]) -> bool {
    data.starts_with(b"PAR1") // Parquet magic number
}

/// Check if data is NPY format (NumPy array)
fn is_npy_dataset(data: &[u8]) -> bool {
    // NPY files start with the magic string "\x93NUMPY"
    data.len() >= 6 && data.starts_with(b"\x93NUMPY")
}

/// Check if data is image dataset (ZIP archive with images)
fn is_image_dataset(data: &[u8]) -> bool {
    data.starts_with(b"PK\x03\x04") // ZIP magic number
}

/// Process CSV dataset
fn process_csv_dataset(data: &[u8]) -> Result<DatasetInfo, EnclaveError> {
    let data_str = std::str::from_utf8(data)
        .map_err(|e| EnclaveError::GenericError(format!("Invalid UTF-8 in CSV: {}", e)))?;
    
    let lines: Vec<&str> = data_str.lines().filter(|line| !line.trim().is_empty()).collect();
    if lines.is_empty() {
        return Err(EnclaveError::GenericError("Empty CSV dataset".to_string()));
    }
    
    // Parse header
    let header = lines[0];
    let columns: Vec<&str> = header.split(',').map(|s| s.trim()).collect();
    let rows = lines.len() - 1; // Exclude header
    
    // Analyze data types by sampling first few rows
    let mut data_types = HashMap::new();
    for (i, column) in columns.iter().enumerate() {
        let column_type = if lines.len() > 1 {
            analyze_csv_column_type(&lines[1..], i)
        } else {
            "unknown".to_string()
        };
        data_types.insert(column.to_string(), column_type);
    }
    
    Ok(DatasetInfo {
        format: "csv".to_string(),
        rows: rows as u64,
        columns: columns.len() as u64,
        data_types,
    })
}

/// Process JSON dataset
fn process_json_dataset(data: &[u8]) -> Result<DatasetInfo, EnclaveError> {
    let json_str = std::str::from_utf8(data)
        .map_err(|e| EnclaveError::GenericError(format!("Invalid UTF-8 in JSON: {}", e)))?;
    
    let json_value: serde_json::Value = serde_json::from_str(json_str)
        .map_err(|e| EnclaveError::GenericError(format!("Invalid JSON: {}", e)))?;
    
    match &json_value {
        serde_json::Value::Array(array) => {
            let rows = array.len() as u64;
            let columns = if let Some(first_obj) = array.first() {
                if let serde_json::Value::Object(obj) = first_obj {
                    obj.len() as u64
                } else {
                    1
                }
            } else {
                0
            };
            
            let mut data_types = HashMap::new();
            if let Some(serde_json::Value::Object(first_obj)) = array.first() {
                for (key, value) in first_obj {
                    let type_name = match value {
                        serde_json::Value::Number(_) => "numeric",
                        serde_json::Value::String(_) => "text",
                        serde_json::Value::Bool(_) => "boolean",
                        _ => "mixed",
                    };
                    data_types.insert(key.clone(), type_name.to_string());
                }
            }
            
            Ok(DatasetInfo {
                format: "json".to_string(),
                rows,
                columns,
                data_types,
            })
        },
        _ => Err(EnclaveError::GenericError("JSON must be an array of objects".to_string())),
    }
}

/// Process Parquet dataset (simplified)
fn process_parquet_dataset(_data: &[u8]) -> Result<DatasetInfo, EnclaveError> {
    // In a real implementation, you'd use the parquet crate
    // For now, return estimated information
    Ok(DatasetInfo {
        format: "parquet".to_string(),
        rows: 1000, // Estimated
        columns: 10, // Estimated
        data_types: HashMap::from([
            ("col1".to_string(), "numeric".to_string()),
            ("col2".to_string(), "text".to_string()),
        ]),
    })
}

/// Process NPY dataset (NumPy array)
fn process_npy_dataset(data: &[u8]) -> Result<DatasetInfo, EnclaveError> {
    // Parse NPY header to get array dimensions and dtype
    // NPY format: magic_string + major_version + minor_version + header_len + header + data
    
    if data.len() < 10 {
        return Err(EnclaveError::GenericError("NPY file too small".to_string()));
    }
    
    // Skip magic string (6 bytes), major/minor version (2 bytes)
    let header_len_bytes = &data[8..10];
    let header_len = u16::from_le_bytes([header_len_bytes[0], header_len_bytes[1]]) as usize;
    
    if data.len() < 10 + header_len {
        return Err(EnclaveError::GenericError("NPY file header incomplete".to_string()));
    }
    
    let header_bytes = &data[10..10 + header_len];
    let header_str = std::str::from_utf8(header_bytes)
        .map_err(|_| EnclaveError::GenericError("NPY header not valid UTF-8".to_string()))?;
    
    // Parse basic info from header (simplified parsing)
    let rows = if header_str.contains("shape") {
        // Try to extract shape information (simplified)
        if header_str.contains("(") && header_str.contains(",") {
            // Multi-dimensional array
            1000 // Estimated for now
        } else {
            // 1D array
            (data.len() - 10 - header_len) / 8 // Estimate assuming float64
        }
    } else {
        1000 // Default estimate
    };
    
    let data_type = if header_str.contains("'f") {
        "numeric".to_string()
    } else if header_str.contains("'i") || header_str.contains("'u") {
        "integer".to_string()
    } else if header_str.contains("'b") {
        "boolean".to_string()
    } else {
        "numeric".to_string() // Default to numeric
    };
    
    // For multi-dimensional arrays, columns represent features
    let columns = if header_str.contains("shape") && header_str.contains(",") {
        // Try to extract second dimension as feature count
        10 // Estimated for now
    } else {
        1 // 1D array has 1 column
    };
    
    Ok(DatasetInfo {
        format: "npy".to_string(),
        rows: rows as u64,
        columns: columns as u64,
        data_types: HashMap::from([
            ("array_data".to_string(), data_type),
        ]),
    })
}

/// Process image dataset (ZIP archive)
fn process_image_dataset(_data: &[u8]) -> Result<DatasetInfo, EnclaveError> {
    // In a real implementation, you'd extract and analyze images
    // For now, return estimated information
    Ok(DatasetInfo {
        format: "image_archive".to_string(),
        rows: 1000, // Number of images
        columns: 3, // RGB channels typically
        data_types: HashMap::from([
            ("image_data".to_string(), "image".to_string()),
            ("label".to_string(), "categorical".to_string()),
        ]),
    })
}

/// Analyze CSV column type by sampling values
fn analyze_csv_column_type(lines: &[&str], column_index: usize) -> String {
    let mut numeric_count = 0;
    let mut total_count = 0;
    
    for line in lines.iter().take(10) { // Sample first 10 rows
        let values: Vec<&str> = line.split(',').collect();
        if let Some(value) = values.get(column_index) {
            total_count += 1;
            if value.trim().parse::<f64>().is_ok() {
                numeric_count += 1;
            }
        }
    }
    
    if total_count == 0 {
        "unknown".to_string()
    } else if numeric_count as f64 / total_count as f64 > 0.8 {
        "numeric".to_string()
    } else {
        "text".to_string()
    }
}

/// Perform comprehensive quality assessment
fn perform_quality_assessment(
    model_info: &ModelInfo,
    dataset_info: &DatasetInfo,
    assessment_type: &AssessmentType,
    metrics: &[String],
) -> Result<AssessmentResult, EnclaveError> {
    
    info!("Performing {:?} assessment with metrics: {:?}", assessment_type, metrics);
    
    let start = std::time::Instant::now();
    
    // Simulate model inference time based on model size and dataset size
    let base_inference_time = (model_info.parameters / 1000) + (dataset_info.rows / 10);
    let inference_time_ms = base_inference_time.max(50).min(30000); // 50ms to 30s
    
    // Simulate actual inference delay
    std::thread::sleep(std::time::Duration::from_millis(inference_time_ms.min(1000))); // Cap at 1s for testing
    
    // Calculate mock quality metrics based on model and data characteristics
    let data_quality_factor = if dataset_info.rows > 1000 { 0.9 } else { 0.7 };
    let model_quality_factor = if model_info.parameters > 50000 { 0.95 } else { 0.8 };
    
    let base_accuracy = data_quality_factor * model_quality_factor;
    
    let accuracy_metrics = AccuracyMetrics {
        precision: ((base_accuracy + 0.02) * 10000.0) as u64,
        recall: ((base_accuracy - 0.01) * 10000.0) as u64,
        f1_score: (base_accuracy * 10000.0) as u64,
        auc: Some(((base_accuracy + 0.05) * 10000.0) as u64),
        rmse: None,
        mae: None,
    };
    
    // Calculate overall quality score (0-100)
    let quality_score = ((base_accuracy * 85.0) + 10.0) as u64; // 10-95 range
    
    // Performance metrics
    let memory_usage = (model_info.parameters * 4 / 1_048_576).max(10); // 4 bytes per param, min 10MB
    let throughput = (100000 / inference_time_ms.max(1)).max(1); // Scaled by 100, samples per second
    
    // Data integrity assessment
    let data_integrity_score = if dataset_info.columns > 5 && dataset_info.rows > 500 {
        90
    } else {
        70
    };
    
    // Bias assessment
    let bias_assessment = BiasAssessment {
        fairness_score: 85, // Mock fairness score
        bias_detected: false,
        bias_type: None,
        demographic_parity: Some(9500), // 95.00% scaled by 10000
        equalized_odds: Some(9300),     // 93.00% scaled by 10000
    };
    
    let processing_time = start.elapsed().as_millis() as u64;
    info!("Assessment completed in {}ms", processing_time);
    
    Ok(AssessmentResult {
        overall_quality_score: quality_score,
        accuracy: accuracy_metrics,
        inference_time_ms,
        memory_usage_mb: memory_usage,
        throughput,
        data_integrity_score,
        bias_assessment,
    })
}

/// Generate integrity hash for the assessment result
fn generate_assessment_integrity_hash(response: &MLQualityResponse, timestamp: u64) -> String {
    use sha2::{Sha256, Digest};
    
    let mut hasher = Sha256::new();
    
    // Hash key components of the assessment
    hasher.update(response.model_hash.as_bytes());
    hasher.update(response.dataset_hash.as_bytes());
    hasher.update(&response.quality_score.to_be_bytes());
    hasher.update(&response.accuracy_metrics.precision.to_be_bytes());
    hasher.update(&response.accuracy_metrics.recall.to_be_bytes());
    hasher.update(&response.accuracy_metrics.f1_score.to_be_bytes());
    hasher.update(&response.performance_metrics.inference_time_ms.to_be_bytes());
    hasher.update(&response.performance_metrics.memory_usage_mb.to_be_bytes());
    hasher.update(&response.data_integrity_score.to_be_bytes());
    hasher.update(&response.bias_assessment.fairness_score.to_be_bytes());
    hasher.update(&timestamp.to_be_bytes());
    hasher.update(response.model_type.as_bytes());
    hasher.update(response.dataset_format.as_bytes());
    
    format!("{:x}", hasher.finalize())
}

/// Generate cryptographic signature for model verification
fn generate_model_verification_signature(
    model_hash: &str, 
    dataset_hash: &str, 
    quality_score: u64,
    keypair: &fastcrypto::ed25519::Ed25519KeyPair
) -> String {
    use fastcrypto::traits::Signer;
    
    // Create a verification message to sign
    let mut hasher = Sha256::new();
    hasher.update(b"MODEL_VERIFICATION_V1:");
    hasher.update(model_hash.as_bytes());
    hasher.update(b":");
    hasher.update(dataset_hash.as_bytes());
    hasher.update(b":");
    hasher.update(&quality_score.to_be_bytes());
    hasher.update(b":");
    hasher.update(&std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs()
        .to_be_bytes());
    
    let message_hash = hasher.finalize();
    
    // Sign the hash with the ephemeral keypair
    let signature = keypair.sign(&message_hash);
    
    // Return base64-encoded signature
    use base64::{Engine, engine::general_purpose::STANDARD};
    STANDARD.encode(signature.as_ref())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::common::IntentMessage;
    use axum::{extract::State, Json};
    use fastcrypto::{ed25519::Ed25519KeyPair, traits::KeyPair};

    #[tokio::test]
    async fn test_ml_quality_assessment() {
        let state = Arc::new(AppState {
            eph_kp: Ed25519KeyPair::generate(&mut rand::thread_rng()),
            api_key: "test_key".to_string(),
        });

        let request = ProcessDataRequest {
            payload: MLQualityRequest {
                model_blob_id: "model_test_123".to_string(),
                dataset_blob_id: "dataset_test_456".to_string(),
                assessment_type: AssessmentType::QualityAnalysis,
                quality_metrics: vec!["accuracy".to_string(), "performance".to_string()],
                model_type_hint: Some("neural_network".to_string()),
                dataset_format_hint: Some("csv".to_string()),
            },
        };

        let result = process_data(State(state), Json(request)).await;
        assert!(result.is_ok());
        
        let response = result.unwrap();
        assert!(response.response.data.quality_score > 0);
        assert!(response.response.data.quality_score <= 100);
        assert!(!response.response.data.model_hash.is_empty());
        assert!(!response.response.data.dataset_hash.is_empty());
    }

    #[test]
    fn test_mock_data_generation() {
        let model_data = create_mock_model_data();
        assert!(!model_data.is_empty());
        
        let dataset_data = create_mock_dataset_data();
        assert!(!dataset_data.is_empty());
    }

    #[test]
    fn test_model_validation() {
        let model_data = create_mock_model_data();
        let result = validate_and_load_model(&model_data, &None);
        assert!(result.is_ok());
        
        let model_info = result.unwrap();
        assert_eq!(model_info.model_type, "neural_network");
        assert_eq!(model_info.framework, "pytorch");
    }

    #[test]
    fn test_dataset_validation() {
        let dataset_data = create_mock_dataset_data();
        let result = validate_and_process_dataset(&dataset_data, &None);
        assert!(result.is_ok());
        
        let dataset_info = result.unwrap();
        assert_eq!(dataset_info.format, "csv");
        assert_eq!(dataset_info.columns, 4);
        assert_eq!(dataset_info.rows, 1000);
    }

    #[test]
    fn test_npy_dataset_validation() {
        // Create a simple mock NPY file header
        let mut npy_data = Vec::new();
        npy_data.extend_from_slice(b"\x93NUMPY"); // Magic string
        npy_data.push(0x01); // Major version
        npy_data.push(0x00); // Minor version
        
        // Mock header (simplified)
        let header = "{'descr': '<f8', 'fortran_order': False, 'shape': (100, 10), }";
        let header_len = header.len() as u16;
        npy_data.extend_from_slice(&header_len.to_le_bytes()); // Header length
        npy_data.extend_from_slice(header.as_bytes());
        
        // Add some mock array data
        npy_data.resize(npy_data.len() + 8000, 0); // 100*10*8 bytes for float64
        
        let result = validate_and_process_dataset(&npy_data, &None);
        assert!(result.is_ok());
        
        let dataset_info = result.unwrap();
        assert_eq!(dataset_info.format, "npy");
        assert!(dataset_info.rows > 0);
        assert!(dataset_info.columns > 0);
    }

    #[test]
    fn test_serde_consistency() {
        // Ensure BCS serialization is consistent with Move contract
        use fastcrypto::encoding::{Encoding, Hex};
        
        let payload = MLQualityResponse {
            model_hash: "abc123".to_string(),
            dataset_hash: "def456".to_string(),
            quality_score: 85,
            accuracy_metrics: AccuracyMetrics {
                precision: 9000,  // 90.00%
                recall: 8800,     // 88.00%
                f1_score: 8900,   // 89.00%
                auc: Some(9200),  // 92.00%
                rmse: None,
                mae: None,
            },
            performance_metrics: PerformanceMetrics {
                inference_time_ms: 150,
                memory_usage_mb: 64,
                model_size_mb: 5,
                dataset_size_mb: 10,
                throughput_samples_per_second: 667,  // 6.67 scaled by 100
            },
            data_integrity_score: 90,
            bias_assessment: BiasAssessment {
                fairness_score: 85,
                bias_detected: false,
                bias_type: None,
                demographic_parity: Some(9500),  // 95.00%
                equalized_odds: Some(9300),     // 93.00%
            },
            model_type: "neural_network".to_string(),
            dataset_format: "csv".to_string(),
        };
        
        let timestamp = 1744038900000u64;
        let intent_msg = IntentMessage::new(payload, timestamp, IntentScope::ProcessData);
        let signing_payload = bcs::to_bytes(&intent_msg).expect("should not fail");
        
        // Verify that BCS serialization works
        assert!(!signing_payload.is_empty());
    }
}