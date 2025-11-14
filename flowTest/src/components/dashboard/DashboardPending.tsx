'use client'

import React from 'react'
import { TbShieldX, TbShieldCheck, TbClockHour4, TbCertificate } from 'react-icons/tb'
import { ModelVerificationFlow } from '@/components/tee'
import { useUploadTasks } from '@/contexts/UploadContext'

export default function DashboardPending() {
  const { allTasks } = useUploadTasks()

  // Debug logging
  console.log('All tasks for dashboard:', allTasks)

  // Create mock tasks for testing (always show these for now)
  const mockTasks = [
    {
      id: 'mock_1',
      title: 'Test Model 1',
      fileName: 'eurostile-extended (1).zip',
      fileSize: 21248, // 20.79 KB
      status: 'completed' as const,
      progress: 100,
      phases: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      verificationStatus: undefined, // This makes it show as pending verification
      modelBlobId: 'q73BP2a0_-e-dhA2i5Tj8hsf2_Ll92jBOFAmYRr0H1zz_iE',
      datasetBlobId: 'pmPnUh0stRV35bHd8f7yYeAi0vp8sL3kp9mNbCxQ2rS6_dI'
    },
    {
      id: 'mock_2', 
      title: 'Test Model 2',
      fileName: 'fleet-landing.zip',
      fileSize: 200151, // 195.41 KB
      status: 'completed' as const,
      progress: 100,
      phases: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      verificationStatus: undefined, // This makes it show as pending verification
      modelBlobId: 'x94GP8b2_-f-ehB3j6Uk9itg3_Mm03kCPGBnZSs1I2az_jF',
      datasetBlobId: 'qnQoVi1tuSW46cId9g8zZfBj1wq9tM4lq0nOcDyR3sT7_eJ'
    }
  ]

  // Filter tasks that need verification (uploaded but not verified)
  const pendingVerification = [...allTasks, ...mockTasks].filter(task => 
    task.status === 'completed' && (!task.verificationStatus || task.verificationStatus === 'pending')
  )

  const inVerification = allTasks.filter(task => 
    task.verificationStatus === 'pending'
  )

  const verified = allTasks.filter(task => 
    task.verificationStatus === 'verified'
  )

  return (
    <div className="space-y-8">
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Awaiting Verification</h3>
              <p className="text-3xl font-bold text-black mt-2">{pendingVerification.length}</p>
            </div>
            <TbClockHour4 className="w-8 h-8 text-gray-600" />
          </div>
        </div>

        <div className="bg-white border border-gray-300 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">In Verification</h3>
              <p className="text-3xl font-bold text-black mt-2">{inVerification.length}</p>
            </div>
            <TbShieldX className="w-8 h-8 text-gray-600" />
          </div>
        </div>

        <div className="bg-black border border-black rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Verified</h3>
              <p className="text-3xl font-bold text-white mt-2">{verified.length}</p>
            </div>
            <TbShieldCheck className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Pending Verification List */}
      {pendingVerification.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <TbCertificate className="w-6 h-6 mr-2 text-orange-600" />
            Models Awaiting TEE Verification
          </h3>
          
          <div className="space-y-6">
            {pendingVerification.map((task) => (
              <div key={task.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{task.fileName}</h4>
                    <p className="text-gray-600">
                      Uploaded: {formatFileSize(task.fileSize)} • {new Date().toLocaleDateString()}
                    </p>
                    <div className="mt-2 space-y-1">
                      {task.modelBlobId && (
                        <span className="inline-block bg-black text-white text-xs font-medium px-2.5 py-0.5 rounded mr-2">
                          Model: {task.modelBlobId.substring(0, 12)}...
                        </span>
                      )}
                      {task.datasetBlobId && (
                        <span className="inline-block bg-gray-300 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded mr-2">
                          Dataset: {task.datasetBlobId.substring(0, 12)}...
                        </span>
                      )}
                      {task.blobId && !task.modelBlobId && (
                        <span className="inline-block bg-gray-200 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded mr-2">
                          Blob: {task.blobId.substring(0, 12)}...
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                    Needs Verification
                  </span>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-800">
                    <strong>Action Required:</strong> Your model has been successfully uploaded to Walrus storage. 
                    To publish it to the marketplace, you must complete TEE attestation verification.
                  </p>
                </div>

                {(() => {
                  console.log('Checking verification flow for task:', {
                    id: task.id,
                    fileName: task.fileName,
                    modelBlobId: task.modelBlobId,
                    blobId: task.blobId,
                    shouldRender: !!(task.modelBlobId || task.blobId)
                  })
                  return (task.modelBlobId || task.blobId) ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-3">Verification interface loading...</p>
                      <ModelVerificationFlow
                        modelBlobId={task.modelBlobId || task.blobId || ''}
                        datasetBlobId={task.datasetBlobId}
                        modelName={task.fileName}
                        onVerificationComplete={(attestation, txDigest) => {
                          // Update task with verification data and upload to marketplace
                          console.log('Verification and marketplace upload complete:', { 
                            attestation, 
                            txDigest, 
                            taskId: task.id 
                          })
                          
                          // TODO: Update the task status in context
                          // This would mark the task as verified and ready for marketplace
                          alert(`Model "${task.fileName}" successfully verified and uploaded to marketplace!\nTransaction: ${txDigest.slice(0, 20)}...`)
                        }}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No blob ID found for verification</p>
                  )
                })()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verified Models */}
      {verified.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <TbShieldCheck className="w-6 h-6 mr-2 text-green-600" />
            Verified Models
          </h3>
          
          <div className="space-y-4">
            {verified.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-4">
                  <TbShieldCheck className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">{task.fileName}</p>
                    <p className="text-green-700 text-sm">
                      {formatFileSize(task.fileSize)} • Verified • Ready for marketplace
                    </p>
                    {task.blockchainTxDigest && (
                      <p className="text-green-600 text-xs mt-1">
                        Tx: {task.blockchainTxDigest.substring(0, 20)}...
                      </p>
                    )}
                  </div>
                </div>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Verified ✓
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {pendingVerification.length === 0 && verified.length === 0 && (
        <div className="text-center py-12">
          <TbCertificate className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No models pending verification</h3>
          <p className="text-gray-600">
            Upload a model first, then it will appear here for TEE verification before marketplace publication.
          </p>
        </div>
      )}
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