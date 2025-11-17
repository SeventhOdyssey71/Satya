'use client'

import React from 'react'
import { IoCloudUpload, IoArrowForward } from 'react-icons/io5'
import { useRouter } from 'next/navigation'

interface DashboardOverviewProps {
 onNewUpload?: () => void
}

export default function DashboardOverview({ onNewUpload }: DashboardOverviewProps) {
 const router = useRouter()

 const handleUploadClick = () => {
  if (onNewUpload) {
   onNewUpload()
  } else {
   router.push('/upload')
  }
 }

 const handlePendingClick = () => {
  // Navigate to the pending tab in dashboard
  router.push('/dashboard?tab=pending')
 }

 return (
  <div className="min-h-[60vh] flex items-center justify-center">
   <div className="max-w-4xl w-full px-6">
    <div className="text-center mb-12">
     <h1 className="text-4xl font-bold text-gray-900 mb-4">Model Management Dashboard</h1>
     <p className="text-xl text-gray-600">Upload your AI models and track their verification status</p>
    </div>
    
    <div className="flex gap-8 justify-center">
     {/* Upload Model Button */}
     <button
      onClick={handleUploadClick}
      className="group relative flex flex-col items-center justify-center w-64 h-64 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-lg transition-all duration-300"
     >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10 flex flex-col items-center">
       <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        <IoCloudUpload className="w-10 h-10 text-white" />
       </div>
       <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Model</h3>
       <p className="text-sm text-gray-600 px-4 text-center">
        Upload your AI model for TEE verification
       </p>
      </div>
     </button>

     {/* Go to Pending Page Button */}
     <button
      onClick={handlePendingClick}
      className="group relative flex flex-col items-center justify-center w-64 h-64 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-lg transition-all duration-300"
     >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10 flex flex-col items-center">
       <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        <IoArrowForward className="w-10 h-10 text-white" />
       </div>
       <h3 className="text-xl font-semibold text-gray-900 mb-2">Go to Pending Page</h3>
       <p className="text-sm text-gray-600 px-4 text-center">
        View and verify your pending models
       </p>
      </div>
     </button>
    </div>
   </div>
  </div>
 )
}