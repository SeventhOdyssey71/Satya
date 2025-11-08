use axum::{
    extract::{Multipart, Path, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::sync::Arc;
use tracing::{error, info};
use uuid::Uuid;

use crate::common::{AppState, Attestation, FileEntry, FileType};

mod secure_storage;
mod attestation;

pub use attestation::*;

/// API error response
#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
    pub code: u16,
}

/// File upload response
#[derive(Debug, Serialize, Deserialize)]
pub struct UploadResponse {
    pub file_id: String,
    pub file_hash: String,
    pub file_size: u64,
    pub file_name: String,
    pub uploaded_at: chrono::DateTime<chrono::Utc>,
    pub attestation_id: Option<String>,
}

/// Health check response
#[derive(Debug, Serialize)]
pub struct HealthCheckResponse {
    pub status: String,
    pub enclave_ready: bool,
    pub public_key: String,
    pub timestamp: i64,
}

/// Attestation request
#[derive(Debug, Deserialize)]
pub struct AttestationRequest {
    pub file_id: String,
    pub operation: String,
    pub metadata: Option<serde_json::Value>,
}

/// Create application routes
pub fn create_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/health", get(health_check))
        .route("/upload", post(upload_file))
        .route("/file/:id", get(get_file))
        .route("/attest", post(create_attestation))
        .route("/attestation/:id", get(get_attestation_handler))
        .route("/verify", post(verify_attestation))
}

/// Health check endpoint
async fn health_check(State(state): State<Arc<AppState>>) -> Json<HealthCheckResponse> {
    let public_key = hex::encode(state.verifying_key.as_bytes());
    
    Json(HealthCheckResponse {
        status: "healthy".to_string(),
        enclave_ready: true,
        public_key,
        timestamp: chrono::Utc::now().timestamp(),
    })
}

/// Upload file to secure enclave storage
async fn upload_file(
    State(state): State<Arc<AppState>>,
    mut multipart: Multipart,
) -> Result<Json<UploadResponse>, (StatusCode, Json<ErrorResponse>)> {
    let mut file_data: Option<Vec<u8>> = None;
    let mut file_name = String::new();
    let mut file_type = FileType::Other("unknown".to_string());

    // Process multipart form data
    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| {
            error!("Failed to get next field: {}", e);
            (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "Invalid multipart data".to_string(),
                    code: 400,
                }),
            )
        })?
    {
        let field_name = field.name().unwrap_or("").to_string();
        
        match field_name.as_str() {
            "file" => {
                file_name = field
                    .file_name()
                    .unwrap_or("unknown")
                    .to_string();
                
                // Determine file type from extension
                if file_name.ends_with(".json") || file_name.ends_with(".model") {
                    file_type = FileType::Model;
                } else if file_name.ends_with(".csv") || file_name.ends_with(".data") {
                    file_type = FileType::Dataset;
                } else if file_name.ends_with(".pdf") || file_name.ends_with(".doc") {
                    file_type = FileType::Document;
                }
                
                file_data = Some(
                    field
                        .bytes()
                        .await
                        .map_err(|e| {
                            error!("Failed to read file bytes: {}", e);
                            (
                                StatusCode::BAD_REQUEST,
                                Json(ErrorResponse {
                                    error: "Failed to read file".to_string(),
                                    code: 400,
                                }),
                            )
                        })?
                        .to_vec(),
                );
            }
            "type" => {
                let type_str = field.text().await.unwrap_or_default();
                file_type = match type_str.as_str() {
                    "model" => FileType::Model,
                    "dataset" => FileType::Dataset,
                    "document" => FileType::Document,
                    other => FileType::Other(other.to_string()),
                };
            }
            _ => {}
        }
    }

    let file_bytes = file_data.ok_or_else(|| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "No file provided".to_string(),
                code: 400,
            }),
        )
    })?;

    // Calculate file hash
    let mut hasher = Sha256::new();
    hasher.update(&file_bytes);
    let file_hash = hasher.finalize().to_vec();

    // Create file entry
    let file_id = Uuid::new_v4().to_string();
    let file_entry = FileEntry {
        id: file_id.clone(),
        name: file_name.clone(),
        data: file_bytes.clone(),
        hash: file_hash.clone(),
        uploaded_at: chrono::Utc::now(),
        file_type,
    };

    // Store file in enclave
    state.store_file(file_entry).map_err(|e| {
        error!("Failed to store file: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: "Failed to store file".to_string(),
                code: 500,
            }),
        )
    })?;

    info!("File uploaded: {} ({})", file_id, file_name);

    // Create automatic attestation for upload
    let attestation = generate_upload_attestation(
        &state,
        &file_id,
        &file_hash,
        &file_name,
        file_bytes.len() as u64,
    )
    .map_err(|e| {
        error!("Failed to generate attestation: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: "Failed to generate attestation".to_string(),
                code: 500,
            }),
        )
    })?;

    let attestation_id = attestation.id.clone();
    state.store_attestation(attestation).map_err(|e| {
        error!("Failed to store attestation: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: "Failed to store attestation".to_string(),
                code: 500,
            }),
        )
    })?;

    Ok(Json(UploadResponse {
        file_id,
        file_hash: hex::encode(file_hash),
        file_size: file_bytes.len() as u64,
        file_name,
        uploaded_at: chrono::Utc::now(),
        attestation_id: Some(attestation_id),
    }))
}

