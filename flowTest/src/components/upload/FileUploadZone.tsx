'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface FileUploadZoneProps {
  accept?: Record<string, string[]>
  maxSize?: number
  multiple?: boolean
  onFileSelect: (files: File[]) => void
  onFileRemove?: (index: number) => void
  className?: string
  placeholder?: string
  disabled?: boolean
  uploadProgress?: number
  error?: string
  files?: File[]
}

export default function FileUploadZone({
  accept = { '*/*': [] },
  maxSize = 1024 * 1024 * 1024, // 1GB default
  multiple = false,
  onFileSelect,
  onFileRemove,
  className = '',
  placeholder = 'Drop files here or click to browse',
  disabled = false,
  uploadProgress,
  error,
  files = []
}: FileUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFileSelect(acceptedFiles)
    },
    [onFileSelect]
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
    disabled,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false)
  })

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (file: File) => {
    const type = file.type.toLowerCase()
    if (type.includes('image/')) return '🖼️'
    if (type.includes('video/')) return '🎥'
    if (type.includes('audio/')) return '🎵'
    if (type.includes('text/') || type.includes('json') || type.includes('csv')) return '📄'
    if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return '📦'
    if (type.includes('pdf')) return '📕'
    return '📄'
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragActive || dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${error ? 'border-red-500 bg-red-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          {uploadProgress !== undefined ? (
            <div className="space-y-3">
              <Loader2 className="h-12 w-12 mx-auto text-blue-500 animate-spin" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">Uploading...</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">{uploadProgress.toFixed(1)}% complete</p>
              </div>
            </div>
          ) : (
            <>
              <Upload className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-900 mb-1">
                  {placeholder}
                </p>
                <p className="text-sm text-gray-500">
                  Maximum file size: {formatFileSize(maxSize)}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error Messages */}
      {error && (
        <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="space-y-2">
          {fileRejections.map(({ file, errors }, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <div>
                <p className="font-medium">{file.name}</p>
                <ul className="text-xs space-y-1">
                  {errors.map((error, errorIndex) => (
                    <li key={errorIndex}>• {error.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">
            Selected Files ({files.length})
          </h4>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getFileIcon(file)}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {onFileRemove && (
                    <button
                      onClick={() => onFileRemove(index)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      disabled={disabled}
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}