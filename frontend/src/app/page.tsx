import Link from 'next/link'

export default function Home() {
  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      {/* Header */}
      <Header />
      
      {/* Hero Section */}
      <HeroSection />
      
      {/* Trusted Marketplaces */}
      <TrustedMarketplacesSection />
      
      {/* Built on Sui Stack */}
      <SuiStackSection />
      
      {/* Trust Enforced */}
      <TrustEnforcedSection />
      
      {/* FAQ */}
      <FAQSection />
      
      {/* Footer */}
      <Footer />
    </div>
  )
}


function Header() {
  return (
    <header className="relative z-10">
      <div className="container max-w-[1728px] mx-auto px-8">
        <div className="flex items-center justify-between py-6">
          <h1 className="text-4xl font-russo text-cyan-950 ml-4">Satya</h1>
          <Link href="/marketplace">
            <button className="px-6 py-3 bg-white rounded-[30px] shadow-sm border border-neutral-500 text-lg font-light font-albert text-black hover:shadow-md transition-shadow mr-4">
              Get Started
            </button>
          </Link>
        </div>
      </div>
    </header>
  )
}

function HeroSection() {
  return (
    <section className="relative z-10 py-32">
      <div className="container max-w-[1728px] mx-auto px-4">
        <div className="text-center">
          <h1 className="text-7xl font-russo text-black leading-tight max-w-[1155px] mx-auto mb-8">
            Bringing verifiable + trusted data markets
          </h1>
          
          <p className="text-xl font-light font-albert text-black max-w-[974px] mx-auto mb-12">
            Model with training data from top NHS inc. hospitals, works like magic. Model with training data from top NHS inc. hospitals, works like magic.
          </p>

          <div className="flex items-center justify-center gap-4 mb-40">
            <Link href="/marketplace">
              <button className="w-52 h-14 bg-black rounded-[30px] shadow-sm border border-neutral-500 text-lg font-light font-albert text-white hover:shadow-md transition-shadow">
                Launch App
              </button>
            </Link>
            <button className="w-52 h-14 bg-white rounded-[30px] shadow-sm border border-neutral-500 text-lg font-light font-albert text-black hover:shadow-md transition-shadow flex items-center justify-center gap-2">
              Read Docs
              <svg className="w-4 h-4" viewBox="0 0 20 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </button>
          </div>

          <div className="text-center mt-8">
            <p className="text-2xl font-albert text-neutral-500 mb-4">Built on the Sui Stack</p>
            <div className="flex items-center justify-center gap-8">
              <div className="w-28 h-6 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-xs font-albert text-gray-600">SEAL</span>
              </div>
              <div className="w-28 h-8 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-xs font-albert text-gray-600">WALRUS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function TrustedMarketplacesSection() {
  return (
    <section className="relative z-10 py-24">
      <div className="container max-w-[1728px] mx-auto px-4">
        <div className="mb-12">
          <h2 className="text-6xl font-russo text-black mb-6 max-w-[1013px]">
            Trusted Marketplaces
          </h2>
          <p className="text-2xl font-light font-albert text-black max-w-[832px]">
            Eliminating the &ldquo;Trust me bro&rdquo; barrier with sensitive markets.
          </p>
        </div>

        {/* Model Cards with exact positioning */}
        <div className="relative h-[1200px]">
          {/* AI Model x129 - Tall */}
          <div className="absolute w-[533px] h-[827px] left-[39px] top-0 bg-black rounded-3xl border border-stone-300 overflow-hidden">
            <div className="w-full h-2/3 bg-gradient-to-br from-gray-800 to-black" />
            <div className="absolute bottom-8 left-8 right-8 text-white">
              <h3 className="text-4xl font-russo mb-4">AI Model x129</h3>
              <p className="text-base font-albert mb-6 w-72">
                Model with training data from top NHS inc. hospitals, works like magic.
              </p>
              <button className="w-40 h-10 bg-zinc-300 rounded-[30px] flex items-center justify-center text-black text-base font-albert">
                Verify Model
              </button>
            </div>
          </div>

          {/* Opus Model x229 */}
          <div className="absolute w-[533px] h-[586px] left-[597px] top-0 bg-gray-600 rounded-3xl border border-neutral-400 overflow-hidden">
            <div className="w-full h-2/3 bg-gradient-to-br from-gray-400 to-gray-600" />
            <div className="absolute bottom-8 left-8 right-8 text-white">
              <h3 className="text-4xl font-russo mb-4">Opus Model x229</h3>
              <p className="text-base font-albert text-zinc-300 mb-6 w-72">
                Model with training data from top NHS inc. hospitals, works like magic.
              </p>
              <button className="w-40 h-10 bg-zinc-500 rounded-[30px] flex items-center justify-center text-white text-base font-albert">
                Verify Model
              </button>
            </div>
          </div>

          {/* Self Drive Model - Top Right */}
          <div className="absolute w-[533px] h-[586px] left-[1155px] top-[8px] bg-black rounded-3xl border border-stone-300 overflow-hidden">
            <div className="w-full h-2/3 bg-gradient-to-br from-gray-800 to-black" />
            <div className="absolute bottom-8 left-8 right-8 text-white">
              <h3 className="text-4xl font-russo mb-4">Self Drive Model</h3>
              <p className="text-base font-albert mb-6 w-72">
                Model with training data from top NHS inc. hospitals, works like magic.
              </p>
              <button className="w-40 h-10 bg-zinc-300 rounded-[30px] flex items-center justify-center text-black text-base font-albert">
                Verify Model
              </button>
            </div>
          </div>

          {/* Self Drive Model - Small */}
          <div className="absolute w-[533px] h-80 left-[39px] top-[846px] bg-gray-500 rounded-3xl border border-neutral-400 overflow-hidden">
            <div className="w-full h-2/3 bg-gradient-to-br from-gray-400 to-gray-600" />
            <div className="absolute bottom-8 left-8 right-8 text-zinc-300">
              <h3 className="text-4xl font-russo mb-4">Self Drive Model</h3>
              <p className="text-base font-albert w-72">
                Model with training data from top NHS inc. hospitals, works like magic.
              </p>
            </div>
          </div>

          {/* Large Self Drive Model */}
          <div className="absolute w-[1092px] h-[586px] left-[596px] top-[607px] bg-black rounded-3xl border border-stone-300 overflow-hidden">
            <div className="w-full h-2/3 bg-gradient-to-br from-gray-800 to-black" />
            <div className="absolute bottom-8 left-8 right-8 text-white">
              <h3 className="text-4xl font-russo mb-4">Self Drive Model</h3>
              <p className="text-base font-albert mb-6 w-72">
                Model with training data from top NHS inc. hospitals, works like magic.
              </p>
              <div className="flex gap-4">
                <button className="w-40 h-10 bg-zinc-500 rounded-[30px] flex items-center justify-center text-white text-base font-albert">
                  Verify Model
                </button>
                <button className="w-40 h-10 bg-zinc-300 rounded-[30px] flex items-center justify-center text-black text-base font-albert">
                  Verify Model
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


function SuiStackSection() {
  return (
    <section className="relative z-10 py-16">
      <div className="container max-w-[1728px] mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-6xl font-russo text-black mb-6">
            Built on the Sui Stack
          </h2>
          <p className="text-2xl font-light font-albert text-black max-w-[974px] mx-auto">
            Model with training data from top NHS inc. hospitals, works like magic.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square bg-white border border-black p-6 flex items-center justify-center">
              {i === 0 && <div className="w-72 h-28 bg-gray-200 rounded" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TrustEnforcedSection() {
  return (
    <section className="relative z-10 py-16">
      <div className="container max-w-[1728px] mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          <div className="lg:w-1/2">
            <h2 className="text-6xl font-russo text-black mb-6 max-w-[490px]">
              Trust Enforced
            </h2>
            <p className="text-2xl font-light font-albert text-black max-w-[514px] mb-8">
              Model with training data from top NHS inc. hospitals, works like magic. Model with training data from top NHS inc. hospitals, works like magic.
            </p>
            <button className="w-80 h-20 bg-white rounded-[30px] shadow-sm border border-neutral-500 text-3xl font-light font-albert text-black hover:shadow-md transition-shadow">
              Read Docs
            </button>
          </div>
          
          <div className="lg:w-1/2">
            <div className="bg-stone-50 rounded-[50px] border border-black p-4 max-w-[933px] h-[568px]">
              <div className="grid grid-cols-2 gap-4 h-full">
                <div className="bg-white rounded-[50px] border border-black" />
                <div className="bg-white rounded-[50px] border border-black" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FAQSection() {
  const faqItems = [
    { expanded: true },
    { expanded: false },
    { expanded: false },
    { expanded: false }
  ]

  return (
    <section className="relative z-10 py-16">
      <div className="container max-w-[1728px] mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-6xl font-russo text-black">FAQ</h2>
        </div>

        <div className="space-y-6 max-w-[1555px] mx-auto">
          {faqItems.map((item, index) => (
            <FAQItem key={index} expanded={item.expanded} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQItem({ expanded }: { expanded: boolean }) {
  return (
    <div className={`${expanded ? 'h-80 bg-black text-white' : 'h-48 bg-white text-black'} rounded-[30px] shadow-sm border ${expanded ? 'border-neutral-200' : 'border-neutral-500'} p-8 flex items-center justify-between`}>
      <div>
        <h3 className="text-6xl font-russo mb-6 max-w-[490px]">
          Trust Enforced
        </h3>
        {expanded && (
          <p className="text-2xl font-light font-albert max-w-[514px]">
            Model with training data from top NHS inc. hospitals, works like magic. Model with training data from top NHS inc. hospitals, works like magic.
          </p>
        )}
      </div>
      <div className={`w-24 h-24 rounded-full flex items-center justify-center ${expanded ? 'bg-white' : 'bg-white border border-black'}`}>
        {expanded ? (
          <div className="w-9 h-0.5 bg-black" />
        ) : (
          <div className="relative">
            <div className="w-9 h-0 border-t-2 border-black" />
            <div className="w-0 h-9 border-l-2 border-black absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
        )}
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer className="relative z-10 py-8">
      <div className="container max-w-[1728px] mx-auto px-4">
        <div className="bg-black rounded-[50px] border border-stone-300 p-16 relative h-[476px]">
          <div className="flex justify-between items-start h-full">
            <div>
              <h3 className="text-4xl font-russo text-sky-100 mb-8">Satya</h3>
            </div>
            
            <div className="flex gap-32">
              <div className="space-y-6">
                <div className="text-2xl font-light font-albert text-white hover:text-gray-300 cursor-pointer">Docs</div>
                <div className="text-2xl font-light font-albert text-white hover:text-gray-300 cursor-pointer">Team</div>
                <div className="text-2xl font-light font-albert text-white hover:text-gray-300 cursor-pointer">Support</div>
              </div>
              
              <div className="space-y-6">
                <div className="text-2xl font-light font-albert text-white hover:text-gray-300 cursor-pointer">FAQ</div>
                <div className="text-2xl font-light font-albert text-white hover:text-gray-300 cursor-pointer">Terms of Service</div>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-8 right-8 flex gap-4">
            <div className="w-9 h-9 bg-white rounded hover:bg-gray-200 cursor-pointer transition-colors" />
            <div className="w-9 h-9 border border-white rounded flex items-center justify-center hover:bg-white hover:bg-opacity-10 cursor-pointer transition-colors">
              <div className="w-7 h-6 border border-white" />
            </div>
            <div className="w-7 h-6 bg-white hover:bg-gray-200 cursor-pointer transition-colors" />
          </div>
        </div>
      </div>
    </footer>
  )
}