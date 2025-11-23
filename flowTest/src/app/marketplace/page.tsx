'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/ui/Header'
import { MarketplaceGrid } from '@/components/marketplace/MarketplaceGrid'
import { HiSparkles, HiMagnifyingGlass, HiArrowPath, HiShoppingCart, HiCheckBadge, HiClock } from 'react-icons/hi2'
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { MarketplaceContractService } from '@/lib/services/marketplace-contract.service'

// Disable static generation to avoid service initialization issues during build
export const dynamic = 'force-dynamic'

// Helper function to normalize category for comparison
const normalizeCategory = (category: string) => {
 return category.toLowerCase().replace(/\s+/g, '-');
};

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

 const [pagination, setPagination] = useState({
  currentPage: 1,
  itemsPerPage: 6
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
 const [hasLoadedModels, setHasLoadedModels] = useState(false);

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
   const transformedModels: MarketplaceModel[] = (rawModels || [])
    .map(obj => {
     try {
      const content = obj.data?.content as any;
      const fields = content?.fields || {};
      
      return {
       id: obj.data?.objectId || '',
       title: fields.title || 'Untitled Model',
       description: fields.description || '',
       category: fields.category || 'Uncategorized',
       tags: fields.tags || [],
       creator: fields.creator || '',
       modelBlobId: fields.model_blob_id || '',
       datasetBlobId: fields.dataset_blob_id || undefined,
       qualityScore: fields.quality_score ? Math.round(parseInt(fields.quality_score) / 10000) : 0,
       teeVerified: Boolean(fields.tee_verified),
       price: fields.price || '0',
       maxDownloads: fields.max_downloads ? parseInt(fields.max_downloads) : undefined,
       currentDownloads: parseInt(fields.current_downloads || '0'),
       totalEarnings: fields.total_earnings || '0',
       listedAt: fields.listed_at ? parseInt(fields.listed_at) : Date.now(),
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

 // Load models when service is ready (only once)
 useEffect(() => {
  if (contractService && !hasLoadedModels) {
   loadMarketplaceModels();
   setHasLoadedModels(true);
  }
 }, [contractService, hasLoadedModels]);

 // Removed auto-refresh to prevent random refreshing
 // Users can manually refresh if needed

 // Filter models based on current filters
 const filteredModels = state.models.filter(model => {
  const matchesCategory = filters.category === 'all' || 
   normalizeCategory(model.category) === filters.category ||
   model.category.toLowerCase() === filters.category.toLowerCase();
  const matchesSearch = !filters.search || 
   model.title.toLowerCase().includes(filters.search.toLowerCase()) ||
   model.description.toLowerCase().includes(filters.search.toLowerCase()) ||
   model.tags.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()));
  const matchesVerified = filters.verified === 'all' || 
   (filters.verified === 'verified' && model.teeVerified) ||
   (filters.verified === 'unverified' && !model.teeVerified);
  
  return matchesCategory && matchesSearch && matchesVerified;
 });

 // Pagination calculations
 const totalPages = Math.ceil(filteredModels.length / pagination.itemsPerPage);
 const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
 const endIndex = startIndex + pagination.itemsPerPage;
 const paginatedModels = filteredModels.slice(startIndex, endIndex);

 // Reset to first page when filters change
 const resetPagination = () => {
  setPagination(prev => ({ ...prev, currentPage: 1 }));
 };

 const handleCategoryChange = (category: string) => {
  setFilters(prev => ({ ...prev, category }));
  resetPagination();
 };

 const handleSearch = (searchQuery: string) => {
  setFilters(prev => ({ ...prev, search: searchQuery }));
  resetPagination();
 };

 const handleVerifiedFilter = (verified: string) => {
  setFilters(prev => ({ ...prev, verified }));
  resetPagination();
 };

 const handlePageChange = (page: number) => {
  setPagination(prev => ({ ...prev, currentPage: page }));
  // Scroll to top of marketplace section
  window.scrollTo({ top: 200, behavior: 'smooth' });
 };

 return (
  <div className="min-h-screen bg-white pt-16">
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
   <main className="relative z-10 pb-8">
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
      totalResults={filteredModels.length}
      models={state.models}
     />
     
     {/* Loading State */}
     {state.isLoading && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
       {[...Array(9)].map((_, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
         {/* Model Image Placeholder */}
         <div className="h-48 bg-gray-200 animate-pulse"></div>
         
         <div className="p-4">
          {/* Title */}
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-3 animate-pulse"></div>
          
          {/* Description */}
          <div className="space-y-2 mb-4">
           <div className="h-3 bg-gray-100 rounded animate-pulse"></div>
           <div className="h-3 bg-gray-100 rounded w-5/6 animate-pulse"></div>
          </div>
          
          {/* Tags */}
          <div className="flex gap-2 mb-4">
           <div className="h-5 bg-gray-100 rounded-full w-16 animate-pulse"></div>
           <div className="h-5 bg-gray-100 rounded-full w-12 animate-pulse"></div>
          </div>
          
          {/* Stats Row */}
          <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
           </div>
           <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
          
          {/* Price and Button */}
          <div className="flex items-center justify-between">
           <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
           <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
         </div>
        </div>
       ))}
      </div>
     )}

     {/* Empty State */}
     {!state.isLoading && !state.error && filteredModels.length === 0 && (
      <div className="text-center py-12">
       <p className="text-gray-500">
        No models found
       </p>
      </div>
     )}
     
     {/* Marketplace Grid - Real Data */}
     {!state.isLoading && !state.error && filteredModels.length > 0 && (
      <>
       <EnhancedMarketplaceGrid 
        models={paginatedModels}
        contractService={contractService}
        onPurchase={loadMarketplaceModels} // Refresh after purchase
       />
       
       {/* Pagination */}
       {totalPages > 1 && (
        <PaginationControls
         currentPage={pagination.currentPage}
         totalPages={totalPages}
         onPageChange={handlePageChange}
         totalItems={filteredModels.length}
         itemsPerPage={pagination.itemsPerPage}
        />
       )}
      </>
     )}
     
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
 totalResults,
 models
}: { 
 activeCategory: string
 activeVerified: string
 onCategoryChange: (category: string) => void
 onVerifiedChange: (verified: string) => void
 onSearch: (query: string) => void
 isLoading: boolean
 totalResults: number
 models: MarketplaceModel[]
}) {
 const [searchQuery, setSearchQuery] = useState('')
 
 const categories = [
  { value: 'all', label: 'All Models', icon: '' },
  { value: 'machine-learning', label: 'Machine Learning', icon: '' },
  { value: 'computer-vision', label: 'Computer Vision', icon: '' },
  { value: 'natural-language', label: 'Natural Language', icon: '' },
  { value: 'nlp', label: 'NLP', icon: '' },
  { value: 'other', label: 'Other', icon: '' }
 ];

 // Get unique categories from actual model data
 const modelCategories = [...new Set(models.map(model => model.category))]
  .filter(Boolean)
  .map(category => ({
   value: normalizeCategory(category),
   label: category,
   icon: ''
  }));

 // Combine predefined categories with dynamic ones
 const allCategories = [
  { value: 'all', label: 'All Models', icon: '' },
  ...modelCategories
 ];

 // Use dynamic categories if available, fallback to predefined
 const displayCategories = modelCategories.length > 0 ? allCategories : categories;

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
      {displayCategories.map((category) => (
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
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
    {models.map((model, index) => (
     <div
      key={model.id || `model-${index}`}
      className="relative rounded-2xl overflow-hidden group hover:shadow-lg transition-all duration-300 bg-white border border-gray-300 shadow-sm"
      style={{
       height: '400px'
      }}
     >
      {/* Background Image Section */}
      <div 
        className="relative h-48 overflow-hidden"
        style={{
          backgroundImage: "url('/images/Claude.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        
        {/* Top badges */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <span className="inline-flex items-center px-3 py-1.5 bg-white/95 backdrop-blur-sm text-gray-700 rounded-full text-xs font-medium shadow-sm">
            {model.category}
          </span>
          {model.teeVerified && (
            <div className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded-full text-xs font-medium shadow-sm">
              <HiCheckBadge className="w-3 h-3" />
              Verified
            </div>
          )}
        </div>
        
        {/* Title at bottom of image */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white mb-1 drop-shadow-lg">
            {model.title}
          </h3>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 flex flex-col justify-between" style={{ height: '200px' }}>
        {/* Model Details Section - Fixed height for uniformity */}
        <div className="flex-1 space-y-2">
          {/* Description - Fixed 2 lines max */}
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 h-10">
            {model.description}
          </p>
          
          {/* Tags Section - Fixed height container */}
          <div className="h-6">
            {model.tags && model.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {model.tags.slice(0, 3).map((tag, tagIndex) => (
                  <span 
                    key={tagIndex}
                    className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
                {model.tags.length > 3 && (
                  <span className="text-xs text-gray-400">
                    +{model.tags.length - 3}
                  </span>
                )}
              </div>
            ) : (
              <div></div>
            )}
          </div>
        </div>
        
        {/* Bottom Section - Always aligned */}
        <div className="space-y-2">
          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>Quality: {model.qualityScore}%</span>
            </div>
            <div className="flex items-center gap-1">
              <HiClock className="w-3 h-3" />
              <span>{formatDate(model.listedAt)}</span>
            </div>
          </div>
          
          {/* Action Button */}
          <button
            onClick={() => handlePurchase(model)}
            disabled={
              purchasingModel === model.id ||
              !currentAccount ||
              model.creator === currentAccount?.address ||
              !!(model.maxDownloads && model.currentDownloads >= model.maxDownloads)
            }
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {purchasingModel === model.id ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Processing...
              </>
            ) : model.creator === currentAccount?.address ? (
              'Your Model'
            ) : !!(model.maxDownloads && model.currentDownloads >= model.maxDownloads) ? (
              'Sold Out'
            ) : (
              <>
                Verify Model
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
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

// Pagination Controls Component
function PaginationControls({ 
 currentPage, 
 totalPages, 
 onPageChange, 
 totalItems, 
 itemsPerPage 
}: {
 currentPage: number
 totalPages: number
 onPageChange: (page: number) => void
 totalItems: number
 itemsPerPage: number
}) {
 const startItem = (currentPage - 1) * itemsPerPage + 1;
 const endItem = Math.min(currentPage * itemsPerPage, totalItems);

 const getPageNumbers = () => {
  const pages = [];
  
  if (totalPages <= 7) {
   // Show all pages if 7 or fewer
   for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
   }
  } else {
   // Show smart pagination with ellipsis
   if (currentPage <= 4) {
    // Near the beginning
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push("...");
    pages.push(totalPages);
   } else if (currentPage >= totalPages - 3) {
    // Near the end
    pages.push(1);
    pages.push("...");
    for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
   } else {
    // In the middle
    pages.push(1);
    pages.push("...");
    for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
    pages.push("...");
    pages.push(totalPages);
   }
  }
  
  return pages;
 };

 return (
  <div className="mt-8 pt-6 border-t border-gray-200">
   <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
    {/* Results Info */}
    <div className="text-sm text-gray-600">
     Showing {startItem}-{endItem} of {totalItems} models
    </div>
    
    {/* Page Controls */}
    <div className="flex items-center gap-2">
     {/* Previous Button */}
     <button
      onClick={() => onPageChange(currentPage - 1)}
      disabled={currentPage === 1}
      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
     >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Previous
     </button>
     
     {/* Page Numbers */}
     <div className="flex items-center gap-1">
      {getPageNumbers().map((page, index) => (
       <button
        key={index}
        onClick={() => typeof page === "number" ? onPageChange(page) : undefined}
        disabled={typeof page !== "number"}
        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
         page === currentPage
          ? "bg-blue-600 text-white"
          : typeof page === "number"
          ? "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
          : "text-gray-400 cursor-default"
        }`}
       >
        {page}
       </button>
      ))}
     </div>
     
     {/* Next Button */}
     <button
      onClick={() => onPageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
     >
      Next
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
     </button>
    </div>
   </div>
  </div>
 )
}
