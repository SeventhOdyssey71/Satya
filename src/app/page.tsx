'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/ui/Header'
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
      className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-regola font-medium leading-tight max-w-4xl mx-auto mb-6 sm:mb-8 text-black"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.1 }}
     >
      Next-Gen Data Infrastructure for AI
     </motion.h1>
     
     <motion.p 
      className="text-lg sm:text-xl md:text-2xl font-regola text-gray-600 max-w-3xl mx-auto mb-8 sm:mb-10 md:mb-12 leading-relaxed px-4"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
     >
      Zero-knowledge proofs, decentralized storage, and modular blockchain infrastructure. 
      Powering the next generation of verifiable AI and data markets.
     </motion.p>

     <motion.div 
      className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 md:mb-20"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
     >
      <Link href="/marketplace">
       <button className="btn-primary min-w-[200px] flex items-center justify-center gap-2">
        Launch App
        <HiArrowRight className="w-5 h-5" />
       </button>
      </Link>
      <Link href="/docs">
       <button className="btn-secondary min-w-[200px] flex items-center justify-center gap-2">
        Read Docs
       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
       </svg>
      </button>
      </Link>
     </motion.div>

     <motion.div 
      className="text-center"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.4 }}
     >
      <p className="text-base sm:text-lg font-regola text-gray-600 mb-6 sm:mb-8">Powered by 0G Labs Infrastructure</p>
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
   title: "Zero-Knowledge Proofs",
   description: "Cryptographic verification without revealing sensitive data"
  },
  {
   icon: <TbDatabase className="w-6 h-6 sm:w-8 sm:h-8" />,
   title: "Modular Data Availability",
   description: "Scalable storage layer with built-in verification"
  },
  {
   icon: <TbNetwork className="w-6 h-6 sm:w-8 sm:h-8" />,
   title: "Decentralized Infrastructure",
   description: "Permissionless network with economic incentives"
  },
  {
   icon: <TbCloudCheck className="w-6 h-6 sm:w-8 sm:h-8" />,
   title: "Instant Finality",
   description: "Sub-second confirmation with Byzantine fault tolerance"
  }
 ]

 return (
  <section className="relative z-10 py-16 sm:py-20 md:py-24">
   <div className="container-custom px-4 sm:px-6">
    <div className="bg-gradient-to-br from-purple-4/20 to-purple-3/30 rounded-2xl sm:rounded-3xl mx-2 px-4 sm:px-6 md:px-8 py-12 sm:py-14 md:py-16">
     <AnimatedSection>
      <div className="text-center mb-12 sm:mb-14 md:mb-16">
       <h2 className="text-3xl sm:text-4xl md:text-5xl font-regola font-medium mb-3 sm:mb-4 text-black">
        Zero-Knowledge Infrastructure
       </h2>
       <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
        Built on 0G's modular blockchain with native data availability
       </p>
      </div>
     </AnimatedSection>

     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
      {features.map((feature, index) => (
       <AnimatedSection key={index} delay={index * 0.1}>
        <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-6 sm:p-8 h-full hover:shadow-xl transition-shadow">
         <div className="text-purple-shade mb-3 sm:mb-4">
          {feature.icon}
         </div>
         <h3 className="text-lg sm:text-xl font-regola font-medium mb-2 sm:mb-3 text-black">{feature.title}</h3>
         <p className="text-sm sm:text-base text-gray-600 font-regola">{feature.description}</p>
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
       <h2 className="text-3xl sm:text-4xl md:text-5xl font-regola font-medium mb-3 sm:mb-4 text-black">
        Verifiable AI Data Markets
       </h2>
       <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
        Trade AI models and datasets with cryptographic proof and instant settlement
       </p>
      </div>
     </AnimatedSection>

     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
      {[
       { title: "ZK Proofs Generated", count: "--", description: "Cryptographic verifications" },
       { title: "Data Stored", count: "--", description: "In decentralized storage" },
       { title: "Network Validators", count: "--", description: "Securing the infrastructure" }
      ].map((stat, index) => (
       <AnimatedSection key={index} delay={index * 0.1}>
        <div className="text-center p-6 sm:p-8 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
         <div className="text-3xl sm:text-4xl md:text-5xl font-regola font-medium text-purple-shade mb-2">
          {stat.count}
         </div>
         <div className="text-base sm:text-lg font-regola font-medium text-black mb-1">{stat.title}</div>
         <div className="text-gray-600 text-sm font-regola">{stat.description}</div>
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
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-regola font-medium mb-3 sm:mb-4 text-black">
       Built on 0G Network
      </h2>
      <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
       Next-generation modular blockchain with native data availability
      </p>
     </div>
    </AnimatedSection>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 max-w-4xl mx-auto">
     <AnimatedSection delay={0.1}>
      <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 hover:shadow-lg transition-shadow">
       <h3 className="text-xl sm:text-2xl font-regola font-medium text-black mb-3 sm:mb-4">Modular Architecture</h3>
       <p className="text-sm sm:text-base text-gray-600 font-regola">
        Separable consensus and data availability layers for maximum scalability
       </p>
      </div>
     </AnimatedSection>

     <AnimatedSection delay={0.2}>
      <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 hover:shadow-lg transition-shadow">
       <h3 className="text-xl sm:text-2xl font-regola font-medium text-black mb-3 sm:mb-4">Infinite Scale</h3>
       <p className="text-sm sm:text-base text-gray-600 font-regola">
        Horizontal scaling with programmable pricing for AI and data workloads
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
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-regola font-medium mb-6 sm:mb-8 text-black">
       Verifiable by Design
      </h2>
      <p className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-10 md:mb-12 px-4 font-regola">
       Every computation is provable, every piece of data is verifiable, every transaction is trustless
      </p>
      
      <Link href="/marketplace">
       <button className="btn-primary text-base sm:text-lg">
        Start Building
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
   question: "What are zero-knowledge proofs?",
   answer: "ZK proofs enable cryptographic verification of computations without revealing the underlying data, ensuring privacy while maintaining trust and verifiability."
  },
  {
   question: "How does 0G's modular architecture work?",
   answer: "0G separates consensus and data availability layers, allowing independent scaling and optimization for AI workloads with programmable pricing."
  },
  {
   question: "What is data availability sampling?",
   answer: "DA sampling ensures data integrity across the network without requiring every node to download all data, enabling massive scale for AI applications."
  },
  {
   question: "How does instant finality benefit AI markets?",
   answer: "Sub-second transaction confirmation enables real-time AI model trading and inference, supporting high-frequency applications and automated systems."
  }
 ]

 return (
  <section className="relative z-10 py-16 sm:py-20 md:py-24">
   <div className="container-custom px-4 sm:px-6">
    <div className="bg-gradient-to-br from-purple-4/20 to-purple-3/30 rounded-2xl sm:rounded-3xl mx-2 px-4 sm:px-6 md:px-8 py-12 sm:py-14 md:py-16">
     <AnimatedSection>
      <div className="text-center mb-12 sm:mb-14 md:mb-16">
       <h2 className="text-3xl sm:text-4xl md:text-5xl font-regola font-medium mb-3 sm:mb-4 text-black">
        Frequently Asked Questions
       </h2>
      </div>
     </AnimatedSection>

     <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
      {faqs.map((faq, index) => (
       <AnimatedSection key={index} delay={index * 0.1}>
        <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:shadow-xl transition-shadow">
         <h3 className="text-base sm:text-lg font-regola font-medium mb-2 text-black">{faq.question}</h3>
         <p className="text-sm sm:text-base text-gray-600 font-regola">{faq.answer}</p>
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
    <div className="flex flex-col md:flex-row justify-between items-start mb-8 sm:mb-10 md:mb-12">
     <div className="mb-6 md:mb-0">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
       <div className="w-8 h-8 bg-gradient-to-br from-purple-shade to-purple-1 rounded-lg flex items-center justify-center">
        <span className="text-white font-regola font-medium text-lg">0G</span>
       </div>
       <h3 className="font-regola font-medium text-black text-lg">0G Labs</h3>
      </div>
      <p className="text-gray-600 text-sm max-w-sm font-regola">
       Next-generation modular blockchain infrastructure for verifiable AI and data markets.
      </p>
     </div>
     
     <div className="flex flex-col sm:flex-row gap-8 sm:gap-12">
      <div>
       <h4 className="font-regola font-medium text-black mb-3 sm:mb-4">Product</h4>
       <ul className="space-y-2">
        <li><Link href="/marketplace" className="text-gray-600 hover:text-black text-sm font-regola">Marketplace</Link></li>
        <li><Link href="/upload" className="text-gray-600 hover:text-black text-sm font-regola">Upload Model</Link></li>
        <li><Link href="/dashboard" className="text-gray-600 hover:text-black text-sm font-regola">Dashboard</Link></li>
       </ul>
      </div>
      
      <div>
       <h4 className="font-regola font-medium text-black mb-3 sm:mb-4">Resources</h4>
       <ul className="space-y-2">
        <li><a href="/docs" className="text-gray-600 hover:text-black text-sm font-regola">Documentation</a></li>
        <li><Link href="/agent" className="text-gray-600 hover:text-black text-sm font-regola">Agent</Link></li>
       </ul>
      </div>
     </div>
    </div>
    
    <div className="border-t border-gray-200 pt-6 sm:pt-8">
     <div className="flex justify-center items-center">
      <p className="text-gray-600 text-sm font-regola">© 2025 0G Labs. All rights reserved.</p>
     </div>
    </div>
   </div>
  </footer>
 )
}