// Smart Contract Event Querying Service
import { SuiClient } from '@mysten/sui.js/client';
import { SUI_CONFIG, MARKETPLACE_CONFIG } from '../constants';
import { logger } from '../integrations/core/logger';

export interface ModelListedEvent {
  type: 'ModelListed';
  listingId: string;
  seller: string;
  title: string;
  category: string;
  price: string;
  blobId?: string;
  isEncrypted: boolean;
  timestamp: number;
  transactionDigest: string;
}

export interface ModelPurchasedEvent {
  type: 'ModelPurchased';
  listingId: string;
  buyer: string;
  seller: string;
  price: string;
  timestamp: number;
  transactionDigest: string;
}

export interface ModelUpdatedEvent {
  type: 'ModelUpdated';
  listingId: string;
  seller: string;
  newPrice?: string;
  newStatus?: string;
  timestamp: number;
  transactionDigest: string;
}

export type MarketplaceEvent = ModelListedEvent | ModelPurchasedEvent | ModelUpdatedEvent;

export interface EventFilter {
  eventType?: string;
  sender?: string;
  timeRange?: {
    start: number;
    end: number;
  };
  limit?: number;
  cursor?: any; // Use any to avoid type conflicts with SuiClient
}

export interface EventQueryResult {
  events: MarketplaceEvent[];
  hasNextPage: boolean;
  nextCursor?: any;
  totalCount?: number;
}

export interface EventSubscription {
  id: string;
  filter: EventFilter;
  callback: (event: MarketplaceEvent) => void;
  isActive: boolean;
}

export class EventService {
  private client: SuiClient;
  private packageId: string;
  private subscriptions: Map<string, EventSubscription> = new Map();
  private polling: boolean = false;
  private pollingInterval?: NodeJS.Timeout;
  private lastKnownCursor?: any;

  constructor() {
    this.client = new SuiClient({ 
      url: SUI_CONFIG.NETWORK === 'testnet' 
        ? 'https://fullnode.testnet.sui.io:443'
        : 'https://fullnode.mainnet.sui.io:443'
    });
    this.packageId = MARKETPLACE_CONFIG.PACKAGE_ID || '';
  }

