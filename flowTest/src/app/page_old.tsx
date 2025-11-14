import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/ui/Header'
import { HiArrowRight, HiShieldCheck, HiLightningBolt, HiGlobe } from 'react-icons/hi2'
import { TbShield, TbDatabase, TbNetwork, TbCloudCheck } from 'react-icons/tb'

export default function Home() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-surface-50 via-primary-50/30 to-accent-50/30">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-accent-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <Header activeTab="marketplace" />
      
      {/* Hero Section */}
      <HeroSection />
      
      {/* Features Overview */}
      <FeaturesSection />
      
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


function FeaturesSection() {
  const features = [
    {
      icon: TbShield,
      title: "TEE Verification",
      description: "Hardware-based security ensures model integrity and prevents tampering through trusted execution environments.",
      color: "primary"
    },
    {
      icon: TbDatabase,
      title: "Encrypted Storage",
      description: "SEAL encryption protects sensitive data while maintaining usability and compliance with privacy regulations.",
      color: "accent"
    },
    {
      icon: TbNetwork,
      title: "Blockchain Transparency",
      description: "Immutable transaction records and smart contract automation ensure trust and verifiable ownership.",
      color: "success"
    },
    {
      icon: TbCloudCheck,
      title: "Walrus Storage",
      description: "Decentralized storage infrastructure provides reliable, scalable, and cost-effective data management.",
      color: "warning"
    }
  ];

  return (
    <section className="relative z-10 py-20">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-russo mb-6">Why Choose Satya?</h2>
          <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
            Built with cutting-edge security and transparency features to ensure trust in AI model trading.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            const colorClasses = {
              primary: "bg-primary-100 text-primary-600 border-primary-200",
              accent: "bg-accent-100 text-accent-600 border-accent-200",
              success: "bg-success-100 text-success-600 border-success-200",
              warning: "bg-warning-100 text-warning-600 border-warning-200"
            };
            
            return (
              <div key={index} className="card-hover p-6 text-center group animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl border ${colorClasses[feature.color]} mb-4 group-hover:scale-110 transition-transform`}>
                  <IconComponent className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-russo mb-3 text-secondary-800">{feature.title}</h3>
                <p className="text-secondary-600 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HeroSection() {
  return (
    <section className="relative z-10 py-24 md:py-32">
      <div className="container-custom">
        <div className="text-center max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 border border-primary-200 rounded-full mb-8 animate-fade-in">
            <HiShieldCheck className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-albert font-medium text-primary-700">Trusted AI Marketplace</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-russo leading-tight max-w-4xl mx-auto mb-8 animate-slide-up">
            Bringing <span className="text-gradient">verifiable</span> + trusted data markets
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl font-albert text-secondary-600 max-w-3xl mx-auto mb-12 leading-relaxed animate-slide-up">
            Secure AI models and datasets with TEE verification, encrypted storage, and blockchain transparency. 
            Building the future of trusted machine learning.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-scale-in">
            <Link href="/marketplace">
              <button className="btn-primary btn-lg w-full sm:w-auto min-w-[200px] group">
                Launch App
                <HiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <button className="btn-secondary btn-lg w-full sm:w-auto min-w-[200px] group">
              Read Docs
              <svg className="w-4 h-4 group-hover:rotate-45 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          </div>

          {/* Tech Stack */}
          <div className="text-center animate-fade-in">
            <p className="text-lg font-albert text-secondary-500 mb-8">Built on the Sui Stack</p>
            <div className="flex items-center justify-center gap-8 md:gap-16">
              <div className="group transition-transform hover:scale-110">
                <div className="p-4 bg-surface-50 border border-border rounded-2xl shadow-card hover:shadow-soft transition-all">
                  <Image 
                    src="/images/Seal.svg" 
                    alt="SEAL"
                    width={80}
                    height={80}
                    className="h-16 w-auto"
                  />
                </div>
              </div>
              <div className="group transition-transform hover:scale-110">
                <div className="p-4 bg-surface-50 border border-border rounded-2xl shadow-card hover:shadow-soft transition-all">
                  <img 
                    src="/images/Walrus.png" 
                    alt="WALRUS"
                    className="h-16 w-auto object-contain"
                  />
                </div>
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
          <h2 className="text-4xl font-russo text-black mb-4 max-w-[1013px]">
            Trusted Marketplaces
          </h2>
          <p className="text-lg font-light font-albert text-black max-w-[832px]">
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
              <Link href="/model/ai-model-x129">
                <button className="w-40 h-10 bg-zinc-300 rounded-[30px] flex items-center justify-center text-black text-base font-albert hover:bg-zinc-200 transition-colors">
                  Verify Model
                </button>
              </Link>
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
              <Link href="/model/opus-model-x229">
                <button className="w-40 h-10 bg-zinc-500 rounded-[30px] flex items-center justify-center text-white text-base font-albert hover:bg-zinc-400 transition-colors">
                  Verify Model
                </button>
              </Link>
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
              <Link href="/model/self-drive-model">
                <button className="w-40 h-10 bg-zinc-300 rounded-[30px] flex items-center justify-center text-black text-base font-albert hover:bg-zinc-200 transition-colors">
                  Verify Model
                </button>
              </Link>
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
                <Link href="/model/self-drive-model">
                  <button className="w-40 h-10 bg-zinc-500 rounded-[30px] flex items-center justify-center text-white text-base font-albert hover:bg-zinc-400 transition-colors">
                    Verify Model
                  </button>
                </Link>
                <Link href="/model/opus-model-x229">
                  <button className="w-40 h-10 bg-zinc-300 rounded-[30px] flex items-center justify-center text-black text-base font-albert hover:bg-zinc-200 transition-colors">
                    Verify Model
                  </button>
                </Link>
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