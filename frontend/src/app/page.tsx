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

          {/* Trusted Marketplaces Section */}
          <section className="mt-32 px-4">
            <div className="max-w-[1013px] mx-auto text-left mb-8">
              <h2 className="text-6xl font-russo text-black mb-6">
                Trusted Marketplaces
              </h2>
              <p className="text-2xl font-light font-albert text-black max-w-[832px]">
                Eliminating the &ldquo;Trust me bro&rdquo; barrier with sensitive markets.
              </p>
            </div>

            {/* Model Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-16">
              {/* AI Model x129 */}
              <div className="relative bg-black rounded-3xl border border-stone-300 overflow-hidden h-[827px]">
                <div className="w-full h-2/3 bg-gradient-to-br from-gray-800 to-black"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-4xl font-russo mb-4">AI Model x129</h3>
                  <p className="text-base font-albert text-white mb-6 max-w-72">
                    Model with training data from top NHS inc. hospitals, works like magic.
                  </p>
                  <button className="w-40 h-10 bg-zinc-300 rounded-[30px] text-black text-base font-albert">
                    Verify Model
                  </button>
                </div>
              </div>

              {/* Opus Model x229 */}
              <div className="relative bg-gray-600 rounded-3xl border border-neutral-400 overflow-hidden h-[586px]">
                <div className="w-full h-2/3 bg-gradient-to-br from-gray-400 to-gray-600"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-4xl font-russo mb-4">Opus Model x229</h3>
                  <p className="text-base font-albert text-zinc-300 mb-6 max-w-72">
                    Model with training data from top NHS inc. hospitals, works like magic.
                  </p>
                  <button className="w-40 h-10 bg-zinc-500 rounded-[30px] text-white text-base font-albert">
                    Verify Model
                  </button>
                </div>
              </div>

              {/* Self Drive Model */}
              <div className="relative bg-black rounded-3xl border border-stone-300 overflow-hidden h-[586px]">
                <div className="w-full h-2/3 bg-gradient-to-br from-gray-800 to-black"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-4xl font-russo mb-4">Self Drive Model</h3>
                  <p className="text-base font-albert text-white mb-6 max-w-72">
                    Model with training data from top NHS inc. hospitals, works like magic.
                  </p>
                  <button className="w-40 h-10 bg-zinc-300 rounded-[30px] text-black text-base font-albert">
                    Verify Model
                  </button>
                </div>
              </div>

              {/* Self Drive Model (small) */}
              <div className="relative bg-gray-500 rounded-3xl border border-neutral-400 overflow-hidden h-80">
                <div className="w-full h-2/3 bg-gradient-to-br from-gray-400 to-gray-600"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-zinc-300">
                  <h3 className="text-4xl font-russo mb-4">Self Drive Model</h3>
                  <p className="text-base font-albert mb-6 max-w-72">
                    Model with training data from top NHS inc. hospitals, works like magic.
                  </p>
                </div>
              </div>

              {/* Large Self Drive Model */}
              <div className="relative bg-black rounded-3xl border border-stone-300 overflow-hidden h-[586px] col-span-2">
                <div className="w-full h-2/3 bg-gradient-to-br from-gray-800 to-black"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-4xl font-russo mb-4">Self Drive Model</h3>
                  <p className="text-base font-albert text-white mb-6 max-w-72">
                    Model with training data from top NHS inc. hospitals, works like magic.
                  </p>
                  <div className="flex gap-4">
                    <button className="w-40 h-10 bg-zinc-500 rounded-[30px] text-white text-base font-albert">
                      Verify Model
                    </button>
                    <button className="w-40 h-10 bg-zinc-300 rounded-[30px] text-black text-base font-albert">
                      Verify Model
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}