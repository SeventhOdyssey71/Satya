'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/ui/Header'
import { MarketplaceGrid } from '@/components/marketplace/MarketplaceGrid'
import { HiSparkles, HiMagnifyingGlass, HiArrowPath, HiShoppingCart, HiCheckBadge, HiClock } from 'react-icons/hi2'
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { MarketplaceContractService } from '@/lib/services/marketplace-contract.service'

// Disable static generation to avoid service initialization issues during build
export const dynamic = 'force-dynamic'

interface MarketplaceModel {
 id: string;
 title: string;
 description: string;
 category: string;
 tags: string[];
 creator: string;
 modelBlobId: string;
 datasetBlobId?: string;
 qualityScore: number;
 teeVerified: boolean;
 price: string;
 maxDownloads?: number;
 currentDownloads: number;
 totalEarnings: string;
 listedAt: number;
 lastPurchasedAt?: number;
 featured: boolean;
}

interface MarketplaceState {
 models: MarketplaceModel[];
 isLoading: boolean;
 error: string | null;
 lastRefresh: Date | null;
 totalModels: number;
 totalEarnings: string;
}

export default function MarketplacePage() {
 const currentAccount = useCurrentAccount();
 
 const [filters, setFilters] = useState({
  category: 'all',
  search: '',
  verified: 'all',
  priceRange: 'all'
 });

 const [state, setState] = useState<MarketplaceState>({
  models: [],
  isLoading: true,
  error: null,
  lastRefresh: null,
  totalModels: 0,
  totalEarnings: '0'
 });

 const [contractService, setContractService] = useState<MarketplaceContractService | null>(null);

 // Initialize service
 useEffect(() => {
  const initService = async () => {
   try {
    const service = await MarketplaceContractService.createWithFallback();
    setContractService(service);
   } catch (error) {
    console.error('Failed to initialize marketplace service:', error);
    setState(prev => ({ ...prev, error: 'Failed to initialize marketplace service' }));
   }
  };

  initService();
 }, []);

 // Load marketplace models
 const loadMarketplaceModels = async () => {
  if (!contractService) return;

  try {
   setState(prev => ({ ...prev, isLoading: true, error: null }));

   console.log('Loading marketplace models...');
   
   const rawModels = await contractService.getMarketplaceModels(100);
   
   console.log('Loaded raw models:', rawModels);

   // Transform contract data to component format
   const transformedModels: MarketplaceModel[] = rawModels
    .map(obj => {
     try {
      const content = obj.content as any;
      const fields = content?.fields || {};
      
      return {
       id: obj.id,
       title: fields.title || 'Untitled Model',
       description: fields.description || '',
       category: fields.category || 'Uncategorized',
       tags: fields.tags || [],
       creator: fields.creator || '',
       modelBlobId: fields.model_blob_id || '',
       datasetBlobId: fields.dataset_blob_id || undefined,
       qualityScore: parseInt(fields.quality_score || '0'),
       teeVerified: Boolean(fields.tee_verified),
       price: fields.price || '0',
       maxDownloads: fields.max_downloads ? parseInt(fields.max_downloads) : undefined,
       currentDownloads: parseInt(fields.current_downloads || '0'),
       totalEarnings: fields.total_earnings || '0',
       listedAt: parseInt(fields.listed_at || '0'),
       lastPurchasedAt: fields.last_purchased_at ? parseInt(fields.last_purchased_at) : undefined,
       featured: Boolean(fields.featured)
      };
     } catch (error) {
      console.error('Failed to transform model data:', error, obj);
      return null;
     }
    })
    .filter(model => model !== null) as MarketplaceModel[];

   // Calculate stats
   const totalEarnings = transformedModels.reduce(
    (sum, model) => sum + parseFloat(model.totalEarnings || '0'), 
    0
   ).toString();

   setState(prev => ({
    ...prev,
    models: transformedModels,
    isLoading: false,
    lastRefresh: new Date(),
    totalModels: transformedModels.length,
    totalEarnings
   }));

   console.log('Transformed marketplace models:', transformedModels);

  } catch (error) {
   console.error('Failed to load marketplace models:', error);
   setState(prev => ({
    ...prev,
    error: error instanceof Error ? error.message : 'Failed to load models',
    isLoading: false
   }));
  }
 };

 // Load models when service is ready
 useEffect(() => {
  if (contractService) {
   loadMarketplaceModels();
  }
 }, [contractService]);

 // Filter models based on current filters
 const filteredModels = state.models.filter(model => {
  const matchesCategory = filters.category === 'all' || model.category.toLowerCase() === filters.category.toLowerCase();
  const matchesSearch = !filters.search || 
   model.title.toLowerCase().includes(filters.search.toLowerCase()) ||
   model.description.toLowerCase().includes(filters.search.toLowerCase()) ||
   model.tags.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()));
  const matchesVerified = filters.verified === 'all' || 
   (filters.verified === 'verified' && model.teeVerified) ||
   (filters.verified === 'unverified' && !model.teeVerified);
  
  return matchesCategory && matchesSearch && matchesVerified;
 });

 const handleCategoryChange = (category: string) => {
  setFilters(prev => ({ ...prev, category }));
 };

 const handleSearch = (searchQuery: string) => {
  setFilters(prev => ({ ...prev, search: searchQuery }));
 };

 const handleVerifiedFilter = (verified: string) => {
  setFilters(prev => ({ ...prev, verified }));
 };

 return (
  <div className="min-h-screen bg-white">
   {/* Header */}
   <Header />
   
   {/* Hero Banner */}
   <section className="relative py-6 md:py-8">
    <div className="container-custom">
     <div className="max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-albert font-semibold leading-tight mb-3 text-gray-900">
       Discover Trusted AI Models
      </h1>
      
      <p className="text-gray-600 mb-2">
       Browse verified AI models with TEE attestation and transparent pricing.
      </p>
     </div>
    </div>
   </section>
   
   {/* Main Content */}
   <main className="relative z-10 pb-16">
    <div className="container-custom">
     {/* Error Display */}
     {state.error && (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
       <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
         <span className="text-white text-sm font-bold">!</span>
        </div>
        <div>
         <p className="font-medium text-red-800">Error Loading Marketplace</p>
         <p className="text-red-700 text-sm">{state.error}</p>
        </div>
       </div>
       <button
        onClick={loadMarketplaceModels}
        className="mt-3 px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
       >
        <HiArrowPath className="w-4 h-4 mr-1 inline" />
        Retry
       </button>
      </div>
     )}

     {/* Combined Navigation, Categories and Search */}
     <EnhancedNavigation 
      activeCategory={filters.category}
      activeVerified={filters.verified}
      onCategoryChange={handleCategoryChange}
      onVerifiedChange={handleVerifiedFilter}
      onSearch={handleSearch}
      isLoading={state.isLoading}
      onRefresh={loadMarketplaceModels}
      totalResults={filteredModels.length}
     />
     
     {/* Loading State */}
     {state.isLoading && (
      <div className="text-center py-12">
       <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-3" />
       <p className="text-gray-600">Loading marketplace models...</p>
      </div>
     )}

     {/* Empty State */}
     {!state.isLoading && !state.error && filteredModels.length === 0 && (
      <div className="text-center py-12">
       <p className="text-gray-500">
        {filteredModels.length} models found
       </p>
      </div>
     )}
     
     {/* Marketplace Grid - Real Data */}
     {!state.isLoading && !state.error && filteredModels.length > 0 && (
      <EnhancedMarketplaceGrid 
       models={filteredModels}
       contractService={contractService}
       onPurchase={loadMarketplaceModels} // Refresh after purchase
      />
     )}
     
     {/* Footer Guide */}
     <MarketplaceGuide />
    </div>
   </main>
  </div>
 )
}


