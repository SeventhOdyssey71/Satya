// Simplified Walrus Client for testing

export class WalrusClient {
  private aggregator = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR || 'https://aggregator-devnet.walrus.space';
  private publisher = process.env.NEXT_PUBLIC_WALRUS_PUBLISHER || 'https://publisher-devnet.walrus.space';

  async uploadBlob(data: Uint8Array): Promise<{ blobId: string; success: boolean }> {
    try {
      const response = await fetch(`${this.publisher}/v1/blobs?epochs=5`, {
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
        blobId: result.blob_id || result.blobId,
        success: true
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  async downloadBlob(blobId: string): Promise<Uint8Array> {
    try {
      const response = await fetch(`${this.aggregator}/v1/blobs/${blobId}`);
      
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