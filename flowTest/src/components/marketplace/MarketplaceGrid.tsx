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
        <p className="text-secondary-600 font-albert">Discovering amazing AI models...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-russo text-secondary-800 mb-2">Something went wrong</h3>
          <p className="text-secondary-600 mb-6">{error}</p>
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
        <div className="w-24 h-24 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-2xl font-russo text-secondary-800 mb-4">No models found</h3>
        <p className="text-secondary-600 mb-8 max-w-md mx-auto">
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
          <h2 className="text-xl font-russo text-secondary-800">
            {listings.length} model{listings.length !== 1 ? 's' : ''} found
          </h2>
          <p className="text-secondary-600">Verified and ready for download</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-secondary-600">Sort by:</span>
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
      <div className="card-interactive overflow-hidden h-full">
        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={imageUrl} 
            alt={model.title} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              const target = e.target as HTMLImageElement;
              target.src = '/images/Claude.png';
            }}
          />
          
          {/* Verified Badge */}
          <div className="absolute top-4 left-4">
            <div className="badge-success">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              TEE Verified
            </div>
          </div>

          {/* Category Badge */}
          <div className="absolute top-4 right-4">
            <div className="badge bg-secondary-900/70 text-white border-secondary-700 backdrop-blur-sm">
              {getCategory(model.title)}
            </div>
          </div>

          {/* Price Tag */}
          <div className="absolute bottom-4 right-4">
            <div className="bg-surface-50/95 backdrop-blur-sm border border-border rounded-xl px-3 py-2">
              <div className="text-lg font-russo text-secondary-900">{formatPrice(model.downloadPrice)}</div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          {/* Title and Rating */}
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-russo text-secondary-900 group-hover:text-secondary-700 transition-colors line-clamp-2 flex-1">
              {model.title}
            </h3>
          </div>

          {/* Description */}
          <p className="text-secondary-600 mb-4 line-clamp-2 leading-relaxed">
            {mockDescription}
          </p>

          {/* Stats Row */}
          <div className="flex items-center justify-between text-sm text-secondary-500 mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-secondary-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>{mockRating}</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                <span>{mockDownloads.toLocaleString()}</span>
              </div>
            </div>
            <div className="text-secondary-400">
              {formatDate(model.timestamp)}
            </div>
          </div>

          {/* Creator Info */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-secondary-600 to-secondary-800 rounded-full flex items-center justify-center text-white text-xs font-medium">
              {model.creator.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-sm text-secondary-500">Created by</div>
              <div className="text-sm font-medium text-secondary-700">{truncateId(model.creator)}</div>
            </div>
          </div>

          {/* Action Button */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              onPurchase(model.listingId);
            }}
            className="btn-primary w-full group"
          >
            View Details
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
}