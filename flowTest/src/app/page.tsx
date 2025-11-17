import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/ui/Header'
import SealTestButton from '@/components/debug/SealTestButton'
import { HiArrowRight, HiShieldCheck, HiBolt, HiGlobeAmericas, HiChevronDown, HiSparkles } from 'react-icons/hi2'
import { TbShield, TbDatabase, TbNetwork, TbCloudCheck } from 'react-icons/tb'

export default function Home() {
 return (
  <div className="relative min-h-screen" style={{ backgroundColor: '#f5f9ef' }}>
   {/* Subtle background effects */}
   <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gray-100/30 rounded-full blur-3xl"></div>
    <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-gray-100/20 rounded-full blur-3xl"></div>
   </div>

   {/* Header */}
   <Header isHomepage={true} />
   
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
   
   {/* Debug component for development */}
   <SealTestButton />
  </div>
 )
}

function HeroSection() {
 return (
  <section className="relative z-10 py-24 md:py-32">
   <div className="container-custom">
    <div className="text-center max-w-5xl mx-auto">
     {/* Badge */}
     <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-200 rounded-full mb-8 animate-fade-in">
      <HiShieldCheck className="w-4 h-4 text-gray-600" />
      <span className="text-[15px] font-albert font-normal text-gray-700">Trusted AI Marketplace</span>
     </div>

     {/* Main Headline */}
     <h1 className="text-5xl md:text-6xl lg:text-7xl font-russo leading-tight max-w-4xl mx-auto mb-8 animate-slide-up">
      Bringing <span className="text-gradient">verifiable</span> + trusted data markets
     </h1>
     
     {/* Subtitle */}
     <p className="text-xl md:text-2xl font-albert font-light text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed animate-slide-up">
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
      <p className="text-lg font-albert font-light text-gray-600 mb-8">Built on the Sui Stack</p>
      <div className="flex items-center justify-center gap-8 md:gap-16">
       <div className="group transition-transform hover:scale-105">
        <div className="p-4 border border-gray-200 rounded-2xl hover:shadow-md transition-all" style={{ backgroundColor: '#f5f9e5' }}>
         <Image 
          src="/images/Seal.svg" 
          alt="SEAL"
          width={80}
          height={80}
          className="h-16 w-auto"
         />
        </div>
       </div>
       <div className="group transition-transform hover:scale-105">
        <div className="p-4 border border-gray-200 rounded-2xl hover:shadow-md transition-all" style={{ backgroundColor: '#f5f9e5' }}>
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
     <p className="text-lg font-albert font-light text-gray-600 max-w-2xl mx-auto">
      Built with cutting-edge security and transparency features to ensure trust in AI model trading.
     </p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
     {features.map((feature, index) => {
      const IconComponent = feature.icon;
      const solidColorClasses = {
       primary: "text-gray-900",
       accent: "text-gray-900", 
       success: "text-gray-900",
       warning: ""
      };
      const solidColorStyles = {
       primary: { backgroundColor: '#92a3fb' },
       accent: { backgroundColor: '#e7fc7e' },
       success: { backgroundColor: '#9df9bc' },
       warning: { backgroundColor: '#000000' }
      };
      
      return (
       <div 
        key={index} 
        className={`card-hover p-8 text-center group animate-slide-up rounded-2xl ${solidColorClasses[feature.color as keyof typeof solidColorClasses]}`} 
        style={{ 
         animationDelay: `${index * 100}ms`,
         ...solidColorStyles[feature.color as keyof typeof solidColorStyles]
        }}
       >
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 group-hover:scale-105 transition-transform ${feature.color === 'warning' ? 'bg-white/20' : 'bg-white/80 text-gray-900'}`} style={feature.color === 'warning' ? { color: '#f5f9e5' } : {}}>
         <IconComponent className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-russo mb-3" style={feature.color === 'warning' ? { color: '#f5f9e5' } : {}}>{feature.title}</h3>
        <p className={`font-albert font-light leading-relaxed ${feature.color === 'warning' ? '' : 'text-gray-800'}`} style={feature.color === 'warning' ? { color: '#f5f9e5' } : {}}>{feature.description}</p>
       </div>
      );
     })}
    </div>
   </div>
  </section>
 );
}

function TrustedMarketplacesSection() {
 return (
  <section className="relative z-10 py-24">
   <div className="container-custom">
    <div className="text-center mb-16">
     <h2 className="text-3xl md:text-4xl font-russo mb-6">
      Trusted AI Model Marketplace
     </h2>
     <p className="text-lg font-albert font-light text-gray-600 max-w-3xl mx-auto leading-relaxed">
      Eliminating the "trust me bro" barrier with verifiable, secure, and transparent AI model trading. 
      Each model comes with cryptographic proofs and hardware-verified attestations.
     </p>
    </div>

    {/* Featured Models Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
     {/* Featured Model 1 */}
      <div className="lg:col-span-1 lg:row-span-2">
      <div className="card-interactive h-full min-h-[600px] border border-gray-200 text-gray-900 relative overflow-hidden" style={{ backgroundColor: '#92a3fb' }}>
       <div className="relative h-full flex flex-col justify-between p-8">
        <div>
         <div className="badge bg-white/80 text-gray-800 border border-gray-300 mb-4">
          <HiShieldCheck className="w-3 h-3" />
          TEE Verified
         </div>
         <h3 className="text-3xl font-russo mb-4 text-gray-900">Medical AI x129</h3>
         <p className="font-albert font-light text-gray-800 mb-6 leading-relaxed">
          Advanced diagnostic model trained on verified hospital data with full privacy compliance and hardware security attestation.
         </p>
        </div>
        <div className="space-y-4">
         <div className="flex items-center justify-between text-[15px] font-albert font-normal">
          <span className="text-gray-700">Downloads</span>
          <span className="text-gray-900">2,439</span>
         </div>
         <div className="flex items-center justify-between text-[15px] font-albert font-normal">
          <span className="text-gray-700">Price</span>
          <span className="text-gray-900">25.5 SUI</span>
         </div>
        </div>
       </div>
      </div>
     </div>

     {/* Featured Model 2 */}
     <div className="lg:col-span-2">
      <div className="card-interactive h-80 border border-gray-200 text-gray-900 relative overflow-hidden" style={{ backgroundColor: '#9df9bc' }}>
       <div className="relative h-full flex items-end p-8">
        <div className="flex-1">
         <div className="flex items-center gap-2 mb-4">
          <div className="badge bg-white/80 text-gray-800 border border-gray-300">
           <HiBolt className="w-3 h-3" />
           High Performance
          </div>
          <div className="badge bg-white/80 text-gray-800 border border-gray-300">
           Computer Vision
          </div>
         </div>
         <h3 className="text-3xl font-russo mb-4 text-gray-900">Vision Opus x229</h3>
         <p className="font-albert font-light text-gray-800 mb-6 leading-relaxed max-w-lg">
          State-of-the-art computer vision model with real-time processing capabilities and enterprise-grade security.
         </p>
        </div>
       </div>
      </div>
     </div>

     {/* Featured Model 3 */}
     <div className="lg:col-span-2">
      <div className="card-interactive h-80 border border-gray-200 text-gray-900 relative overflow-hidden" style={{ backgroundColor: '#e7fc7e' }}>
       <div className="relative h-full flex items-end p-8">
        <div className="flex-1">
         <div className="flex items-center gap-2 mb-4">
          <div className="badge bg-white/80 text-gray-800 border border-gray-300">
           <HiGlobeAmericas className="w-3 h-3" />
           Autonomous Systems
          </div>
          <div className="badge bg-white/80 text-gray-800 border border-gray-300">
           Real-time
          </div>
         </div>
         <h3 className="text-3xl font-russo mb-4 text-gray-900">AutoDrive Neural Net</h3>
         <p className="font-albert font-light text-gray-800 mb-6 leading-relaxed max-w-lg">
          Advanced autonomous driving model with multi-sensor fusion and real-time decision making capabilities.
         </p>
        </div>
       </div>
      </div>
     </div>
    </div>
    
    {/* Browse All Models CTA */}
    <div className="text-center mt-12">
     <Link href="/marketplace">
      <button className="btn-primary btn-lg group">
       Browse All Models
       <HiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
     </Link>
    </div>
   </div>
  </section>
 )
}

function SuiStackSection() {
 const technologies = [
  {
   name: "Sui Blockchain",
   description: "High-performance blockchain infrastructure",
   icon: "🌊",
   features: ["Low latency", "Parallel execution", "Smart contracts"]
  },
  {
   name: "SEAL Encryption",
   description: "Advanced encryption for sensitive data",
   icon: "🛡️",
   features: ["Privacy-preserving", "Selective disclosure", "Compliance-ready"]
  },
  {
   name: "Walrus Storage",
   description: "Decentralized data storage network",
   icon: "",
   features: ["Highly available", "Cost-effective", "Scalable"]
  },
  {
   name: "TEE Integration",
   description: "Trusted execution environments",
   icon: "",
   features: ["Hardware security", "Verifiable computation", "Integrity proofs"]
  }
 ];

 return (
  <section className="relative z-10 py-20 bg-black text-white">
   <div className="container-custom relative">
    <div className="text-center mb-20">
     <h2 className="text-3xl md:text-5xl font-russo text-white tracking-tight leading-tight">
      Secure AI Marketplace Built on Trusted Infrastructure
     </h2>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
     <div className="rounded-3xl p-8 text-black" style={{ backgroundColor: '#92a3fb' }}>
      <h3 className="text-2xl font-bold mb-6">TEE Verification</h3>
      <p className="text-lg leading-relaxed">
       Hardware-based security ensures model integrity and prevents tampering through trusted execution environments.
      </p>
     </div>
     
     <div className="rounded-3xl p-8 text-black" style={{ backgroundColor: '#9df9bc' }}>
      <h3 className="text-2xl font-bold mb-6">Blockchain Transparency</h3>
      <p className="text-lg leading-relaxed">
       Immutable transaction records and smart contract automation ensure trust and reliable ownership.
      </p>
     </div>
     
     <div className="rounded-3xl p-8 text-black" style={{ backgroundColor: '#e7fc7e' }}>
      <h3 className="text-2xl font-bold mb-6">Encrypted Storage</h3>
      <p className="text-lg leading-relaxed">
       SEAL encryption protects sensitive data while maintaining usability and compliance with privacy regulations.
      </p>
     </div>
    </div>
   </div>
  </section>
 )
}

function TrustEnforcedSection() {
 return (
  <section className="relative z-10 py-24">
   <div className="container-custom">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
     <div>
      <h2 className="text-3xl md:text-4xl font-russo mb-6">
       Trust Enforced by Design
      </h2>
      <p className="text-xl text-secondary-800 mb-8 leading-relaxed">
       Every transaction is protected by cryptographic proofs, hardware attestations, and blockchain immutability. 
       No more hoping for the best - trust is mathematically guaranteed.
      </p>
      
      <div className="space-y-4 mb-8">
       <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-secondary-600 rounded-full"></div>
        <span className="text-secondary-900">Cryptographic verification of model integrity</span>
       </div>
       <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-secondary-600 rounded-full"></div>
        <span className="text-secondary-900">Hardware-based attestation through TEE</span>
       </div>
       <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-secondary-600 rounded-full"></div>
        <span className="text-secondary-900">Immutable transaction records on blockchain</span>
       </div>
       <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-secondary-600 rounded-full"></div>
        <span className="text-secondary-900">Privacy-preserving encrypted storage</span>
       </div>
      </div>
      
      <button className="btn-secondary btn-lg group">
       Read Documentation
       <svg className="w-4 h-4 group-hover:rotate-45 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
       </svg>
      </button>
     </div>
     
     <div className="relative">
      <div className="bg-gradient-to-br from-white to-surface-100 rounded-3xl p-8 border border-secondary-300 shadow-large">
       <div className="grid grid-cols-2 gap-4 h-80">
        <div className="space-y-4">
         <div className="card p-4 bg-white border-secondary-300">
          <div className="flex items-center gap-2 mb-2">
           <HiShieldCheck className="w-4 h-4 text-secondary-600" />
           <span className="text-sm font-medium text-secondary-800">TEE Verified</span>
          </div>
          <div className="h-8 bg-surface-200 rounded animate-pulse"></div>
         </div>
         <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
           <HiSparkles className="w-4 h-4 text-secondary-600" />
           <span className="text-sm font-medium">Encrypted</span>
          </div>
          <div className="space-y-2">
           <div className="h-2 bg-surface-200 rounded"></div>
           <div className="h-2 bg-surface-200 rounded w-3/4"></div>
          </div>
         </div>
        </div>
        <div className="space-y-4">
         <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
           <div className="w-4 h-4 bg-surface-300 rounded-full animate-pulse"></div>
           <span className="text-sm font-medium">Blockchain</span>
          </div>
          <div className="space-y-1">
           <div className="h-2 bg-surface-200 rounded"></div>
           <div className="h-2 bg-surface-200 rounded"></div>
           <div className="h-2 bg-surface-200 rounded w-2/3"></div>
          </div>
         </div>
         <div className="card p-4 bg-white border-secondary-300">
          <div className="flex items-center gap-2 mb-2">
           <div className="w-4 h-4 bg-secondary-600 rounded animate-pulse"></div>
           <span className="text-sm font-medium text-secondary-800">Verified</span>
          </div>
          <div className="h-8 bg-surface-200 rounded"></div>
         </div>
        </div>
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
  {
   question: "How does TEE verification work?",
   answer: "Trusted Execution Environments (TEEs) provide hardware-level security guarantees. Our system uses Intel SGX and similar technologies to ensure that AI models run in isolated, tamper-proof environments.",
   expanded: true
  },
  {
   question: "What makes Satya different from other AI marketplaces?",
   answer: "Satya combines blockchain transparency, TEE verification, and advanced encryption to provide mathematical guarantees of trust - no need to rely on reputation or hope.",
   expanded: false
  },
  {
   question: "How is my sensitive data protected?",
   answer: "We use SEAL (Simple Encrypted Arithmetic Library) for homomorphic encryption, allowing computations on encrypted data without ever exposing the raw information.",
   expanded: false
  },
  {
   question: "What are the transaction fees?",
   answer: "Transaction fees are minimal thanks to Sui's efficient architecture. Most operations cost less than $0.01, with marketplace fees of 2.5% on successful transactions.",
   expanded: false
  }
 ];

 return (
  <section className="relative z-10 py-20" style={{ backgroundColor: '#9df9bc' }}>
   <div className="container-custom">
    <div className="text-left">
     <h2 className="text-4xl md:text-6xl font-bold mb-12 text-black tracking-tight leading-tight">
      Get Started Today
     </h2>
     <p className="text-xl text-black leading-relaxed mb-16 max-w-2xl">
      Join the future of AI marketplaces with verified models, secure transactions, and transparent pricing. Start trading with confidence.
     </p>
    </div>
    
   </div>
  </section>
 )
}

function FAQItem({ question, answer, expanded }: { question: string, answer: string, expanded: boolean }) {
 return (
  <div className={`card-hover p-8 transition-all duration-300 ${expanded ? 'bg-white border-secondary-300 shadow-card' : ''}`}>
   <div className="flex items-center justify-between">
    <div className="flex-1">
     <h3 className="text-xl font-russo mb-4 text-secondary-800">
      {question}
     </h3>
     {expanded && (
      <p className="text-secondary-800 leading-relaxed pr-8">
       {answer}
      </p>
     )}
    </div>
    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${expanded ? 'bg-black text-white' : 'bg-white border border-secondary-300 text-secondary-700'}`}>
     {expanded ? (
      <div className="w-4 h-0.5 bg-white" />
     ) : (
      <HiChevronDown className="w-5 h-5" />
     )}
    </div>
   </div>
  </div>
 )
}

function Footer() {
 return (
  <footer className="relative z-10 py-16 text-secondary-900" style={{ backgroundColor: '#f5f9ef' }}>
   <div className="container-custom">
    <div className="p-16 relative">
     <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      <div className="md:col-span-2">
       <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-tr from-secondary-600 to-secondary-800 rounded-xl flex items-center justify-center">
         <HiSparkles className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-2xl font-russo text-gradient">Satya</h3>
       </div>
       <p className="text-secondary-700 leading-relaxed mb-8 max-w-lg">
        Building the future of trusted AI with verifiable security, transparent transactions, and privacy-preserving technology.
       </p>
       <div className="flex gap-4">
        <div className="w-10 h-10 bg-white border border-secondary-300 rounded-lg flex items-center justify-center hover:bg-surface-100 cursor-pointer transition-colors text-secondary-600">
         <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd" />
         </svg>
        </div>
        <div className="w-10 h-10 bg-white border border-secondary-300 rounded-lg flex items-center justify-center hover:bg-surface-100 cursor-pointer transition-colors text-secondary-600">
         <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
         </svg>
        </div>
       </div>
      </div>
      
      <div>
       <h4 className="font-russo mb-6">Platform</h4>
       <div className="space-y-4">
        <Link href="/marketplace" className="block text-secondary-700 hover:text-secondary-900 transition-colors">Marketplace</Link>
        <Link href="/upload" className="block text-secondary-700 hover:text-secondary-900 transition-colors">Upload Model</Link>
        <Link href="/dashboard" className="block text-secondary-700 hover:text-secondary-900 transition-colors">Dashboard</Link>
       </div>
      </div>
      
      <div>
       <h4 className="font-russo mb-6">Resources</h4>
       <div className="space-y-4">
        <a href="#" className="block text-secondary-700 hover:text-secondary-900 transition-colors">Documentation</a>
        <a href="#" className="block text-secondary-700 hover:text-secondary-900 transition-colors">API Reference</a>
        <a href="#" className="block text-secondary-700 hover:text-secondary-900 transition-colors">Security</a>
        <a href="#" className="block text-secondary-700 hover:text-secondary-900 transition-colors">Privacy Policy</a>
       </div>
      </div>
     </div>
     
    </div>
   </div>
  </footer>
 )
}