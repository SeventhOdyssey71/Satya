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
import { nautilusClient, type MarketplaceListing, type AttestationData } from '@/lib/nautilus-client';

interface Purchase {
  id: string;
  listing: MarketplaceListing;
  status: 'pending' | 'processing' | 'verifying' | 'completed' | 'failed';
  purchaseDate: string;
  verificationResult?: AttestationData;
  error?: string;
}

export function BuyerMarketplace() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<MarketplaceListing[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [verifyingData, setVerifyingData] = useState<string | null>(null);

  useEffect(() => {
    loadListings();
  }, []);

  useEffect(() => {
    filterListings();
  }, [listings, searchTerm, selectedType]);

  const loadListings = async () => {
    try {
      setLoading(true);
      const mockListings = await nautilusClient.getMockListings();
      setListings(mockListings);
    } catch (error) {
      console.error('Failed to load listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterListings = useCallback(() => {
    let filtered = listings;

    if (searchTerm) {
      filtered = filtered.filter(listing =>
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(listing => listing.dataType === selectedType);
    }

    setFilteredListings(filtered);
  }, [listings, searchTerm, selectedType]);

  const handlePreviewData = async (listing: MarketplaceListing) => {
    setVerifyingData(listing.id);
    
    try {
      // Simulate downloading a sample and verifying in Nautilus
      const { resultHash, attestation } = await nautilusClient.processDataInEnclave(
        listing.blobId,
        ['preview', 'validate']
      );
      
      // Update listing with fresh verification
      setListings(prev => 
        prev.map(l => 
          l.id === listing.id 
            ? { ...l, verified: true, attestation }
            : l
        )
      );
      
      alert(`Data preview verified! Quality score: ${attestation.verificationResult.quality}%`);
    } catch (error) {
      console.error('Preview failed:', error);
      alert('Failed to preview data. Please try again.');
    } finally {
      setVerifyingData(null);
    }
  };

  const handlePurchase = async (listing: MarketplaceListing) => {
    const purchaseId = `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newPurchase: Purchase = {
      id: purchaseId,
      listing,
      status: 'pending',
      purchaseDate: new Date().toISOString(),
    };

    setPurchases(prev => [...prev, newPurchase]);

    try {
      // Step 1: Escrow payment (simulated)
      setPurchases(prev => 
        prev.map(p => 
          p.id === purchaseId 
            ? { ...p, status: 'processing' }
            : p
        )
      );
      
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 2: Verify data in Nautilus before granting access
      setPurchases(prev => 
        prev.map(p => 
          p.id === purchaseId 
            ? { ...p, status: 'verifying' }
            : p
        )
      );

      const { resultHash, attestation } = await nautilusClient.processDataInEnclave(
        listing.blobId,
        ['verify', 'decrypt']
      );

      // Step 3: Grant access and complete purchase
      setPurchases(prev => 
        prev.map(p => 
          p.id === purchaseId 
            ? { 
                ...p, 
                status: 'completed', 
                verificationResult: attestation 
              }
            : p
        )
      );

      alert('Purchase completed! You now have access to the dataset.');
    } catch (error) {
      console.error('Purchase failed:', error);
      setPurchases(prev => 
        prev.map(p => 
          p.id === purchaseId 
            ? { 
                ...p, 
                status: 'failed', 
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            : p
        )
      );
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading marketplace...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Data Marketplace</h2>
        <Badge variant="secondary">{listings.length} Datasets Available</Badge>
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
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Analytics">Analytics</SelectItem>
                    <SelectItem value="IoT">IoT</SelectItem>
                    <SelectItem value="Financial">Financial</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Research">Research</SelectItem>
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
                        <Badge variant="outline">{listing.dataType}</Badge>
                        {listing.verified && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            Verified
                          </Badge>
                        )}
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
                      <span className="text-muted-foreground">Size:</span>
                      <span>{formatFileSize(listing.size)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Format:</span>
                      <span>{listing.format}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Seller:</span>
                      <span className="font-mono">{listing.seller}</span>
                    </div>
                    
                    {listing.attestation && (
                      <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Quality: {listing.attestation.verificationResult.quality}% | 
                          Verified by Nautilus TEE
                        </AlertDescription>
                      </Alert>
                    )}
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
                              <p className="text-sm text-muted-foreground">
                                {selectedListing.description}
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Price:</span>
                                <div className="font-semibold">{selectedListing.price} SUI</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Size:</span>
                                <div>{formatFileSize(selectedListing.size)}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Format:</span>
                                <div>{selectedListing.format}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Verified:</span>
                                <div className="flex items-center gap-1">
                                  {selectedListing.verified ? (
                                    <>
                                      <CheckCircle className="h-3 w-3 text-green-500" />
                                      Yes
                                    </>
                                  ) : (
                                    <>
                                      <AlertCircle className="h-3 w-3 text-yellow-500" />
                                      No
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <Button 
                              onClick={() => handlePurchase(selectedListing)}
                              className="w-full"
                            >
                              Confirm Purchase
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
                <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No purchases yet</h3>
                <p className="text-muted-foreground">
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
                        <CardTitle className="text-lg">{purchase.listing.title}</CardTitle>
                        <CardDescription>
                          Purchased on {new Date(purchase.purchaseDate).toLocaleDateString()}
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
                        <span className="text-muted-foreground">Price paid:</span>
                        <span>{purchase.listing.price} SUI</span>
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
                        <Button size="sm" className="w-full">
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