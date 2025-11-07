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
  const [encryptedDEK, setEncryptedDEK] = useState<Uint8Array | null>(null);
  const [iv, setIv] = useState<Uint8Array | null>(null);
  const [status, setStatus] = useState<string>('');
  const [downloadedContent, setDownloadedContent] = useState<string>('');

  const walrus = new WalrusClient();
  const seal = new SealEncryption();

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
      setEncryptedDEK(encDEK);
      
      // Encrypt data with DEK
      const { ciphertext, iv: encIv } = await seal.encryptWithDEK(plaintext, dek);
      setIv(encIv);
      
      // Upload encrypted data to Walrus
      setStatus('Uploading encrypted data to Walrus...');
      const result = await walrus.uploadBlob(ciphertext);
      setBlobId(result.blobId);
      
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
      const text = new TextDecoder().decode(data);
      setDownloadedContent(text);
      setStatus('Download successful!');
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

    if (!encryptedDEK || !iv) {
      setStatus('Missing encryption parameters. Upload a file first.');
      return;
    }

    try {
      setStatus('Downloading encrypted data from Walrus...');
      const encryptedData = await walrus.downloadBlob(downloadBlobId);
      
      setStatus('Decrypting data...');
      // Decrypt DEK
      const dek = await seal.decryptDEK(encryptedDEK);
      
      // Decrypt data with DEK
      const plaintext = await seal.decryptWithDEK(encryptedData, dek, iv);
      const text = new TextDecoder().decode(plaintext);
      setDownloadedContent(text);
      
      setStatus('Encrypted download and decryption successful!');
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
          <h2 className="text-xl font-semibold mb-4">Upload</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select File</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="space-y-2">
            <button
              onClick={handleRegularUpload}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Regular Upload to Walrus
            </button>
            
            <button
              onClick={handleEncryptedUpload}
              className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
              disabled={!account}
            >
              Encrypted Upload (Seal + Walrus)
            </button>
          </div>

          {blobId && (
            <div className="mt-4 p-2 bg-gray-100 rounded">
              <p className="text-xs break-all">Blob ID: {blobId}</p>
            </div>
          )}
        </div>

        {/* Download Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Download</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Blob ID</label>
            <input
              type="text"
              value={downloadBlobId}
              onChange={(e) => setDownloadBlobId(e.target.value)}
              placeholder="Enter blob ID"
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="space-y-2">
            <button
              onClick={handleRegularDownload}
              className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Regular Download from Walrus
            </button>
            
            <button
              onClick={handleEncryptedDownload}
              className="w-full bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
            >
              Encrypted Download (Walrus + Seal)
            </button>
          </div>

          {downloadedContent && (
            <div className="mt-4 p-2 bg-gray-100 rounded">
              <p className="text-xs">Content:</p>
              <pre className="text-xs overflow-auto max-h-32">{downloadedContent}</pre>
            </div>
          )}
        </div>
      </div>

      {/* Status Section */}
      {status && (
        <div className="mt-8 p-4 bg-gray-50 rounded">
          <p className="text-sm">{status}</p>
        </div>
      )}

      {/* Debug Info */}
      {encryptedDEK && (
        <div className="mt-4 text-xs text-gray-500">
          <p>Encrypted DEK stored (for testing)</p>
          <p>IV stored (for testing)</p>
        </div>
      )}
    </div>
  );
}