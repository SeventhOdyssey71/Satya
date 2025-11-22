'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/ui/Header'
import SealTestButton from '@/components/debug/SealTestButton'
import { HiArrowRight, HiShieldCheck, HiBolt } from 'react-icons/hi2'
import { TbShield, TbDatabase, TbNetwork, TbCloudCheck } from 'react-icons/tb'
import { motion, useInView } from 'framer-motion'

export default function Home() {
 return (
  <div className="relative min-h-screen bg-white">
   <Header isHomepage={true} />
   
   <HeroSection />
   <FeaturesSection />
   <TrustedMarketplacesSection />
   <SuiStackSection />
   <TrustEnforcedSection />
   <FAQSection />
   <Footer />
   
   <SealTestButton />
  </div>
 )
}

function HeroSection() {
 return (
  <motion.section 
   className="relative z-10 pt-32 sm:pt-40 md:pt-52 lg:pt-64 pb-16 sm:pb-20 md:pb-24 lg:pb-32 px-4 sm:px-6"
   initial={{ opacity: 0 }}
   animate={{ opacity: 1 }}
   transition={{ duration: 0.6 }}
  >
   <div className="container-custom">
    <div className="text-center max-w-5xl mx-auto">
     <motion.h1 
      className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-albert font-bold leading-tight max-w-4xl mx-auto mb-6 sm:mb-8 text-gray-900"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.1 }}
     >
      Bringing verifiable + trusted data markets
     </motion.h1>
     
     <motion.p 
      className="text-lg sm:text-xl md:text-2xl font-albert font-light text-gray-600 max-w-3xl mx-auto mb-8 sm:mb-10 md:mb-12 leading-relaxed px-4"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
     >
      Secure AI models and datasets with TEE verification, encrypted storage, and blockchain transparency. 
      Building the future of trusted machine learning.
     </motion.p>

     <motion.div 
      className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 md:mb-20"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
     >
      <Link href="/marketplace">
       <button className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-black text-white rounded-lg font-medium min-w-[200px] hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
        Launch App
        <HiArrowRight className="w-5 h-5" />
       </button>
      </Link>
      <button className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white text-black border-2 border-gray-200 rounded-lg font-medium min-w-[200px] hover:border-black transition-colors flex items-center justify-center gap-2">
       Read Docs
       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
       </svg>
      </button>
     </motion.div>

     <motion.div 
      className="text-center"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.4 }}
     >
      <p className="text-base sm:text-lg font-albert font-light text-gray-600 mb-6 sm:mb-8">Built on the Sui Stack</p>
      <div className="flex items-center justify-center gap-6 sm:gap-8 md:gap-12 lg:gap-16">
       <div className="p-3 sm:p-4 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
        <Image 
         src="/images/Seal.svg" 
         alt="SEAL"
         width={60}
         height={60}
         className="h-12 sm:h-14 md:h-16 w-auto"
        />
       </div>
       <div className="p-3 sm:p-4 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
        <img 
         src="/images/Walrus.png" 
         alt="WALRUS"
         className="h-12 sm:h-14 md:h-16 w-auto"
        />
       </div>
      </div>
     </motion.div>
    </div>
   </div>
  </motion.section>
 )
}

