'use client'

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'

// Types for upload state management
export interface UploadTask {
 id: string
 title: string
 fileName: string
 fileSize: number
 status: 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled'
 progress: number
 phases: UploadPhase[]
 result?: UploadResult
 error?: string
 createdAt: Date
 updatedAt: Date
 // TEE Verification fields
 verificationStatus?: 'pending' | 'verified' | 'failed'
 teeAttestation?: any
 blockchainTxDigest?: string
 // Blob IDs for model and dataset
 modelBlobId?: string
 datasetBlobId?: string
 blobId?: string // Legacy field for backward compatibility
}

export interface UploadPhase {
 id: string
 name: string
 description: string
 status: 'pending' | 'in-progress' | 'completed' | 'error'
 progress?: number
 error?: string
}

export interface UploadResult {
 success: boolean
 modelId?: string
 listingId?: string
 blobId?: string
 transactionHash?: string
 error?: string
 warnings?: string[]
}

export interface UploadStats {
 totalUploads: number
 successfulUploads: number
 failedUploads: number
 totalBytesUploaded: number
 averageUploadTime: number
}

interface UploadState {
 tasks: UploadTask[]
 activeTaskIds: string[]
 completedTaskIds: string[]
 failedTaskIds: string[]
 maxConcurrentUploads: number
 stats: UploadStats
 isInitialized: boolean
}

// Action types for state management
type UploadAction =
 | { type: 'INIT_STATE'; payload: UploadTask[] }
 | { type: 'ADD_TASK'; payload: UploadTask }
 | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<UploadTask> } }
 | { type: 'UPDATE_TASK_PROGRESS'; payload: { id: string; progress: number; phases: UploadPhase[] } }
 | { type: 'COMPLETE_TASK'; payload: { id: string; result: UploadResult } }
 | { type: 'FAIL_TASK'; payload: { id: string; error: string } }
 | { type: 'CANCEL_TASK'; payload: { id: string } }
 | { type: 'REMOVE_TASK'; payload: { id: string } }
 | { type: 'CLEAR_COMPLETED' }
 | { type: 'CLEAR_FAILED' }
 | { type: 'FORCE_RESET_FAILED' }
 | { type: 'CLEAR_ALL' }
 | { type: 'UPDATE_STATS' }

// Context interface
interface UploadContextType {
 state: UploadState
 // Task management
 addUploadTask: (task: Omit<UploadTask, 'id' | 'createdAt' | 'updatedAt'>) => string
 updateUploadTask: (id: string, updates: Partial<UploadTask>) => void
 updateUploadProgress: (id: string, progress: number, phases: UploadPhase[]) => void
 completeUploadTask: (id: string, result: UploadResult) => void
 failUploadTask: (id: string, error: string) => void
 cancelUploadTask: (id: string) => void
 removeUploadTask: (id: string) => void
 
 // Bulk operations
 clearCompletedTasks: () => void
 clearFailedTasks: () => void
 forceResetFailedTasks: () => void
 clearAllTasks: () => void
 
 // Getters
 getTask: (id: string) => UploadTask | undefined
 getActiveTasks: () => UploadTask[]
 getCompletedTasks: () => UploadTask[]
 getFailedTasks: () => UploadTask[]
 
 // Utilities
 canStartNewUpload: () => boolean
 getTotalProgress: () => number
 getUploadStats: () => UploadStats
}

// Initial state
const initialState: UploadState = {
 tasks: [],
 activeTaskIds: [],
 completedTaskIds: [],
 failedTaskIds: [],
 maxConcurrentUploads: 3,
 stats: {
  totalUploads: 0,
  successfulUploads: 0,
  failedUploads: 0,
  totalBytesUploaded: 0,
  averageUploadTime: 0
 },
 isInitialized: false
}

