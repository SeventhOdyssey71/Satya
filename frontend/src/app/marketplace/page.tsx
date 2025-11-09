export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Background Lines */}
      <BackgroundLines />
      
      {/* Header */}
      <MarketplaceHeader />
      
      {/* Main Content */}
      <main className="relative z-10 py-6">
        <div className="container max-w-7xl mx-auto px-6">
          {/* Combined Navigation, Categories and Search */}
          <CombinedNavigation />
          
          {/* Model Grid */}
          <ModelGrid />
          
          {/* Pagination */}
          <Pagination />
          
          {/* Footer Guide */}
          <MarketplaceGuide />
        </div>
      </main>
    </div>
  )
}

function BackgroundLines() {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-50">
      {/* Vertical Grid Lines */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={`vertical-${i}`}
          className="absolute w-px h-full bg-neutral-200"
          style={{ left: `${(i + 1) * 8.33}%` }}
        />
      ))}
      
      {/* Horizontal Grid Lines */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={`horizontal-${i}`}
          className="absolute w-full h-px bg-neutral-200"
          style={{ top: `${(i + 1) * 12.5}%` }}
        />
      ))}
    </div>
  )
}

function MarketplaceHeader() {
  return (
    <header className="relative z-10 border-b border-neutral-100">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-8">
            <h1 className="text-3xl font-russo text-cyan-950">Satya</h1>
            <div className="flex items-center gap-8">
              <div className="text-lg font-medium font-albert text-black border-b-2 border-black pb-1">Marketplace</div>
              <div className="text-lg font-medium font-albert text-zinc-500 hover:text-zinc-700 cursor-pointer pb-1">Dashboard</div>
              <div className="text-lg font-medium font-albert text-zinc-500 hover:text-zinc-700 cursor-pointer pb-1">More</div>
            </div>
          </div>
          <button className="px-5 py-2.5 bg-white rounded-lg shadow-sm border border-neutral-300 text-sm font-medium font-albert text-black hover:shadow-md transition-shadow">
            Connect Wallet
          </button>
        </div>
      </div>
    </header>
  )
}

function CombinedNavigation() {
  return (
    <div className="mb-8">
      {/* Categories and Search Bar in same row */}
      <div className="flex items-center justify-between gap-6">
        {/* Category Tabs */}
        <div className="bg-gray-50 rounded-full border border-gray-200 p-1 flex">
          <div className="bg-white rounded-full px-6 py-3 shadow-sm">
            <span className="text-sm font-medium font-albert text-black">Designs</span>
          </div>
          <div className="px-6 py-3 hover:bg-white hover:rounded-full transition-colors cursor-pointer">
            <span className="text-sm font-medium font-albert text-gray-600">Machine Learning</span>
          </div>
          <div className="px-6 py-3 hover:bg-white hover:rounded-full transition-colors cursor-pointer">
            <span className="text-sm font-medium font-albert text-gray-600">HealthCare</span>
          </div>
          <div className="px-6 py-3 hover:bg-white hover:rounded-full transition-colors cursor-pointer">
            <span className="text-sm font-medium font-albert text-gray-600">Education</span>
          </div>
          <div className="px-6 py-3 hover:bg-white hover:rounded-full transition-colors cursor-pointer">
            <span className="text-sm font-medium font-albert text-gray-600">Others</span>
          </div>
        </div>
        
        {/* Search Input */}
        <div className="bg-white rounded-full shadow-sm border border-gray-200 px-6 py-3 min-w-[400px]">
          <div className="flex items-center gap-3">
            <input 
              type="text" 
              placeholder="Type in your search here..."
              className="text-sm font-albert text-gray-600 bg-transparent outline-none flex-1 placeholder-gray-400"
            />
            <button className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ModelGrid() {
  const models = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    title: "Opus Model x229",
    description: "Model with training data from top NHS inc. hospitals, works like magic.",
    image: "https://placehold.co/400x320"
  }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
      {models.map((model) => (
        <ModelCard key={model.id} {...model} />
      ))}
    </div>
  )
}

function ModelCard({ title, description, image }: { 
  title: string
  description: string
  image: string 
}) {
  return (
    <div className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      <div className="aspect-[4/3] overflow-hidden">
        <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white bg-gradient-to-t from-black/90 via-black/60 to-transparent">
        <h3 className="text-xl font-russo mb-2 leading-tight">{title}</h3>
        <p className="text-sm font-albert text-gray-200 mb-3 line-clamp-2 leading-relaxed">
          {description}
        </p>
        <button className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-2 text-sm font-medium font-albert text-white hover:bg-white/30 transition-colors">
          Verify Model
        </button>
      </div>
    </div>
  )
}

function Pagination() {
  return (
    <div className="flex items-center justify-center gap-6 mb-8">
      <button className="px-4 py-2 bg-white rounded-lg border border-gray-200 flex items-center gap-2 text-sm font-medium font-albert text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Prev
      </button>
      
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-black rounded-full"></div>
        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
      </div>
      
      <button className="px-4 py-2 bg-white rounded-lg border border-gray-200 flex items-center gap-2 text-sm font-medium font-albert text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors">
        Next
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}

function MarketplaceGuide() {
  return (
    <div className="flex items-center gap-2 mt-12 pt-6 border-t border-gray-100">
      <span className="text-sm font-albert text-gray-500">Marketplace Guide</span>
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  )
}