  /**
   * Query events from the blockchain with filtering options
   */
  async queryEvents(filter: EventFilter = {}): Promise<EventQueryResult> {
    try {
      logger.info('Querying blockchain events', { filter });

      const query = {
        MoveEventType: `${this.packageId}::marketplace::ModelListed`
      };

      const response = await this.client.queryEvents({
        query,
        cursor: filter.cursor || null,
        limit: filter.limit || 50,
        order: 'descending'
      });

      const events = response.data
        .map(event => this.parseEvent(event))
        .filter((event): event is MarketplaceEvent => event !== null)
        .filter(event => this.applyEventFilter(event, filter));

      return {
        events,
        hasNextPage: response.hasNextPage,
        nextCursor: response.nextCursor || undefined,
        totalCount: events.length
      };

    } catch (error) {
      logger.error('Failed to query events', { error, filter });
      throw new Error(`Event query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all model listing events
   */
  async getModelListings(limit: number = 20, cursor?: string): Promise<EventQueryResult> {
    return this.queryEvents({
      eventType: 'ModelListed',
      limit,
      cursor
    });
  }

  /**
   * Get purchase events for a specific user
   */
  async getUserPurchases(userAddress: string, limit: number = 20): Promise<ModelPurchasedEvent[]> {
    const result = await this.queryEvents({
      eventType: 'ModelPurchased',
      sender: userAddress,
      limit
    });

    return result.events.filter(event => event.type === 'ModelPurchased') as ModelPurchasedEvent[];
  }

  /**
   * Get events for a specific model listing
   */
  async getModelEvents(listingId: string): Promise<MarketplaceEvent[]> {
    const allEvents = await this.queryEvents({ limit: 1000 });
    
    return allEvents.events.filter(event => {
      if ('listingId' in event) {
        return event.listingId === listingId;
      }
      return false;
    });
  }

  /**
   * Get recent marketplace activity
   */
  async getRecentActivity(limit: number = 10): Promise<MarketplaceEvent[]> {
    const result = await this.queryEvents({ limit });
    return result.events.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Subscribe to real-time events
   */
  subscribeToEvents(
    filter: EventFilter,
    callback: (event: MarketplaceEvent) => void
  ): string {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const subscription: EventSubscription = {
      id: subscriptionId,
      filter,
      callback,
      isActive: true
    };

    this.subscriptions.set(subscriptionId, subscription);
    
    // Start polling if not already running
    if (!this.polling) {
      this.startPolling();
    }

    logger.info('Created event subscription', { subscriptionId, filter });
    return subscriptionId;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribeFromEvents(subscriptionId: string): boolean {
    const removed = this.subscriptions.delete(subscriptionId);
    
    // Stop polling if no active subscriptions
    if (this.subscriptions.size === 0 && this.polling) {
      this.stopPolling();
    }

    logger.info('Removed event subscription', { subscriptionId, removed });
    return removed;
  }

  /**
   * Get marketplace statistics from events
   */
  async getMarketplaceStats(timeRange?: { start: number; end: number }) {
    const allEvents = await this.queryEvents({ 
      timeRange,
      limit: 1000 
    });

    const stats = {
      totalListings: 0,
      totalPurchases: 0,
      totalVolume: '0',
      averagePrice: '0',
      activeListings: 0,
      uniqueSellers: new Set<string>(),
      uniqueBuyers: new Set<string>(),
      categoryBreakdown: new Map<string, number>(),
      recentActivity: [] as MarketplaceEvent[]
    };

    let totalVolumeNum = 0;
    const prices: number[] = [];

    for (const event of allEvents.events) {
      if (event.type === 'ModelListed') {
        stats.totalListings++;
        stats.uniqueSellers.add(event.seller);
        
        if (event.category) {
          stats.categoryBreakdown.set(
            event.category,
            (stats.categoryBreakdown.get(event.category) || 0) + 1
          );
        }
      } else if (event.type === 'ModelPurchased') {
        stats.totalPurchases++;
        stats.uniqueBuyers.add(event.buyer);
        
        const price = parseFloat(event.price);
        if (!isNaN(price)) {
          totalVolumeNum += price;
          prices.push(price);
        }
      }
    }

    stats.totalVolume = totalVolumeNum.toString();
    stats.averagePrice = prices.length > 0 
      ? (prices.reduce((a, b) => a + b, 0) / prices.length).toString()
      : '0';
    
    stats.recentActivity = allEvents.events
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    return {
      ...stats,
      uniqueSellers: stats.uniqueSellers.size,
      uniqueBuyers: stats.uniqueBuyers.size,
      categoryBreakdown: Object.fromEntries(stats.categoryBreakdown)
    };
  }

  /**
   * Parse raw event data into typed event objects
   */
  private parseEvent(rawEvent: any): MarketplaceEvent | null {
    try {
      const eventType = rawEvent.type.split('::').pop();
      const fields = rawEvent.parsedJson || {};
      const timestamp = parseInt(rawEvent.timestampMs) || Date.now();

      switch (eventType) {
        case 'ModelListed':
          return {
            type: 'ModelListed',
            listingId: fields.listing_id || fields.listingId || '',
            seller: fields.seller || '',
            title: fields.title || '',
            category: fields.category || '',
            price: fields.price?.toString() || '0',
            blobId: fields.blob_id || fields.blobId,
            isEncrypted: fields.is_encrypted || fields.isEncrypted || false,
            timestamp,
            transactionDigest: rawEvent.id.txDigest
          };

        case 'ModelPurchased':
          return {
            type: 'ModelPurchased',
            listingId: fields.listing_id || fields.listingId || '',
            buyer: fields.buyer || '',
            seller: fields.seller || '',
            price: fields.price?.toString() || '0',
            timestamp,
            transactionDigest: rawEvent.id.txDigest
          };

        case 'ModelUpdated':
          return {
            type: 'ModelUpdated',
            listingId: fields.listing_id || fields.listingId || '',
            seller: fields.seller || '',
            newPrice: fields.new_price?.toString() || fields.newPrice?.toString(),
            newStatus: fields.new_status || fields.newStatus,
            timestamp,
            transactionDigest: rawEvent.id.txDigest
          };

        default:
          logger.warn('Unknown event type', { eventType, rawEvent });
          return null;
      }
    } catch (error) {
      logger.error('Failed to parse event', { error, rawEvent });
      return null;
    }
  }

  /**
   * Apply filters to events
   */
  private applyEventFilter(event: MarketplaceEvent, filter: EventFilter): boolean {
    if (filter.eventType && event.type !== filter.eventType) {
      return false;
    }

    if (filter.sender) {
      const eventSender = (event as any).seller || (event as any).buyer || '';
      if (eventSender !== filter.sender) {
        return false;
      }
    }

    if (filter.timeRange) {
      if (event.timestamp < filter.timeRange.start || 
          event.timestamp > filter.timeRange.end) {
        return false;
      }
    }

    return true;
  }

  /**
   * Start polling for new events
   */
  private async startPolling() {
    if (this.polling) return;
    
    this.polling = true;
    logger.info('Started event polling');

    const pollEvents = async () => {
      try {
        const result = await this.queryEvents({ 
          cursor: this.lastKnownCursor,
          limit: 10 
        });

        if (result.events.length > 0) {
          this.lastKnownCursor = result.nextCursor;

          // Notify subscribers
          for (const event of result.events) {
            for (const subscription of this.subscriptions.values()) {
              if (subscription.isActive && this.applyEventFilter(event, subscription.filter)) {
                try {
                  subscription.callback(event);
                } catch (error) {
                  logger.error('Subscription callback error', { error, subscriptionId: subscription.id });
                }
              }
            }
          }
        }
      } catch (error) {
        logger.error('Event polling error', { error });
      }
    };

    // Poll every 5 seconds
    this.pollingInterval = setInterval(pollEvents, 5000);
    
    // Initial poll
    await pollEvents();
  }

  /**
   * Stop polling for events
   */
  private stopPolling() {
    if (!this.polling) return;
    
    this.polling = false;
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
    }

    logger.info('Stopped event polling');
  }

  /**
   * Check service health
   */
  async getHealthStatus() {
    try {
      const testQuery = await this.client.queryEvents({
        query: { All: [] },
        limit: 1
      });

      return {
        status: 'healthy',
        client: 'connected',
        subscriptions: this.subscriptions.size,
        polling: this.polling,
        network: SUI_CONFIG.NETWORK
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        client: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        subscriptions: this.subscriptions.size,
        polling: this.polling,
        network: SUI_CONFIG.NETWORK
      };
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.stopPolling();
    this.subscriptions.clear();
    logger.info('Event service destroyed');
  }
}