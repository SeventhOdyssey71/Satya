'use client'

import React from 'react'
import { FaCheckCircle, FaRegCircle } from 'react-icons/fa'
import { RiCheckboxCircleFill } from 'react-icons/ri'

interface Step {
  title: string
  description: string
}

interface ProgressIndicatorProps {
  steps: Step[]
  currentStep: number
  completedSteps: number[]
  className?: string
}

export default function ProgressIndicator({ 
  steps, 
  currentStep, 
  completedSteps = [],
  className = '' 
}: ProgressIndicatorProps) {
  return (
    <div className={`${className}`}>
      {/* Desktop Progress Bar */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(index)
            const isCurrent = index === currentStep
            const isUpcoming = index > currentStep

            return (
              <div key={index} className="flex items-center flex-1">
                {/* Step Circle */}
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200
                  ${isCompleted 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : isCurrent 
                      ? 'bg-black border-black text-white'
                      : 'bg-white border-gray-300 text-gray-500'
                  }
                `}>
                  {isCompleted ? (
                    <RiCheckboxCircleFill className="w-6 h-6" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>

                {/* Step Info */}
                <div className="ml-4 flex-1">
                  <h3 className={`text-sm font-medium transition-colors
                    ${isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'}
                  `}>
                    {step.title}
                  </h3>
                  <p className={`text-xs transition-colors
                    ${isCompleted || isCurrent ? 'text-gray-600' : 'text-gray-400'}
                  `}>
                    {step.description}
                  </p>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className={`
                    flex-1 h-px mx-4 transition-colors
                    ${isCompleted || (completedSteps.includes(index + 1)) 
                      ? 'bg-green-500' 
                      : index < currentStep
                        ? 'bg-black'
                        : 'bg-gray-300'
                    }
                  `} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile Progress Bar */}
      <div className="md:hidden">
        <div className="mb-6">
          {/* Current Step Info */}
          <div className="flex items-center mb-4">
            <div className={`
              flex items-center justify-center w-8 h-8 rounded-full border-2 
              bg-black border-black text-white text-sm font-medium
            `}>
              {currentStep + 1}
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">
                {steps[currentStep].title}
              </h3>
              <p className="text-xs text-gray-600">
                {steps[currentStep].description}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-black h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Step Counter */}
          <div className="mt-2 text-xs text-gray-500 text-center">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>

        {/* All Steps List */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(index)
            const isCurrent = index === currentStep
            const isUpcoming = index > currentStep

            return (
              <div key={index} className={`
                flex items-center p-3 rounded-lg border transition-all
                ${isCurrent 
                  ? 'border-gray-300 bg-gray-100' 
                  : isCompleted 
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }
              `}>
                <div className={`
                  flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium
                  ${isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isCurrent 
                      ? 'bg-black text-white'
                      : 'bg-gray-300 text-gray-600'
                  }
                `}>
                  {isCompleted ? (
                    <RiCheckboxCircleFill className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="ml-3">
                  <div className={`text-sm font-medium
                    ${isCurrent ? 'text-gray-900' : isCompleted ? 'text-green-900' : 'text-gray-600'}
                  `}>
                    {step.title}
                  </div>
                  <div className={`text-xs
                    ${isCurrent ? 'text-gray-700' : isCompleted ? 'text-green-700' : 'text-gray-500'}
                  `}>
                    {step.description}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}