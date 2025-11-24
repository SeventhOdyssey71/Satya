'use client'

import { useState, useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
  onClose: () => void
}

export function Toast({ message, type, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Allow fade out animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 text-white'
      case 'error':
        return 'bg-red-600 text-white'
      case 'info':
        return 'bg-blue-600 text-white'
      default:
        return 'bg-gray-600 text-white'
    }
  }

  return (
    <div
      className={`
        fixed bottom-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${getTypeStyles()}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {message.split('\n').map((line, index) => (
            <div key={index} className={index === 0 ? 'font-semibold' : 'text-sm mt-1'}>
              {line}
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(onClose, 300)
          }}
          className="ml-3 text-white hover:text-gray-200"
        >
          ×
        </button>
      </div>
    </div>
  )
}