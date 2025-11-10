'use client'

import React from 'react'
import { CheckCircle, AlertCircle, Loader2, Upload, Shield, Cloud, Zap } from 'lucide-react'

interface UploadPhase {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  status: 'pending' | 'in-progress' | 'completed' | 'error'
  progress?: number
  error?: string
}

interface UploadProgressProps {
  phases: UploadPhase[]
  currentPhase?: string
  overallProgress: number
  onCancel?: () => void
  className?: string
}

export default function UploadProgress({
  phases,
  currentPhase,
  overallProgress,
  onCancel,
  className = ''
}: UploadProgressProps) {
  const getPhaseIcon = (phase: UploadPhase) => {
    const IconComponent = phase.icon
    
    if (phase.status === 'completed') {
      return <CheckCircle className="w-6 h-6 text-green-500" />
    } else if (phase.status === 'error') {
      return <AlertCircle className="w-6 h-6 text-red-500" />
    } else if (phase.status === 'in-progress') {
      return <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
    } else {
      return <IconComponent className="w-6 h-6 text-gray-400" />
    }
  }

  const getPhaseStatusText = (phase: UploadPhase) => {
    switch (phase.status) {
      case 'completed':
        return 'Completed'
      case 'error':
        return 'Failed'
      case 'in-progress':
        return phase.progress ? `${phase.progress.toFixed(1)}%` : 'Processing...'
      default:
        return 'Pending'
    }
  }

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Uploading Model</h3>
            <p className="text-sm text-gray-600">
              Please wait while we process and upload your model
            </p>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
        
        {/* Overall Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Overall Progress</span>
            <span>{overallProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Phases */}
      <div className="p-6">
        <div className="space-y-4">
          {phases.map((phase, index) => (
            <div key={phase.id} className="flex items-start space-x-4">
              {/* Icon */}
              <div className="flex-shrink-0 mt-1">
                {getPhaseIcon(phase)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-medium
                    ${phase.status === 'completed' 
                      ? 'text-green-900' 
                      : phase.status === 'error' 
                        ? 'text-red-900'
                        : phase.status === 'in-progress'
                          ? 'text-blue-900'
                          : 'text-gray-500'
                    }
                  `}>
                    {phase.name}
                  </h4>
                  <span className={`text-xs font-medium
                    ${phase.status === 'completed' 
                      ? 'text-green-600' 
                      : phase.status === 'error' 
                        ? 'text-red-600'
                        : phase.status === 'in-progress'
                          ? 'text-blue-600'
                          : 'text-gray-400'
                    }
                  `}>
                    {getPhaseStatusText(phase)}
                  </span>
                </div>
                
                <p className={`text-xs mt-1
                  ${phase.status === 'in-progress' 
                    ? 'text-gray-700' 
                    : 'text-gray-500'
                  }
                `}>
                  {phase.error || phase.description}
                </p>

                {/* Individual Progress Bar */}
                {phase.status === 'in-progress' && phase.progress !== undefined && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${phase.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Connector Line */}
              {index < phases.length - 1 && (
                <div className="absolute left-9 mt-8 w-px h-8 bg-gray-200" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Example usage component
export function UploadProgressExample() {
  const [phases, setPhases] = React.useState<UploadPhase[]>([
    {
      id: 'validation',
      name: 'File Validation',
      description: 'Validating file format and size',
      icon: Upload,
      status: 'completed'
    },
    {
      id: 'encryption',
      name: 'SEAL Encryption',
      description: 'Encrypting model with policy-based access control',
      icon: Shield,
      status: 'in-progress',
      progress: 45
    },
    {
      id: 'upload',
      name: 'Walrus Upload',
      description: 'Uploading to decentralized storage network',
      icon: Cloud,
      status: 'pending'
    },
    {
      id: 'listing',
      name: 'Marketplace Listing',
      description: 'Creating on-chain listing and finalizing',
      icon: Zap,
      status: 'pending'
    }
  ])

  return (
    <div className="max-w-2xl mx-auto p-6">
      <UploadProgress
        phases={phases}
        currentPhase="encryption"
        overallProgress={35}
        onCancel={() => alert('Upload cancelled')}
      />
    </div>
  )
}