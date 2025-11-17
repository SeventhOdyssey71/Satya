'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/ui/Header'
import SealTestButton from '@/components/debug/SealTestButton'
import { HiArrowRight, HiShieldCheck, HiBolt, HiGlobeAmericas } from 'react-icons/hi2'
import { TbShield, TbDatabase, TbNetwork, TbCloudCheck } from 'react-icons/tb'
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TextPlugin } from 'gsap/TextPlugin'

// Register GSAP plugins
if (typeof window !== 'undefined') {
 gsap.registerPlugin(ScrollTrigger, TextPlugin)
}

export default function Home() {
 const containerRef = useRef<HTMLDivElement>(null)
 const { scrollYProgress } = useScroll()
 const scaleProgress = useTransform(scrollYProgress, [0, 1], [1, 0.8])
 const opacityProgress = useTransform(scrollYProgress, [0, 0.5], [1, 0])
 
 useEffect(() => {
  // Smooth scroll behavior
  if (typeof window !== 'undefined') {
   gsap.to(window, {
    scrollTo: { y: 0, autoKill: false },
    duration: 0.5,
    ease: "power2.inOut"
   })
  }
 }, [])

 return (
  <div ref={containerRef} className="relative min-h-screen bg-white overflow-x-hidden">
   {/* Animated background */}
   <div className="fixed inset-0 overflow-hidden pointer-events-none">
    <motion.div 
     className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl"
     animate={{
      x: [0, 100, 0],
      y: [0, -100, 0],
     }}
     transition={{
      duration: 20,
      repeat: Infinity,
      repeatType: "reverse"
     }}
    />
    <motion.div 
     className="absolute top-1/2 right-1/4 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"
     animate={{
      x: [0, -100, 0],
      y: [0, 100, 0],
     }}
     transition={{
      duration: 15,
      repeat: Infinity,
      repeatType: "reverse"
     }}
    />
   </div>

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
 const sectionRef = useRef(null)
 const headingRef = useRef(null)
 const { scrollY } = useScroll()
 const y = useTransform(scrollY, [0, 500], [0, -100])
 const opacity = useTransform(scrollY, [0, 300], [1, 0])
 
 useEffect(() => {
  // Split text animation
  if (headingRef.current) {
   gsap.from(headingRef.current, {
    duration: 1.5,
    text: "",
    ease: "power2.inOut",
   })
  }
  
  // Parallax for section
  gsap.to(sectionRef.current, {
   scrollTrigger: {
    trigger: sectionRef.current,
    start: "top top",
    end: "bottom top",
    scrub: 1
   },
   y: 100,
   ease: "none"
  })
 }, [])

 return (
  <motion.section 
   ref={sectionRef}
   className="relative z-10 pt-52 md:pt-64 pb-24 md:pb-32"
   initial={{ opacity: 0 }}
   animate={{ opacity: 1 }}
   transition={{ duration: 0.8 }}
  >
   <div className="container-custom">
    <div className="text-center max-w-5xl mx-auto">
     <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
     >
      <h1 
       ref={headingRef}
       className="text-5xl md:text-6xl lg:text-7xl font-albert font-bold leading-tight max-w-4xl mx-auto mb-8 bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 bg-clip-text text-transparent"
      >
       Bringing verifiable + trusted data markets
      </h1>
     </motion.div>
     
     <motion.p 
      className="text-xl md:text-2xl font-albert font-light text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed"
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.4 }}
     >
      Secure AI models and datasets with TEE verification, encrypted storage, and blockchain transparency. 
      Building the future of trusted machine learning.
     </motion.p>

     <motion.div 
      className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.6 }}
     >
      <Link href="/marketplace">
       <motion.button 
        className="px-8 py-4 bg-black text-white rounded-lg font-medium min-w-[200px] group flex items-center justify-center gap-2"
        whileHover={{ scale: 1.05, boxShadow: "0 20px 30px -10px rgba(0,0,0,0.3)" }}
        whileTap={{ scale: 0.95 }}
       >
        Launch App
        <HiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
       </motion.button>
      </Link>
      <motion.button 
       className="px-8 py-4 bg-white text-black border-2 border-gray-200 rounded-lg font-medium min-w-[200px] group flex items-center justify-center gap-2"
       whileHover={{ scale: 1.05, borderColor: "#000" }}
       whileTap={{ scale: 0.95 }}
      >
       Read Docs
       <svg className="w-4 h-4 group-hover:rotate-45 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
       </svg>
      </motion.button>
     </motion.div>

     <motion.div 
      className="text-center"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.8 }}
     >
      <p className="text-lg font-albert font-light text-gray-600 mb-8">Built on the Sui Stack</p>
      <div className="flex items-center justify-center gap-8 md:gap-16">
       <motion.div 
        className="group"
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 300 }}
       >
        <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all">
         <Image 
          src="/images/Seal.svg" 
          alt="SEAL"
          width={80}
          height={80}
          className="h-16 w-auto"
         />
        </div>
       </motion.div>
       <motion.div 
        className="group"
        whileHover={{ scale: 1.1, rotate: -5 }}
        transition={{ type: "spring", stiffness: 300 }}
       >
        <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all">
         <img 
          src="/images/Walrus.png" 
          alt="WALRUS"
          className="h-16 w-auto"
         />
        </div>
       </motion.div>
      </div>
     </motion.div>
    </div>
   </div>
  </motion.section>
 )
}

