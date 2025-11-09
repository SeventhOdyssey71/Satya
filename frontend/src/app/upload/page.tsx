import Header from '@/components/ui/Header'
import { FormField, FormRow, FormInput, FormSelect, FormTextarea } from '@/components/ui/FormField'

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Header */}
      <Header activeTab="upload" />
      
      {/* Main Content */}
      <main className="relative z-10 py-6">
        <div className="container max-w-7xl mx-auto px-6">
          {/* Upload Form */}
          <UploadForm />
        </div>
      </main>
    </div>
  )
}


function UploadForm() {
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-russo text-black mb-12">Upload to Marketplace</h1>
      
      <div className="flex gap-10">
        <div className="flex-shrink-0">
          <ImageUpload />
        </div>
        
        <div className="flex-1 max-w-3xl space-y-8">
          <FormRow>
            <FormField label="Model Name">
              <FormInput placeholder="Enter model name here..." />
            </FormField>
            <FormField label="Category">
              <FormSelect>
                <option>Select Category</option>
                <option>Designs</option>
                <option>Machine Learning</option>
                <option>HealthCare</option>
                <option>Education</option>
                <option>Others</option>
              </FormSelect>
            </FormField>
          </FormRow>
          
          <FormField label="Description">
            <FormTextarea placeholder="Explain what your model does and its use cases..." />
          </FormField>
          
          <FormRow>
            <FormField label="Dataset File">
              <FileUpload placeholder="Choose File" />
            </FormField>
            <FormField label="Listing Price">
              <FormInput placeholder="Enter Price ($100..." />
            </FormField>
          </FormRow>
          
          <div className="flex justify-center pt-10">
            <UploadButton />
          </div>
        </div>
      </div>
    </div>
  )
}

function ImageUpload() {
  return (
    <div className="w-80 h-80 bg-white rounded-lg shadow-sm border border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        id="image-upload"
      />
      <label htmlFor="image-upload" className="cursor-pointer text-center">
        <div className="w-12 h-12 mx-auto mb-3 text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <div className="text-gray-700 text-lg font-albert">Upload Image File</div>
        <div className="text-gray-500 text-sm font-albert mt-1">Click to browse</div>
      </label>
    </div>
  )
}


function FileUpload({ placeholder }: { placeholder: string }) {
  return (
    <div className="relative">
      <input 
        type="file" 
        className="hidden" 
        id="dataset-upload"
      />
      <label 
        htmlFor="dataset-upload"
        className="w-full h-14 bg-white rounded-lg shadow-sm border border-gray-300 px-4 flex items-center cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <span className="text-gray-600 text-base font-light font-albert">{placeholder}</span>
      </label>
    </div>
  )
}

function UploadButton() {
  return (
    <button className="w-60 h-12 bg-black rounded-full text-white text-lg font-albert hover:bg-gray-800 transition-colors">
      Upload Model
    </button>
  )
}