export default function Home() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Header */}
      <header className="relative">
        <div className="border-b border-neutral-200"></div>
        <div className="max-w-[1728px] mx-auto px-4">
          <div className="flex items-center justify-between py-6">
            <div className="text-4xl font-russo text-cyan-950">
              Satya
            </div>
            <button className="px-8 py-4 bg-white rounded-[30px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] border-[0.30px] border-neutral-500 text-2xl font-light font-albert text-black">
              Get Started
            </button>
          </div>
        </div>
        <div className="border-b border-neutral-200"></div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        {/* Background Lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-80 h-[1px] bg-neutral-200 left-[285px] top-[116px] -rotate-90 origin-top-left"></div>
          <div className="absolute w-96 h-[1px] bg-neutral-200 left-[528px] top-[183px] rotate-[-88.99deg] origin-top-left"></div>
          <div className="absolute w-96 h-[1px] bg-neutral-200 left-[788px] top-[218px] rotate-[-90.36deg] origin-top-left"></div>
          <div className="absolute w-96 h-[1px] bg-neutral-200 left-[1029px] top-[218px] rotate-[-89.20deg] origin-top-left"></div>
          <div className="absolute w-96 h-[1px] bg-neutral-200 left-[1284px] top-[201px] rotate-[-89.84deg] origin-top-left"></div>
          <div className="absolute w-96 h-[1px] bg-neutral-200 right-[192px] top-[146px] -rotate-90 origin-top-left"></div>
        </div>

        <div className="max-w-[1728px] mx-auto px-4 pt-16">
          {/* Main Heading */}
          <div className="text-center mb-16">
            <h1 className="text-8xl font-russo text-black leading-tight max-w-[1155px] mx-auto">
              Bringing verifiable + trusted data markets
            </h1>
            
            <p className="text-2xl font-light font-albert text-black max-w-[974px] mx-auto mt-8">
              Model with training data from top NHS inc. hospitals, works like magic. Model with training data from top NHS inc. hospitals, works like magic.
            </p>

            {/* CTA Buttons */}
            <div className="flex items-center justify-center gap-8 mt-12">
              <button className="w-80 h-20 bg-black rounded-[30px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] border-[0.30px] border-neutral-500 text-3xl font-light font-albert text-white">
                Launch App
              </button>
              <button className="w-80 h-20 bg-white rounded-[30px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] border-[0.30px] border-neutral-500 text-3xl font-light font-albert text-black flex items-center justify-center gap-2">
                Read Docs
                <svg className="w-5 h-6" viewBox="0 0 20 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </button>
            </div>

            {/* Built on Sui Stack */}
            <div className="mt-16 text-center">
              <p className="text-2xl font-albert text-neutral-500 mb-4">
                Built on the Sui Stack
              </p>
              <div className="flex items-center justify-center gap-8">
                <div className="w-28 h-6 bg-gray-200 rounded"></div>
                <div className="w-28 h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}