// Enhanced Navigation with verification filters
function EnhancedNavigation({ 
 activeCategory, 
 activeVerified,
 onCategoryChange, 
 onVerifiedChange,
 onSearch,
 isLoading,
 onRefresh,
 totalResults
}: { 
 activeCategory: string
 activeVerified: string
 onCategoryChange: (category: string) => void
 onVerifiedChange: (verified: string) => void
 onSearch: (query: string) => void
 isLoading: boolean
 onRefresh: () => void
 totalResults: number
}) {
 const [searchQuery, setSearchQuery] = useState('')
 
 const categories = [
  { value: 'all', label: 'All Models', icon: '' },
  { value: 'machine-learning', label: 'Machine Learning', icon: '' },
  { value: 'computer-vision', label: 'Computer Vision', icon: '' },
  { value: 'nlp', label: 'Natural Language', icon: '' },
  { value: 'other', label: 'Other', icon: '' }
 ];

 const verificationFilters = [
  { value: 'all', label: 'All Models' },
  { value: 'verified', label: 'TEE Verified' },
  { value: 'unverified', label: 'Unverified' }
 ]

 const handleSearchSubmit = () => {
  onSearch(searchQuery)
 }

 const handleKeyPress = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter') {
   handleSearchSubmit()
  }
 }

 return (
  <div className="mb-8">
   {/* Search Bar and Category Pills Side by Side */}
   <div className="flex items-center justify-between gap-4 mb-4">
    {/* Category Pills */}
    <div className="bg-white border border-gray-200 rounded-lg p-2 flex-shrink-0">
     <div className="flex items-center gap-2">
      {categories.map((category) => (
       <button
        key={category.value}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
         activeCategory === category.value 
          ? 'bg-gray-900 text-white' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        onClick={() => onCategoryChange(category.value)}
       >
        <span>{category.label}</span>
       </button>
      ))}
     </div>
    </div>

    {/* Search Bar */}
    <div className="relative w-80">
     <input 
      type="text" 
      placeholder="Type in your search here..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      onKeyPress={handleKeyPress}
      className="w-full pl-4 pr-20 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
     />
     <div className="absolute inset-y-0 right-0 flex items-center pr-2">
      <button 
       onClick={handleSearchSubmit}
       className="p-2 bg-black text-white rounded-md hover:bg-gray-800"
      >
       <HiMagnifyingGlass className="h-4 w-4" />
      </button>
     </div>
    </div>
   </div>


   {/* Results Summary */}
   <div className="text-center text-sm text-gray-500 mb-4">
    {totalResults} models found
    {isLoading && (
     <span className="ml-2">
      <div className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-blue-500 border-t-transparent ml-1" />
     </span>
    )}
   </div>
  </div>
 )
}

