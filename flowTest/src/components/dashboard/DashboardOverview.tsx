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
    <div className="space-y-10">
      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Pending Card */}
        <div className="bg-white border border-gray-300 rounded-lg p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-black">Pending</h3>
              <p className="text-4xl font-bold text-yellow-600 mt-3">{statusCounts.pending}</p>
              <p className="text-gray-700 mt-2">Processing uploads</p>
            </div>
            <IoTime className="w-10 h-10 text-yellow-600" />
          </div>
        </div>

        {/* Completed Card */}
        <div className="bg-white border border-gray-300 rounded-lg p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-black">Completed</h3>
              <p className="text-4xl font-bold text-green-600 mt-3">{statusCounts.completed}</p>
              <p className="text-gray-700 mt-2">Available in marketplace</p>
            </div>
            <IoCheckmarkCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>

        {/* Failed Card */}
        <div className="bg-white border border-gray-300 rounded-lg p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-black">Failed</h3>
              <p className="text-4xl font-bold text-red-600 mt-3">{statusCounts.failed}</p>
              <p className="text-gray-700 mt-2">Requires attention</p>
            </div>
            <IoCloseCircle className="w-10 h-10 text-red-600" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white border border-gray-300 rounded-lg p-8 shadow-sm">
        <h3 className="text-2xl font-semibold text-black mb-6">Upload Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <p className="text-gray-700 mb-2">Total Uploads</p>
            <p className="text-3xl font-bold text-black">{allTasks.length}</p>
          </div>
          <div>
            <p className="text-gray-700 mb-2">Total Size</p>
            <p className="text-3xl font-bold text-black">{formatFileSize(allTasks.reduce((sum, task) => sum + task.fileSize, 0))}</p>
          </div>
          <div>
            <p className="text-gray-700 mb-2">Avg. Upload Speed</p>
            <p className="text-3xl font-bold text-black">
              '--'
            </p>
          </div>
          <div>
            <p className="text-gray-700 mb-2">Success Rate</p>
            <p className="text-3xl font-bold text-black">
              {allTasks.length ? Math.round((statusCounts.completed / allTasks.length) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-gray-300 rounded-lg p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-black">Recent Activity</h3>
          <button
            onClick={onNewUpload}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-3 font-medium"
          >
            <IoCloudUpload className="w-5 h-5" />
            New Upload
          </button>
        </div>
        
        {allTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-32 h-32 mx-auto mb-6">
              <img 
                src="/images/Claude.png" 
                alt="Claude AI"
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-gray-700 text-lg leading-relaxed">No uploads yet. Start by uploading your first model!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className={`w-4 h-4 rounded-full ${getStatusColor(task.status)}`} />
                  <div>
                    <p className="font-semibold text-black">{task.fileName}</p>
                    <p className="text-gray-700">
                      {formatFileSize(task.fileSize)} • {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-2 rounded-lg text-sm font-medium ${getStatusBadge(task.status)}`}>
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
      return 'bg-gray-100 text-gray-700'
  }
}