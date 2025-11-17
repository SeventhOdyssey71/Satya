'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { EventService, MarketplaceEvent, EventFilter, EventQueryResult } from '@/lib/services/event-service'

interface UseEventsState {
 events: MarketplaceEvent[]
 isLoading: boolean
 error: string | null
 hasNextPage: boolean
 nextCursor?: any
}

export function useEvents(initialFilter?: EventFilter) {
 const [state, setState] = useState<UseEventsState>({
  events: [],
  isLoading: false,
  error: null,
  hasNextPage: false
 })

 const eventService = useRef<EventService>()
 const subscriptionId = useRef<string>()

 // Initialize event service
 useEffect(() => {
  eventService.current = new EventService()
  
  return () => {
   if (subscriptionId.current) {
    eventService.current?.unsubscribeFromEvents(subscriptionId.current)
   }
   eventService.current?.destroy()
  }
 }, [])

 const queryEvents = useCallback(async (filter?: EventFilter) => {
  if (!eventService.current) return

  try {
   setState(prev => ({ ...prev, isLoading: true, error: null }))
   
   const result = await eventService.current.queryEvents(filter)
   
   setState(prev => ({
    ...prev,
    events: result.events,
    hasNextPage: result.hasNextPage,
    nextCursor: result.nextCursor,
    isLoading: false
   }))

   return result
  } catch (error) {
   const errorMessage = error instanceof Error ? error.message : 'Failed to query events'
   setState(prev => ({ 
    ...prev, 
    error: errorMessage, 
    isLoading: false 
   }))
   throw error
  }
 }, [])

 const loadMoreEvents = useCallback(async () => {
  if (!eventService.current || !state.hasNextPage || state.isLoading) return

  try {
   setState(prev => ({ ...prev, isLoading: true }))
   
   const result = await eventService.current.queryEvents({
    ...initialFilter,
    cursor: state.nextCursor
   })
   
   setState(prev => ({
    ...prev,
    events: [...prev.events, ...result.events],
    hasNextPage: result.hasNextPage,
    nextCursor: result.nextCursor,
    isLoading: false
   }))

   return result
  } catch (error) {
   const errorMessage = error instanceof Error ? error.message : 'Failed to load more events'
   setState(prev => ({ 
    ...prev, 
    error: errorMessage, 
    isLoading: false 
   }))
   throw error
  }
 }, [state.hasNextPage, state.isLoading, state.nextCursor, initialFilter])

 const subscribeToEvents = useCallback((
  filter: EventFilter,
  callback: (event: MarketplaceEvent) => void
 ) => {
  if (!eventService.current) return

  // Unsubscribe from previous subscription
  if (subscriptionId.current) {
   eventService.current.unsubscribeFromEvents(subscriptionId.current)
  }

  // Subscribe to new events
  subscriptionId.current = eventService.current.subscribeToEvents(filter, (event) => {
   // Add new event to the beginning of the list
   setState(prev => ({
    ...prev,
    events: [event, ...prev.events]
   }))
   
   // Call the provided callback
   callback(event)
  })

  return subscriptionId.current
 }, [])

 const unsubscribeFromEvents = useCallback(() => {
  if (!eventService.current || !subscriptionId.current) return

  eventService.current.unsubscribeFromEvents(subscriptionId.current)
  subscriptionId.current = undefined
 }, [])

 const clearEvents = useCallback(() => {
  setState(prev => ({
   ...prev,
   events: [],
   hasNextPage: false,
   nextCursor: undefined,
   error: null
  }))
 }, [])

 const refreshEvents = useCallback(async () => {
  await queryEvents(initialFilter)
 }, [queryEvents, initialFilter])

 // Initial load
 useEffect(() => {
  if (initialFilter && eventService.current) {
   queryEvents(initialFilter)
  }
 }, [queryEvents, initialFilter])

 return {
  ...state,
  queryEvents,
  loadMoreEvents,
  subscribeToEvents,
  unsubscribeFromEvents,
  clearEvents,
  refreshEvents
 }
}

