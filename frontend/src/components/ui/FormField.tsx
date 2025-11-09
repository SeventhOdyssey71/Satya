import { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  children: ReactNode
}

export function FormField({ label, children }: FormFieldProps) {
  return (
    <div>
      <label className="block text-gray-700 text-lg font-russo mb-3">
        {label}
      </label>
      {children}
    </div>
  )
}

export function FormRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-6">{children}</div>
}

interface FormInputProps {
  placeholder: string
  type?: string
}

export function FormInput({ placeholder, type = 'text' }: FormInputProps) {
  const baseClasses = "w-full h-14 bg-white rounded-lg shadow-sm border border-gray-300 px-4 text-gray-600 text-base font-light font-albert outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200"
  
  return (
    <input 
      type={type}
      placeholder={placeholder}
      className={baseClasses}
    />
  )
}

export function FormSelect({ children }: { children: ReactNode }) {
  return (
    <select className="w-full h-14 bg-white rounded-lg shadow-sm border border-gray-300 px-4 text-gray-600 text-base font-light font-albert outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200">
      {children}
    </select>
  )
}

export function FormTextarea({ placeholder }: { placeholder: string }) {
  return (
    <textarea 
      placeholder={placeholder}
      rows={8}
      className="w-full bg-white rounded-lg shadow-sm border border-gray-300 px-4 py-4 text-gray-600 text-base font-light font-albert outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 resize-none"
    />
  )
}