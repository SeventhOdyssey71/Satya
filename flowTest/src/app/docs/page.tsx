'use client'

import { useState } from 'react'
import Header from '@/components/ui/Header'

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('introduction')

  const sections = [
    { id: 'introduction', title: 'Introduction' },
    { id: 'getting-started', title: 'Getting Started' },
    { id: 'marketplace', title: 'Marketplace' },
    { id: 'upload', title: 'Upload Models' },
    { id: 'seal', title: 'SEAL Encryption' },
    { id: 'api', title: 'API Reference' },
    { id: 'contracts', title: 'Smart Contracts' }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {/* Sidebar */}
            <div className="w-64 flex-shrink-0">
              <div className="sticky top-24 bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-base font-semibold text-black mb-4">Documentation</h2>
                <nav className="space-y-2">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-50 text-blue-600 border-l-2 border-blue-500'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {section.title}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 max-w-4xl">
              <div className="bg-white border border-gray-200 rounded-lg p-8">
                {activeSection === 'introduction' && <IntroductionContent />}
                {activeSection === 'getting-started' && <GettingStartedContent />}
                {activeSection === 'marketplace' && <MarketplaceContent />}
                {activeSection === 'upload' && <UploadContent />}
                {activeSection === 'seal' && <SealContent />}
                {activeSection === 'api' && <ApiContent />}
                {activeSection === 'contracts' && <ContractsContent />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function IntroductionContent() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-black">Satya AI Marketplace Documentation</h1>
      
      <div className="border-l-4 border-blue-500 pl-6 py-4 bg-gray-50">
        <p className="text-gray-700 leading-relaxed">
          Satya is a decentralized marketplace for AI models built on the SUI blockchain. 
          It enables secure trading of machine learning models using advanced encryption, 
          trusted execution environments, and blockchain technology.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-semibold text-black">Core Features</h2>
        
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-base font-medium text-black mb-2">Decentralized Model Trading</h3>
            <p className="text-gray-700">
              Trade AI models on a peer-to-peer marketplace without intermediaries. 
              All transactions are recorded on the SUI blockchain for transparency and immutability.
              Creators maintain ownership while enabling controlled access to their models.
            </p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-base font-medium text-black mb-2">SEAL Homomorphic Encryption</h3>
            <p className="text-gray-700">
              Models are protected using Microsoft SEAL homomorphic encryption technology. 
              This allows computation on encrypted data without revealing the underlying model structure,
              ensuring intellectual property protection while enabling model usage.
            </p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-base font-medium text-black mb-2">Trusted Execution Environment</h3>
            <p className="text-gray-700">
              TEE verification provides cryptographic proof of model integrity and performance.
              Models are executed in secure enclaves to generate attestations that buyers can verify,
              ensuring models perform as advertised before purchase.
            </p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-base font-medium text-black mb-2">Walrus Decentralized Storage</h3>
            <p className="text-gray-700">
              All model data is stored on the Walrus decentralized storage network.
              This ensures data availability, redundancy, and censorship resistance while
              maintaining cost-effectiveness for large model files.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-semibold text-black">Architecture Overview</h2>
        <p className="text-gray-700">
          The platform consists of several integrated components working together to provide
          a secure and efficient marketplace experience:
        </p>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <span className="font-medium text-black">Frontend Application:</span>
                <span className="text-gray-700"> Next.js web application for marketplace interaction</span>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <span className="font-medium text-black">SUI Blockchain:</span>
                <span className="text-gray-700"> Smart contracts for marketplace operations and payments</span>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <span className="font-medium text-black">SEAL Encryption:</span>
                <span className="text-gray-700"> Homomorphic encryption for model protection</span>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <span className="font-medium text-black">TEE Services:</span>
                <span className="text-gray-700"> Model verification and attestation generation</span>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <span className="font-medium text-black">Walrus Storage:</span>
                <span className="text-gray-700"> Decentralized storage for encrypted model data</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function GettingStartedContent() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-black">Getting Started</h1>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-base font-semibold text-black mb-4">Prerequisites</h2>
          <div className="space-y-3">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-medium text-black mb-2">SUI Wallet</h3>
              <p className="text-gray-700 mb-3">
                You need a SUI wallet to interact with the marketplace. We recommend using the official SUI Wallet extension.
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">
                  Download from: https://chrome.google.com/webstore/detail/sui-wallet
                </p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-medium text-black mb-2">SUI Tokens</h3>
              <p className="text-gray-700 mb-3">
                You need SUI tokens to purchase models and pay transaction fees. For testnet, you can get free tokens from the faucet.
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">
                  Testnet faucet: https://discord.gg/sui (use #testnet-faucet channel)
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold text-black mb-4">Quick Start Steps</h2>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <span className="w-8 h-8 bg-gray-200 text-black rounded-full flex items-center justify-center font-semibold mr-4">1</span>
                <h3 className="text-base font-medium text-black">Install and Setup Wallet</h3>
              </div>
              <p className="text-gray-700 ml-12">
                Install the SUI Wallet browser extension, create a new wallet or import an existing one.
                Make sure to securely store your seed phrase and set up a strong password for your wallet.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <span className="w-8 h-8 bg-gray-200 text-black rounded-full flex items-center justify-center font-semibold mr-4">2</span>
                <h3 className="text-base font-medium text-black">Get SUI Tokens</h3>
              </div>
              <p className="text-gray-700 ml-12">
                For testnet usage, request SUI tokens from the Discord faucet. For mainnet, 
                purchase SUI tokens from a cryptocurrency exchange and transfer them to your wallet.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <span className="w-8 h-8 bg-gray-200 text-black rounded-full flex items-center justify-center font-semibold mr-4">3</span>
                <h3 className="text-base font-medium text-black">Connect to Satya</h3>
              </div>
              <p className="text-gray-700 ml-12">
                Visit the Satya marketplace and click the "Connect Wallet" button. 
                Approve the connection request in your wallet to link your account to the platform.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <span className="w-8 h-8 bg-gray-200 text-black rounded-full flex items-center justify-center font-semibold mr-4">4</span>
                <h3 className="text-base font-medium text-black">Browse and Purchase</h3>
              </div>
              <p className="text-gray-700 ml-12">
                Explore available models, review their specifications and pricing, 
                then purchase access using your SUI tokens. Downloaded models can be used according to their licensing terms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MarketplaceContent() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-black">Marketplace Guide</h1>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-base font-semibold text-black mb-4">Browsing Models</h2>
          <p className="text-gray-700 mb-4">
            The marketplace provides comprehensive search and filtering capabilities to help you find the right AI models for your needs.
          </p>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-medium text-black mb-2">Search and Filters</h3>
              <p className="text-gray-700 mb-3">
                Use the search bar to find models by name, description, or tags. Apply filters to narrow down results by category, 
                price range, verification status, and creator. Sort results by relevance, price, popularity, or upload date.
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">
                  <strong>Available categories:</strong> Computer Vision, Natural Language Processing, Audio Processing, 
                  Recommendation Systems, Time Series Analysis, Generative Models
                </p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-medium text-black mb-2">Model Information</h3>
              <p className="text-gray-700 mb-3">
                Each model listing displays comprehensive information including performance metrics, 
                technical specifications, usage examples, licensing terms, and creator details.
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">
                  <strong>Key details:</strong> Model architecture, training dataset size, accuracy metrics, 
                  inference latency, memory requirements, supported frameworks
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold text-black mb-4">Purchasing Models</h2>
          <p className="text-gray-700 mb-4">
            Purchase process is secured through blockchain transactions and provides immediate access upon confirmation.
          </p>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-medium text-black mb-2">Payment Process</h3>
              <p className="text-gray-700 mb-3">
                Select a model and click "Purchase Access". Review the pricing, access duration, and terms. 
                Confirm the transaction in your wallet to complete the purchase. Gas fees will be added to the model price.
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">
                  <strong>Fee structure:</strong> Model price + 2.5% platform fee + SUI network gas fees
                </p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-medium text-black mb-2">Access and Download</h3>
              <p className="text-gray-700 mb-3">
                After successful purchase, you receive an access ticket that allows model decryption. 
                The system coordinates with SEAL key servers to provide decryption keys for your purchased models.
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">
                  <strong>Access duration:</strong> Typically 30-90 days, as specified by the model creator
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold text-black mb-4">TEE Verification</h2>
          <p className="text-gray-700 mb-4">
            Trusted Execution Environment verification provides cryptographic proof that models perform as advertised.
          </p>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-base font-medium text-black mb-2">Verification Benefits</h3>
            <p className="text-gray-700 mb-3">
              Verified models carry trust badges and are prioritized in search results. 
              TEE verification validates model integrity, performance claims, and ensures no malicious modifications.
            </p>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600">
                <strong>Verification process:</strong> Models are executed in secure enclaves, 
                performance metrics are measured, and cryptographic attestations are generated for public verification.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function UploadContent() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-black">Upload Models</h1>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-base font-semibold text-black mb-4">Model Preparation</h2>
          <p className="text-gray-700 mb-4">
            Properly prepare your AI model for upload to ensure optimal marketplace performance and user experience.
          </p>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-medium text-black mb-2">Supported Formats</h3>
              <p className="text-gray-700 mb-3">
                The platform supports standard AI model formats including PyTorch (.pt, .pth), TensorFlow (.pb, .h5), 
                ONNX (.onnx), and scikit-learn (.pkl). Ensure your model is saved in a compatible format.
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">
                  <strong>File size limits:</strong> Maximum 10GB per model file. Larger models should be split or compressed.
                </p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-medium text-black mb-2">Documentation Requirements</h3>
              <p className="text-gray-700 mb-3">
                Provide comprehensive documentation including model architecture description, training methodology, 
                performance benchmarks, usage examples, and API specifications. Good documentation increases model sales.
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">
                  <strong>Required information:</strong> Input/output specifications, preprocessing requirements, 
                  performance metrics, licensing terms, supported use cases
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold text-black mb-4">Upload Process</h2>
          <p className="text-gray-700 mb-4">
            The upload process includes file validation, encryption, storage, and blockchain registration.
          </p>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <span className="w-8 h-8 bg-gray-200 text-black rounded-full flex items-center justify-center font-semibold mr-4">1</span>
                <h3 className="text-base font-medium text-black">Basic Information</h3>
              </div>
              <p className="text-gray-700 ml-12">
                Enter model title, description, category, tags, and creator information. 
                Choose appropriate tags to improve discoverability in marketplace search results.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <span className="w-8 h-8 bg-gray-200 text-black rounded-full flex items-center justify-center font-semibold mr-4">2</span>
                <h3 className="text-base font-medium text-black">File Upload</h3>
              </div>
              <p className="text-gray-700 ml-12">
                Upload your model file, optional dataset, and sample files. 
                The system validates file formats and sizes before proceeding to encryption.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <span className="w-8 h-8 bg-gray-200 text-black rounded-full flex items-center justify-center font-semibold mr-4">3</span>
                <h3 className="text-base font-medium text-black">Pricing and Access</h3>
              </div>
              <p className="text-gray-700 ml-12">
                Set your model price in SUI tokens, configure access duration, and select encryption policies. 
                Consider market pricing for similar models when setting your price.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <span className="w-8 h-8 bg-gray-200 text-black rounded-full flex items-center justify-center font-semibold mr-4">4</span>
                <h3 className="text-base font-medium text-black">Encryption and Storage</h3>
              </div>
              <p className="text-gray-700 ml-12">
                Files are encrypted using SEAL homomorphic encryption and stored on Walrus decentralized storage. 
                The system generates access policies and stores metadata on the SUI blockchain.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SealContent() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-black">SEAL Encryption</h1>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-base font-semibold text-black mb-4">How SEAL Works</h2>
          <p className="text-gray-700 mb-4">
            Microsoft SEAL provides homomorphic encryption that enables computation on encrypted data 
            without revealing the underlying information. This protects AI model intellectual property 
            while allowing controlled usage.
          </p>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-base font-medium text-black mb-2">Encryption Process</h3>
            <div className="space-y-3 ml-4">
              <div className="flex items-start space-x-3">
                <span className="text-sm font-medium text-black bg-gray-200 px-2 py-1 rounded">1</span>
                <p className="text-gray-700">Model data is prepared and validated for encryption compatibility</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-sm font-medium text-black bg-gray-200 px-2 py-1 rounded">2</span>
                <p className="text-gray-700">SEAL encryption keys are generated using threshold cryptography</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-sm font-medium text-black bg-gray-200 px-2 py-1 rounded">3</span>
                <p className="text-gray-700">Homomorphic encryption is applied to protect model parameters</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-sm font-medium text-black bg-gray-200 px-2 py-1 rounded">4</span>
                <p className="text-gray-700">Encrypted data is stored on Walrus decentralized storage network</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-sm font-medium text-black bg-gray-200 px-2 py-1 rounded">5</span>
                <p className="text-gray-700">Access policies are defined and enforced through smart contracts</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold text-black mb-4">Access Control Policies</h2>
          <p className="text-gray-700 mb-4">
            SEAL supports multiple access control mechanisms to provide flexible protection for different use cases.
          </p>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-medium text-black mb-2">Time-Based Access</h3>
              <p className="text-gray-700 mb-3">
                Control how long users maintain access to encrypted models after purchase. 
                Configure durations from hours to years based on your business model and user needs.
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <code className="text-sm text-gray-700">duration: 2592000000 // 30 days in milliseconds</code>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-medium text-black mb-2">Address-Based Access</h3>
              <p className="text-gray-700 mb-3">
                Restrict model access to specific wallet addresses for private distributions, 
                enterprise deployments, or compliance requirements.
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <code className="text-sm text-gray-700">allowedUsers: ['0xabc123...', '0xdef456...']</code>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-medium text-black mb-2">Usage-Based Access</h3>
              <p className="text-gray-700 mb-3">
                Limit the number of model interactions or inference calls to support 
                pay-per-use business models and prevent abuse.
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <code className="text-sm text-gray-700">maxUsage: 100 // Maximum number of inference calls</code>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold text-black mb-4">Key Management</h2>
          <p className="text-gray-700 mb-4">
            Threshold cryptography distributes encryption keys across multiple servers 
            to ensure security and availability without single points of failure.
          </p>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-base font-medium text-black mb-2">Server Configuration</h3>
            <div className="space-y-2 text-gray-700">
              <p><strong>Threshold Requirement:</strong> 2 out of 2 key servers must participate in decryption</p>
              <p><strong>Primary Server:</strong> seal-key-server-testnet-1.mystenlabs.com</p>
              <p><strong>Secondary Server:</strong> seal-key-server-testnet-2.mystenlabs.com</p>
              <p><strong>Session Duration:</strong> 30 minutes maximum for active decryption sessions</p>
              <p><strong>Health Monitoring:</strong> 5-minute intervals for server availability checks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ApiContent() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-black">API Reference</h1>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-base font-semibold text-black mb-4">REST API</h2>
          <p className="text-gray-700 mb-4">
            Satya provides RESTful APIs for integrating marketplace functionality into external applications.
            All endpoints require authentication using SUI wallet signatures.
          </p>
          
          <div className="border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="text-base font-medium text-black mb-2">Base URL</h3>
            <div className="bg-gray-50 p-3 rounded">
              <code className="text-gray-700">https://api.satya.ai/v1</code>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <span className="px-3 py-1 bg-gray-200 text-black text-sm font-medium rounded">GET</span>
                <code className="text-gray-700">/models</code>
              </div>
              <p className="text-gray-700 mb-3">
                Retrieve all available models with filtering and pagination support. 
                Supports category filtering, text search, price ranges, and sorting options.
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600 mb-2"><strong>Query Parameters:</strong></p>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><code>category</code> - Filter by model category</p>
                  <p><code>limit</code> - Maximum results (default: 20, max: 100)</p>
                  <p><code>offset</code> - Pagination offset</p>
                  <p><code>search</code> - Full-text search</p>
                  <p><code>verified</code> - Filter TEE-verified models only</p>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <span className="px-3 py-1 bg-gray-200 text-black text-sm font-medium rounded">GET</span>
                <code className="text-gray-700">/models/&#123;id&#125;</code>
              </div>
              <p className="text-gray-700">
                Retrieve comprehensive details for a specific model including metadata, 
                performance metrics, pricing, and verification status.
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <span className="px-3 py-1 bg-gray-200 text-black text-sm font-medium rounded">POST</span>
                <code className="text-gray-700">/models</code>
              </div>
              <p className="text-gray-700 mb-3">
                Upload and list a new AI model. Handles file upload, encryption, storage, and blockchain registration.
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600 mb-2"><strong>Request Body Example:</strong></p>
                <pre className="text-sm text-gray-700 overflow-x-auto">{`{
  "title": "Computer Vision Model",
  "description": "Image classification model",
  "category": "computer-vision",
  "price": 1000000000,
  "accessDuration": 2592000000,
  "tags": ["classification", "images"],
  "modelFile": "base64_encoded_data"
}`}</pre>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <span className="px-3 py-1 bg-gray-200 text-black text-sm font-medium rounded">POST</span>
                <code className="text-gray-700">/models/&#123;id&#125;/purchase</code>
              </div>
              <p className="text-gray-700">
                Purchase access to a model with SUI token payment. Processes blockchain transaction 
                and issues access ticket for model decryption.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold text-black mb-4">Authentication</h2>
          <p className="text-gray-700 mb-4">
            All API requests require authentication using SUI wallet signatures for security and access control.
          </p>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2"><strong>Header Format:</strong></p>
            <pre className="text-sm text-gray-700">{`Authorization: Bearer <wallet_signature>
Content-Type: application/json`}</pre>
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold text-black mb-4">Error Responses</h2>
          <p className="text-gray-700 mb-4">
            Standardized error responses with consistent formatting and detailed error information.
          </p>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2"><strong>Error Response Format:</strong></p>
            <pre className="text-sm text-gray-700">{`{
  "error": "INVALID_REQUEST",
  "message": "Model not found",
  "code": 404,
  "timestamp": "2024-11-22T10:30:00Z"
}`}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}

function ContractsContent() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-black">Smart Contracts</h1>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-base font-semibold text-black mb-4">Contract Addresses</h2>
          <p className="text-gray-700 mb-4">
            Satya smart contracts are deployed on the SUI blockchain for marketplace operations, payments, and access control.
          </p>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-base font-medium text-black mb-3">Testnet Deployment</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-black">Marketplace Package:</span>
                <div className="bg-gray-50 p-2 rounded mt-1">
                  <code className="text-sm text-gray-700">0x2643c7f8f6ea672a2780c8259be490bfc57cfa2c3895cbfd6109bde5e65a0bc7</code>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-black">Registry Object:</span>
                <div className="bg-gray-50 p-2 rounded mt-1">
                  <code className="text-sm text-gray-700">0xc6c008c9df4017f000a28b37c4949a931b566258d52eaa3ae4b5be17a6e1bf06</code>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-black">SEAL Package:</span>
                <div className="bg-gray-50 p-2 rounded mt-1">
                  <code className="text-sm text-gray-700">0x98f8a6ce208764219b23dc51db45bf11516ec0998810e98f3a94548d788ff679</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold text-black mb-4">Core Functions</h2>
          <p className="text-gray-700 mb-4">
            The marketplace smart contract provides functions for listing, purchasing, and managing AI models.
          </p>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-medium text-black mb-2">list_model</h3>
              <p className="text-gray-700 mb-3">
                Creates a new marketplace listing for an AI model with pricing and access parameters.
                Validates input data and registers the model in the global marketplace registry.
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600 mb-2"><strong>Parameters:</strong></p>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><code>registry: &mut Registry</code> - Marketplace registry reference</p>
                  <p><code>title: String</code> - Model display name</p>
                  <p><code>description: String</code> - Detailed model description</p>
                  <p><code>price: u64</code> - Price in MIST (1 SUI = 1,000,000,000 MIST)</p>
                  <p><code>blob_id: String</code> - Walrus storage identifier</p>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-medium text-black mb-2">purchase_model</h3>
              <p className="text-gray-700 mb-3">
                Processes model purchase with SUI token payment, fee distribution, 
                and access ticket generation for buyer model access.
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600 mb-2"><strong>Parameters:</strong></p>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><code>registry: &mut Registry</code> - Marketplace registry reference</p>
                  <p><code>model_id: ID</code> - Unique model identifier</p>
                  <p><code>payment: Coin&lt;SUI&gt;</code> - SUI payment coin</p>
                  <p><code>ctx: &mut TxContext</code> - Transaction context</p>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-medium text-black mb-2">verify_model</h3>
              <p className="text-gray-700 mb-3">
                Processes TEE verification attestations to validate model integrity 
                and performance claims, updating verification status on-chain.
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600 mb-2"><strong>Parameters:</strong></p>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><code>registry: &mut Registry</code> - Marketplace registry reference</p>
                  <p><code>model_id: ID</code> - Model to verify</p>
                  <p><code>attestation: vector&lt;u8&gt;</code> - TEE attestation data</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold text-black mb-4">Data Structures</h2>
          <p className="text-gray-700 mb-4">
            Key data structures used in the smart contract system for model and access management.
          </p>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-medium text-black mb-2">AIModel Struct</h3>
              <div className="bg-gray-50 p-3 rounded">
                <pre className="text-sm text-gray-700 overflow-x-auto">{`struct AIModel has key, store {
    id: UID,
    title: String,
    description: String,
    creator: address,
    price: u64,
    blob_id: String,
    category: String,
    tags: vector<String>,
    quality_score: u64,
    downloads: u64,
    is_verified: bool,
    created_at: u64
}`}</pre>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-medium text-black mb-2">AccessTicket Struct</h3>
              <div className="bg-gray-50 p-3 rounded">
                <pre className="text-sm text-gray-700 overflow-x-auto">{`struct AccessTicket has key, store {
    id: UID,
    model_id: ID,
    buyer: address,
    expires_at: u64,
    access_key: Option<vector<u8>>,
    usage_count: u64,
    max_usage: Option<u64>
}`}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}