export function useModelListings(limit: number = 20) {
 const [listings, setListings] = useState<MarketplaceEvent[]>([])
 const [isLoading, setIsLoading] = useState(false)
 const [error, setError] = useState<string | null>(null)
 const [hasNextPage, setHasNextPage] = useState(false)
 const [nextCursor, setNextCursor] = useState<any>()

 const eventService = useRef<EventService>()

 useEffect(() => {
  eventService.current = new EventService()
  return () => eventService.current?.destroy()
 }, [])

 const loadListings = useCallback(async (cursor?: string) => {
  if (!eventService.current) return

  try {
   setIsLoading(true)
   setError(null)

   const result = await eventService.current.getModelListings(limit, cursor)
   
   if (cursor) {
    // Append to existing listings
    setListings(prev => [...prev, ...result.events])
   } else {
    // Replace listings
    setListings(result.events)
   }

   setHasNextPage(result.hasNextPage)
   setNextCursor(result.nextCursor)
  } catch (error) {
   const errorMessage = error instanceof Error ? error.message : 'Failed to load listings'
   setError(errorMessage)
  } finally {
   setIsLoading(false)
  }
 }, [limit])

 const loadMore = useCallback(async () => {
  if (hasNextPage && !isLoading) {
   await loadListings(nextCursor)
  }
 }, [hasNextPage, isLoading, loadListings, nextCursor])

 const refresh = useCallback(async () => {
  await loadListings()
 }, [loadListings])

 // Initial load
 useEffect(() => {
  loadListings()
 }, [loadListings])

 return {
  listings,
  isLoading,
  error,
  hasNextPage,
  loadMore,
  refresh
 }
}

export function useMarketplaceStats(timeRange?: { start: number; end: number }) {
 const [stats, setStats] = useState<any>(null)
 const [isLoading, setIsLoading] = useState(false)
 const [error, setError] = useState<string | null>(null)

 const eventService = useRef<EventService>()

 useEffect(() => {
  eventService.current = new EventService()
  return () => eventService.current?.destroy()
 }, [])

 const loadStats = useCallback(async () => {
  if (!eventService.current) return

  try {
   setIsLoading(true)
   setError(null)

   const result = await eventService.current.getMarketplaceStats(timeRange)
   setStats(result)
  } catch (error) {
   const errorMessage = error instanceof Error ? error.message : 'Failed to load stats'
   setError(errorMessage)
  } finally {
   setIsLoading(false)
  }
 }, [timeRange])

 useEffect(() => {
  loadStats()
 }, [loadStats])

 return {
  stats,
  isLoading,
  error,
  refresh: loadStats
 }
}

export function useRecentActivity(limit: number = 10) {
 const [activities, setActivities] = useState<MarketplaceEvent[]>([])
 const [isLoading, setIsLoading] = useState(false)
 const [error, setError] = useState<string | null>(null)

 const eventService = useRef<EventService>()
 const subscriptionId = useRef<string>()

 useEffect(() => {
  eventService.current = new EventService()
  
  return () => {
   if (subscriptionId.current) {
    eventService.current?.unsubscribeFromEvents(subscriptionId.current)
   }
   eventService.current?.destroy()
  }
 }, [])

 const loadActivity = useCallback(async () => {
  if (!eventService.current) return

  try {
   setIsLoading(true)
   setError(null)

   const result = await eventService.current.getRecentActivity(limit)
   setActivities(result)
  } catch (error) {
   const errorMessage = error instanceof Error ? error.message : 'Failed to load activity'
   setError(errorMessage)
  } finally {
   setIsLoading(false)
  }
 }, [limit])

 const subscribeToUpdates = useCallback(() => {
  if (!eventService.current) return

  subscriptionId.current = eventService.current.subscribeToEvents(
   { limit: 1 },
   (event) => {
    setActivities(prev => [event, ...prev.slice(0, limit - 1)])
   }
  )
 }, [limit])

 useEffect(() => {
  loadActivity()
  subscribeToUpdates()
 }, [loadActivity, subscribeToUpdates])

 return {
  activities,
  isLoading,
  error,
  refresh: loadActivity
 }
}