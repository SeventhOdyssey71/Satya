'use client'

import React, { useState } from 'react'
import { 
  Upload, 
  BarChart3, 
  Settings, 
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  HardDrive
} from 'lucide-react'
import { useUploadTasks, useUploadStats, useUploadActions } from '@/contexts/UploadContext'
import UploadHistory from './UploadHistory'

interface UploadDashboardProps {
  showNewUploadButton?: boolean
  onNewUpload?: () => void
}

export default function UploadDashboard({ 
  showNewUploadButton = true,
  onNewUpload 
}: UploadDashboardProps) {
  const { taskCount } = useUploadTasks()
  const { stats, totalProgress } = useUploadStats()
  const { clearCompletedTasks, clearAllTasks } = useUploadActions()
  
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'settings'>('overview')

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return '< 1s'
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const successRate = stats.totalUploads > 0 
    ? Math.round((stats.successfulUploads / stats.totalUploads) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Upload Dashboard</h2>
          <p className="text-gray-600">Manage and monitor your model uploads</p>
        </div>

        {showNewUploadButton && onNewUpload && (
          <button
            onClick={onNewUpload}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-5 h-5" />
            New Upload
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'history', label: 'History', icon: Clock },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
              {id === 'history' && taskCount.total > 0 && (
                <span className="ml-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                  {taskCount.total}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Uploads"
              value={stats.totalUploads.toString()}
              icon={Upload}
              color="blue"
            />
            <StatCard
              title="Success Rate"
              value={`${successRate}%`}
              icon={CheckCircle}
              color="green"
              trend={successRate >= 90 ? 'up' : successRate >= 70 ? 'stable' : 'down'}
            />
            <StatCard
              title="Data Uploaded"
              value={formatFileSize(stats.totalBytesUploaded)}
              icon={HardDrive}
              color="purple"
            />
            <StatCard
              title="Avg. Time"
              value={formatDuration(stats.averageUploadTime)}
              icon={Clock}
              color="orange"
            />
          </div>

          {/* Current Activity */}
          {taskCount.active > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                <h3 className="text-lg font-semibold text-gray-900">Active Uploads</h3>
                <span className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                  {taskCount.active} running
                </span>
              </div>

              {totalProgress > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Overall Progress</span>
                    <span className="font-medium text-gray-900">{Math.round(totalProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${totalProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{taskCount.total - taskCount.completed - taskCount.failed}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{taskCount.completed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{taskCount.failed}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <UploadHistory showStats={false} />
      )}

      {activeTab === 'settings' && (
        <UploadSettings
          onClearCompleted={clearCompletedTasks}
          onClearAll={clearAllTasks}
        />
      )}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  icon: React.ComponentType<any>
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  trend?: 'up' | 'down' | 'stable'
}

function StatCard({ title, value, icon: Icon, color, trend }: StatCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    purple: 'text-purple-600 bg-purple-100',
    orange: 'text-orange-600 bg-orange-100',
    red: 'text-red-600 bg-red-100'
  }

  const trendIcon = {
    up: <TrendingUp className="w-4 h-4 text-green-500" />,
    down: <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />,
    stable: <div className="w-4 h-4" />
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && trendIcon[trend]}
          </div>
        </div>
        <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

interface UploadSettingsProps {
  onClearCompleted: () => void
  onClearAll: () => void
}

function UploadSettings({ onClearCompleted, onClearAll }: UploadSettingsProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload History</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Clear Completed Uploads</h4>
              <p className="text-sm text-gray-600">Remove all successfully completed uploads from history</p>
            </div>
            <button
              onClick={onClearCompleted}
              className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Completed
            </button>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Clear All History</h4>
                <p className="text-sm text-gray-600">Remove all upload records (this cannot be undone)</p>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all upload history? This action cannot be undone.')) {
                    onClearAll()
                  }
                }}
                className="px-4 py-2 text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Auto-clear completed uploads</h4>
              <p className="text-sm text-gray-600">Automatically remove completed uploads after 7 days</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Show upload notifications</h4>
              <p className="text-sm text-gray-600">Get notified when uploads complete or fail</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}