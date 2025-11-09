'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  ShoppingCart, 
  Eye, 
  Shield, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Clock,
  FileText,
  DollarSign,
  Calendar,
  Database,
  Zap
} from 'lucide-react';
import { useAuth } from '@/lib/use-auth';
import { useMarketplace } from '@/lib/use-marketplace';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { nautilusClient, type AttestationData } from '@/lib/nautilus-client';
import { type ListingData } from '@/lib/api-client';

interface Purchase {
  id: string;
  listing: ListingData;
  status: 'pending' | 'processing' | 'verifying' | 'completed' | 'failed';
  purchaseDate: string;
  verificationResult?: AttestationData;
  error?: string;
}

export function BuyerMarketplace() {
  const { isAuthenticated, error: authError } = useAuth();
  const currentAccount = useCurrentAccount();
  const { 
    marketplaceState, 
    purchaseState, 
    fetchListings, 
    purchaseListing,
    getDownloadLink,
    resetPurchaseState 
  } = useMarketplace();
  
  const [filteredListings, setFilteredListings] = useState<ListingData[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedListing, setSelectedListing] = useState<ListingData | null>(null);
  const [verifyingData, setVerifyingData] = useState<string | null>(null);

  useEffect(() => {
    filterListings();
  }, [marketplaceState.listings, searchTerm, selectedType]);

  const filterListings = useCallback(() => {
    let filtered = marketplaceState.listings;

    if (searchTerm) {
      filtered = filtered.filter(listing =>
        (listing.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (listing.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(listing => listing.category === selectedType);
    }

    setFilteredListings(filtered);
  }, [marketplaceState.listings, searchTerm, selectedType]);

  const handlePreviewData = async (listing: ListingData) => {
    if (!isAuthenticated) {
      alert('Please connect your wallet to preview data');
      return;
    }
    
    setVerifyingData(listing.id);
    
    try {
      // Use the file hash as blob ID for Nautilus verification
      const { resultHash, attestation } = await nautilusClient.processDataInEnclave(
        listing.fileHash,
        ['preview', 'validate']
      );
      
      alert(`Data preview verified! Quality score: ${attestation.verificationResult.quality}%`);
    } catch (error) {
      console.error('Preview failed:', error);
      alert('Failed to preview data. Please try again.');
    } finally {
      setVerifyingData(null);
    }
  };

  const handlePurchase = async (listing: ListingData) => {
    if (!isAuthenticated) {
      alert('Please connect your wallet to make a purchase');
      return;
    }

    const success = await purchaseListing(listing.id);
    
    if (success && purchaseState.purchaseId) {
      // Add to local purchases list
      const newPurchase: Purchase = {
        id: purchaseState.purchaseId,
        listing,
        status: 'completed',
        purchaseDate: new Date().toISOString(),
      };
      setPurchases(prev => [...prev, newPurchase]);
      alert('Purchase completed! You now have access to the dataset.');
    }
  };

  const handleDownload = async (purchase: Purchase) => {
    try {
      const downloadUrl = await getDownloadLink(purchase.id);
      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
      } else {
        alert('Failed to generate download link');
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: Purchase['status']) => {
    switch (status) {
      case 'processing':
      case 'verifying':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (marketplaceState.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading marketplace...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Authentication Status */}
      {!currentAccount ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please connect your wallet to access marketplace features
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
      {marketplaceState.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{marketplaceState.error}</AlertDescription>
        </Alert>
      )}

      {authError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Authentication Error: {authError}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Data Marketplace</h2>
        <Badge variant="secondary">{marketplaceState.listings.length} Datasets Available</Badge>
      </div>

      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browse">Browse Datasets</TabsTrigger>
          <TabsTrigger value="purchases">My Purchases</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search datasets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Listings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <Card key={listing.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{listing.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="outline">{listing.category}</Badge>
                        <Badge variant="default" className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Blockchain Verified
                        </Badge>
                      </div>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {listing.price} SUI
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <CardDescription className="mb-4">
                    {listing.description}
                  </CardDescription>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">File Hash:</span>
                      <span className="font-mono text-xs">{listing.fileHash ? listing.fileHash.substring(0, 8) + '...' : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Category:</span>
                      <span className="capitalize">{listing.category}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Seller:</span>
                      <span className="font-mono text-xs">{listing.sellerAddress ? listing.sellerAddress.substring(0, 8) + '...' : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Created:</span>
                      <span>{listing.createdAt ? new Date(listing.createdAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </CardContent>
                
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreviewData(listing)}
                      disabled={verifyingData === listing.id}
                      className="flex-1"
                    >
                      {verifyingData === listing.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Eye className="h-4 w-4 mr-2" />
                      )}
                      Preview
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => setSelectedListing(listing)}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Buy
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Purchase Dataset</DialogTitle>
                          <DialogDescription>
                            Review the details before purchasing
                          </DialogDescription>
                        </DialogHeader>
                        {selectedListing && (
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold">{selectedListing.title}</h4>
                              <p className="text-sm text-gray-600">
                                {selectedListing.description}
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Price:</span>
                                <div className="font-semibold">{selectedListing.price} SUI</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Category:</span>
                                <div className="capitalize">{selectedListing.category}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">File Hash:</span>
                                <div className="font-mono text-xs">{selectedListing.fileHash.substring(0, 16)}...</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Verified:</span>
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  Blockchain
                                </div>
                              </div>
                            </div>
                            
                            <Button 
                              onClick={() => handlePurchase(selectedListing)}
                              className="w-full"
                              disabled={purchaseState.isLoading}
                            >
                              {purchaseState.isLoading ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Processing Purchase...
                                </>
                              ) : (
                                'Confirm Purchase'
                              )}
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="purchases" className="space-y-4">
          {purchases.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Database className="h-12 w-12 mx-auto text-gray-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No purchases yet</h3>
                <p className="text-gray-600">
                  Start exploring the marketplace to find valuable datasets
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <Card key={purchase.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{purchase.listing?.title || 'Unknown Item'}</CardTitle>
                        <CardDescription>
                          Purchased on {purchase.purchaseDate ? new Date(purchase.purchaseDate).toLocaleDateString() : 'Unknown Date'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(purchase.status)}
                        <Badge variant={purchase.status === 'completed' ? 'default' : 'secondary'}>
                          {purchase.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Price paid:</span>
                        <span>{purchase.listing?.price || 'N/A'} SUI</span>
                      </div>
                      
                      {purchase.verificationResult && (
                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Verified by Nautilus:</strong> Quality {purchase.verificationResult.verificationResult.quality}%, 
                            Size {formatFileSize(purchase.verificationResult.verificationResult.size)}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {purchase.error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{purchase.error}</AlertDescription>
                        </Alert>
                      )}
                      
                      {purchase.status === 'completed' && (
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleDownload(purchase)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Dataset
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}