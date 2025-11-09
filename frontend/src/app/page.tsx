export default function Home() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Header */}
      <header className="relative">
        <div className="border-b border-neutral-200"></div>
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="text-2xl font-russo text-cyan-950">
              Satya
            </div>
            <button className="px-4 py-2 bg-white rounded-[30px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] border-[0.30px] border-neutral-500 text-sm font-light font-albert text-black flex items-center gap-2">
              Get Started
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 13l3 3 7-7" />
              </svg>
            </button>
          </div>
        </div>
        <div className="border-b border-neutral-200"></div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        {/* Background Grid - Subtle */}
        <div className="absolute inset-0 pointer-events-none opacity-30 -z-10">
          <div className="w-full h-full bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:80px_80px]"></div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 pt-12">
          {/* Main Heading */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-russo text-black leading-tight max-w-[800px] mx-auto">
              Bringing verifiable + trusted data markets
            </h1>
            
            <p className="text-lg font-light font-albert text-black max-w-[650px] mx-auto mt-6">
              Model with training data from top NHS inc. hospitals, works like magic. Model with training data from top NHS inc. hospitals, works like magic.
            </p>

            {/* CTA Buttons */}
            <div className="flex items-center justify-center gap-6 mt-8">
              <button className="px-8 py-3 bg-black rounded-[30px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] border-[0.30px] border-neutral-500 text-base font-light font-albert text-white flex items-center gap-2">
                Launch App
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 12L10 8L6 4" />
                </svg>
              </button>
              <button className="px-8 py-3 bg-white rounded-[30px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] border-[0.30px] border-neutral-500 text-base font-light font-albert text-black flex items-center justify-center gap-2">
                Read Docs
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8L8 12L12 8" />
                </svg>
              </button>
            </div>

            {/* Built on Sui Stack */}
            <div className="mt-12 text-center">
              <p className="text-base font-albert text-neutral-500 mb-3">
                Built on the Sui Stack
              </p>
              <div className="flex items-center justify-center gap-6">
                <div className="w-20 h-5 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-xs font-albert text-gray-600">SEAL</span>
                </div>
                <div className="w-20 h-6 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-xs font-albert text-gray-600">WALRUS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trusted Marketplaces Section */}
          <section className="mt-32 px-4">
            <div className="max-w-[1013px] mx-auto text-left mb-8">
              <h2 className="text-4xl font-russo text-black mb-4">
                Trusted Marketplaces
              </h2>
              <p className="text-lg font-light font-albert text-black max-w-[600px]">
                Eliminating the &ldquo;Trust me bro&rdquo; barrier with sensitive markets.
              </p>
            </div>

            {/* Model Cards Bento Grid */}
            <div className="max-w-[1100px] mx-auto mt-12 relative h-[700px]">
              {/* AI Model x129 - Tall left */}
              <div className="absolute left-0 top-0 bg-black rounded-3xl border border-stone-300 overflow-hidden w-[350px] h-[420px]">
                <div className="w-full h-2/3 bg-gradient-to-br from-gray-800 to-black"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="text-xl font-russo mb-2">AI Model x129</h3>
                  <p className="text-sm font-albert text-white mb-3 leading-tight">
                    Model with training data from top NHS inc. hospitals, works like magic.
                  </p>
                  <button className="w-28 h-8 bg-zinc-300 rounded-[20px] text-black text-sm font-albert">
                    Verify Model
                  </button>
                </div>
              </div>

              {/* Opus Model x229 - Top middle */}
              <div className="absolute left-[370px] top-0 bg-gray-500 rounded-3xl border border-neutral-400 overflow-hidden w-[350px] h-[280px]">
                <div className="w-full h-2/3 bg-gradient-to-br from-gray-400 to-gray-600"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="text-xl font-russo mb-2">Opus Model x229</h3>
                  <p className="text-sm font-albert text-zinc-300 mb-3 leading-tight">
                    Model with training data from top NHS inc. hospitals, works like magic.
                  </p>
                  <button className="w-28 h-8 bg-zinc-500 rounded-[20px] text-white text-sm font-albert">
                    Verify Model
                  </button>
                </div>
              </div>

              {/* Self Drive Model - Top right */}
              <div className="absolute left-[740px] top-0 bg-black rounded-3xl border border-stone-300 overflow-hidden w-[350px] h-[280px]">
                <div className="w-full h-2/3 bg-gradient-to-br from-gray-800 to-black"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="text-xl font-russo mb-2">Self Drive Model</h3>
                  <p className="text-sm font-albert text-white mb-3 leading-tight">
                    Model with training data from top NHS inc. hospitals, works like magic.
                  </p>
                  <button className="w-28 h-8 bg-zinc-300 rounded-[20px] text-black text-sm font-albert">
                    Verify Model
                  </button>
                </div>
              </div>

              {/* Self Drive Model (small) - Bottom left */}
              <div className="absolute left-0 top-[440px] bg-gray-500 rounded-3xl border border-neutral-400 overflow-hidden w-[350px] h-[250px]">
                <div className="w-full h-2/3 bg-gradient-to-br from-gray-400 to-gray-600"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-zinc-300">
                  <h3 className="text-xl font-russo mb-2">Self Drive Model</h3>
                  <p className="text-sm font-albert mb-3 leading-tight">
                    Model with training data from top NHS inc. hospitals, works like magic.
                  </p>
                  <button className="w-28 h-8 bg-zinc-400 rounded-[20px] text-white text-sm font-albert">
                    Verify Model
                  </button>
                </div>
              </div>

              {/* Large Self Drive Model - Bottom right */}
              <div className="absolute left-[370px] top-[300px] bg-black rounded-3xl border border-stone-300 overflow-hidden w-[720px] h-[390px]">
                <div className="w-full h-2/3 bg-gradient-to-br from-gray-800 to-black"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="text-xl font-russo mb-2">Self Drive Model</h3>
                  <p className="text-sm font-albert text-white mb-3 leading-tight">
                    Model with training data from top NHS inc. hospitals, works like magic.
                  </p>
                  <div className="flex gap-3">
                    <button className="w-28 h-8 bg-zinc-500 rounded-[20px] text-white text-sm font-albert">
                      Verify Model
                    </button>
                    <button className="w-28 h-8 bg-zinc-300 rounded-[20px] text-black text-sm font-albert">
                      Verify Model
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Built on Sui Stack Section */}
          <section className="mt-24 px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-russo text-black mb-3">
                Built on the Sui Stack
              </h2>
              <p className="text-base font-light font-albert text-black max-w-[500px] mx-auto">
                Model with training data from top NHS inc. hospitals, works like magic.
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 max-w-[1000px] mx-auto">
              <div className="w-full h-40 bg-white border border-black p-4 flex items-center justify-center">
                <div className="w-20 h-16 bg-gray-200 rounded"></div>
              </div>
              <div className="w-full h-40 bg-white border border-black"></div>
              <div className="w-full h-40 bg-white border border-black"></div>
              <div className="w-full h-40 bg-white border border-black"></div>
            </div>
          </section>

          {/* Trust Enforced Section */}
          <section className="mt-24 px-4">
            <div className="flex flex-col lg:flex-row gap-12 items-start max-w-[1000px] mx-auto">
              <div className="lg:w-1/2">
                <h2 className="text-3xl font-russo text-black mb-3 max-w-[350px]">
                  Trust Enforced
                </h2>
                <p className="text-base font-light font-albert text-black max-w-[350px] mb-5">
                  Model with training data from top NHS inc. hospitals, works like magic. Model with training data from top NHS inc. hospitals, works like magic.
                </p>
                <button className="px-6 py-3 bg-white rounded-[30px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] border-[0.5px] border-neutral-500 text-base font-light font-albert text-black">
                  Read Docs
                </button>
              </div>
              
              <div className="lg:w-1/2">
                <div className="bg-stone-50 rounded-[40px] border border-black p-3 max-w-[450px] h-80">
                  <div className="grid grid-cols-2 gap-3 h-full">
                    <div className="bg-white rounded-[40px] border border-black"></div>
                    <div className="bg-white rounded-[40px] border border-black"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mt-24 px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-russo text-black">
                FAQ
              </h2>
            </div>

            <div className="space-y-4 max-w-[1000px] mx-auto">
              {/* FAQ Item 1 - Expanded */}
              <div className="h-60 bg-black rounded-[30px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] border-[0.5px] border-neutral-200 p-6 flex items-center justify-between">
                <div className="text-white">
                  <h3 className="text-2xl font-russo mb-3 max-w-[350px]">
                    Trust Enforced
                  </h3>
                  <p className="text-base font-light font-albert max-w-[350px] leading-relaxed">
                    Model with training data from top NHS inc. hospitals, works like magic. Model with training data from top NHS inc. hospitals, works like magic.
                  </p>
                </div>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                  <div className="w-6 h-0.5 bg-black"></div>
                </div>
              </div>

              {/* FAQ Item 2 */}
              <div className="h-20 bg-white rounded-[30px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] border-[0.5px] border-neutral-500 p-6 flex items-center justify-between">
                <div className="text-black">
                  <h3 className="text-2xl font-russo max-w-[350px]">
                    Trust Enforced
                  </h3>
                </div>
                <div className="w-16 h-16 bg-white rounded-full border border-black flex items-center justify-center relative">
                  <div className="w-6 h-0 border-t border-black"></div>
                  <div className="w-0 h-6 border-l border-black absolute"></div>
                </div>
              </div>

              {/* FAQ Item 3 */}
              <div className="h-20 bg-white rounded-[30px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] border-[0.5px] border-neutral-500 p-6 flex items-center justify-between">
                <div className="text-black">
                  <h3 className="text-2xl font-russo max-w-[350px]">
                    Trust Enforced
                  </h3>
                </div>
                <div className="w-16 h-16 bg-white rounded-full border border-black flex items-center justify-center relative">
                  <div className="w-6 h-0 border-t border-black"></div>
                  <div className="w-0 h-6 border-l border-black absolute"></div>
                </div>
              </div>

              {/* FAQ Item 4 */}
              <div className="h-20 bg-white rounded-[30px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] border-[0.5px] border-neutral-500 p-6 flex items-center justify-between">
                <div className="text-black">
                  <h3 className="text-2xl font-russo max-w-[350px]">
                    Trust Enforced
                  </h3>
                </div>
                <div className="w-16 h-16 bg-white rounded-full border border-black flex items-center justify-center relative">
                  <div className="w-6 h-0 border-t border-black"></div>
                  <div className="w-0 h-6 border-l border-black absolute"></div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-24 px-4 pb-6">
        <div className="w-full max-w-[1000px] mx-auto h-80 bg-black rounded-[40px] border border-stone-300 p-8 relative">
          <div className="flex justify-between items-start h-full">
            <div>
              <h3 className="text-2xl font-russo text-sky-100 mb-4">
                Satya
              </h3>
            </div>
            
            <div className="flex gap-16">
              <div className="space-y-4">
                <div className="text-base font-light font-albert text-white">Docs</div>
                <div className="text-base font-light font-albert text-white">Team</div>
                <div className="text-base font-light font-albert text-white">Support</div>
              </div>
              
              <div className="space-y-4">
                <div className="text-base font-light font-albert text-white">FAQ</div>
                <div className="text-base font-light font-albert text-white">Terms of Service</div>
              </div>
            </div>
          </div>
          
          {/* Social Icons */}
          <div className="absolute bottom-6 right-6 flex gap-3">
            <div className="w-8 h-8 bg-white rounded"></div>
            <div className="w-8 h-8 border border-white rounded flex items-center justify-center">
              <div className="w-6 h-5 border border-white"></div>
            </div>
            <div className="w-6 h-5 bg-white"></div>
          </div>
        </div>
      </footer>
    </div>
  )
}