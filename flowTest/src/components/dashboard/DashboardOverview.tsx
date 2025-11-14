'use client'

import React from 'react'
import { 
  IoTime,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoCloudUpload,
  IoStatsChart,
  IoDownload
} from 'react-icons/io5'
import { useUploadTasks, useUploadStats } from '@/contexts/UploadContext'

interface DashboardOverviewProps {
  onNewUpload?: () => void
}

export default function DashboardOverview({ onNewUpload }: DashboardOverviewProps) {
  const { allTasks } = useUploadTasks()

  // Calculate status counts based on the new flow requirements
  const statusCounts = {
    pending: allTasks.filter(task => task.status === 'pending' || task.status === 'uploading').length,
    completed: allTasks.filter(task => task.status === 'completed').length,
    failed: allTasks.filter(task => task.status === 'cancelled').length
  }

  return (
    <div className="space-y-12">
      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Pending Card */}
        <div className="card-hover bg-gradient-to-br from-secondary-100 to-secondary-200 border-secondary-300 p-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <IoTime className="w-5 h-5 text-secondary-600" />
                <h3 className="text-lg font-russo text-secondary-800">Pending</h3>
              </div>
              <p className="text-4xl font-russo text-secondary-700 mb-2">{statusCounts.pending}</p>
              <p className="text-secondary-600">Processing uploads</p>
            </div>
            <div className="w-16 h-16 bg-secondary-300 rounded-2xl flex items-center justify-center">
              <IoTime className="w-8 h-8 text-secondary-700" />
            </div>
          </div>
          {statusCounts.pending > 0 && (
            <div className="mt-4 pt-4 border-t border-secondary-300">
              <div className="w-full bg-secondary-300 rounded-full h-2">
                <div className="bg-secondary-700 h-2 rounded-full w-1/3 animate-pulse"></div>
              </div>
              <p className="text-sm text-secondary-600 mt-2">Verification in progress...</p>
            </div>
          )}
        </div>

        {/* Completed Card */}
        <div className="card-hover bg-gradient-to-br from-secondary-50 to-secondary-100 border-secondary-200 p-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <IoCheckmarkCircle className="w-5 h-5 text-secondary-600" />
                <h3 className="text-lg font-russo text-secondary-800">Completed</h3>
              </div>
              <p className="text-4xl font-russo text-secondary-700 mb-2">{statusCounts.completed}</p>
              <p className="text-secondary-600">Available in marketplace</p>
            </div>
            <div className="w-16 h-16 bg-secondary-200 rounded-2xl flex items-center justify-center">
              <IoCheckmarkCircle className="w-8 h-8 text-secondary-700" />
            </div>
          </div>
          {statusCounts.completed > 0 && (
            <div className="mt-4 pt-4 border-t border-secondary-200">
              <p className="text-sm text-secondary-600">Ready for downloads</p>
            </div>
          )}
        </div>

        {/* Failed Card */}
        <div className="card-hover bg-gradient-to-br from-secondary-200 to-secondary-300 border-secondary-400 p-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <IoCloseCircle className="w-5 h-5 text-secondary-700" />
                <h3 className="text-lg font-russo text-secondary-900">Failed</h3>
              </div>
              <p className="text-4xl font-russo text-secondary-800 mb-2">{statusCounts.failed}</p>
              <p className="text-secondary-700">Requires attention</p>
            </div>
            <div className="w-16 h-16 bg-secondary-400 rounded-2xl flex items-center justify-center">
              <IoCloseCircle className="w-8 h-8 text-secondary-800" />
            </div>
          </div>
          {statusCounts.failed > 0 && (
            <div className="mt-4 pt-4 border-t border-secondary-400">
              <button className="btn-sm bg-secondary-800 text-white hover:bg-secondary-900">
                Review Issues
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <IoStatsChart className="w-6 h-6 text-primary-600" />
          </div>
          <p className="text-sm text-secondary-600 mb-1">Total Uploads</p>
          <p className="text-3xl font-russo text-secondary-900 mb-1">{allTasks.length}</p>
          <div className="text-xs text-secondary-500">
            {allTasks.length > 0 ? '+2 this week' : 'Get started!'}
          </div>
        </div>

        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <IoDownload className="w-6 h-6 text-accent-600" />
          </div>
          <p className="text-sm text-secondary-600 mb-1">Total Size</p>
          <p className="text-3xl font-russo text-secondary-900 mb-1">
            {formatFileSize(allTasks.reduce((sum, task) => sum + task.fileSize, 0))}
          </p>
          <div className="text-xs text-secondary-500">
            Across all models
          </div>
        </div>

        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-warning-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-sm text-secondary-600 mb-1">Avg. Speed</p>
          <p className="text-3xl font-russo text-secondary-900 mb-1">2.4 MB/s</p>
          <div className="text-xs text-secondary-500">
            Upload speed
          </div>
        </div>

        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-success-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <IoCheckmarkCircle className="w-6 h-6 text-success-600" />
          </div>
          <p className="text-sm text-secondary-600 mb-1">Success Rate</p>
          <p className="text-3xl font-russo text-secondary-900 mb-1">
            {allTasks.length ? Math.round((statusCounts.completed / allTasks.length) * 100) : 0}%
          </p>
          <div className="text-xs text-secondary-500">
            Verification rate
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-russo text-secondary-900 mb-2">Recent Activity</h3>
            <p className="text-secondary-600">Track your latest model uploads and verifications</p>
          </div>
          <button
            onClick={onNewUpload}
            className="btn-primary group"
          >
            <IoCloudUpload className="w-5 h-5" />
            New Upload
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {allTasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <IoCloudUpload className="w-10 h-10 text-secondary-400" />
            </div>
            <h4 className="text-xl font-russo text-secondary-800 mb-3">No uploads yet</h4>
            <p className="text-secondary-600 mb-8 leading-relaxed max-w-md mx-auto">
              Start by uploading your first AI model. Our TEE verification system will ensure it's secure and ready for the marketplace.
            </p>
            <button 
              onClick={onNewUpload}
              className="btn-primary btn-lg"
            >
              Upload Your First Model
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {allTasks.slice(0, 5).map((task, index) => (
              <div key={task.id} className="flex items-center justify-between p-6 bg-surface-100 border border-border rounded-2xl hover:bg-surface-200 transition-colors group">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)} ${task.status === 'pending' || task.status === 'uploading' ? 'animate-pulse' : ''}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-russo text-secondary-900 group-hover:text-primary-600 transition-colors">{task.fileName}</p>
                      {task.status === 'completed' && (
                        <div className="badge-success btn-sm">
                          <IoCheckmarkCircle className="w-3 h-3" />
                          Verified
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-secondary-500">
                      <span>{formatFileSize(task.fileSize)}</span>
                      <span>•</span>
                      <span>{new Date().toLocaleDateString()}</span>
                      {task.status === 'uploading' && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1 bg-secondary-200 rounded-full overflow-hidden">
                              <div className="h-full bg-primary-600 rounded-full w-2/3 animate-pulse"></div>
                            </div>
                            <span>67%</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-2 rounded-xl text-sm font-medium ${getStatusBadge(task.status)}`}>
                    {task.status === 'uploading' ? 'uploading' : 
                     task.status === 'pending' ? 'verifying' : 
                     task.status === 'completed' ? 'completed' : 
                     task.status}
                  </span>
                  <button className="p-2 rounded-lg border border-border hover:bg-surface-100 transition-colors">
                    <svg className="w-4 h-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            
            {allTasks.length > 5 && (
              <div className="pt-4 text-center">
                <button className="btn-ghost">
                  View All {allTasks.length} Uploads
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-500'
    case 'pending':
    case 'uploading':
      return 'bg-yellow-500'
    case 'failed':
    case 'error':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

function getStatusBadge(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'pending':
    case 'uploading':
      return 'bg-yellow-100 text-yellow-800'
    case 'failed':
    case 'error':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}