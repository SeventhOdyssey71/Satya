// Simple Walrus Client stub for test-app
// This avoids module format conflicts with the full implementation

export class WalrusClient {
  async uploadBlob(data: Uint8Array): Promise<{ blobId: string; success: boolean }> {
    try {
      const response = await fetch('/api/walrus/upload', {
        method: 'PUT',
        body: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer,
        headers: {
          'Content-Type': 'application/octet-stream'
        }
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        blobId: result.blobId,
        success: true
      };
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
      const response = await fetch(`/api/walrus/download?blob_id=${blobId}`);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return {
        data: new Uint8Array(arrayBuffer),
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
}