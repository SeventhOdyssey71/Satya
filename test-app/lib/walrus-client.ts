// Simplified Walrus Client for testing

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
        success: result.success
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  async downloadBlob(blobId: string): Promise<Uint8Array> {
    try {
      const response = await fetch(`/api/walrus/download?blobId=${encodeURIComponent(blobId)}`);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }
}