function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) {
 const ref = useRef(null)
 const isInView = useInView(ref, { once: true, margin: "-100px" })
 
 return (
  <motion.div
   ref={ref}
   initial={{ y: 30, opacity: 0 }}
   animate={isInView ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
   transition={{ duration: 0.6, delay }}
  >
   {children}
  </motion.div>
 )
}

function FeaturesSection() {
 const features = [
  {
   icon: <TbShield className="w-6 h-6 sm:w-8 sm:h-8" />,
   title: "TEE Verification",
   description: "Hardware-based attestation ensures model integrity and security"
  },
  {
   icon: <TbDatabase className="w-6 h-6 sm:w-8 sm:h-8" />,
   title: "Encrypted Storage",
   description: "SEAL encryption with policy-based access control"
  },
  {
   icon: <TbNetwork className="w-6 h-6 sm:w-8 sm:h-8" />,
   title: "Decentralized Network",
   description: "Walrus storage for resilient, distributed data"
  },
  {
   icon: <TbCloudCheck className="w-6 h-6 sm:w-8 sm:h-8" />,
   title: "Blockchain Transparency",
   description: "Immutable records on Sui blockchain"
  }
 ]

 return (
  <section className="relative z-10 py-16 sm:py-20 md:py-24">
   <div className="container-custom px-4 sm:px-6">
    <div className="bg-[#E8F4FF] rounded-2xl sm:rounded-3xl mx-2 px-4 sm:px-6 md:px-8 py-12 sm:py-14 md:py-16">
     <AnimatedSection>
      <div className="text-center mb-12 sm:mb-14 md:mb-16">
       <h2 className="text-3xl sm:text-4xl md:text-5xl font-albert font-bold mb-3 sm:mb-4 text-gray-900">
        Enterprise-Grade Security
       </h2>
       <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
        Built with cutting-edge cryptography and blockchain technology
       </p>
      </div>
     </AnimatedSection>

     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
      {features.map((feature, index) => (
       <AnimatedSection key={index} delay={index * 0.1}>
        <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-6 sm:p-8 h-full hover:shadow-xl transition-shadow">
         <div className="text-gray-700 mb-3 sm:mb-4">
          {feature.icon}
         </div>
         <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900">{feature.title}</h3>
         <p className="text-sm sm:text-base text-gray-600">{feature.description}</p>
        </div>
       </AnimatedSection>
      ))}
     </div>
    </div>
   </div>
  </section>
 )
}

function TrustedMarketplacesSection() {
 return (
  <section className="relative z-10 py-16 sm:py-20 md:py-24 bg-white">
   <div className="container-custom px-4 sm:px-6">
    <div className="max-w-6xl mx-auto">
     <AnimatedSection>
      <div className="text-center mb-12 sm:mb-14 md:mb-16">
       <h2 className="text-3xl sm:text-4xl md:text-5xl font-albert font-bold mb-3 sm:mb-4 text-gray-900">
        Trusted Marketplaces for AI
       </h2>
       <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
        Buy, sell, and verify AI models with complete transparency
       </p>
      </div>
     </AnimatedSection>

     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
      {[
       { title: "Verified Models", count: "1,000+", description: "TEE-attested AI models" },
       { title: "Active Users", count: "10,000+", description: "Developers and researchers" },
       { title: "Total Volume", count: "$5M+", description: "In secure transactions" }
      ].map((stat, index) => (
       <AnimatedSection key={index} delay={index * 0.1}>
        <div className="text-center p-6 sm:p-8 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
         <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2">
          {stat.count}
         </div>
         <div className="text-base sm:text-lg font-semibold text-gray-900 mb-1">{stat.title}</div>
         <div className="text-gray-600 text-sm">{stat.description}</div>
        </div>
       </AnimatedSection>
      ))}
     </div>
    </div>
   </div>
  </section>
 )
}

function SuiStackSection() {
 return (
  <section className="relative z-10 py-16 sm:py-20 md:py-24 bg-white">
   <div className="container-custom px-4 sm:px-6">
    <AnimatedSection>
     <div className="text-center mb-12 sm:mb-14 md:mb-16">
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-albert font-bold mb-3 sm:mb-4 text-gray-900">
       Powered by Sui Ecosystem
      </h2>
      <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
       Leveraging the best of blockchain and decentralized storage
      </p>
     </div>
    </AnimatedSection>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 max-w-4xl mx-auto">
     <AnimatedSection delay={0.1}>
      <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 hover:shadow-lg transition-shadow">
       <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
        <HiShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700 flex-shrink-0" />
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Security First</h3>
       </div>
       <p className="text-sm sm:text-base text-gray-600">
        Multi-layer security with TEE verification, encryption, and blockchain immutability
       </p>
      </div>
     </AnimatedSection>

     <AnimatedSection delay={0.2}>
      <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 hover:shadow-lg transition-shadow">
       <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
        <HiBolt className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700 flex-shrink-0" />
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Lightning Fast</h3>
       </div>
       <p className="text-sm sm:text-base text-gray-600">
        Sub-second finality with Sui blockchain and optimized storage retrieval
       </p>
      </div>
     </AnimatedSection>
    </div>
   </div>
  </section>
 )
}

function TrustEnforcedSection() {
 return (
  <section className="relative z-10 py-16 sm:py-20 md:py-24 bg-white">
   <div className="container-custom px-4 sm:px-6">
    <AnimatedSection>
     <div className="max-w-4xl mx-auto text-center">
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-albert font-bold mb-6 sm:mb-8 text-gray-900">
       Trust, Enforced by Technology
      </h2>
      <p className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-10 md:mb-12 px-4">
       Every model is verified, every transaction is transparent, every byte is secure
      </p>
      
      <Link href="/marketplace">
       <button className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-black text-white rounded-lg font-medium text-base sm:text-lg hover:bg-gray-800 transition-colors">
        Start Building Trust
        <HiArrowRight className="inline-block ml-2 w-4 h-4 sm:w-5 sm:h-5" />
       </button>
      </Link>
     </div>
    </AnimatedSection>
   </div>
  </section>
 )
}

function FAQSection() {
 const faqs = [
  {
   question: "How does TEE verification work?",
   answer: "TEE (Trusted Execution Environment) provides hardware-based attestation that proves your model runs exactly as intended, without tampering or modification."
  },
  {
   question: "What is SEAL encryption?",
   answer: "SEAL is a homomorphic encryption library that allows computations on encrypted data, ensuring your models remain private while still being functional."
  },
  {
   question: "Why use Walrus for storage?",
   answer: "Walrus provides decentralized, redundant storage that ensures your models are always available, with built-in replication and fault tolerance."
  },
  {
   question: "How does blockchain transparency help?",
   answer: "Every transaction and verification is recorded on the Sui blockchain, creating an immutable audit trail that builds trust between buyers and sellers."
  }
 ]

 return (
  <section className="relative z-10 py-16 sm:py-20 md:py-24">
   <div className="container-custom px-4 sm:px-6">
    <div className="bg-[#E8F4FF] rounded-2xl sm:rounded-3xl mx-2 px-4 sm:px-6 md:px-8 py-12 sm:py-14 md:py-16">
     <AnimatedSection>
      <div className="text-center mb-12 sm:mb-14 md:mb-16">
       <h2 className="text-3xl sm:text-4xl md:text-5xl font-albert font-bold mb-3 sm:mb-4 text-gray-900">
        Frequently Asked Questions
       </h2>
      </div>
     </AnimatedSection>

     <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
      {faqs.map((faq, index) => (
       <AnimatedSection key={index} delay={index * 0.1}>
        <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:shadow-xl transition-shadow">
         <h3 className="text-base sm:text-lg font-semibold mb-2 text-gray-900">{faq.question}</h3>
         <p className="text-sm sm:text-base text-gray-600">{faq.answer}</p>
        </div>
       </AnimatedSection>
      ))}
     </div>
    </div>
   </div>
  </section>
 )
}

function Footer() {
 return (
  <footer className="relative z-10 py-12 sm:py-14 md:py-16 bg-white border-t border-gray-200">
   <div className="container-custom px-4 sm:px-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-10 md:mb-12">
     <div className="sm:col-span-2 md:col-span-1">
      <h3 className="font-bold text-gray-900 mb-3 sm:mb-4">Satya</h3>
      <p className="text-gray-600 text-sm">
       Building the future of trusted AI with verifiable data markets.
      </p>
     </div>
     
     <div>
      <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4">Product</h4>
      <ul className="space-y-2">
       <li><Link href="/marketplace" className="text-gray-600 hover:text-gray-900 text-sm">Marketplace</Link></li>
       <li><Link href="/upload" className="text-gray-600 hover:text-gray-900 text-sm">Upload Model</Link></li>
       <li><Link href="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm">Dashboard</Link></li>
      </ul>
     </div>
     
     <div>
      <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4">Resources</h4>
      <ul className="space-y-2">
       <li><a href="/docs" className="text-gray-600 hover:text-gray-900 text-sm">Documentation</a></li>
       <li><a href="/api" className="text-gray-600 hover:text-gray-900 text-sm">API Reference</a></li>
       <li><a href="/guides" className="text-gray-600 hover:text-gray-900 text-sm">Guides</a></li>
      </ul>
     </div>
     
     <div>
      <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4">Company</h4>
      <ul className="space-y-2">
       <li><a href="/about" className="text-gray-600 hover:text-gray-900 text-sm">About</a></li>
       <li><a href="/blog" className="text-gray-600 hover:text-gray-900 text-sm">Blog</a></li>
       <li><a href="/contact" className="text-gray-600 hover:text-gray-900 text-sm">Contact</a></li>
      </ul>
     </div>
    </div>
    
    <div className="border-t border-gray-200 pt-6 sm:pt-8">
     <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
      <p className="text-gray-600 text-sm text-center md:text-left">© 2025 Satya. All rights reserved.</p>
      <div className="flex gap-4 sm:gap-6">
       <a href="/privacy" className="text-gray-600 hover:text-gray-900 text-sm">Privacy Policy</a>
       <a href="/terms" className="text-gray-600 hover:text-gray-900 text-sm">Terms of Service</a>
      </div>
     </div>
    </div>
   </div>
  </footer>
 )
}