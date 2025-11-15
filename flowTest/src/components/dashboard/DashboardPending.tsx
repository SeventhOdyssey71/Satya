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
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-albert font-semibold text-lg text-secondary-700">Awaiting Verification</h3>
              <p className="text-4xl font-russo font-bold text-secondary-600 mt-3">{pendingVerification.length}</p>
            </div>
            <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
              <TbClockHour4 className="w-6 h-6 text-secondary-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-albert font-semibold text-lg text-secondary-700">In Verification</h3>
              <p className="text-4xl font-russo font-bold text-secondary-600 mt-3">{inVerification.length}</p>
            </div>
            <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
              <TbShieldX className="w-6 h-6 text-secondary-600" />
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-secondary-100 to-secondary-200 border-secondary-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-albert font-semibold text-lg text-secondary-800">Verified</h3>
              <p className="text-4xl font-russo font-bold text-secondary-700 mt-3">{verified.length}</p>
            </div>
            <div className="w-12 h-12 bg-white border border-secondary-300 rounded-xl flex items-center justify-center">
              <TbShieldCheck className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Pending Verification List */}
      {pendingVerification.length > 0 && (
        <div className="card p-8">
          <h3 className="text-2xl font-russo text-secondary-900 mb-8 flex items-center">
            <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center mr-3">
              <TbCertificate className="w-5 h-5 text-warning-600" />
            </div>
            Models Awaiting TEE Verification
          </h3>
          
          <div className="space-y-8">
            {pendingVerification.map((task) => (
              <div key={task.id} className="card-hover p-6 border-l-4 border-l-warning-400">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-xl font-albert font-semibold text-secondary-900">{task.fileName}</h4>
                    <p className="text-secondary-600 font-albert mt-1">
                      Uploaded: {formatFileSize(task.fileSize)} • {new Date().toLocaleDateString()}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {task.modelBlobId && (
                        <span className="badge bg-primary-100 text-primary-800">
                          Model: {task.modelBlobId.substring(0, 12)}...
                        </span>
                      )}
                      {task.datasetBlobId && (
                        <span className="badge bg-white text-secondary-800 border border-secondary-300 shadow-card">
                          Dataset: {task.datasetBlobId.substring(0, 12)}...
                        </span>
                      )}
                      {(task as any).blobId && !task.modelBlobId && (
                        <span className="badge bg-surface-200 text-secondary-700">
                          Blob: {(task as any).blobId.substring(0, 12)}...
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="badge badge-warning">
                    Needs Verification
                  </span>
                </div>

                <div className="bg-warning-50 border border-warning-200 rounded-xl p-5 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-warning-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm font-bold">!</span>
                    </div>
                    <div>
                      <h5 className="font-albert font-semibold text-warning-800 mb-1">Action Required</h5>
                      <p className="font-albert text-warning-700 leading-relaxed">
                        Your model has been successfully uploaded to Walrus storage. 
                        To publish it to the marketplace, you must complete TEE attestation verification.
                      </p>
                    </div>
                  </div>
                </div>

                {(() => {
                  console.log('Checking verification flow for task:', {
                    id: task.id,
                    fileName: task.fileName,
                    modelBlobId: task.modelBlobId,
                    blobId: (task as any).blobId,
                    shouldRender: !!(task.modelBlobId || (task as any).blobId)
                  })
                  return (task.modelBlobId || (task as any).blobId) ? (
                    <div>
                      <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-4">
                        <p className="font-albert text-primary-700">Verification interface ready</p>
                      </div>
                      <ModelVerificationFlow
                        modelBlobId={task.modelBlobId || (task as any).blobId || ''}
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
                    <div className="bg-danger-50 border border-danger-200 rounded-xl p-4">
                      <p className="font-albert text-danger-700">No blob ID found for verification</p>
                    </div>
                  )
                })()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verified Models */}
      {verified.length > 0 && (
        <div className="card p-8">
          <h3 className="text-2xl font-russo text-secondary-900 mb-8 flex items-center">
            <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center mr-3">
              <TbShieldCheck className="w-5 h-5 text-success-600" />
            </div>
            Verified Models
          </h3>
          
          <div className="space-y-6">
            {verified.map((task) => (
              <div key={task.id} className="card-hover p-6 bg-gradient-to-r from-success-50 to-success-100 border-success-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-success-500 rounded-xl flex items-center justify-center">
                      <TbShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-albert font-semibold text-success-900 text-lg">{task.fileName}</p>
                      <p className="text-success-700 font-albert">
                        {formatFileSize(task.fileSize)} • Verified • Ready for marketplace
                      </p>
                      {task.blockchainTxDigest && (
                        <code className="text-xs bg-success-200 px-2 py-1 rounded text-success-800 font-mono mt-2 inline-block">
                          Tx: {task.blockchainTxDigest.substring(0, 20)}...
                        </code>
                      )}
                    </div>
                  </div>
                  <span className="badge badge-success">
                    Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {pendingVerification.length === 0 && verified.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-24 h-24 bg-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <TbCertificate className="w-12 h-12 text-secondary-400" />
          </div>
          <h3 className="text-2xl font-russo text-secondary-900 mb-3">No models pending verification</h3>
          <p className="text-secondary-600 font-albert max-w-md mx-auto leading-relaxed">
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