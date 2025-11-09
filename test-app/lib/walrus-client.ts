import { apiClient } from './api-client';

export class WalrusClient {
  private useMockMode: boolean;

  constructor() {
    this.useMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
  }

  async uploadBlob(data: Uint8Array): Promise<{ blobId: string; success: boolean }> {
    try {
      // Convert Uint8Array to File for the API
      const file = new File([data], 'upload.bin', { type: 'application/octet-stream' });
      
      const response = await apiClient.uploadFile(file);
      
      if (response.success && response.data) {
        return {
          blobId: response.data.blobId,
          success: true
        };
      } else {
        throw new Error(response.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      return {
        blobId: '',
        success: false
      };
    }
  }

  async uploadFile(file: File): Promise<{ blobId: string; success: boolean; filename?: string; size?: number }> {
    try {
      const response = await apiClient.uploadFile(file);
      
      if (response.success && response.data) {
        return {
          blobId: response.data.blobId,
          success: true,
          filename: response.data.filename,
          size: response.data.size
        };
      } else {
        throw new Error(response.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      return {
        blobId: '',
        success: false
      };
    }
  }

  async downloadBlob(blobId: string): Promise<{ data: Uint8Array; success: boolean }> {
    try {
      const data = await apiClient.downloadFile(blobId);
      return {
        data,
        success: true
      };
    } catch (error) {
      console.error('Download error:', error);
      return {
        data: new Uint8Array(),
        success: false
      };
    }
  }

  async getFileInfo(blobId: string): Promise<{ available: boolean; storedAt?: string; success: boolean }> {
    try {
      const response = await apiClient.getFileInfo(blobId);
      
      if (response.success && response.data) {
        return {
          available: response.data.available,
          storedAt: response.data.storedAt,
          success: true
        };
      } else {
        throw new Error(response.error?.message || 'Failed to get file info');
      }
    } catch (error) {
      console.error('File info error:', error);
      return {
        available: false,
        success: false
      };
    }
  }
}