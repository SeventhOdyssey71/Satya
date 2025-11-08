// Chunking utilities for large file handling

export class ChunkingUtils {
  constructor(private chunkSize: number) {}
  
  // Chunk a file into smaller pieces
  async chunkFile(file: File): Promise<Uint8Array[]> {
    const chunks: Uint8Array[] = [];
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    for (let i = 0; i < uint8Array.length; i += this.chunkSize) {
      const chunk = uint8Array.slice(i, i + this.chunkSize);
      chunks.push(chunk);
    }
    
    return chunks;
  }
  
  // Chunk a Uint8Array
  chunkData(data: Uint8Array): Uint8Array[] {
    const chunks: Uint8Array[] = [];
    
    for (let i = 0; i < data.length; i += this.chunkSize) {
      const chunk = data.slice(i, i + this.chunkSize);
      chunks.push(chunk);
    }
    
    return chunks;
  }
  
  // Reassemble chunks into original data
  reassembleChunks(chunks: Uint8Array[]): Uint8Array {
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    return result;
  }
  
  // Calculate optimal chunk size based on file size
  calculateOptimalChunkSize(fileSize: number): number {
    const MIN_CHUNK_SIZE = 1024 * 1024;      // 1MB
    const MAX_CHUNK_SIZE = 50 * 1024 * 1024; // 50MB
    const TARGET_CHUNKS = 100;                // Aim for ~100 chunks
    
    const idealSize = Math.ceil(fileSize / TARGET_CHUNKS);
    
    if (idealSize < MIN_CHUNK_SIZE) return MIN_CHUNK_SIZE;
    if (idealSize > MAX_CHUNK_SIZE) return MAX_CHUNK_SIZE;
    
    return idealSize;
  }
  
  // Validate chunk integrity
  validateChunks(chunks: Uint8Array[], expectedSize: number): boolean {
    const actualSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    return actualSize === expectedSize;
  }
}