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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Loading marketplace listings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-red-600">Error: {error}</div>
        <button
          onClick={() => loadListings()}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="aspect-[4/4] bg-gray-200 animate-pulse"></div>
            <div className="p-4 space-y-3">
              <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg font-albert mb-4">No models found</div>
        <p className="text-gray-400">Be the first to upload and sell your AI models on the marketplace!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {listings.map((listing) => (
          <ModelCard key={listing.listingId} model={listing} onPurchase={handlePurchase} />
        ))}
      </div>

      {hasNextPage && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {loadingMore ? 'Loading more...' : 'Load More'}
          </button>
        </div>
      )}

      <div className="text-center text-sm text-gray-500">
        Showing {listings.length} model{listings.length !== 1 ? 's' : ''}
      </div>
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
  const mockDescription = `Encrypted AI model secured by SEAL technology. Listed by ${truncateId(model.creator)} on ${formatDate(model.timestamp)}.`;
  const mockDownloads = Math.floor(Math.random() * 100) + 1;

  return (
    <Link href={`/model/${model.listingId}`} className="block">
      <div className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
        <div className="aspect-[4/4] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={imageUrl} 
            alt={model.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              const target = e.target as HTMLImageElement;
              target.src = '/images/Claude.png';
            }}
          />
        </div>
        {/* Simple overlay for text */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-russo leading-tight flex-1 drop-shadow-sm">{model.title}</h3>
            <div className="ml-2 flex-shrink-0">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-albert text-white/95 mb-3 line-clamp-2 leading-relaxed drop-shadow-sm">
            {mockDescription}
          </p>
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-white drop-shadow-sm">
              {formatPrice(model.downloadPrice)}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-white/90 flex items-center drop-shadow-sm">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                {mockDownloads}
              </div>
              <div className="bg-white/20 border border-white/30 rounded-lg px-4 py-2 text-sm font-medium font-albert text-white hover:bg-white/30 transition-colors">
                View Details
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}