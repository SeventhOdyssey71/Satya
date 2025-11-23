import { ReactNode } from 'react'

interface FormFieldProps {
 label: string
 children: ReactNode
}

export function FormField({ label, children }: FormFieldProps) {
 return (
  <div>
   <label className="block text-secondary-700 text-lg font-albert font-bold mb-3">
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
 value?: string
 onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function FormInput({ placeholder, type = 'text', value, onChange }: FormInputProps) {
 const baseClasses = "w-full h-14 bg-white rounded-lg shadow-sm border border-secondary-300 px-4 text-secondary-600 text-base font-light font-albert outline-none focus:border-secondary-400 focus:ring-1 focus:ring-secondary-200"
 
 return (
  <input 
   type={type}
   placeholder={placeholder}
   value={value}
   onChange={onChange}
   className={baseClasses}
  />
 )
}

export function FormSelect({ 
 children, 
 value, 
 onChange 
}: { 
 children: ReactNode
 value?: string
 onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
}) {
 return (
  <select 
   className="w-full h-14 bg-white rounded-lg shadow-sm border border-secondary-300 px-4 text-secondary-600 text-base font-light font-albert outline-none focus:border-secondary-400 focus:ring-1 focus:ring-secondary-200"
   value={value}
   onChange={onChange}
  >
   {children}
  </select>
 )
}

export function FormTextarea({ 
 placeholder, 
 value, 
 onChange 
}: { 
 placeholder: string
 value?: string
 onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}) {
 return (
  <textarea 
   placeholder={placeholder}
   value={value}
   onChange={onChange}
   rows={8}
   className="w-full bg-white rounded-lg shadow-sm border border-secondary-300 px-4 py-4 text-secondary-600 text-base font-light font-albert outline-none focus:border-secondary-400 focus:ring-1 focus:ring-secondary-200 resize-none"
  />
 )
}