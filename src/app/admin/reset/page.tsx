'use client'

import { useEffect, useState } from 'react'
import { useUploadActions } from '@/contexts/UploadContext'

export default function ResetPage() {
 const { forceResetFailedTasks } = useUploadActions()
 const [resetComplete, setResetComplete] = useState(false)

 useEffect(() => {
  // Auto-trigger reset on page load
  const performReset = async () => {
   console.log('Force resetting failed tasks...')
   
   // Clear localStorage manually first
   if (typeof window !== 'undefined') {
    localStorage.removeItem('uploadTasks')
    localStorage.removeItem('uploadState')
    sessionStorage.clear()
   }
   
   // Trigger context reset
   forceResetFailedTasks()
   
   console.log('Failed tasks reset complete!')
   setResetComplete(true)
   
   // Redirect to dashboard after 2 seconds
   setTimeout(() => {
    window.location.href = '/dashboard'
   }, 2000)
  }
  
  performReset()
 }, [forceResetFailedTasks])

 return (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
   <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
    <div className="text-center">
     {!resetComplete ? (
      <>
       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
       <h2 className="text-xl font-semibold text-gray-800 mb-2">Resetting Failed Tasks</h2>
       <p className="text-gray-600">Please wait while we clear failed uploads...</p>
      </>
     ) : (
      <>
       <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
       </div>
       <h2 className="text-xl font-semibold text-gray-800 mb-2">Reset Complete</h2>
       <p className="text-gray-600 mb-4">All failed upload tasks have been cleared!</p>
       <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
      </>
     )}
    </div>
   </div>
  </div>
 )
}