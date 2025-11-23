'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { EventService, ModelListedEvent, EventQueryResult } from '@/lib/services/event-service';
import { logger } from '@/lib/integrations/core/logger';

interface MarketplaceGridProps {
 filters?: {
  category: string;
  search: string;
 };
}

export const MarketplaceGrid: React.FC<MarketplaceGridProps> = ({ filters }) => {
 const [listings, setListings] = useState<ModelListedEvent[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [hasNextPage, setHasNextPage] = useState(false);
 const [nextCursor, setNextCursor] = useState<any>();
 const [loadingMore, setLoadingMore] = useState(false);

 const eventService = new EventService();

 const loadListings = async (cursor?: any) => {
  try {
   if (!cursor) {
    setLoading(true);
    setError(null);
   } else {
    setLoadingMore(true);
   }

   const result: EventQueryResult = await eventService.getModelListings(20, cursor);
   
   let filteredEvents = result.events as ModelListedEvent[];
   
   // Apply client-side filtering
   if (filters) {
    if (filters.search) {
     filteredEvents = filteredEvents.filter(event =>
      event.title.toLowerCase().includes(filters.search.toLowerCase())
     );
    }
    // Note: category filtering would need category data from the smart contract
    // For now, we'll skip category filtering since it's not in the event data
   }
   
   if (!cursor) {
    setListings(filteredEvents);
   } else {
    setListings(prev => [...prev, ...filteredEvents]);
   }
   
   setHasNextPage(result.hasNextPage);
   setNextCursor(result.nextCursor);
  } catch (err) {
   const errorMessage = err instanceof Error ? err.message : 'Failed to load marketplace listings';
   logger.error('Failed to load marketplace listings', { error: err });
   setError(errorMessage);
  } finally {
   setLoading(false);
   setLoadingMore(false);
  }
 };

 useEffect(() => {
  loadListings();
 }, []);

 useEffect(() => {
  if (filters) {
   loadListings(); // Reload when filters change
  }
 }, [filters]);

 const handlePurchase = (listingId: string) => {
  // TODO: Implement purchase flow
  logger.info('Purchase requested', { listingId });
  alert(`Purchase functionality for listing ${listingId} coming soon!`);
 };

 const loadMore = () => {
  if (hasNextPage && !loadingMore && nextCursor) {
   loadListings(nextCursor);
  }
 };

 if (loading) {
  return (
   <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <div className="w-12 h-12 border-4 border-secondary-200 border-t-secondary-600 rounded-full animate-spin"></div>
    <p className="text-secondary-800 font-albert">Discovering amazing AI models...</p>
   </div>
  );
 }

 if (error) {
  return (
   <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
    <div className="w-16 h-16 bg-white border border-surface-300 rounded-full flex items-center justify-center">
     <svg className="w-8 h-8 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
     </svg>
    </div>
    <div className="text-center">
     <h3 className="text-xl font-albert font-semibold text-secondary-800 mb-2">Something went wrong</h3>
     <p className="text-secondary-800 mb-6">{error}</p>
     <button
      onClick={() => loadListings()}
      className="btn-primary"
     >
      Try Again
     </button>
    </div>
   </div>
  );
 }

 if (listings.length === 0) {
  return (
   <div className="text-center py-20">
    <div className="w-24 h-24 bg-white border border-surface-300 rounded-full flex items-center justify-center mx-auto mb-6">
     <svg className="w-12 h-12 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
     </svg>
    </div>
    <h3 className="text-2xl font-albert font-bold text-secondary-800 mb-4">No models found</h3>
    <p className="text-secondary-800 mb-8 max-w-md mx-auto">
     Be the first to upload and sell your AI models on the marketplace! Start building the future of trusted AI.
    </p>
    <button className="btn-primary btn-lg">
     Upload Your Model
    </button>
   </div>
  );
 }

 return (
  <div className="space-y-8">
   {/* Results Header */}
   <div className="flex items-center justify-between">
    <div>
     <h2 className="text-xl font-albert font-semibold text-secondary-800">
      {listings.length} model{listings.length !== 1 ? 's' : ''} found
     </h2>
     <p className="text-secondary-800">Verified and ready for download</p>
    </div>
    <div className="flex items-center gap-2">
     <span className="text-sm text-secondary-800">Sort by:</span>
     <select className="input py-2 px-3 text-sm">
      <option>Most Popular</option>
      <option>Newest</option>
      <option>Price: Low to High</option>
      <option>Price: High to Low</option>
     </select>
    </div>
   </div>

   {/* Models Grid */}
   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
    {listings.map((listing, index) => (
     <div key={listing.listingId} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
      <ModelCard model={listing} onPurchase={handlePurchase} />
     </div>
    ))}
   </div>

   {/* Load More */}
   {hasNextPage && (
    <div className="flex justify-center pt-8">
     <button
      onClick={loadMore}
      disabled={loadingMore}
      className="btn-secondary btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
     >
      {loadingMore ? (
       <>
        <div className="w-5 h-5 border-2 border-secondary-300 border-t-secondary-600 rounded-full animate-spin mr-2"></div>
        Loading more models...
       </>
      ) : (
       'Load More Models'
      )}
     </button>
    </div>
   )}
  </div>
 );
};

function ModelCard({ model, onPurchase }: { model: ModelListedEvent, onPurchase: (id: string) => void }) {
 // Use placeholder image for now since we don't have image data in the events
 const imageUrl = '/images/Claude.png';

 const formatPrice = (price: string) => {
  const priceNum = parseFloat(price);
  if (isNaN(priceNum)) return '0 SUI';
  return `${(priceNum / 1e9).toFixed(4)} SUI`;
 };

 const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString();
 };

 const truncateId = (id: string) => {
  return `${id.slice(0, 8)}...${id.slice(-8)}`;
 };

 // Generate a mock description for now since it's not in the event data
 const mockDescription = `Advanced AI model with TEE verification and cryptographic integrity proofs.`;
 const mockDownloads = Math.floor(Math.random() * 1000) + 50;
 const mockRating = (Math.random() * 1 + 4).toFixed(1); // 4.0 - 5.0

 // Mock categories based on title
 const getCategory = (title: string) => {
  if (title.toLowerCase().includes('vision') || title.toLowerCase().includes('image')) return 'Computer Vision';
  if (title.toLowerCase().includes('language') || title.toLowerCase().includes('nlp')) return 'NLP';
  if (title.toLowerCase().includes('medical') || title.toLowerCase().includes('health')) return 'Healthcare';
  return 'Machine Learning';
 };

 return (
  <Link href={`/model/${model.listingId}`} className="block group">
   <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
    {/* Image Section */}
    <div className="h-48 relative overflow-hidden">
     {/* eslint-disable-next-line @next/next/no-img-element */}
     <img 
      src={imageUrl} 
      alt={model.title} 
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      onError={(e) => {
       // Fallback to placeholder if image fails to load
       const target = e.target as HTMLImageElement;
       target.src = '/images/Claude.png';
      }}
     />
    </div>

    {/* Content Section */}
    <div className="p-4">
     {/* Title */}
     <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2">
      {model.title}
     </h3>
     
     {/* Description */}
     <p className="text-sm text-gray-600 mb-4 line-clamp-2">
      {mockDescription}
     </p>
     
     {/* Tags */}
     <div className="flex gap-2 mb-4">
      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
       TEE Verified
      </span>
      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
       {getCategory(model.title)}
      </span>
     </div>
     
     {/* Stats Row */}
     <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
      <div className="flex items-center gap-2">
       <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
       </svg>
       <span>{mockRating}</span>
      </div>
      <span>{mockDownloads.toLocaleString()} downloads</span>
     </div>
     
     {/* Price and Button */}
     <div className="flex items-center justify-between">
      <span className="text-lg font-semibold text-gray-900">
       {formatPrice(model.downloadPrice)}
      </span>
      <button 
       onClick={(e) => {
        e.preventDefault();
        onPurchase(model.listingId);
       }}
       className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 transition-colors"
      >
       View Details
      </button>
     </div>
    </div>
   </div>
  </Link>
 );
}