'use client';

import { useState } from 'react';
import { useCurrentAccount, useSignPersonalMessage, ConnectButton } from '@mysten/dapp-kit';
import { WalrusClient } from '@/lib/walrus-client';
import { SealEncryption } from '@/lib/seal-encryption';

export default function TestUpload() {
  const account = useCurrentAccount();
  const { mutate: signMessage } = useSignPersonalMessage();
  
  const [file, setFile] = useState<File | null>(null);
  const [blobId, setBlobId] = useState<string>('');
  const [downloadBlobId, setDownloadBlobId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [downloadedContent, setDownloadedContent] = useState<string>('');

  const walrus = new WalrusClient();
  const seal = new SealEncryption();

  // Helper function to determine mime type from file extension
  const getMimeType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      // Images
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'ico': 'image/x-icon',
      
      // Documents
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      
      // Text
      'txt': 'text/plain',
      'csv': 'text/csv',
      'json': 'application/json',
      'xml': 'application/xml',
      
      // Video
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      
      // Audio
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      
      // Archives
      'zip': 'application/zip',
      'tar': 'application/x-tar',
      'gz': 'application/gzip',
    };
    
    return mimeTypes[ext || ''] || 'application/octet-stream';
  };

  // Helper function to trigger browser download
  const triggerDownload = (data: Uint8Array, filename: string = 'download', mimeType?: string) => {
    const actualMimeType = mimeType || getMimeType(filename);
    // Convert Uint8Array to ArrayBuffer for Blob
    const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
    const blob = new Blob([arrayBuffer], { type: actualMimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Regular upload to Walrus
  const handleRegularUpload = async () => {
    if (!file) {
      setStatus('Please select a file');
      return;
    }

    try {
      setStatus('Uploading to Walrus...');
      const data = new Uint8Array(await file.arrayBuffer());
      const result = await walrus.uploadBlob(data);
      setBlobId(result.blobId);
      
      // Store file metadata with blob ID for later retrieval
      localStorage.setItem(`file_${result.blobId}`, JSON.stringify({
        name: file.name,
        type: file.type || getMimeType(file.name)
      }));
      
      setStatus(`Upload successful! Blob ID: ${result.blobId}`);
    } catch (error) {
      setStatus(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Encrypted upload (encrypt then upload to Walrus)
  const handleEncryptedUpload = async () => {
    if (!file) {
      setStatus('Please select a file');
      return;
    }

    if (!account) {
      setStatus('Please connect wallet first');
      return;
    }

    try {
      setStatus('Encrypting file...');
      
      // Read file data
      const plaintext = new Uint8Array(await file.arrayBuffer());
      
      // Generate and encrypt DEK
      const dek = await seal.generateDEK();
      const encDEK = await seal.encryptDEK(dek);
      
      // Encrypt data with DEK
      const { ciphertext, iv: encIv } = await seal.encryptWithDEK(plaintext, dek);
      
      // Upload encrypted data to Walrus
      setStatus('Uploading encrypted data to Walrus...');
      const result = await walrus.uploadBlob(ciphertext);
      setBlobId(result.blobId);
      
      // Store encryption metadata and file info
      localStorage.setItem(`encryption_${result.blobId}`, JSON.stringify({
        encryptedDEK: Array.from(encDEK),
        iv: Array.from(encIv),
        filename: file.name,
        mimetype: file.type || getMimeType(file.name)
      }));
      
      setStatus(`Encrypted upload successful! Blob ID: ${result.blobId}`);
    } catch (error) {
      setStatus(`Encrypted upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Regular download from Walrus
  const handleRegularDownload = async () => {
    if (!downloadBlobId) {
      setStatus('Please enter a blob ID');
      return;
    }

    try {
      setStatus('Downloading from Walrus...');
      const data = await walrus.downloadBlob(downloadBlobId);
      
      // Try to get file metadata
      const storedMetadata = localStorage.getItem(`file_${downloadBlobId}`);
      let filename = 'download';
      let mimetype = 'application/octet-stream';
      
      if (storedMetadata) {
        const metadata = JSON.parse(storedMetadata);
        filename = metadata.name || 'download';
        mimetype = metadata.type || getMimeType(filename);
      }
      
      // Check if it's text-based content
      if (mimetype.startsWith('text/') || mimetype.includes('json') || mimetype.includes('xml')) {
        const text = new TextDecoder().decode(data);
        setDownloadedContent(text.substring(0, 1000)); // Show first 1000 chars
      } else {
        setDownloadedContent('[Binary file - click download to save]');
      }
      
      // Always trigger download for files
      triggerDownload(data, filename, mimetype);
      setStatus(`Download successful! File saved as: ${filename}`);
      
    } catch (error) {
      setStatus(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Encrypted download (download from Walrus then decrypt)
  const handleEncryptedDownload = async () => {
    if (!downloadBlobId) {
      setStatus('Please enter a blob ID');
      return;
    }

    try {
      setStatus('Downloading encrypted data from Walrus...');
      const encryptedData = await walrus.downloadBlob(downloadBlobId);
      
      // Get encryption metadata
      const storedData = localStorage.getItem(`encryption_${downloadBlobId}`);
      if (!storedData) {
        setStatus('❌ Encryption metadata not found. This blob may not be encrypted or was uploaded in a different session.');
        return;
      }
      
      const { encryptedDEK: storedDEK, iv: storedIv, filename, mimetype } = JSON.parse(storedData);
      
      setStatus('Decrypting data...');
      // Decrypt DEK
      const dek = await seal.decryptDEK(new Uint8Array(storedDEK));
      
      // Decrypt data with DEK
      const plaintext = await seal.decryptWithDEK(encryptedData, dek, new Uint8Array(storedIv));
      
      // Check if it's text content for preview
      if (mimetype?.startsWith('text/') || mimetype?.includes('json')) {
        const text = new TextDecoder().decode(plaintext);
        setDownloadedContent(text.substring(0, 1000)); // Show first 1000 chars
      } else {
        setDownloadedContent('[Decrypted binary file - click download to save]');
      }
      
      // Trigger download
      triggerDownload(new Uint8Array(plaintext), filename || 'decrypted_file', mimetype);
      setStatus(`Encrypted download successful! Decrypted and saved as: ${filename || 'decrypted_file'}`);
      
    } catch (error) {
      setStatus(`Encrypted download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Walrus & Seal Test Application</h1>
        <div className="mb-4">
          <ConnectButton />
        </div>
        {account && (
          <p className="text-sm text-gray-600">Connected: {account.address}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">📤 Upload</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select File (Any Type)</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full p-2 border rounded"
              accept="*/*"
            />
            {file && (
              <p className="text-xs text-gray-500 mt-1">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <button
              onClick={handleRegularUpload}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              🚀 Regular Upload to Walrus
            </button>
            
            <button
              onClick={handleEncryptedUpload}
              className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
              disabled={!account}
            >
              🔐 Encrypted Upload (Seal + Walrus)
            </button>
          </div>

          {blobId && (
            <div className="mt-4 p-2 bg-gray-100 rounded">
              <p className="text-xs font-medium">Blob ID:</p>
              <p className="text-xs break-all font-mono">{blobId}</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(blobId);
                  setStatus('Blob ID copied to clipboard!');
                }}
                className="mt-2 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
              >
                📋 Copy ID
              </button>
            </div>
          )}
        </div>

        {/* Download Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">📥 Download</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Blob ID</label>
            <input
              type="text"
              value={downloadBlobId}
              onChange={(e) => setDownloadBlobId(e.target.value)}
              placeholder="Paste blob ID here"
              className="w-full p-2 border rounded font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <button
              onClick={handleRegularDownload}
              className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              💾 Regular Download from Walrus
            </button>
            
            <button
              onClick={handleEncryptedDownload}
              className="w-full bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
            >
              🔓 Encrypted Download (Walrus + Seal)
            </button>
          </div>

          {downloadedContent && (
            <div className="mt-4 p-2 bg-gray-100 rounded">
              <p className="text-xs font-medium mb-1">Preview:</p>
              <pre className="text-xs overflow-auto max-h-32 bg-white p-2 rounded border">{downloadedContent}</pre>
            </div>
          )}
        </div>
      </div>

      {/* Status Section */}
      {status && (
        <div className="mt-8 p-4 bg-gray-50 rounded border border-gray-200">
          <p className="text-sm">{status}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold text-sm mb-2">📝 Instructions:</h3>
        <ul className="text-xs space-y-1 text-gray-700">
          <li>• Upload any file type (images, PDFs, documents, etc.)</li>
          <li>• Files are automatically downloaded to your browser when retrieved</li>
          <li>• Encrypted uploads require wallet connection for Seal integration</li>
          <li>• File metadata is stored locally for proper file naming on download</li>
          <li>• Copy the Blob ID after upload to share or download later</li>
        </ul>
      </div>
    </div>
  );
}