// Reducer function
function uploadReducer(state: UploadState, action: UploadAction): UploadState {
 switch (action.type) {
  case 'INIT_STATE': {
   const tasks = action.payload
   return {
    ...state,
    tasks,
    activeTaskIds: tasks.filter(t => t.status === 'uploading').map(t => t.id),
    completedTaskIds: tasks.filter(t => t.status === 'completed').map(t => t.id),
    failedTaskIds: tasks.filter(t => t.status === 'failed').map(t => t.id),
    isInitialized: true
   }
  }

  case 'ADD_TASK': {
   const newTask = action.payload
   const updatedTasks = [...state.tasks, newTask]
   
   return {
    ...state,
    tasks: updatedTasks,
    activeTaskIds: newTask.status === 'uploading' 
     ? [...state.activeTaskIds, newTask.id]
     : state.activeTaskIds
   }
  }

  case 'UPDATE_TASK': {
   const { id, updates } = action.payload
   const updatedTasks = state.tasks.map(task =>
    task.id === id 
     ? { ...task, ...updates, updatedAt: new Date() }
     : task
   )

   // Update status arrays based on new status
   const task = updatedTasks.find(t => t.id === id)
   let newActiveTaskIds = state.activeTaskIds.filter(taskId => taskId !== id)
   let newCompletedTaskIds = state.completedTaskIds.filter(taskId => taskId !== id)
   let newFailedTaskIds = state.failedTaskIds.filter(taskId => taskId !== id)

   if (task) {
    if (task.status === 'uploading') {
     newActiveTaskIds.push(id)
    } else if (task.status === 'completed') {
     newCompletedTaskIds.push(id)
    } else if (task.status === 'failed') {
     newFailedTaskIds.push(id)
    }
   }

   return {
    ...state,
    tasks: updatedTasks,
    activeTaskIds: newActiveTaskIds,
    completedTaskIds: newCompletedTaskIds,
    failedTaskIds: newFailedTaskIds
   }
  }

  case 'UPDATE_TASK_PROGRESS': {
   const { id, progress, phases } = action.payload
   const updatedTasks = state.tasks.map(task =>
    task.id === id 
     ? { ...task, progress, phases, updatedAt: new Date() }
     : task
   )

   return {
    ...state,
    tasks: updatedTasks
   }
  }

  case 'COMPLETE_TASK': {
   const { id, result } = action.payload
   const updatedTasks = state.tasks.map(task =>
    task.id === id 
     ? { 
       ...task, 
       status: 'completed' as const, 
       progress: 100, 
       result, 
       updatedAt: new Date() 
      }
     : task
   )

   return {
    ...state,
    tasks: updatedTasks,
    activeTaskIds: state.activeTaskIds.filter(taskId => taskId !== id),
    completedTaskIds: [...state.completedTaskIds, id]
   }
  }

  case 'FAIL_TASK': {
   const { id, error } = action.payload
   const updatedTasks = state.tasks.map(task =>
    task.id === id 
     ? { 
       ...task, 
       status: 'failed' as const, 
       error, 
       updatedAt: new Date() 
      }
     : task
   )

   return {
    ...state,
    tasks: updatedTasks,
    activeTaskIds: state.activeTaskIds.filter(taskId => taskId !== id),
    failedTaskIds: [...state.failedTaskIds, id]
   }
  }

  case 'CANCEL_TASK': {
   const { id } = action.payload
   const updatedTasks = state.tasks.map(task =>
    task.id === id 
     ? { 
       ...task, 
       status: 'cancelled' as const, 
       updatedAt: new Date() 
      }
     : task
   )

   return {
    ...state,
    tasks: updatedTasks,
    activeTaskIds: state.activeTaskIds.filter(taskId => taskId !== id)
   }
  }

  case 'REMOVE_TASK': {
   const { id } = action.payload
   
   return {
    ...state,
    tasks: state.tasks.filter(task => task.id !== id),
    activeTaskIds: state.activeTaskIds.filter(taskId => taskId !== id),
    completedTaskIds: state.completedTaskIds.filter(taskId => taskId !== id),
    failedTaskIds: state.failedTaskIds.filter(taskId => taskId !== id)
   }
  }

  case 'CLEAR_COMPLETED': {
   const completedIds = new Set(state.completedTaskIds)
   
   return {
    ...state,
    tasks: state.tasks.filter(task => !completedIds.has(task.id)),
    completedTaskIds: []
   }
  }

  case 'CLEAR_FAILED': {
   const failedIds = new Set(state.failedTaskIds)
   
   // Force a complete reset by also updating remaining task IDs with timestamp
   const remainingTasks = state.tasks
    .filter(task => !failedIds.has(task.id))
    .map(task => ({
     ...task,
     id: task.status === 'failed' || task.status === 'cancelled' ? 
      `reset-${Date.now()}-${Math.random()}` : task.id
    }))
   
   return {
    ...state,
    tasks: remainingTasks,
    failedTaskIds: [],
    // Also update other ID arrays to reflect the changes
    activeTaskIds: remainingTasks.filter(t => t.status === 'uploading').map(t => t.id),
    completedTaskIds: remainingTasks.filter(t => t.status === 'completed').map(t => t.id)
   }
  }

  case 'FORCE_RESET_FAILED': {
   // Force clear all failed/cancelled tasks and reset localStorage
   const cleanTasks = state.tasks.filter(task => 
    task.status !== 'failed' && task.status !== 'cancelled'
   )
   
   // Clear localStorage for failed tasks
   if (typeof window !== 'undefined') {
    const storageKey = 'uploadTasks'
    localStorage.setItem(storageKey, JSON.stringify(cleanTasks))
   }
   
   return {
    ...state,
    tasks: cleanTasks,
    failedTaskIds: [],
    activeTaskIds: cleanTasks.filter(t => t.status === 'uploading').map(t => t.id),
    completedTaskIds: cleanTasks.filter(t => t.status === 'completed').map(t => t.id)
   }
  }

  case 'CLEAR_ALL': {
   return {
    ...state,
    tasks: [],
    activeTaskIds: [],
    completedTaskIds: [],
    failedTaskIds: []
   }
  }

  case 'UPDATE_STATS': {
   const { tasks } = state
   const totalUploads = tasks.length
   const successfulUploads = tasks.filter(t => t.status === 'completed').length
   const failedUploads = tasks.filter(t => t.status === 'failed').length
   const totalBytesUploaded = tasks
    .filter(t => t.status === 'completed')
    .reduce((total, task) => total + task.fileSize, 0)
   
   // Calculate average upload time from completed tasks
   const completedTasks = tasks.filter(t => t.status === 'completed')
   const averageUploadTime = completedTasks.length > 0
    ? completedTasks.reduce((total, task) => {
      const duration = task.updatedAt.getTime() - task.createdAt.getTime()
      return total + duration
     }, 0) / completedTasks.length
    : 0

   return {
    ...state,
    stats: {
     totalUploads,
     successfulUploads,
     failedUploads,
     totalBytesUploaded,
     averageUploadTime
    }
   }
  }

  default:
   return state
 }
}

