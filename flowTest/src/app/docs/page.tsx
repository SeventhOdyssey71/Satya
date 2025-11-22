'use client'

import { useState } from 'react'
import Header from '@/components/ui/Header'
import { HiChevronDown, HiChevronRight } from 'react-icons/hi2'
import { TbShield, TbDatabase, TbNetwork, TbCloudCheck, TbUpload, TbCoin, TbKey, TbApi } from 'react-icons/tb'

interface DocSection {
  id: string
  title: string
  icon?: React.ReactNode
  subsections?: DocSubsection[]
}

interface DocSubsection {
  id: string
  title: string
  content: React.ReactNode
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('introduction')
  const [expandedSections, setExpandedSections] = useState<string[]>(['getting-started', 'platform-overview'])

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const docSections: DocSection[] = [
    {
      id: 'introduction',
      title: 'Introduction to Satya',
      icon: <TbNetwork className="w-4 h-4" />
    },
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <TbUpload className="w-4 h-4" />,
      subsections: [
        { id: 'quick-start', title: 'Quick Start Guide', content: <QuickStartContent /> },
        { id: 'wallet-setup', title: 'Wallet Setup', content: <WalletSetupContent /> },
        { id: 'first-upload', title: 'Your First Upload', content: <FirstUploadContent /> }
      ]
    },
    {
      id: 'platform-overview',
      title: 'Platform Overview',
      icon: <TbShield className="w-4 h-4" />,
      subsections: [
        { id: 'architecture', title: 'Architecture', content: <ArchitectureContent /> },
        { id: 'security', title: 'Security Features', content: <SecurityContent /> },
        { id: 'technology-stack', title: 'Technology Stack', content: <TechnologyStackContent /> }
      ]
    },
    {
      id: 'marketplace',
      title: 'Marketplace',
      icon: <TbCoin className="w-4 h-4" />,
      subsections: [
        { id: 'browsing-models', title: 'Browsing Models', content: <BrowsingModelsContent /> },
        { id: 'purchasing', title: 'Purchasing Models', content: <PurchasingContent /> },
        { id: 'verification', title: 'TEE Verification', content: <VerificationContent /> }
      ]
    },
    {
      id: 'upload-guide',
      title: 'Upload Guide',
      icon: <TbUpload className="w-4 h-4" />,
      subsections: [
        { id: 'model-preparation', title: 'Model Preparation', content: <ModelPreparationContent /> },
        { id: 'upload-process', title: 'Upload Process', content: <UploadProcessContent /> },
        { id: 'listing-setup', title: 'Listing Setup', content: <ListingSetupContent /> }
      ]
    },
    {
      id: 'encryption',
      title: 'SEAL Encryption',
      icon: <TbKey className="w-4 h-4" />,
      subsections: [
        { id: 'how-it-works', title: 'How SEAL Works', content: <SealWorkContent /> },
        { id: 'policy-types', title: 'Policy Types', content: <PolicyTypesContent /> },
        { id: 'key-management', title: 'Key Management', content: <KeyManagementContent /> }
      ]
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      icon: <TbApi className="w-4 h-4" />,
      subsections: [
        { id: 'rest-api', title: 'REST API', content: <RestApiContent /> },
        { id: 'smart-contracts', title: 'Smart Contracts', content: <SmartContractsContent /> },
        { id: 'sdk-usage', title: 'SDK Usage', content: <SdkUsageContent /> }
      ]
    }
  ]

  const getActiveContent = () => {
    for (const section of docSections) {
      if (section.id === activeSection) {
        return <IntroductionContent />
      }
      if (section.subsections) {
        for (const subsection of section.subsections) {
          if (subsection.id === activeSection) {
            return subsection.content
          }
        }
      }
    }
    return <IntroductionContent />
  }

  const getActiveTitle = () => {
    for (const section of docSections) {
      if (section.id === activeSection) {
        return section.title
      }
      if (section.subsections) {
        for (const subsection of section.subsections) {
          if (subsection.id === activeSection) {
            return subsection.title
          }
        }
      }
    }
    return 'Introduction to Satya'
  }

  return (
    <div className="min-h-screen bg-white pt-16">
      <Header />
      
      <div className="flex">
        {/* Sidebar */}
        <div className="fixed left-0 top-16 w-72 h-[calc(100vh-4rem)] bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center mb-6">
              <TbDatabase className="w-6 h-6 text-blue-600 mr-2" />
              <span className="font-bold text-lg">Satya Docs</span>
            </div>
            
            <nav className="space-y-1">
              {docSections.map((section) => (
                <div key={section.id}>
                  <button
                    onClick={() => {
                      if (section.subsections) {
                        toggleSection(section.id)
                      } else {
                        setActiveSection(section.id)
                      }
                    }}
                    className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                      activeSection === section.id 
                        ? 'bg-blue-100 text-blue-700 font-medium' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {section.icon}
                    <span className="ml-2 flex-1 text-left">{section.title}</span>
                    {section.subsections && (
                      expandedSections.includes(section.id) 
                        ? <HiChevronDown className="w-4 h-4" />
                        : <HiChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  
                  {section.subsections && expandedSections.includes(section.id) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {section.subsections.map((subsection) => (
                        <button
                          key={subsection.id}
                          onClick={() => setActiveSection(subsection.id)}
                          className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                            activeSection === subsection.id 
                              ? 'bg-blue-100 text-blue-700 font-medium' 
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {subsection.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>
        
        {/* Main content */}
        <div className="ml-72 flex-1">
          <div className="max-w-4xl mx-auto px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {getActiveTitle()}
              </h1>
              {activeSection === 'introduction' && (
                <p className="text-xl text-gray-600">
                  Secure AI models and datasets with TEE verification, encrypted storage, and blockchain transparency.
                </p>
              )}
            </div>
            
            <div className="prose prose-lg max-w-none">
              {getActiveContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Content Components
function IntroductionContent() {
  return (
    <div className="space-y-8">
      {/* Hero Video/Image Placeholder */}
      <div className="bg-black rounded-2xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
          <TbShield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Secure AI Marketplace</h2>
        <p className="text-gray-300">Built on SUI blockchain with enterprise-grade security</p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-3 text-gray-900">What is Satya?</h3>
          <p className="text-gray-700 leading-relaxed">
            Satya is the ultimate platform for secure AI model trading and deployment on the SUI blockchain. 
            We've built every trading and data feature you need to make smarter, more profitable trades right 
            where you need them. No switching tabs. No guesswork. Just actionable information and seamless execution.
          </p>
        </div>

        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <h4 className="font-semibold text-green-800 mb-2">🔐 Trade Securely, Anytime</h4>
          <p className="text-green-700 text-sm">
            Satya is fully secure platform - trade seamlessly from:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-green-700">
            <li>• Web browser at <a href="https://satya.app" className="underline">satya.app</a></li>
            <li>• iOS and Android mobile apps</li>
            <li>• Telegram bot interface</li>
            <li>• Any device with internet access</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function QuickStartContent() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4">Get Started in 3 Steps</h3>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h4 className="font-semibold text-blue-900">Connect Your Wallet</h4>
              <p className="text-blue-700 text-sm">Connect your SUI wallet to start trading AI models securely.</p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h4 className="font-semibold text-green-900">Browse or Upload</h4>
              <p className="text-green-700 text-sm">Browse verified AI models or upload your own for TEE verification.</p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-4 bg-purple-50 rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <h4 className="font-semibold text-purple-900">Trade with Confidence</h4>
              <p className="text-purple-700 text-sm">All models are TEE-verified and encrypted for maximum security.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function WalletSetupContent() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4">Supported Wallets</h3>
        <p className="text-gray-700 mb-4">
          Satya supports all major SUI ecosystem wallets for secure transactions.
        </p>
        
        <div className="space-y-3">
          <div className="flex items-center p-3 border rounded-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <TbKey className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium">SUI Wallet</div>
              <div className="text-sm text-gray-500">Official SUI ecosystem wallet</div>
            </div>
          </div>
          
          <div className="flex items-center p-3 border rounded-lg">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <TbKey className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="font-medium">Suiet Wallet</div>
              <div className="text-sm text-gray-500">Popular SUI wallet extension</div>
            </div>
          </div>

          <div className="flex items-center p-3 border rounded-lg">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <TbKey className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-medium">Ethos Wallet</div>
              <div className="text-sm text-gray-500">User-friendly SUI wallet</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FirstUploadContent() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4">Upload Your First AI Model</h3>
        
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
          <p className="text-amber-700">
            <strong>Prerequisites:</strong> Ensure your model is in a supported format (.pkl, .pt, .pth, .h5, .onnx, .pb, .tflite, .json)
          </p>
        </div>

        <ol className="space-y-4">
          <li className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
            <div>
              <strong>Navigate to Upload:</strong> Click the "Upload" button in the navigation or visit /upload
            </div>
          </li>
          
          <li className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
            <div>
              <strong>Fill Model Details:</strong> Provide title, description, category, and tags
            </div>
          </li>

          <li className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
            <div>
              <strong>Upload Files:</strong> Select your model file and optional dataset
            </div>
          </li>

          <li className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
            <div>
              <strong>Set Pricing:</strong> Configure pricing and access policies
            </div>
          </li>

          <li className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
            <div>
              <strong>Submit for Verification:</strong> Your model will undergo TEE verification
            </div>
          </li>
        </ol>
      </div>
    </div>
  )
}

function ArchitectureContent() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4">System Architecture</h3>
        <p className="text-gray-700 mb-6">
          Satya is built on a robust, decentralized architecture that ensures security, scalability, and transparency.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <TbDatabase className="w-6 h-6 text-blue-600 mr-2" />
              <h4 className="font-semibold">Storage Layer</h4>
            </div>
            <p className="text-sm text-gray-600">Walrus decentralized storage for model files and datasets with built-in redundancy.</p>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <TbShield className="w-6 h-6 text-green-600 mr-2" />
              <h4 className="font-semibold">Security Layer</h4>
            </div>
            <p className="text-sm text-gray-600">SEAL homomorphic encryption and TEE verification for secure computation.</p>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <TbNetwork className="w-6 h-6 text-purple-600 mr-2" />
              <h4 className="font-semibold">Blockchain Layer</h4>
            </div>
            <p className="text-sm text-gray-600">SUI blockchain for smart contracts, payments, and immutable records.</p>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <TbCloudCheck className="w-6 h-6 text-orange-600 mr-2" />
              <h4 className="font-semibold">Application Layer</h4>
            </div>
            <p className="text-sm text-gray-600">Next.js frontend with TypeScript and responsive design for all devices.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SecurityContent() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4">Security Features</h3>
        
        <div className="space-y-4">
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <h4 className="font-semibold text-green-800 mb-2">TEE Verification</h4>
            <p className="text-green-700 text-sm">
              Hardware-based Trusted Execution Environment verification ensures model integrity and prevents tampering.
            </p>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <h4 className="font-semibold text-blue-800 mb-2">SEAL Encryption</h4>
            <p className="text-blue-700 text-sm">
              Homomorphic encryption allows computation on encrypted data without exposing sensitive information.
            </p>
          </div>

          <div className="bg-purple-50 border-l-4 border-purple-400 p-4">
            <h4 className="font-semibold text-purple-800 mb-2">Blockchain Transparency</h4>
            <p className="text-purple-700 text-sm">
              All transactions and verifications are recorded on SUI blockchain for complete transparency.
            </p>
          </div>

          <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
            <h4 className="font-semibold text-orange-800 mb-2">Decentralized Storage</h4>
            <p className="text-orange-700 text-sm">
              Walrus network provides redundant, fault-tolerant storage across multiple nodes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function TechnologyStackContent() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4">Technology Stack</h3>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-3">Frontend</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="font-medium text-sm">Next.js 15</div>
                <div className="text-xs text-gray-500">React Framework</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="font-medium text-sm">TypeScript</div>
                <div className="text-xs text-gray-500">Type Safety</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="font-medium text-sm">Tailwind CSS</div>
                <div className="text-xs text-gray-500">Styling</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Blockchain & Crypto</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="font-medium text-sm">SUI Blockchain</div>
                <div className="text-xs text-gray-500">Smart Contracts</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="font-medium text-sm">SEAL</div>
                <div className="text-xs text-gray-500">Encryption</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="font-medium text-sm">Walrus</div>
                <div className="text-xs text-gray-500">Storage</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">AI & ML</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="font-medium text-sm">ONNX</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="font-medium text-sm">PyTorch</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="font-medium text-sm">TensorFlow</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="font-medium text-sm">HuggingFace</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Marketplace content components
function BrowsingModelsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4">Finding the Right AI Model</h3>
        
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <p className="text-blue-700">
            <strong>Pro Tip:</strong> Use filters and search to quickly find models that match your specific requirements.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Search and Filters</h4>
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>Search Bar:</strong> Search by model name, description, or tags</li>
              <li>• <strong>Category Filter:</strong> Machine Learning, Computer Vision, NLP, Audio, etc.</li>
              <li>• <strong>Verification Filter:</strong> Show only TEE-verified models</li>
              <li>• <strong>Price Range:</strong> Filter by price to match your budget</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Model Information</h4>
            <p className="text-gray-700 mb-3">Each model card displays:</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <strong>Basic Info:</strong> Title, description, category, tags
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <strong>Verification:</strong> TEE verification status and quality score
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <strong>Pricing:</strong> Cost in SUI tokens and access duration
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <strong>Stats:</strong> Upload date, downloads, creator info
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PurchasingContent() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4">How to Purchase AI Models</h3>

        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
          <p className="text-amber-700">
            <strong>Requirements:</strong> Connected SUI wallet with sufficient balance for the model price + gas fees.
          </p>
        </div>

        <ol className="space-y-4">
          <li className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
            <div>
              <strong>Select Model:</strong> Browse and click on the model you want to purchase
            </div>
          </li>
          
          <li className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
            <div>
              <strong>Review Details:</strong> Check model information, price, and access duration
            </div>
          </li>

          <li className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
            <div>
              <strong>Connect Wallet:</strong> Ensure your SUI wallet is connected
            </div>
          </li>

          <li className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
            <div>
              <strong>Verify Purchase:</strong> Click "Verify Model" to initiate TEE verification
            </div>
          </li>

          <li className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
            <div>
              <strong>Complete Transaction:</strong> Approve the transaction in your wallet
            </div>
          </li>
        </ol>

        <div className="bg-green-50 border-l-4 border-green-400 p-4 mt-6">
          <h4 className="font-semibold text-green-800 mb-2">After Purchase</h4>
          <ul className="text-green-700 text-sm space-y-1">
            <li>• Model access is granted immediately upon transaction confirmation</li>
            <li>• Download links and API access are available in your dashboard</li>
            <li>• Access duration begins from purchase time</li>
            <li>• Support is available if you encounter any issues</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function VerificationContent() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4">TEE (Trusted Execution Environment) Verification</h3>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-3">What is TEE Verification?</h4>
            <p className="text-gray-700 mb-4">
              TEE verification uses hardware-based security to ensure that AI models run exactly as intended, 
              without tampering or modification. This provides mathematical proof of model integrity.
            </p>
            
            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <h5 className="font-semibold text-green-800 mb-2">Benefits of TEE Verification:</h5>
              <ul className="text-green-700 text-sm space-y-1">
                <li>• <strong>Integrity:</strong> Guarantees the model hasn't been tampered with</li>
                <li>• <strong>Authenticity:</strong> Proves the model comes from the claimed creator</li>
                <li>• <strong>Performance:</strong> Validates advertised accuracy and performance metrics</li>
                <li>• <strong>Security:</strong> Ensures no malicious code is embedded in the model</li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Verification Process</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div className="text-blue-700">Model is uploaded to secure enclave environment</div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div className="text-purple-700">Hardware attestation generates cryptographic proof</div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div className="text-green-700">Verification results are recorded on SUI blockchain</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Verification Statuses</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-3 p-3 border rounded">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <strong className="text-green-700">Verified</strong> - Model passed all TEE checks
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div>
                  <strong className="text-yellow-700">Pending</strong> - Verification in progress
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <div>
                  <strong className="text-gray-700">Unverified</strong> - No verification attempted
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ModelPreparationContent() {
  return <div className="text-gray-600">Model Preparation content coming soon...</div>
}

function UploadProcessContent() {
  return <div className="text-gray-600">Upload Process content coming soon...</div>
}

function ListingSetupContent() {
  return <div className="text-gray-600">Listing Setup content coming soon...</div>
}

function SealWorkContent() {
  return <div className="text-gray-600">SEAL Works content coming soon...</div>
}

function PolicyTypesContent() {
  return <div className="text-gray-600">Policy Types content coming soon...</div>
}

function KeyManagementContent() {
  return <div className="text-gray-600">Key Management content coming soon...</div>
}

function RestApiContent() {
  return <div className="text-gray-600">REST API content coming soon...</div>
}

function SmartContractsContent() {
  return <div className="text-gray-600">Smart Contracts content coming soon...</div>
}

function SdkUsageContent() {
  return <div className="text-gray-600">SDK Usage content coming soon...</div>
}