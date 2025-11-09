import Header from '@/components/ui/Header'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Header */}
      <Header activeTab="dashboard" />
      
      {/* Main Content */}
      <main className="relative z-10 py-6">
        <div className="container max-w-7xl mx-auto px-6">
          <DashboardContent />
        </div>
      </main>
    </div>
  )
}


function DashboardContent() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-russo text-black mb-12">User Dashboard</h1>
      
      <DashboardTabs />
      
      <div className="mt-8">
        <ModelList />
      </div>
    </div>
  )
}

function DashboardTabs() {
  return (
    <div className="flex gap-8 border-b border-gray-200">
      <TabButton active>Uploaded Models</TabButton>
      <TabButton>Downloaded Models</TabButton>
    </div>
  )
}

function TabButton({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button className={`pb-3 text-base font-medium font-albert transition-colors ${
      active 
        ? 'text-black border-b-2 border-black' 
        : 'text-gray-500 hover:text-gray-700'
    }`}>
      {children}
    </button>
  )
}

function ModelList() {
  const models = [
    { id: 1, name: "Healthcare AI Model v2.1", status: "Active", uploads: 245 },
    { id: 2, name: "Financial Prediction Model", status: "Pending", uploads: 0 },
    { id: 3, name: "Image Classification Model", status: "Active", uploads: 89 }
  ]

  return (
    <div className="space-y-4">
      {models.map((model) => (
        <ModelCard key={model.id} {...model} />
      ))}
    </div>
  )
}

function ModelCard({ name, status, uploads }: { name: string; status: string; uploads: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-medium font-albert text-black mb-1">{name}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Status: {status}</span>
            <span>Downloads: {uploads}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm font-medium font-albert text-gray-600 hover:text-gray-800 transition-colors">
            View Details
          </button>
          <button className="px-4 py-2 text-sm font-medium font-albert text-gray-600 hover:text-gray-800 transition-colors">
            Edit
          </button>
          <StatusBadge status={status} />
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'Active'
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
      isActive 
        ? 'bg-green-100 text-green-800' 
        : 'bg-yellow-100 text-yellow-800'
    }`}>
      {status}
    </span>
  )
}