// Storage utilities
const STORAGE_KEY = 'satya_upload_state'

const saveToStorage = (tasks: UploadTask[]) => {
 try {
  if (typeof window !== 'undefined') {
   const filteredTasks = tasks
    .filter(task => task.status !== 'uploading') // Don't persist active uploads
    .slice(-50) // Keep only recent 50 tasks
   localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredTasks))
  }
 } catch (error) {
  console.warn('Failed to save upload state to localStorage:', error)
 }
}

const loadFromStorage = (): UploadTask[] => {
 try {
  if (typeof window !== 'undefined') {
   const stored = localStorage.getItem(STORAGE_KEY)
   if (stored) {
    const tasks = JSON.parse(stored)
    return tasks.map((task: any) => ({
     ...task,
     createdAt: new Date(task.createdAt),
     updatedAt: new Date(task.updatedAt)
    }))
   }
  }
  return []
 } catch (error) {
  console.warn('Failed to load upload state from localStorage:', error)
  return []
 }
}

// Context creation
const UploadContext = createContext<UploadContextType | undefined>(undefined)

// Provider component
export function UploadProvider({ children }: { children: React.ReactNode }) {
 const [state, dispatch] = useReducer(uploadReducer, initialState)

 // Initialize state from localStorage
 useEffect(() => {
  const storedTasks = loadFromStorage()
  dispatch({ type: 'INIT_STATE', payload: storedTasks })
 }, [])

 // Save state to localStorage when tasks change
 useEffect(() => {
  if (state.isInitialized) {
   saveToStorage(state.tasks)
   dispatch({ type: 'UPDATE_STATS' })
  }
 }, [state.tasks, state.isInitialized])

 // Task management functions
 const addUploadTask = useCallback((taskData: Omit<UploadTask, 'id' | 'createdAt' | 'updatedAt'>): string => {
  const id = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const task: UploadTask = {
   ...taskData,
   id,
   createdAt: new Date(),
   updatedAt: new Date()
  }
  
  dispatch({ type: 'ADD_TASK', payload: task })
  return id
 }, [])

 const updateUploadTask = useCallback((id: string, updates: Partial<UploadTask>) => {
  dispatch({ type: 'UPDATE_TASK', payload: { id, updates } })
 }, [])

 const updateUploadProgress = useCallback((id: string, progress: number, phases: UploadPhase[]) => {
  dispatch({ type: 'UPDATE_TASK_PROGRESS', payload: { id, progress, phases } })
 }, [])

 const completeUploadTask = useCallback((id: string, result: UploadResult) => {
  dispatch({ type: 'COMPLETE_TASK', payload: { id, result } })
 }, [])

 const failUploadTask = useCallback((id: string, error: string) => {
  dispatch({ type: 'FAIL_TASK', payload: { id, error } })
 }, [])

 const cancelUploadTask = useCallback((id: string) => {
  dispatch({ type: 'CANCEL_TASK', payload: { id } })
 }, [])

 const removeUploadTask = useCallback((id: string) => {
  dispatch({ type: 'REMOVE_TASK', payload: { id } })
 }, [])

 const clearCompletedTasks = useCallback(() => {
  dispatch({ type: 'CLEAR_COMPLETED' })
 }, [])

 const clearFailedTasks = useCallback(() => {
  dispatch({ type: 'CLEAR_FAILED' })
 }, [])

 const forceResetFailedTasks = useCallback(() => {
  dispatch({ type: 'FORCE_RESET_FAILED' })
 }, [])

 const clearAllTasks = useCallback(() => {
  dispatch({ type: 'CLEAR_ALL' })
 }, [])

 // Getter functions
 const getTask = useCallback((id: string): UploadTask | undefined => {
  return state.tasks.find(task => task.id === id)
 }, [state.tasks])

 const getActiveTasks = useCallback((): UploadTask[] => {
  return state.tasks.filter(task => state.activeTaskIds.includes(task.id))
 }, [state.tasks, state.activeTaskIds])

 const getCompletedTasks = useCallback((): UploadTask[] => {
  return state.tasks.filter(task => state.completedTaskIds.includes(task.id))
 }, [state.tasks, state.completedTaskIds])

 const getFailedTasks = useCallback((): UploadTask[] => {
  return state.tasks.filter(task => state.failedTaskIds.includes(task.id))
 }, [state.tasks, state.failedTaskIds])

 // Utility functions
 const canStartNewUpload = useCallback((): boolean => {
  return state.activeTaskIds.length < state.maxConcurrentUploads
 }, [state.activeTaskIds.length, state.maxConcurrentUploads])

 const getTotalProgress = useCallback((): number => {
  const activeTasks = getActiveTasks()
  if (activeTasks.length === 0) return 0
  
  const totalProgress = activeTasks.reduce((sum, task) => sum + task.progress, 0)
  return totalProgress / activeTasks.length
 }, [getActiveTasks])

 const getUploadStats = useCallback((): UploadStats => {
  return state.stats
 }, [state.stats])

 const contextValue: UploadContextType = {
  state,
  addUploadTask,
  updateUploadTask,
  updateUploadProgress,
  completeUploadTask,
  failUploadTask,
  cancelUploadTask,
  removeUploadTask,
  clearCompletedTasks,
  clearFailedTasks,
  forceResetFailedTasks,
  clearAllTasks,
  getTask,
  getActiveTasks,
  getCompletedTasks,
  getFailedTasks,
  canStartNewUpload,
  getTotalProgress,
  getUploadStats
 }

 return (
  <UploadContext.Provider value={contextValue}>
   {children}
  </UploadContext.Provider>
 )
}

