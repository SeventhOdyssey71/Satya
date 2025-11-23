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
              Trade AI models through a structured pipeline: Upload → Pending → TEE Verification → Marketplace Listing. 
              All transactions are recorded on the SUI blockchain using smart contracts for transparency and immutability.
              Creators maintain ownership while enabling controlled access through encrypted storage.
            </p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-base font-medium text-black mb-2">SEAL Homomorphic Encryption</h3>
            <p className="text-gray-700">
              Models are protected using SEAL encryption with threshold cryptography (2 out of 2 key servers). 
              Encrypted models are stored on Walrus with access policies enforced through smart contracts.
              Session-based access keys are provided to buyers after successful purchase verification.
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
              Encrypted model data is stored on Walrus testnet with blob IDs tracked in smart contracts.
              Maximum file size is 1GB with 10MB chunk sizes for efficient uploads.
              Storage includes 5-epoch default retention with aggregator and publisher endpoints.
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
                <span className="font-medium text-black">Next.js Frontend:</span>
                <span className="text-gray-700"> React application with SUI wallet integration and responsive design</span>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <span className="font-medium text-black">SUI Smart Contracts:</span>
                <span className="text-gray-700"> Marketplace contract managing upload, verification, listing, and purchase flows</span>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <span className="font-medium text-black">SEAL Key Servers:</span>
                <span className="text-gray-700"> Two testnet servers with threshold cryptography for secure key management</span>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <span className="font-medium text-black">Nautilus TEE:</span>
                <span className="text-gray-700"> Local enclave verification service for model integrity and quality assessment</span>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <span className="font-medium text-black">Walrus Testnet:</span>
                <span className="text-gray-700"> Decentralized storage with aggregator and publisher endpoints for blob management</span>
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
                Connect a SUI wallet to interact with the testnet marketplace. The platform connects to SUI testnet at fullnode.testnet.sui.io:443.
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">
                  <strong>Testnet RPC:</strong> https://fullnode.testnet.sui.io:443
                </p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-medium text-black mb-2">SUI Testnet Tokens</h3>
              <p className="text-gray-700 mb-3">
                SUI tokens are required for transactions with gas budgets of 100-1000 million MIST. Platform fee is 2.5% of model prices.
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">
                  <strong>Default gas budget:</strong> 200 million MIST
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
                Install and configure a SUI wallet for testnet. The application will request wallet connection
                and permission to interact with marketplace smart contracts.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <span className="w-8 h-8 bg-gray-200 text-black rounded-full flex items-center justify-center font-semibold mr-4">2</span>
                <h3 className="text-base font-medium text-black">Get SUI Tokens</h3>
              </div>
              <p className="text-gray-700 ml-12">
                Obtain testnet SUI tokens. Platform requires sufficient balance for gas fees 
                and model purchase prices set by creators.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <span className="w-8 h-8 bg-gray-200 text-black rounded-full flex items-center justify-center font-semibold mr-4">3</span>
                <h3 className="text-base font-medium text-black">Connect to Satya</h3>
              </div>
              <p className="text-gray-700 ml-12">
                Connect your wallet through the header interface. The application establishes
                connection to testnet contracts and displays your wallet address.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <span className="w-8 h-8 bg-gray-200 text-black rounded-full flex items-center justify-center font-semibold mr-4">4</span>
                <h3 className="text-base font-medium text-black">Browse and Purchase</h3>
              </div>
              <p className="text-gray-700 ml-12">
                Browse marketplace models with TEE verification status, quality scores, and pricing.
                Purchase creates on-chain records and provides SEAL decryption access.
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
                <strong>Verification process:</strong> Nautilus TEE service executes models in local enclaves, 
                generates quality scores and security assessments, then calls complete_verification on-chain.
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
                Platform accepts JSON, CSV, ZIP, TAR, GZIP, ONNX, and pickle files. 
                Files are uploaded to Walrus storage with blob ID tracking in smart contracts.
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">
                  <strong>File limits:</strong> Maximum 1GB file size, 10MB chunks for parallel uploads
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
                <h3 className="text-base font-medium text-black">Create Pending Model</h3>
              </div>
              <p className="text-gray-700 ml-12">
                Submit model metadata (title, description, category, tags) and pricing to create a PendingModel object.
                Status starts as PENDING (0) and advances through verification stages.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <span className="w-8 h-8 bg-gray-200 text-black rounded-full flex items-center justify-center font-semibold mr-4">2</span>
                <h3 className="text-base font-medium text-black">SEAL Encryption & Walrus Storage</h3>
              </div>
              <p className="text-gray-700 ml-12">
                Files are SEAL-encrypted with policy metadata and uploaded to Walrus storage.
                Blob IDs and encryption policies are recorded in the smart contract.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <span className="w-8 h-8 bg-gray-200 text-black rounded-full flex items-center justify-center font-semibold mr-4">3</span>
                <h3 className="text-base font-medium text-black">TEE Verification Request</h3>
              </div>
              <p className="text-gray-700 ml-12">
                Submit model for Nautilus TEE verification. Status changes to VERIFYING (1) while
                enclave performs quality assessment and generates attestation.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <span className="w-8 h-8 bg-gray-200 text-black rounded-full flex items-center justify-center font-semibold mr-4">4</span>
                <h3 className="text-base font-medium text-black">Marketplace Listing</h3>
              </div>
              <p className="text-gray-700 ml-12">
                After verification completion, create MarketplaceModel from verified PendingModel.
                Model becomes available for purchase with TEE verification badge and quality score.
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
                <code className="text-sm text-gray-700">DEFAULT_ACCESS_DURATION_MS: 2592000000 // 30 days</code>
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
              <p><strong>Threshold Requirement:</strong> 2 out of 2 key servers for decryption</p>
              <p><strong>Server 1 Object ID:</strong> 0x2304dd255b13eaf5cb471bd5188df946a64f1715ee2b7b02fecf306bd12ceebc</p>
              <p><strong>Server 2 Object ID:</strong> 0x81aeaa8c25d2c912e1dc23b4372305b7a602c4ec4cc3e510963bc635e500aa37</p>
              <p><strong>Session TTL:</strong> 30 minutes for active sessions</p>
              <p><strong>Health Check:</strong> 5-minute intervals (reduced from 30 seconds)</p>
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
          <h2 className="text-base font-semibold text-black mb-4">Local Development APIs</h2>
          <p className="text-gray-700 mb-4">
            Satya provides local API routes for development and testing. These endpoints are available 
            when running the Next.js development server.
          </p>
          
          <div className="border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="text-base font-medium text-black mb-2">Base URL</h3>
            <div className="bg-gray-50 p-3 rounded">
              <code className="text-gray-700">http://localhost:3000/api</code>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <span className="px-3 py-1 bg-gray-200 text-black text-sm font-medium rounded">POST</span>
                <code className="text-gray-700">/marketplace/create-listing</code>
              </div>
              <p className="text-gray-700 mb-3">
                Create a new marketplace listing by calling the smart contract's upload_model_entry function.
                Handles file encryption, Walrus storage, and blockchain registration.
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600 mb-2"><strong>Request Body:</strong></p>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><code>title</code> - Model name and description</p>
                  <p><code>price</code> - Price in SUI MIST units</p>
                  <p><code>category</code> - Model category classification</p>
                  <p><code>file</code> - Model file for SEAL encryption and Walrus upload</p>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <span className="px-3 py-1 bg-gray-200 text-black text-sm font-medium rounded">POST</span>
                <code className="text-gray-700">/decrypt-blobs</code>
              </div>
              <p className="text-gray-700">
                Decrypt purchased model blobs using SEAL session keys. Coordinates with 
                key servers to provide decrypted model access to verified buyers.
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <span className="px-3 py-1 bg-gray-200 text-black text-sm font-medium rounded">POST</span>
                <code className="text-gray-700">/debug/test-marketplace-service</code>
              </div>
              <p className="text-gray-700 mb-3">
                Development endpoint for testing marketplace service integration.
                Tests smart contract interactions and service coordination.
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600 mb-2"><strong>Debug Endpoints Available:</strong></p>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><code>/debug/test-full-upload</code> - Test complete upload flow</p>
                  <p><code>/debug/test-smart-contract</code> - Test contract calls</p>
                  <p><code>/debug/test-marketplace-service</code> - Test service integration</p>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <span className="px-3 py-1 bg-gray-200 text-black text-sm font-medium rounded">Frontend</span>
                <code className="text-gray-700">Direct Blockchain Integration</code>
              </div>
              <p className="text-gray-700">
                Model purchases are handled directly through wallet interactions with smart contracts.
                No separate API endpoint - uses browser SUI wallet integration for transactions.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold text-black mb-4">Wallet Integration</h2>
          <p className="text-gray-700 mb-4">
            The application uses browser-based SUI wallet integration for transaction signing.
            No separate authentication API - wallet connection handled by frontend hooks.
          </p>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2"><strong>Integration Method:</strong></p>
            <div className="space-y-1 text-sm text-gray-600">
              <p><code>useAuth</code> - Wallet connection management</p>
              <p><code>useMarketplace</code> - Smart contract interactions</p>
              <p><code>useSeal</code> - SEAL encryption operations</p>
            </div>
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
            <h3 className="text-base font-medium text-black mb-3">Active Testnet Deployment</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-black">Marketplace Package:</span>
                <div className="bg-gray-50 p-2 rounded mt-1">
                  <code className="text-sm text-gray-700">0xc29f2a2de17085ce6b7e8c490a2d80eba3e7bdda5c2a8e1d1840af88ef604678</code>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-black">Registry Object:</span>
                <div className="bg-gray-50 p-2 rounded mt-1">
                  <code className="text-sm text-gray-700">0xa3a0814822a4126846b0dbc5ffef91f1ee5bf078ca129eef16c8bdf5b6481c9b</code>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-black">SEAL Package:</span>
                <div className="bg-gray-50 p-2 rounded mt-1">
                  <code className="text-sm text-gray-700">0x8afa5d31dbaa0a8fb07082692940ca3d56b5e856c5126cb5a3693f0a4de63b82</code>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-black">Platform Fee:</span>
                <div className="bg-gray-50 p-2 rounded mt-1">
                  <code className="text-sm text-gray-700">250 basis points (2.5%)</code>
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
              <h3 className="text-base font-medium text-black mb-2">upload_model_entry</h3>
              <p className="text-gray-700 mb-3">
                Creates a PendingModel object with status PENDING (0). Initial step in the 
                Upload → Verification → Marketplace pipeline.
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600 mb-2"><strong>Parameters:</strong></p>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><code>title: String</code> - Model display name</p>
                  <p><code>model_blob_id: String</code> - Walrus encrypted blob ID</p>
                  <p><code>encryption_policy_id: String</code> - SEAL policy reference</p>
                  <p><code>price: u64</code> - Price in MIST (1 SUI = 1,000,000,000 MIST)</p>
                  <p><code>clock: &Clock</code> - SUI clock for timestamps</p>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-medium text-black mb-2">purchase_model</h3>
              <p className="text-gray-700 mb-3">
                Processes MarketplaceModel purchase with 2.5% platform fee distribution.
                Creates PurchaseRecord with access_key field for SEAL decryption.
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600 mb-2"><strong>Parameters:</strong></p>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><code>marketplace_model: &mut MarketplaceModel</code> - Target model</p>
                  <p><code>payment: Coin&lt;SUI&gt;</code> - SUI payment coin</p>
                  <p><code>clock: &Clock</code> - SUI clock for timestamps</p>
                  <p><code>ctx: &mut TxContext</code> - Transaction context</p>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-medium text-black mb-2">complete_verification</h3>
              <p className="text-gray-700 mb-3">
                Called by TEE service to complete verification process. Changes model status 
                to VERIFIED (2) and creates VerificationResult with quality score.
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600 mb-2"><strong>Parameters:</strong></p>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><code>model: &mut PendingModel</code> - Model being verified</p>
                  <p><code>enclave_id: String</code> - TEE enclave identifier</p>
                  <p><code>quality_score: u64</code> - Verification quality rating</p>
                  <p><code>verifier_signature: vector&lt;u8&gt;</code> - TEE signature</p>
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