function AnimatedCard({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) {
 const ref = useRef(null)
 const isInView = useInView(ref, { once: true, margin: "-100px" })
 
 return (
  <motion.div
   ref={ref}
   initial={{ y: 50, opacity: 0 }}
   animate={isInView ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
   transition={{ duration: 0.8, delay, type: "spring", stiffness: 100 }}
   whileHover={{ y: -5, transition: { duration: 0.2 } }}
   className="h-full"
  >
   {children}
  </motion.div>
 )
}

function FeaturesSection() {
 const features = [
  {
   icon: <TbShield className="w-8 h-8" />,
   title: "TEE Verification",
   description: "Hardware-based attestation ensures model integrity and security"
  },
  {
   icon: <TbDatabase className="w-8 h-8" />,
   title: "Encrypted Storage",
   description: "SEAL encryption with policy-based access control"
  },
  {
   icon: <TbNetwork className="w-8 h-8" />,
   title: "Decentralized Network",
   description: "Walrus storage for resilient, distributed data"
  },
  {
   icon: <TbCloudCheck className="w-8 h-8" />,
   title: "Blockchain Transparency",
   description: "Immutable records on Sui blockchain"
  }
 ]

 return (
  <section className="relative z-10 py-24 bg-gradient-to-b from-white to-gray-50">
   <div className="container-custom">
    <motion.div 
     className="text-center mb-16"
     initial={{ opacity: 0 }}
     whileInView={{ opacity: 1 }}
     transition={{ duration: 1 }}
     viewport={{ once: true }}
    >
     <h2 className="text-4xl md:text-5xl font-albert font-bold mb-4">
      Enterprise-Grade Security
     </h2>
     <p className="text-xl text-gray-600 max-w-3xl mx-auto">
      Built with cutting-edge cryptography and blockchain technology
     </p>
    </motion.div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
     {features.map((feature, index) => (
      <AnimatedCard key={index} delay={index * 0.1}>
       <div className="bg-white border border-gray-200 rounded-2xl p-8 h-full hover:border-black transition-colors">
        <motion.div 
         className="text-blue-600 mb-4"
         whileHover={{ scale: 1.2, rotate: 360 }}
         transition={{ duration: 0.5 }}
        >
         {feature.icon}
        </motion.div>
        <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
        <p className="text-gray-600">{feature.description}</p>
       </div>
      </AnimatedCard>
     ))}
    </div>
   </div>
  </section>
 )
}

function TrustedMarketplacesSection() {
 const ref = useRef(null)
 
 useEffect(() => {
  gsap.from(ref.current, {
   scrollTrigger: {
    trigger: ref.current,
    start: "top center",
    end: "bottom center",
    toggleActions: "play none none reverse"
   },
   scale: 0.8,
   opacity: 0,
   duration: 1,
   ease: "power2.out"
  })
 }, [])

 return (
  <section ref={ref} className="relative z-10 py-24">
   <div className="container-custom">
    <div className="max-w-6xl mx-auto">
     <motion.div 
      className="text-center mb-16"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 1 }}
      viewport={{ once: true }}
     >
      <h2 className="text-4xl md:text-5xl font-albert font-bold mb-4">
       Trusted Marketplaces for AI
      </h2>
      <p className="text-xl text-gray-600 max-w-3xl mx-auto">
       Buy, sell, and verify AI models with complete transparency
      </p>
     </motion.div>

     <div className="grid md:grid-cols-3 gap-8">
      {[
       { title: "Verified Models", count: "1,000+", description: "TEE-attested AI models" },
       { title: "Active Users", count: "10,000+", description: "Developers and researchers" },
       { title: "Total Volume", count: "$5M+", description: "In secure transactions" }
      ].map((stat, index) => (
       <motion.div
        key={index}
        className="text-center p-8 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: index * 0.2 }}
        viewport={{ once: true }}
        whileHover={{ scale: 1.05 }}
       >
        <motion.div 
         className="text-4xl md:text-5xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text mb-2"
         initial={{ scale: 0 }}
         whileInView={{ scale: 1 }}
         transition={{ duration: 0.5, delay: 0.3 + index * 0.2, type: "spring" }}
         viewport={{ once: true }}
        >
         {stat.count}
        </motion.div>
        <div className="text-lg font-semibold mb-1">{stat.title}</div>
        <div className="text-gray-600 text-sm">{stat.description}</div>
       </motion.div>
      ))}
     </div>
    </div>
   </div>
  </section>
 )
}

