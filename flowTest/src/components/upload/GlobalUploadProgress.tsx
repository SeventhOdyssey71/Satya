'use client'

import React, { useState } from 'react'
import { 
  Upload, 
  X, 
  Minimize2, 
  Maximize2,
  AlertCircle,
  CheckCircle,
  Loader2 
} from 'lucide-react'
import { useUploadTasks, useUploadStats, useUploadActions } from '@/contexts/UploadContext'

interface GlobalUploadProgressProps {
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left'
  showWhenEmpty?: boolean
  minimizable?: boolean
}

export default function GlobalUploadProgress({
  position = 'bottom-right',
  showWhenEmpty = false,
  minimizable = true
}: GlobalUploadProgressProps) {
  const { activeTasks, taskCount } = useUploadTasks()
  const { totalProgress } = useUploadStats()
  const { cancelUploadTask } = useUploadActions()
  
  const [isMinimized, setIsMinimized] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  // Don't show if no active uploads and showWhenEmpty is false
  if (!showWhenEmpty && activeTasks.length === 0) {
    return null
  }

  // Don't show if manually hidden
  if (!isVisible) {
    return null
  }

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-left': 'top-4 left-4'
  }

  const hasActiveUploads = activeTasks.length > 0
  const overallProgress = hasActiveUploads ? totalProgress : 0

  return (
    <div className={`fixed ${positionClasses[position]} z-50 transition-all duration-300`}>
      <div className="bg-white rounded-lg border border-gray-200 shadow-lg min-w-80">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-gray-900">
              Uploads {hasActiveUploads ? `(${activeTasks.length})` : ''}
            </h3>
          </div>

          <div className="flex items-center gap-1">
            {minimizable && (
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </button>
            )}
            
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="p-4">
            {hasActiveUploads ? (
              <>
                {/* Overall progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Overall Progress</span>
                    <span className="font-medium text-gray-900">{Math.round(overallProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${overallProgress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Individual upload tasks */}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {activeTasks.map((task) => (
                    <UploadTaskProgress
                      key={task.id}
                      task={task}
                      onCancel={() => cancelUploadTask(task.id)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No active uploads</p>
                {taskCount.completed > 0 && (
                  <p className="text-xs text-gray-400">
                    {taskCount.completed} completed today
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Minimized state */}
        {isMinimized && hasActiveUploads && (
          <div className="p-2">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              <span className="text-sm text-gray-600">
                {activeTasks.length} uploading...
              </span>
              <span className="text-sm font-medium text-gray-900">
                {Math.round(overallProgress)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface UploadTaskProgressProps {
  task: {
    id: string
    title: string
    fileName: string
    status: string
    progress: number
    phases?: Array<{
      id: string
      name: string
      status: string
      progress?: number
      error?: string
    }>
    error?: string
  }
  onCancel: () => void
}

function UploadTaskProgress({ task, onCancel }: UploadTaskProgressProps) {
  const getCurrentPhase = () => {
    if (!task.phases) return null
    return task.phases.find(phase => phase.status === 'in-progress') || 
           task.phases[task.phases.length - 1]
  }

  const currentPhase = getCurrentPhase()
  const hasError = task.status === 'failed' || currentPhase?.status === 'error'

  return (
    <div className="border border-gray-100 rounded-lg p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {hasError ? (
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            ) : (
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
            )}
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {task.title}
            </h4>
          </div>

          <p className="text-xs text-gray-500 mb-2 truncate">
            {task.fileName}
          </p>

          {/* Progress bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">
                {currentPhase?.name || 'Processing...'}
              </span>
              <span className="text-gray-700 font-medium">
                {task.progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  hasError ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${task.progress}%` }}
              ></div>
            </div>
          </div>

          {/* Error message */}
          {hasError && (task.error || currentPhase?.error) && (
            <p className="text-xs text-red-600 mb-2">
              {task.error || currentPhase?.error}
            </p>
          )}
        </div>

        {/* Cancel button */}
        <button
          onClick={onCancel}
          className="ml-2 p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
          title="Cancel upload"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Hook to toggle visibility of global upload progress
export function useGlobalUploadProgress() {
  const [isVisible, setIsVisible] = useState(true)
  const [position, setPosition] = useState<'top-right' | 'bottom-right' | 'bottom-left' | 'top-left'>('bottom-right')

  return {
    isVisible,
    setIsVisible,
    position,
    setPosition,
    show: () => setIsVisible(true),
    hide: () => setIsVisible(false),
    toggle: () => setIsVisible(!isVisible)
  }
}