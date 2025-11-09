'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle, AlertCircle, Loader2, Eye, DollarSign } from 'lucide-react';
import { useAuth } from '@/lib/use-auth';
import { useMarketplace } from '@/lib/use-marketplace';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { WalrusClient } from '@/lib/walrus-client';
import { nautilusClient, type VerificationRequest, type AttestationData } from '@/lib/nautilus-client';

interface DataListing {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  file?: File;
  fileHash?: string;
  status: 'draft' | 'uploading' | 'verifying' | 'listed' | 'error';
  attestation?: AttestationData;
  error?: string;
}

export function SellerDashboard() {
  const { isAuthenticated, error: authError } = useAuth();
  const currentAccount = useCurrentAccount();
  const { createListingState, createListing, resetCreateListingState } = useMarketplace();
  
  const [listings, setListings] = useState<DataListing[]>([]);
  const [currentListing, setCurrentListing] = useState<Partial<DataListing>>({
    title: '',
    description: '',
    category: '',
    price: 0,
    status: 'draft',
  });
  
  const walrusClient = new WalrusClient();

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCurrentListing(prev => ({ ...prev, file }));
    }
  }, []);

  const handleInputChange = useCallback((field: keyof DataListing, value: string | number) => {
    setCurrentListing(prev => ({ ...prev, [field]: value }));
  }, []);

  const generateFileHash = async (file: File): Promise<string> => {
    // Generate a simple hash from file content for demo purposes
    // In production, use a proper cryptographic hash
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleCreateListing = async () => {
    if (!isAuthenticated) {
      alert('Please connect and authenticate your wallet');
      return;
    }

    if (!currentListing.title || !currentListing.file || !currentListing.category) {
      alert('Please fill in all required fields and select a file');
      return;
    }

    const listingId = `listing_${Date.now()}`;
    const newListing: DataListing = {
      id: listingId,
      title: currentListing.title!,
      description: currentListing.description || '',
      category: currentListing.category || 'other',
      price: currentListing.price || 0,
      file: currentListing.file,
      status: 'uploading',
    };

    setListings(prev => [...prev, newListing]);
    
    try {
      // Step 1: Upload to Walrus
      setListings(prev => 
        prev.map(listing => 
          listing.id === listingId 
            ? { ...listing, status: 'uploading' }
            : listing
        )
      );

      const uploadResult = await walrusClient.uploadFile(currentListing.file);
      
      if (!uploadResult.success || !uploadResult.blobId) {
        throw new Error('Failed to upload file to Walrus');
      }

      // Step 2: Generate file hash
      const fileHash = await generateFileHash(currentListing.file);
      
      // Step 3: Create listing on blockchain
      setListings(prev => 
        prev.map(listing => 
          listing.id === listingId 
            ? { ...listing, status: 'verifying', fileHash }
            : listing
        )
      );

      const success = await createListing({
        title: currentListing.title!,
        description: currentListing.description || '',
        price: currentListing.price || 0,
        category: currentListing.category || 'other',
        fileHash,
        metadata: {
          blobId: uploadResult.blobId,
          filename: currentListing.file.name,
          size: currentListing.file.size,
          mimeType: currentListing.file.type,
        }
      });

      if (success) {
        setListings(prev => 
          prev.map(listing => 
            listing.id === listingId 
              ? { ...listing, status: 'listed' }
              : listing
          )
        );
        
        // Reset form
        setCurrentListing({
          title: '',
          description: '',
          category: '',
          price: 0,
          status: 'draft',
        });
        
        alert('Listing created successfully!');
      } else {
        throw new Error(createListingState.error || 'Failed to create listing');
      }

    } catch (error) {
      console.error('Failed to create listing:', error);
      setListings(prev => 
        prev.map(listing => 
          listing.id === listingId 
            ? { 
                ...listing, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            : listing
        )
      );
    }
  };

  const getStatusIcon = (status: DataListing['status']) => {
    switch (status) {
      case 'uploading':
      case 'verifying':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'listed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: DataListing['status']) => {
    switch (status) {
      case 'uploading':
        return 'Uploading to Walrus...';
      case 'verifying':
        return 'Verifying with Nautilus...';
      case 'listed':
        return 'Listed & Verified';
      case 'error':
        return 'Error';
      default:
        return 'Draft';
    }
  };

  return (
    <div className="space-y-6">
      {/* Authentication Status */}
      {!currentAccount ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please connect your wallet to create listings
          </AlertDescription>
        </Alert>
      ) : !isAuthenticated ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Authenticating with wallet... Please sign the message when prompted
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Error States */}
      {createListingState.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Listing Error: {createListingState.error}</AlertDescription>
        </Alert>
      )}

      {authError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Authentication Error: {authError}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Seller Dashboard</h2>
        <Badge variant="secondary">{listings.length} Listings</Badge>
      </div>

      {/* Create New Listing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Create New Data Listing
          </CardTitle>
          <CardDescription>
            Upload your data to the secure marketplace with Nautilus verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Dataset Title</Label>
              <Input
                id="title"
                placeholder="e.g., Customer Analytics Dataset"
                value={currentListing.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your dataset, its use cases, and any relevant details..."
              value={currentListing.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (SUI)</Label>
              <Input
                id="price"
                type="number"
                step="0.1"
                min="0"
                placeholder="0.5"
                value={currentListing.price || ''}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">Dataset File</Label>
              <Input
                id="file"
                type="file"
                accept=".csv,.json,.xlsx,.parquet,.zip"
                onChange={handleFileSelect}
              />
            </div>
          </div>

          <Button 
            onClick={handleCreateListing}
            disabled={!currentListing.title || !currentListing.file || !currentListing.category || !isAuthenticated || createListingState.isLoading}
            className="w-full"
          >
            {createListingState.isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating Listing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Create Listing
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Listings */}
      {listings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Data Listings</CardTitle>
            <CardDescription>
              Track the status of your marketplace listings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="font-semibold">{listing.title}</h4>
                      <p className="text-sm text-gray-600">
                        {listing.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(listing.status)}
                      <Badge variant={listing.status === 'listed' ? 'default' : 'secondary'}>
                        {getStatusText(listing.status)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="capitalize">{listing.category}</Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {listing.price} SUI
                    </Badge>
                    {listing.file && (
                      <Badge variant="outline">
                        {(listing.file.size / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                    )}
                  </div>

                  {listing.attestation && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Verified by Nautilus TEE:</strong> Data quality score: {listing.attestation.verificationResult.quality}%, 
                        Size: {(listing.attestation.verificationResult.size / 1024 / 1024).toFixed(2)} MB, 
                        Format: {listing.attestation.verificationResult.format}
                      </AlertDescription>
                    </Alert>
                  )}

                  {listing.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {listing.error}
                      </AlertDescription>
                    </Alert>
                  )}

                  {listing.fileHash && (
                    <div className="text-xs text-gray-500">
                      File Hash: {listing.fileHash.substring(0, 20)}...
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}