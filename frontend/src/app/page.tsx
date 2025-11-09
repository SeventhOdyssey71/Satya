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
            <button className="px-6 py-3 bg-white rounded-[30px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] border-[0.30px] border-neutral-500 text-lg font-light font-albert text-black">
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
            <h1 className="text-5xl font-russo text-black leading-tight max-w-[800px] mx-auto">
              Bringing verifiable + trusted data markets
            </h1>
            
            <p className="text-lg font-light font-albert text-black max-w-[650px] mx-auto mt-6">
              Model with training data from top NHS inc. hospitals, works like magic. Model with training data from top NHS inc. hospitals, works like magic.
            </p>

            {/* CTA Buttons */}
            <div className="flex items-center justify-center gap-8 mt-12">
              <button className="w-60 h-14 bg-black rounded-[30px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] border-[0.30px] border-neutral-500 text-lg font-light font-albert text-white">
                Launch App
              </button>
              <button className="w-60 h-14 bg-white rounded-[30px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] border-[0.30px] border-neutral-500 text-lg font-light font-albert text-black flex items-center justify-center gap-2">
                Read Docs
                <svg className="w-5 h-6" viewBox="0 0 20 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </button>
            </div>

            {/* Built on Sui Stack */}
            <div className="mt-16 text-center">
              <p className="text-lg font-albert text-neutral-500 mb-4">
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
          <section className="mt-32 px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-russo text-black mb-4">
                Built on the Sui Stack
              </h2>
              <p className="text-lg font-light font-albert text-black max-w-[650px] mx-auto">
                Model with training data from top NHS inc. hospitals, works like magic.
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              <div className="w-full h-56 bg-white border border-black p-6 flex items-center justify-center">
                <div className="w-72 h-28 bg-gray-200 rounded"></div>
              </div>
              <div className="w-full h-56 bg-white border border-black"></div>
              <div className="w-full h-56 bg-white border border-black"></div>
              <div className="w-full h-56 bg-white border border-black"></div>
            </div>
          </section>

          {/* Trust Enforced Section */}
          <section className="mt-32 px-4">
            <div className="flex flex-col lg:flex-row gap-16 items-start">
              <div className="lg:w-1/2">
                <h2 className="text-4xl font-russo text-black mb-4 max-w-[400px]">
                  Trust Enforced
                </h2>
                <p className="text-lg font-light font-albert text-black max-w-[400px] mb-6">
                  Model with training data from top NHS inc. hospitals, works like magic. Model with training data from top NHS inc. hospitals, works like magic.
                </p>
                <button className="w-60 h-14 bg-white rounded-[30px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] border-[0.5px] border-neutral-500 text-lg font-light font-albert text-black">
                  Read Docs
                </button>
              </div>
              
              <div className="lg:w-1/2">
                <div className="bg-stone-50 rounded-[50px] border border-black p-4 max-w-[933px] h-[568px]">
                  <div className="grid grid-cols-2 gap-4 h-full">
                    <div className="bg-white rounded-[50px] border border-black"></div>
                    <div className="bg-white rounded-[50px] border border-black"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mt-32 px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-russo text-black">
                FAQ
              </h2>
            </div>

            <div className="space-y-6 max-w-[1555px] mx-auto">
              {/* FAQ Item 1 - Expanded */}
              <div className="h-80 bg-black rounded-[30px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] border-[0.5px] border-neutral-200 p-8 flex items-center justify-between">
                <div className="text-white">
                  <h3 className="text-4xl font-russo mb-4 max-w-[400px]">
                    Trust Enforced
                  </h3>
                  <p className="text-lg font-light font-albert max-w-[400px]">
                    Model with training data from top NHS inc. hospitals, works like magic. Model with training data from top NHS inc. hospitals, works like magic.
                  </p>
                </div>
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                  <div className="w-9 h-0.5 bg-black"></div>
                </div>
              </div>

              {/* FAQ Item 2 */}
              <div className="h-48 bg-white rounded-[30px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] border-[0.5px] border-neutral-500 p-8 flex items-center justify-between">
                <div className="text-black">
                  <h3 className="text-4xl font-russo max-w-[400px]">
                    Trust Enforced
                  </h3>
                </div>
                <div className="w-24 h-24 bg-white rounded-full border border-black flex items-center justify-center">
                  <div className="w-9 h-0 border-t-2 border-black"></div>
                  <div className="w-0 h-9 border-l-2 border-black absolute"></div>
                </div>
              </div>

              {/* FAQ Item 3 */}
              <div className="h-48 bg-white rounded-[30px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] border-[0.5px] border-neutral-500 p-8 flex items-center justify-between">
                <div className="text-black">
                  <h3 className="text-4xl font-russo max-w-[400px]">
                    Trust Enforced
                  </h3>
                </div>
                <div className="w-24 h-24 bg-white rounded-full border border-black flex items-center justify-center">
                  <div className="w-9 h-0 border-t-2 border-black"></div>
                  <div className="w-0 h-9 border-l-2 border-black absolute"></div>
                </div>
              </div>

              {/* FAQ Item 4 */}
              <div className="h-48 bg-white rounded-[30px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] border-[0.5px] border-neutral-500 p-8 flex items-center justify-between">
                <div className="text-black">
                  <h3 className="text-4xl font-russo max-w-[400px]">
                    Trust Enforced
                  </h3>
                </div>
                <div className="w-24 h-24 bg-white rounded-full border border-black flex items-center justify-center">
                  <div className="w-9 h-0 border-t-2 border-black"></div>
                  <div className="w-0 h-9 border-l-2 border-black absolute"></div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-32 px-4 pb-8">
        <div className="w-full max-w-[1648px] mx-auto h-[476px] bg-black rounded-[50px] border border-stone-300 p-16 relative">
          <div className="flex justify-between items-start h-full">
            <div>
              <h3 className="text-3xl font-russo text-sky-100 mb-6">
                Satya
              </h3>
            </div>
            
            <div className="flex gap-32">
              <div className="space-y-6">
                <div className="text-lg font-light font-albert text-white">Docs</div>
                <div className="text-lg font-light font-albert text-white">Team</div>
                <div className="text-lg font-light font-albert text-white">Support</div>
              </div>
              
              <div className="space-y-6">
                <div className="text-lg font-light font-albert text-white">FAQ</div>
                <div className="text-lg font-light font-albert text-white">Terms of Service</div>
              </div>
            </div>
          </div>
          
          {/* Social Icons */}
          <div className="absolute bottom-8 right-8 flex gap-4">
            <div className="w-9 h-9 bg-white rounded"></div>
            <div className="w-9 h-9 border border-white rounded flex items-center justify-center">
              <div className="w-7 h-6 border border-white"></div>
            </div>
            <div className="w-7 h-6 bg-white"></div>
          </div>
        </div>
      </footer>
    </div>
  )
}