function MarketplaceGuide() {
 return (
  <div className="mt-12 pt-8 border-t border-gray-200">
   <div className="bg-white p-6 text-center border border-gray-200 rounded-lg">
    <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 text-gray-600 rounded-lg mb-3">
     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
     </svg>
    </div>
    <h3 className="text-lg font-medium mb-3 text-gray-900">Need Help Getting Started?</h3>
    <p className="text-gray-600 mb-4 leading-relaxed max-w-xl mx-auto">
     Learn how to verify AI models, understand TEE attestations, and make secure purchases.
    </p>
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
     <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
      View Marketplace Guide
     </button>
     <button className="px-4 py-2 text-gray-600 hover:text-gray-900">
      Watch Tutorial Videos
     </button>
    </div>
   </div>
  </div>
 )
}

// Enhanced Marketplace Grid with purchase functionality
function EnhancedMarketplaceGrid({ 
 models, 
 contractService,
 onPurchase
}: {
 models: MarketplaceModel[]
 contractService: MarketplaceContractService | null
 onPurchase: () => void
}) {
 const currentAccount = useCurrentAccount()
 const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction()
 const [purchasingModel, setPurchasingModel] = useState<string | null>(null)
 const [purchaseError, setPurchaseError] = useState<string | null>(null)

 const handlePurchase = async (model: MarketplaceModel) => {
  if (!currentAccount || !contractService) {
   setPurchaseError('Please connect your wallet first')
   return
  }

  if (model.creator === currentAccount.address) {
   setPurchaseError('You cannot purchase your own model')
   return
  }

  try {
   setPurchasingModel(model.id)
   setPurchaseError(null)
   
   console.log('Purchasing model:', model.id)
   
   // Create purchase transaction
   const transaction = await contractService.createPurchaseTransaction({
    marketplaceModelId: model.id,
    paymentAmount: model.price
   })

   // Execute transaction
   const result = await signAndExecuteTransaction({ transaction })

   // Transaction succeeded if we get a result with a digest
   if (result && result.digest) {
    console.log('Purchase successful:', result.digest)
    onPurchase() // Refresh marketplace
   } else {
    throw new Error('Purchase transaction failed')
   }

  } catch (error) {
   console.error('Purchase failed:', error)
   setPurchaseError(error instanceof Error ? error.message : 'Purchase failed')
  } finally {
   setPurchasingModel(null)
  }
 }

 const formatPrice = (price: string) => {
  const priceNum = parseFloat(price)
  if (priceNum >= 1000000000) {
   return `${(priceNum / 1000000000).toFixed(2)} SUI`
  }
  return `${(priceNum / 1000000000).toFixed(6)} SUI`
 }

 const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
   month: 'short',
   day: 'numeric',
   year: 'numeric'
  })
 }

 if (models.length === 0) {
  return (
   <div className="text-center py-16">
    <div className="w-24 h-24 bg-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
     <HiSparkles className="w-12 h-12 text-secondary-400" />
    </div>
    <h3 className="text-2xl font-albert font-semibold text-secondary-900 mb-3">No models found</h3>
    <p className="text-secondary-600 font-albert">
     No models match your current filters.
    </p>
   </div>
  )
 }

 return (
  <div className="space-y-6">
   {/* Purchase Error */}
   {purchaseError && (
    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
     <div className="flex items-center gap-2">
      <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
       <span className="text-white text-xs font-bold">!</span>
      </div>
      <p className="text-red-700 text-sm">{purchaseError}</p>
      <button
       onClick={() => setPurchaseError(null)}
       className="ml-auto text-red-600 hover:text-red-800"
      >
       ×
      </button>
     </div>
    </div>
   )}

   {/* Models Grid */}
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {models.map((model) => (
     <div
      key={model.id}
      className="bg-white border border-gray-200 rounded-lg group hover:shadow-lg transition-shadow duration-200"
     >
      {/* Model Header */}
      <div className="p-4 border-b border-gray-200">
       <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
         {model.title}
        </h3>
        <div className="flex items-center gap-1">
         {model.teeVerified && (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
           <HiCheckBadge className="w-3 h-3" />
           TEE
          </div>
         )}
         {model.featured && (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
           <HiSparkles className="w-3 h-3" />
           Featured
          </div>
         )}
        </div>
       </div>
       
       <p className="text-gray-600 text-sm leading-relaxed mb-3 line-clamp-2">
        {model.description}
       </p>

       <div className="flex flex-wrap items-center gap-1 mb-3">
        <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
         {model.category}
        </span>
        {model.tags.slice(0, 2).map((tag, index) => (
         <span key={index} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">
          {tag}
         </span>
        ))}
        {model.tags.length > 2 && (
         <span className="text-xs text-gray-500">
          +{model.tags.length - 2} more
         </span>
        )}
       </div>
      </div>

      {/* Model Stats */}
      <div className="p-4 space-y-3">
       <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="space-y-1">
         <span className="text-gray-600">Quality Score</span>
         <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
           <div 
            className={`h-1.5 rounded-full ${
             model.qualityScore >= 8500 ? 'bg-blue-500' :
             model.qualityScore >= 7000 ? 'bg-blue-400' : 'bg-blue-300'
            }`}
            style={{ width: `${(model.qualityScore / 10000) * 100}%` }}
           />
          </div>
          <span className="font-medium text-gray-900">
           {(model.qualityScore / 100).toFixed(0)}%
          </span>
         </div>
        </div>
        
        <div className="space-y-1">
         <span className="text-gray-600">Downloads</span>
         <p className="font-medium text-gray-900">
          {model.currentDownloads}
          {model.maxDownloads && ` / ${model.maxDownloads}`}
         </p>
        </div>
       </div>

       <div className="flex items-center justify-between text-sm">
        <div className="space-y-1">
         <span className="text-gray-600">Listed</span>
         <p className="text-gray-800">
          {formatDate(model.listedAt)}
         </p>
        </div>
        <div className="text-right space-y-1">
         <span className="text-gray-600">Earnings</span>
         <p className="font-medium text-gray-900">
          {formatPrice(model.totalEarnings)}
         </p>
        </div>
       </div>
      </div>

      {/* Purchase Section */}
      <div className="p-4 border-t border-gray-200">
       <div className="flex items-center justify-between">
        <div>
         <span className="text-xl font-semibold text-gray-900">
          {formatPrice(model.price)}
         </span>
         {model.maxDownloads && model.currentDownloads >= model.maxDownloads && (
          <p className="text-xs text-orange-600 mt-1">
           Limited availability
          </p>
         )}
        </div>
        
        <button
         onClick={() => handlePurchase(model)}
         disabled={
          purchasingModel === model.id ||
          !currentAccount ||
          model.creator === currentAccount?.address ||
          !!(model.maxDownloads && model.currentDownloads >= model.maxDownloads)
         }
         className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
         {purchasingModel === model.id ? (
          <>
           <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
           Purchasing...
          </>
         ) : model.creator === currentAccount?.address ? (
          'Your Model'
         ) : !!(model.maxDownloads && model.currentDownloads >= model.maxDownloads) ? (
          'Sold Out'
         ) : (
          <>
           <HiShoppingCart className="w-4 h-4" />
           Purchase
          </>
         )}
        </button>
       </div>
      </div>
     </div>
    ))}
   </div>
  </div>
 )
}