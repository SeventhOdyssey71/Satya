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
import { nautilusClient, type VerificationRequest, type AttestationData } from '@/lib/nautilus-client';

interface DataListing {
  id: string;
  title: string;
  description: string;
  dataType: string;
  price: number;
  file?: File;
  blobId?: string;
  status: 'draft' | 'uploading' | 'verifying' | 'listed' | 'error';
  attestation?: AttestationData;
  error?: string;
}

export function SellerDashboard() {
  const [listings, setListings] = useState<DataListing[]>([]);
  const [currentListing, setCurrentListing] = useState<Partial<DataListing>>({
    title: '',
    description: '',
    dataType: '',
    price: 0,
    status: 'draft',
  });

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCurrentListing(prev => ({ ...prev, file }));
    }
  }, []);

  const handleInputChange = useCallback((field: keyof DataListing, value: string | number) => {
    setCurrentListing(prev => ({ ...prev, [field]: value }));
  }, []);

  const uploadToWalrus = async (file: File): Promise<string> => {
    // Mock Walrus upload - in real implementation, use actual Walrus client
    await new Promise(resolve => setTimeout(resolve, 2000));
    return `blob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const encryptWithSeal = async (blobId: string): Promise<string> => {
    // Mock SEAL encryption - in real implementation, use actual SEAL client
    await new Promise(resolve => setTimeout(resolve, 1500));
    return `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleCreateListing = async () => {
    if (!currentListing.title || !currentListing.file) {
      alert('Please fill in all required fields and select a file');
      return;
    }

    const listingId = `listing_${Date.now()}`;
    const newListing: DataListing = {
      id: listingId,
      title: currentListing.title!,
      description: currentListing.description || '',
      dataType: currentListing.dataType || 'Other',
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

      const blobId = await uploadToWalrus(currentListing.file);
      
      // Step 2: Encrypt with SEAL
      const sealPolicyId = await encryptWithSeal(blobId);
      
      // Step 3: Request Nautilus verification
      setListings(prev => 
        prev.map(listing => 
          listing.id === listingId 
            ? { ...listing, status: 'verifying', blobId }
            : listing
        )
      );

      const verificationRequest: VerificationRequest = {
        assetId: listingId,
        blobId,
        expectedHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        metadata: {
          format: currentListing.file.name.split('.').pop() || 'unknown',
          expectedSize: currentListing.file.size,
        },
      };

      const { requestId } = await nautilusClient.requestVerification(verificationRequest);
      
      // Poll for attestation result
      let attempts = 0;
      const maxAttempts = 10;
      
      const pollAttestation = async (): Promise<void> => {
        if (attempts >= maxAttempts) {
          throw new Error('Verification timeout');
        }
        
        attempts++;
        const attestation = await nautilusClient.getAttestationResult(requestId);
        
        if (!attestation) {
          setTimeout(pollAttestation, 2000);
          return;
        }
        
        // Update listing with attestation
        setListings(prev => 
          prev.map(listing => 
            listing.id === listingId 
              ? { ...listing, status: 'listed', attestation }
              : listing
          )
        );
      };

      await pollAttestation();

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

    // Reset form
    setCurrentListing({
      title: '',
      description: '',
      dataType: '',
      price: 0,
      status: 'draft',
    });
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
              <Label htmlFor="dataType">Data Type</Label>
              <Select onValueChange={(value) => handleInputChange('dataType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select data type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Analytics">Analytics</SelectItem>
                  <SelectItem value="IoT">IoT Sensor Data</SelectItem>
                  <SelectItem value="Financial">Financial</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Research">Research</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
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
            disabled={!currentListing.title || !currentListing.file}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            Create Listing & Verify with Nautilus
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
                    <Badge variant="outline">{listing.dataType}</Badge>
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

                  {listing.blobId && (
                    <div className="text-xs text-gray-500">
                      Blob ID: {listing.blobId}
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