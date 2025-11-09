export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Background Lines */}
      <BackgroundLines />
      
      {/* Header */}
      <MarketplaceHeader />
      
      {/* Main Content */}
      <main className="relative z-10 py-8">
        <div className="container max-w-[1728px] mx-auto px-4">
          {/* Navigation Tabs */}
          <MarketplaceNavigation />
          
          {/* Search Bar */}
          <SearchBar />
          
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
    <header className="relative z-10">
      <div className="container max-w-[1728px] mx-auto px-8">
        <div className="flex items-center justify-between py-6">
          <h1 className="text-4xl font-russo text-cyan-950 ml-4">Satya</h1>
          <button className="px-6 py-3 bg-white rounded-[30px] shadow-sm border border-neutral-500 text-xl font-light font-albert text-black hover:shadow-md transition-shadow mr-4">
            Connect Wallet
          </button>
        </div>
      </div>
    </header>
  )
}

function MarketplaceNavigation() {
  return (
    <div className="flex items-center gap-8 mb-8">
      <div className="text-2xl font-albert text-black">Marketplace</div>
      <div className="text-2xl font-albert text-zinc-500">Dashboard</div>
      <div className="text-2xl font-albert text-zinc-500">More</div>
    </div>
  )
}

function SearchBar() {
  return (
    <div className="mb-8">
      {/* Category Tabs */}
      <div className="bg-white rounded-[35px] border border-black p-2 mb-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <div className="bg-neutral-200 rounded-[35px] border border-black px-6 py-3">
            <span className="text-xl font-albert text-black">Designs</span>
          </div>
          <div className="px-6 py-3">
            <span className="text-xl font-albert text-zinc-500">Machine Learning</span>
          </div>
          <div className="px-6 py-3">
            <span className="text-xl font-albert text-zinc-500">HealthCare</span>
          </div>
          <div className="px-6 py-3">
            <span className="text-xl font-albert text-zinc-500">Education</span>
          </div>
          <div className="px-6 py-3">
            <span className="text-xl font-albert text-zinc-500">Others</span>
          </div>
        </div>
      </div>
      
      {/* Search Input */}
      <div className="bg-white rounded-[10px] shadow-sm border border-neutral-500 p-4 max-w-lg">
        <div className="flex items-center justify-between">
          <input 
            type="text" 
            placeholder="Type in your search here..."
            className="text-xl font-light font-albert text-neutral-600 bg-transparent outline-none flex-1"
          />
          <div className="w-12 h-10 bg-zinc-300 rounded-[10px] flex items-center justify-center">
            <div className="w-4 h-4 bg-black"></div>
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
    image: "https://placehold.co/484x397"
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
    <div className="relative bg-gray-600 rounded-3xl border border-neutral-400 overflow-hidden">
      <img src={image} alt={title} className="w-full h-96 object-cover" />
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white bg-gradient-to-t from-black/80 to-transparent">
        <h3 className="text-4xl font-russo mb-4">{title}</h3>
        <p className="text-xs font-albert text-zinc-300 mb-6 w-72">
          {description}
        </p>
        <div className="flex items-center gap-2">
          <button className="w-40 h-10 bg-zinc-500 rounded-[30px] flex items-center justify-center text-white text-base font-albert hover:bg-zinc-600 transition-colors">
            Verify Model
          </button>
          <div className="w-2.5 h-1 bg-white"></div>
        </div>
      </div>
    </div>
  )
}

function Pagination() {
  return (
    <div className="flex items-center justify-center gap-6 mb-8">
      <button className="w-28 h-10 bg-white rounded-[30px] border border-black flex items-center justify-center gap-2 text-base font-light font-albert text-black hover:bg-gray-50 transition-colors">
        <div className="w-1.5 h-2 bg-black"></div>
        Prev.
      </button>
      
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-zinc-300 rounded-full"></div>
        <div className="w-3 h-3 bg-neutral-100 rounded-full"></div>
        <div className="w-3 h-3 bg-neutral-100 rounded-full"></div>
      </div>
      
      <button className="w-28 h-10 bg-white rounded-[30px] border border-black flex items-center justify-center gap-2 text-base font-light font-albert text-black hover:bg-gray-50 transition-colors">
        Next
        <div className="w-1.5 h-2 bg-black"></div>
      </button>
    </div>
  )
}

function MarketplaceGuide() {
  return (
    <div className="flex items-center gap-2 mt-16">
      <span className="text-xl font-inter text-stone-500">Marketplace Guide</span>
      <div className="flex items-center">
        <div className="w-4 h-4 bg-black"></div>
        <div className="w-[5px] h-2 bg-black ml-1"></div>
      </div>
    </div>
  )
}