/// Get file metadata (not the actual file data for security)
async fn get_file(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<ErrorResponse>)> {
    let file = state.get_file(&id).map_err(|e| {
        (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: format!("File not found: {}", e),
                code: 404,
            }),
        )
    })?;

    Ok(Json(serde_json::json!({
        "file_id": file.id,
        "file_name": file.name,
        "file_hash": hex::encode(file.hash),
        "file_size": file.data.len(),
        "uploaded_at": file.uploaded_at,
        "file_type": format!("{:?}", file.file_type),
    })))
}

/// Create attestation for a file operation
async fn create_attestation(
    State(state): State<Arc<AppState>>,
    Json(request): Json<AttestationRequest>,
) -> Result<Json<Attestation>, (StatusCode, Json<ErrorResponse>)> {
    let file = state.get_file(&request.file_id).map_err(|e| {
        (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: format!("File not found: {}", e),
                code: 404,
            }),
        )
    })?;

    let attestation = generate_operation_attestation(
        &state,
        &request.file_id,
        &file.hash,
        &request.operation,
        request.metadata,
    )
    .map_err(|e| {
        error!("Failed to generate attestation: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: "Failed to generate attestation".to_string(),
                code: 500,
            }),
        )
    })?;

    let attestation_clone = attestation.clone();
    state.store_attestation(attestation).map_err(|e| {
        error!("Failed to store attestation: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: "Failed to store attestation".to_string(),
                code: 500,
            }),
        )
    })?;

    Ok(Json(attestation_clone))
}

/// Get attestation by ID
async fn get_attestation_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<Attestation>, (StatusCode, Json<ErrorResponse>)> {
    state.get_attestation(&id).map_err(|e| {
        (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: format!("Attestation not found: {}", e),
                code: 404,
            }),
        )
    })
    .map(Json)
}

/// Verify an attestation signature
async fn verify_attestation(
    State(state): State<Arc<AppState>>,
    Json(attestation): Json<Attestation>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<ErrorResponse>)> {
    let is_valid = verify_attestation_signature(&state, &attestation)
        .map_err(|e| {
            error!("Failed to verify attestation: {}", e);
            (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "Failed to verify attestation".to_string(),
                    code: 400,
                }),
            )
        })?;

    Ok(Json(serde_json::json!({
        "valid": is_valid,
        "attestation_id": attestation.id,
        "public_key": hex::encode(state.verifying_key.as_bytes()),
    })))
}