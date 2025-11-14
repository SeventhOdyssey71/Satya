import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/ui/Header'
import { HiArrowRight, HiShieldCheck, HiLightningBolt, HiGlobe, HiChevronDown, HiSparkles } from 'react-icons/hi2'
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

function TrustedMarketplacesSection() {
  return (
    <section className="relative z-10 py-24">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-russo mb-6">
            Trusted AI Model Marketplace
          </h2>
          <p className="text-lg text-secondary-600 max-w-3xl mx-auto leading-relaxed">
            Eliminating the "trust me bro" barrier with verifiable, secure, and transparent AI model trading. 
            Each model comes with cryptographic proofs and hardware-verified attestations.
          </p>
        </div>

        {/* Featured Models Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Featured Model 1 */}
          <div className="lg:col-span-1 lg:row-span-2">
            <div className="card-interactive h-full min-h-[600px] bg-gradient-to-br from-secondary-900 to-secondary-800 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-accent-500/20" />
              <div className="relative h-full flex flex-col justify-between p-8">
                <div>
                  <div className="badge-success mb-4">
                    <HiShieldCheck className="w-3 h-3" />
                    TEE Verified
                  </div>
                  <h3 className="text-3xl font-russo mb-4">Medical AI x129</h3>
                  <p className="text-surface-200 mb-6 leading-relaxed">
                    Advanced diagnostic model trained on verified hospital data with full privacy compliance and hardware security attestation.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-surface-300">Downloads</span>
                    <span className="text-white font-medium">2,439</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-surface-300">Price</span>
                    <span className="text-white font-medium">25.5 SUI</span>
                  </div>
                  <Link href="/model/medical-ai-x129">
                    <button className="btn-secondary w-full">
                      View Details
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Model 2 */}
          <div className="lg:col-span-2">
            <div className="card-interactive h-80 bg-gradient-to-r from-primary-600 to-primary-700 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent-500/30 to-transparent" />
              <div className="relative h-full flex items-end p-8">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="badge bg-white/20 text-white border-white/30">
                      <HiLightningBolt className="w-3 h-3" />
                      High Performance
                    </div>
                    <div className="badge bg-white/20 text-white border-white/30">
                      Computer Vision
                    </div>
                  </div>
                  <h3 className="text-3xl font-russo mb-4">Vision Opus x229</h3>
                  <p className="text-primary-100 mb-6 leading-relaxed max-w-lg">
                    State-of-the-art computer vision model with real-time processing capabilities and enterprise-grade security.
                  </p>
                </div>
                <Link href="/model/vision-opus-x229">
                  <button className="btn bg-white/20 border border-white/30 text-white hover:bg-white/30 backdrop-blur-sm">
                    Explore Model
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Featured Model 3 */}
          <div className="lg:col-span-2">
            <div className="card-interactive h-80 bg-gradient-to-r from-accent-600 to-accent-700 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tl from-primary-500/30 to-transparent" />
              <div className="relative h-full flex items-end p-8">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="badge bg-white/20 text-white border-white/30">
                      <HiGlobe className="w-3 h-3" />
                      Autonomous Systems
                    </div>
                    <div className="badge bg-white/20 text-white border-white/30">
                      Real-time
                    </div>
                  </div>
                  <h3 className="text-3xl font-russo mb-4">AutoDrive Neural Net</h3>
                  <p className="text-accent-100 mb-6 leading-relaxed max-w-lg">
                    Advanced autonomous driving model with multi-sensor fusion and real-time decision making capabilities.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link href="/model/autodrive-neural">
                    <button className="btn bg-white/20 border border-white/30 text-white hover:bg-white/30 backdrop-blur-sm">
                      View Model
                    </button>
                  </Link>
                  <button className="btn bg-white text-accent-700 hover:bg-surface-100">
                    Try Demo
                  </button>
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
      icon: "📦",
      features: ["Highly available", "Cost-effective", "Scalable"]
    },
    {
      name: "TEE Integration",
      description: "Trusted execution environments",
      icon: "🔒",
      features: ["Hardware security", "Verifiable computation", "Integrity proofs"]
    }
  ];

  return (
    <section className="relative z-10 py-20 bg-secondary-900 text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 to-accent-900/20"></div>
      <div className="container-custom relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-russo mb-6">
            Built on the Sui Stack
          </h2>
          <p className="text-xl text-secondary-300 max-w-3xl mx-auto leading-relaxed">
            Leveraging cutting-edge blockchain infrastructure and privacy technology to create the most secure and efficient AI marketplace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {technologies.map((tech, index) => (
            <div key={index} className="bg-secondary-800/50 backdrop-blur-xl border border-secondary-700 rounded-2xl p-8 hover:bg-secondary-800/70 transition-all animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="flex items-start gap-4">
                <div className="text-4xl">{tech.icon}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-russo mb-2">{tech.name}</h3>
                  <p className="text-secondary-300 mb-4 leading-relaxed">{tech.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {tech.features.map((feature, featureIndex) => (
                      <span key={featureIndex} className="badge bg-primary-500/20 text-primary-300 border-primary-500/30">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
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
            <p className="text-xl text-secondary-600 mb-8 leading-relaxed">
              Every transaction is protected by cryptographic proofs, hardware attestations, and blockchain immutability. 
              No more hoping for the best - trust is mathematically guaranteed.
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                <span className="text-secondary-700">Cryptographic verification of model integrity</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                <span className="text-secondary-700">Hardware-based attestation through TEE</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                <span className="text-secondary-700">Immutable transaction records on blockchain</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                <span className="text-secondary-700">Privacy-preserving encrypted storage</span>
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
            <div className="bg-gradient-to-br from-primary-100 to-accent-100 rounded-3xl p-8 border border-border shadow-large">
              <div className="grid grid-cols-2 gap-4 h-80">
                <div className="space-y-4">
                  <div className="card p-4 bg-success-50 border-success-200">
                    <div className="flex items-center gap-2 mb-2">
                      <HiShieldCheck className="w-4 h-4 text-success-600" />
                      <span className="text-sm font-medium text-success-800">TEE Verified</span>
                    </div>
                    <div className="h-8 bg-success-200 rounded animate-pulse"></div>
                  </div>
                  <div className="card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <HiSparkles className="w-4 h-4 text-primary-600" />
                      <span className="text-sm font-medium">Encrypted</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-secondary-200 rounded"></div>
                      <div className="h-2 bg-secondary-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 bg-secondary-300 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Blockchain</span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 bg-secondary-200 rounded"></div>
                      <div className="h-2 bg-secondary-200 rounded"></div>
                      <div className="h-2 bg-secondary-200 rounded w-2/3"></div>
                    </div>
                  </div>
                  <div className="card p-4 bg-primary-50 border-primary-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 bg-primary-500 rounded animate-pulse"></div>
                      <span className="text-sm font-medium text-primary-800">Verified</span>
                    </div>
                    <div className="h-8 bg-primary-200 rounded"></div>
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
    <section className="relative z-10 py-20 bg-surface-100">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-russo mb-6">Frequently Asked Questions</h2>
          <p className="text-lg text-secondary-600">Everything you need to know about Satya</p>
        </div>

        <div className="space-y-4 max-w-4xl mx-auto">
          {faqItems.map((item, index) => (
            <FAQItem key={index} {...item} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQItem({ question, answer, expanded }: { question: string, answer: string, expanded: boolean }) {
  return (
    <div className={`card-hover p-8 transition-all duration-300 ${expanded ? 'bg-primary-50 border-primary-200' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-xl font-russo mb-4 text-secondary-800">
            {question}
          </h3>
          {expanded && (
            <p className="text-secondary-600 leading-relaxed pr-8">
              {answer}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${expanded ? 'bg-primary-600 text-white' : 'bg-surface-200 text-secondary-600'}`}>
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
    <footer className="relative z-10 py-16 bg-secondary-900 text-white">
      <div className="container-custom">
        <div className="bg-secondary-800 rounded-3xl p-16 relative">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-tr from-primary-600 to-accent-600 rounded-xl flex items-center justify-center">
                  <HiSparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-russo text-gradient">Satya</h3>
              </div>
              <p className="text-secondary-300 leading-relaxed mb-8 max-w-lg">
                Building the future of trusted AI with verifiable security, transparent transactions, and privacy-preserving technology.
              </p>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-secondary-700 rounded-lg flex items-center justify-center hover:bg-secondary-600 cursor-pointer transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="w-10 h-10 bg-secondary-700 rounded-lg flex items-center justify-center hover:bg-secondary-600 cursor-pointer transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-russo mb-6">Platform</h4>
              <div className="space-y-4">
                <Link href="/marketplace" className="block text-secondary-300 hover:text-white transition-colors">Marketplace</Link>
                <Link href="/upload" className="block text-secondary-300 hover:text-white transition-colors">Upload Model</Link>
                <Link href="/dashboard" className="block text-secondary-300 hover:text-white transition-colors">Dashboard</Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-russo mb-6">Resources</h4>
              <div className="space-y-4">
                <a href="#" className="block text-secondary-300 hover:text-white transition-colors">Documentation</a>
                <a href="#" className="block text-secondary-300 hover:text-white transition-colors">API Reference</a>
                <a href="#" className="block text-secondary-300 hover:text-white transition-colors">Security</a>
                <a href="#" className="block text-secondary-300 hover:text-white transition-colors">Privacy Policy</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-secondary-700 mt-12 pt-8 text-center">
            <p className="text-secondary-400">© 2024 Satya. Built with ❤️ on the Sui blockchain.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}