function SuiStackSection() {
 return (
  <section className="relative z-10 py-24 bg-gradient-to-b from-gray-50 to-white">
   <div className="container-custom">
    <motion.div 
     className="text-center mb-16"
     initial={{ opacity: 0 }}
     whileInView={{ opacity: 1 }}
     transition={{ duration: 1 }}
     viewport={{ once: true }}
    >
     <h2 className="text-4xl md:text-5xl font-albert font-bold mb-4">
      Powered by Sui Ecosystem
     </h2>
     <p className="text-xl text-gray-600 max-w-3xl mx-auto">
      Leveraging the best of blockchain and decentralized storage
     </p>
    </motion.div>

    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
     <motion.div 
      className="bg-white border border-gray-200 rounded-2xl p-8"
      whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -15px rgba(0,0,0,0.1)" }}
     >
      <div className="flex items-center gap-4 mb-4">
       <HiShieldCheck className="w-8 h-8 text-green-600" />
       <h3 className="text-2xl font-bold">Security First</h3>
      </div>
      <p className="text-gray-600">
       Multi-layer security with TEE verification, encryption, and blockchain immutability
      </p>
     </motion.div>

     <motion.div 
      className="bg-white border border-gray-200 rounded-2xl p-8"
      whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -15px rgba(0,0,0,0.1)" }}
     >
      <div className="flex items-center gap-4 mb-4">
       <HiBolt className="w-8 h-8 text-yellow-600" />
       <h3 className="text-2xl font-bold">Lightning Fast</h3>
      </div>
      <p className="text-gray-600">
       Sub-second finality with Sui blockchain and optimized storage retrieval
      </p>
     </motion.div>
    </div>
   </div>
  </section>
 )
}

function TrustEnforcedSection() {
 return (
  <section className="relative z-10 py-24">
   <div className="container-custom">
    <motion.div 
     className="max-w-4xl mx-auto text-center"
     initial={{ opacity: 0 }}
     whileInView={{ opacity: 1 }}
     transition={{ duration: 1 }}
     viewport={{ once: true }}
    >
     <motion.h2 
      className="text-4xl md:text-5xl font-albert font-bold mb-8"
      initial={{ y: 30 }}
      whileInView={{ y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
     >
      Trust, Enforced by Technology
     </motion.h2>
     <motion.p 
      className="text-xl text-gray-600 mb-12"
      initial={{ y: 30 }}
      whileInView={{ y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      viewport={{ once: true }}
     >
      Every model is verified, every transaction is transparent, every byte is secure
     </motion.p>
     
     <Link href="/marketplace">
      <motion.button 
       className="px-8 py-4 bg-black text-white rounded-lg font-medium text-lg"
       whileHover={{ scale: 1.05, boxShadow: "0 20px 30px -10px rgba(0,0,0,0.3)" }}
       whileTap={{ scale: 0.95 }}
      >
       Start Building Trust
       <HiArrowRight className="inline-block ml-2 w-5 h-5" />
      </motion.button>
     </Link>
    </motion.div>
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
  <section className="relative z-10 py-24 bg-gray-50">
   <div className="container-custom">
    <motion.div 
     className="text-center mb-16"
     initial={{ opacity: 0 }}
     whileInView={{ opacity: 1 }}
     transition={{ duration: 1 }}
     viewport={{ once: true }}
    >
     <h2 className="text-4xl md:text-5xl font-albert font-bold mb-4">
      Frequently Asked Questions
     </h2>
    </motion.div>

    <div className="max-w-3xl mx-auto space-y-4">
     {faqs.map((faq, index) => (
      <motion.div
       key={index}
       className="bg-white border border-gray-200 rounded-lg p-6"
       initial={{ opacity: 0, y: 20 }}
       whileInView={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.5, delay: index * 0.1 }}
       viewport={{ once: true }}
       whileHover={{ scale: 1.02 }}
      >
       <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
       <p className="text-gray-600">{faq.answer}</p>
      </motion.div>
     ))}
    </div>
   </div>
  </section>
 )
}

function Footer() {
 return (
  <footer className="relative z-10 py-12 bg-white border-t border-gray-200">
   <div className="container-custom">
    <div className="text-center">
     <p className="text-gray-600">© 2025 Satya. Building the future of trusted AI.</p>
    </div>
   </div>
  </footer>
 )
}