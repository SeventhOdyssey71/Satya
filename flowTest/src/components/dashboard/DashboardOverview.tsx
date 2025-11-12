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
    <div className="space-y-8">
      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Pending</h3>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{statusCounts.pending}</p>
              <p className="text-sm text-gray-500 mt-1">Processing uploads</p>
            </div>
            <IoTime className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        {/* Completed Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Completed</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{statusCounts.completed}</p>
              <p className="text-sm text-gray-500 mt-1">Available in marketplace</p>
            </div>
            <IoCheckmarkCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        {/* Failed Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Failed</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">{statusCounts.failed}</p>
              <p className="text-sm text-gray-500 mt-1">Requires attention</p>
            </div>
            <IoCloseCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Total Uploads</p>
            <p className="text-2xl font-bold text-gray-900">{allTasks.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Size</p>
            <p className="text-2xl font-bold text-gray-900">{formatFileSize(allTasks.reduce((sum, task) => sum + task.fileSize, 0))}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Avg. Upload Speed</p>
            <p className="text-2xl font-bold text-gray-900">
              '--'
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Success Rate</p>
            <p className="text-2xl font-bold text-gray-900">
              {allTasks.length ? Math.round((statusCounts.completed / allTasks.length) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          <button
            onClick={onNewUpload}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <IoCloudUpload className="w-4 h-4" />
            New Upload
          </button>
        </div>
        
        {allTasks.length === 0 ? (
          <div className="text-center py-8">
            <IoCloudUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No uploads yet. Start by uploading your first model!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`} />
                  <div>
                    <p className="font-medium text-gray-900">{task.fileName}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(task.fileSize)} • {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(task.status)}`}>
                  {task.status}
                </span>
              </div>
            ))}
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
      return 'bg-gray-100 text-gray-800'
  }
}