// Custom hook to use upload context
export function useUploadContext() {
 const context = useContext(UploadContext)
 if (context === undefined) {
  throw new Error('useUploadContext must be used within an UploadProvider')
 }
 return context
}

// Convenience hooks for specific functionality
export function useUploadTasks() {
 const { state, getActiveTasks, getCompletedTasks, getFailedTasks } = useUploadContext()
 
 return {
  allTasks: state.tasks,
  activeTasks: getActiveTasks(),
  completedTasks: getCompletedTasks(),
  failedTasks: getFailedTasks(),
  taskCount: {
   total: state.tasks.length,
   active: state.activeTaskIds.length,
   completed: state.completedTaskIds.length,
   failed: state.failedTaskIds.length
  }
 }
}

export function useUploadStats() {
 const { getUploadStats, getTotalProgress } = useUploadContext()
 
 return {
  stats: getUploadStats(),
  totalProgress: getTotalProgress()
 }
}

export function useUploadActions() {
 const {
  addUploadTask,
  updateUploadTask,
  updateUploadProgress,
  completeUploadTask,
  failUploadTask,
  cancelUploadTask,
  removeUploadTask,
  clearCompletedTasks,
  clearFailedTasks,
  forceResetFailedTasks,
  clearAllTasks,
  canStartNewUpload
 } = useUploadContext()

 return {
  addUploadTask,
  updateUploadTask,
  updateUploadProgress,
  completeUploadTask,
  failUploadTask,
  cancelUploadTask,
  removeUploadTask,
  clearCompletedTasks,
  clearFailedTasks,
  forceResetFailedTasks,
  clearAllTasks,
  canStartNewUpload
 }
}