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
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4">Preparing Your AI Model for Upload</h3>
        
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <p className="text-blue-700">
            <strong>Important:</strong> Proper model preparation ensures successful upload and verification on Satya.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="font-semibold mb-3">Supported File Formats</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h5 className="font-medium mb-2">PyTorch Models</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• .pt (recommended)</li>
                  <li>• .pth</li>
                  <li>• .pkl (pickle files)</li>
                </ul>
              </div>
              
              <div className="border rounded-lg p-4">
                <h5 className="font-medium mb-2">TensorFlow Models</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• .h5 (HDF5 format)</li>
                  <li>• .pb (protobuf)</li>
                  <li>• .tflite (mobile)</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h5 className="font-medium mb-2">Standard Formats</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• .onnx (recommended)</li>
                  <li>• .json (metadata)</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h5 className="font-medium mb-2">Framework Support</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Hugging Face</li>
                  <li>• Scikit-learn</li>
                  <li>• XGBoost</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Pre-Upload Checklist</h4>
            <div className="space-y-2">
              {[
                "Model file is in supported format (.pt, .onnx, .h5, etc.)",
                "File size is reasonable (recommend < 500MB for faster upload)",
                "Model has been tested and works as expected",
                "You have prepared clear documentation/description",
                "Optional: Dataset file is ready (if sharing training data)",
                "Optional: Sample input/output files for demonstration"
              ].map((item, index) => (
                <div key={index} className="flex items-start space-x-3 p-2 bg-gray-50 rounded">
                  <input type="checkbox" className="mt-1" disabled />
                  <span className="text-gray-700 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Best Practices</h4>
            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <ul className="text-green-700 space-y-2">
                <li>• <strong>Documentation:</strong> Provide clear, detailed descriptions</li>
                <li>• <strong>Tags:</strong> Use relevant tags for better discoverability</li>
                <li>• <strong>Testing:</strong> Verify model works before uploading</li>
                <li>• <strong>Size:</strong> Compress large models to reduce upload time</li>
                <li>• <strong>Metadata:</strong> Include input/output specifications</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function UploadProcessContent() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4">Step-by-Step Upload Process</h3>
        
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
          <p className="text-amber-700">
            <strong>Note:</strong> The upload process involves multiple steps including file upload, encryption, and blockchain recording.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="font-semibold mb-3">Upload Wizard Steps</h4>
            
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</div>
                  <h5 className="font-medium">Basic Information</h5>
                </div>
                <ul className="text-sm text-gray-600 space-y-1 ml-11">
                  <li>• Model title and description</li>
                  <li>• Category selection (Computer Vision, NLP, etc.)</li>
                  <li>• Tags for better discoverability</li>
                  <li>• Creator information</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</div>
                  <h5 className="font-medium">File Upload</h5>
                </div>
                <ul className="text-sm text-gray-600 space-y-1 ml-11">
                  <li>• Upload model file (required)</li>
                  <li>• Upload dataset file (optional)</li>
                  <li>• Upload sample files (optional)</li>
                  <li>• File validation and size checking</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</div>
                  <h5 className="font-medium">Pricing & Access</h5>
                </div>
                <ul className="text-sm text-gray-600 space-y-1 ml-11">
                  <li>• Set price in SUI tokens</li>
                  <li>• Configure access duration</li>
                  <li>• Choose encryption policy</li>
                  <li>• Set maximum downloads (optional)</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">4</div>
                  <h5 className="font-medium">Review & Submit</h5>
                </div>
                <ul className="text-sm text-gray-600 space-y-1 ml-11">
                  <li>• Review all information</li>
                  <li>• Confirm pricing and terms</li>
                  <li>• Initiate blockchain transaction</li>
                  <li>• Wait for confirmation</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Upload Progress Phases</h4>
            <p className="text-gray-700 mb-4">After clicking submit, your upload goes through these phases:</p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded">
                <TbUpload className="w-5 h-5 text-blue-600" />
                <div className="text-blue-700"><strong>Validation:</strong> Files are checked and validated</div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded">
                <TbShield className="w-5 h-5 text-purple-600" />
                <div className="text-purple-700"><strong>Encryption:</strong> SEAL encryption is applied</div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded">
                <TbDatabase className="w-5 h-5 text-orange-600" />
                <div className="text-orange-700"><strong>Storage:</strong> Files are stored on Walrus network</div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded">
                <TbNetwork className="w-5 h-5 text-green-600" />
                <div className="text-green-700"><strong>Listing:</strong> Transaction is recorded on SUI blockchain</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ListingSetupContent() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4">Setting Up Your Model Listing</h3>
        
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <p className="text-green-700">
            <strong>Goal:</strong> Configure your model listing to attract buyers and maximize your earnings.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="font-semibold mb-3">Pricing Strategy</h4>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h5 className="font-medium mb-2 text-blue-600">Fixed Pricing</h5>
                <p className="text-sm text-gray-600 mb-2">Set a one-time purchase price</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Simple for buyers to understand</li>
                  <li>• Good for specialized models</li>
                  <li>• Price in SUI tokens</li>
                </ul>
              </div>
              
              <div className="border rounded-lg p-4">
                <h5 className="font-medium mb-2 text-purple-600">Access Duration</h5>
                <p className="text-sm text-gray-600 mb-2">Control how long buyers have access</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• 30 days (default)</li>
                  <li>• 90 days (recommended)</li>
                  <li>• Custom duration</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Access Policies</h4>
            
            <div className="space-y-3">
              <div className="border rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <TbCoin className="w-5 h-5 text-green-600 mr-2" />
                  <h5 className="font-medium">Payment Gated (Recommended)</h5>
                </div>
                <p className="text-sm text-gray-600">Buyers pay to access your model immediately after purchase.</p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <TbKey className="w-5 h-5 text-blue-600 mr-2" />
                  <h5 className="font-medium">Time Locked</h5>
                </div>
                <p className="text-sm text-gray-600">Access is granted after a specific time period.</p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <TbShield className="w-5 h-5 text-purple-600 mr-2" />
                  <h5 className="font-medium">Allowlist</h5>
                </div>
                <p className="text-sm text-gray-600">Restrict access to specific wallet addresses.</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Optimization Tips</h4>
            
            <div className="bg-gray-50 border rounded-lg p-4">
              <h5 className="font-medium text-black mb-3">Strategies to Increase Your Model's Visibility and Sales:</h5>
              <ul className="space-y-3 text-gray-700">
                <li className="border-l-4 border-blue-500 pl-4">
                  <div>
                    <strong>Clear and Comprehensive Description:</strong> Write detailed explanations of what your model does, its specific use cases, performance metrics, and technical specifications. Include information about training data, model architecture, accuracy rates, and recommended applications. Buyers need to understand exactly what they're purchasing and how it can solve their problems.
                  </div>
                </li>
                <li className="border-l-4 border-blue-500 pl-4">
                  <div>
                    <strong>Strategic Tag Selection:</strong> Use popular and searchable tags that accurately describe your model's functionality. Examples include computer-vision, nlp, classification, object-detection, sentiment-analysis, recommendation-system. Research what tags are commonly used in your category and include both broad category tags and specific technique tags.
                  </div>
                </li>
                <li className="border-l-4 border-blue-500 pl-4">
                  <div>
                    <strong>Quality Score Optimization:</strong> Higher quality scores improve your model's ranking in search results. Quality is determined by factors including model performance metrics, completeness of documentation, number of downloads, user ratings, and verification status. Provide thorough documentation and ensure your model performs well on standard benchmarks.
                  </div>
                </li>
                <li className="border-l-4 border-blue-500 pl-4">
                  <div>
                    <strong>TEE Verification Benefits:</strong> Verified models through Trusted Execution Environment are given priority placement and carry trust badges that significantly increase buyer confidence. The verification process validates that your model performs as advertised and hasn't been tampered with, which is crucial for enterprise buyers and safety-critical applications.
                  </div>
                </li>
                <li className="border-l-4 border-blue-500 pl-4">
                  <div>
                    <strong>Competitive Pricing Strategy:</strong> Research similar models in your category to understand market pricing. Consider factors like model complexity, uniqueness, performance metrics, and target audience. Price competitively while ensuring fair compensation for your work. You can adjust pricing based on demand and performance over time.
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">After Listing</h4>
            <p className="text-gray-700 mb-3">Once your model is listed:</p>
            
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <span className="text-gray-700"><strong>Monitor Performance:</strong> Use the Dashboard to track your model's performance metrics including view counts, download rates, user ratings, and revenue generation. Regular monitoring helps you understand market demand and optimize your listings accordingly.</span>
              </div>
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <span className="text-gray-700"><strong>Track Financial Metrics:</strong> Monitor downloads, earnings, and transaction history to understand your revenue streams. The platform provides detailed analytics on buyer demographics, peak usage times, and payment patterns to help you make informed business decisions.</span>
              </div>
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <span className="text-gray-700"><strong>Update and Maintain:</strong> Regularly review and update your model pricing, descriptions, and tags based on market feedback and performance data. Keep your model documentation current and respond to changing market conditions to maintain competitive positioning.</span>
              </div>
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <span className="text-gray-700"><strong>Customer Communication:</strong> Engage with potential and existing buyers through the platform's messaging system. Respond promptly to inquiries, provide technical support, and gather feedback to improve your models and build a reputation as a reliable creator.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SealWorkContent() {
  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        SEAL encryption protects your models through homomorphic encryption, allowing computations on encrypted data without revealing the underlying model.
      </p>
      
      <div className="bg-blue-50 p-6 rounded-lg">
        <h4 className="font-semibold mb-3 text-blue-900">Encryption Process</h4>
        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li>Model is packaged and prepared for encryption</li>
          <li>SEAL keys are generated using threshold cryptography</li>
          <li>Model data is encrypted using homomorphic encryption</li>
          <li>Encrypted model is stored on Walrus decentralized storage</li>
          <li>Access policies are defined and enforced on-chain</li>
        </ol>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="font-semibold mb-3">Code Example: Model Encryption</h4>
        <pre className="text-sm text-gray-700 overflow-x-auto">
{`// Encrypt model for secure storage
const encryptedModel = await sealService.encryptModel({
  modelData: modelBuffer,
  accessPolicy: {
    duration: 2592000000, // 30 days
    allowedUsers: ['0x...'], // specific addresses
  },
  keyServers: [
    'https://seal-key-server-testnet-1.mystenlabs.com',
    'https://seal-key-server-testnet-2.mystenlabs.com'
  ]
})

console.log('Model encrypted:', encryptedModel.blobId)`}
        </pre>
      </div>
    </div>
  )
}

function PolicyTypesContent() {
  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        SEAL supports various access policies to control who can decrypt and use your encrypted models.
      </p>
      
      <div className="space-y-6">
        <div className="border p-6 rounded-lg">
          <h4 className="font-semibold mb-3 text-black">Time-Based Access Control</h4>
          <p className="text-gray-600 mb-4">Configure how long users maintain access to your encrypted models after purchase. This policy type allows you to set specific durations ranging from hours to years, providing flexibility for different use cases such as temporary access for evaluation or long-term access for production deployment.</p>
          <div className="bg-gray-50 p-4 rounded text-sm border-l-4 border-blue-500">
            <strong className="text-black">Configuration Example:</strong>
            <code className="block mt-2 text-gray-700">
              duration: 2592000000 // 30 days in milliseconds
            </code>
            <p className="mt-2 text-gray-600">Common durations: 24 hours (86400000ms), 7 days (604800000ms), 30 days (2592000000ms), 1 year (31536000000ms)</p>
          </div>
        </div>
        
        <div className="border p-6 rounded-lg">
          <h4 className="font-semibold mb-3 text-black">Address-Based Access Control</h4>
          <p className="text-gray-600 mb-4">Restrict model access to specific wallet addresses, enabling allowlist functionality for private distributions or enterprise deployments. This approach is useful for controlled releases, beta testing with selected users, or compliance requirements that mandate access restrictions.</p>
          <div className="bg-gray-50 p-4 rounded text-sm border-l-4 border-blue-500">
            <strong className="text-black">Configuration Example:</strong>
            <code className="block mt-2 text-gray-700">
              allowedUsers: ['0xabc123...', '0xdef456...', '0x789ghi...']
            </code>
            <p className="mt-2 text-gray-600">Supports multiple addresses, wildcards for address patterns, and can be combined with other policy types</p>
          </div>
        </div>
        
        <div className="border p-6 rounded-lg">
          <h4 className="font-semibold mb-3 text-black">Payment-Based Access Control</h4>
          <p className="text-gray-600 mb-4">Require specific payment amounts for model access, enabling monetization strategies beyond simple one-time purchases. This policy can implement tiered pricing, subscription models, or pay-per-use scenarios based on SUI token payments.</p>
          <div className="bg-gray-50 p-4 rounded text-sm border-l-4 border-blue-500">
            <strong className="text-black">Configuration Example:</strong>
            <code className="block mt-2 text-gray-700">
              price: 1000000000, // 1 SUI in MIST (smallest unit)
            </code>
            <p className="mt-2 text-gray-600">MIST conversion: 1 SUI = 1,000,000,000 MIST. Supports dynamic pricing and recurring payments.</p>
          </div>
        </div>
        
        <div className="border p-6 rounded-lg">
          <h4 className="font-semibold mb-3 text-black">Usage-Based Access Control</h4>
          <p className="text-gray-600 mb-4">Limit the number of model interactions or inference calls that users can perform, enabling fine-grained usage control and supporting pay-per-use business models. This policy tracks usage automatically and enforces limits transparently.</p>
          <div className="bg-gray-50 p-4 rounded text-sm border-l-4 border-blue-500">
            <strong className="text-black">Configuration Example:</strong>
            <code className="block mt-2 text-gray-700">
              maxUsage: 100 // 100 inference calls maximum
            </code>
            <p className="mt-2 text-gray-600">Usage tracking includes API calls, model downloads, and compute operations. Can be reset or extended through additional payments.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function KeyManagementContent() {
  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        SEAL uses threshold cryptography with multiple key servers to ensure security and availability.
      </p>
      
      <div className="bg-gray-50 border-l-4 border-blue-500 p-6">
        <h4 className="font-semibold mb-3 text-black">Key Server Configuration Details</h4>
        <div className="space-y-3 text-gray-700">
          <div><strong>Threshold Requirement:</strong> 2 out of 2 key servers must participate in any decryption operation to ensure security through distribution</div>
          <div><strong>Primary Server:</strong> seal-key-server-testnet-1.mystenlabs.com (handles primary key operations and coordination)</div>
          <div><strong>Secondary Server:</strong> seal-key-server-testnet-2.mystenlabs.com (provides redundancy and threshold completion)</div>
          <div><strong>Session Time-to-Live:</strong> 30 minutes maximum for any active decryption session to limit exposure window</div>
          <div><strong>Health Check Interval:</strong> 5 minutes between server availability checks to ensure system reliability</div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold">Key Lifecycle Management</h4>
        
        <div className="space-y-6">
          <div className="border p-6 rounded-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                <span className="text-black font-semibold">1</span>
              </div>
              <h5 className="font-medium text-black">Distributed Key Generation</h5>
            </div>
            <p className="text-gray-600">The system generates cryptographic keys using a distributed protocol where no single server ever holds the complete key. This process involves mathematical operations that create key shares across multiple servers simultaneously, ensuring that the full key never exists in one location. The generation process uses proven cryptographic algorithms including Shamir's Secret Sharing and distributed key generation protocols.</p>
          </div>
          
          <div className="border p-6 rounded-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                <span className="text-black font-semibold">2</span>
              </div>
              <h5 className="font-medium text-black">Secure Key Share Distribution</h5>
            </div>
            <p className="text-gray-600">Each key server maintains only partial key shares that are mathematically useless in isolation. These shares are generated so that any individual share reveals no information about the complete key or the encrypted data. The shares are stored in secure enclaves and protected by additional encryption layers. Regular key rotation ensures long-term security even if shares are compromised.</p>
          </div>
          
          <div className="border p-6 rounded-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                <span className="text-black font-semibold">3</span>
              </div>
              <h5 className="font-medium text-black">Threshold Decryption Operations</h5>
            </div>
            <p className="text-gray-600">Decryption requires coordinated participation from multiple key servers, implementing a threshold scheme where a minimum number of servers must cooperate to decrypt any data. This ensures that no single point of failure can compromise the system. The decryption process involves secure multi-party computation protocols that maintain privacy while enabling the necessary mathematical operations to recover the original data.</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="font-semibold mb-3">Key Server Health Monitoring</h4>
        <pre className="text-sm text-gray-700 overflow-x-auto">
{`// Health check configuration
const sealConfig = {
  healthCheckIntervalMs: 300000, // 5 minutes
  maxRetries: 3,
  sessionTtlMinutes: 30,
  cacheSize: 100
}

// Check server availability
const healthStatus = await sealService.checkKeyServerHealth()
console.log('Key servers status:', healthStatus)`}
        </pre>
      </div>
    </div>
  )
}

function RestApiContent() {
  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        Satya provides RESTful APIs for integrating with external systems and building custom applications.
      </p>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-6">
        <h4 className="font-semibold mb-3 text-blue-800">Base URL</h4>
        <p className="text-blue-700"><code>https://api.satya.ai/v1</code></p>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="font-semibold mb-3">Authentication</h4>
          <p className="text-gray-600 mb-4">All API requests require authentication using SUI wallet signatures.</p>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-sm text-gray-700 overflow-x-auto">
{`// Example authentication header
Authorization: Bearer <wallet_signature>
Content-Type: application/json`}
            </pre>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Marketplace Endpoints</h4>
          
          <div className="space-y-6">
            <div className="border rounded-lg p-6">
              <div className="flex items-center mb-4 border-b border-gray-200 pb-2">
                <span className="px-3 py-1 bg-gray-200 text-black text-sm font-medium rounded mr-3">GET</span>
                <code className="text-lg font-mono">/models</code>
              </div>
              <p className="text-gray-600 mb-4">Retrieve all available models in the marketplace with optional filtering and pagination. This endpoint supports comprehensive search functionality including category filtering, text search, price ranges, and sorting options. Results are returned in a standardized format with model metadata, pricing information, and availability status.</p>
              <div className="bg-gray-50 p-4 rounded border-l-4 border-blue-500">
                <strong className="text-black">Query Parameters:</strong>
                <ul className="mt-2 space-y-2 text-gray-700">
                  <li><strong>category</strong> (optional) - Filter by model category (computer-vision, nlp, audio, etc.)</li>
                  <li><strong>limit</strong> (optional) - Maximum number of results to return (default: 20, max: 100)</li>
                  <li><strong>offset</strong> (optional) - Pagination offset for retrieving additional results</li>
                  <li><strong>search</strong> (optional) - Full-text search across model titles and descriptions</li>
                  <li><strong>sort</strong> (optional) - Sort order: newest, oldest, price-low, price-high, popular</li>
                  <li><strong>verified</strong> (optional) - Filter for TEE-verified models only (true/false)</li>
                </ul>
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <div className="flex items-center mb-4 border-b border-gray-200 pb-2">
                <span className="px-3 py-1 bg-gray-200 text-black text-sm font-medium rounded mr-3">GET</span>
                <code className="text-lg font-mono">/models/{id}</code>
              </div>
              <p className="text-gray-600 mb-4">Retrieve comprehensive details for a specific model including metadata, performance metrics, creator information, pricing details, download statistics, user ratings, and verification status. This endpoint provides all information necessary for users to make informed purchase decisions.</p>
            </div>

            <div className="border rounded-lg p-6">
              <div className="flex items-center mb-4 border-b border-gray-200 pb-2">
                <span className="px-3 py-1 bg-gray-200 text-black text-sm font-medium rounded mr-3">POST</span>
                <code className="text-lg font-mono">/models</code>
              </div>
              <p className="text-gray-600 mb-4">Upload and list a new AI model in the marketplace. This endpoint handles the complete model listing process including file upload to Walrus storage, SEAL encryption, metadata validation, and blockchain registration. The process is atomic and will rollback if any step fails.</p>
              <div className="bg-gray-50 p-4 rounded border-l-4 border-blue-500">
                <strong className="text-black">Request Body Schema:</strong>
                <pre className="mt-2 text-gray-700 text-sm">
{`{
  "title": "My AI Model",
  "description": "Detailed model description with use cases",
  "category": "computer-vision",
  "price": 1000000000,
  "accessDuration": 2592000000,
  "tags": ["classification", "images", "pytorch"],
  "modelFile": "base64_encoded_model_data",
  "datasetFile": "base64_encoded_dataset_data", // optional
  "sampleFiles": ["base64_encoded_sample_data"], // optional
  "accessPolicy": {
    "type": "payment-gated",
    "restrictions": ["time-limited"]
  }
}`}
                </pre>
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <div className="flex items-center mb-4 border-b border-gray-200 pb-2">
                <span className="px-3 py-1 bg-gray-200 text-black text-sm font-medium rounded mr-3">POST</span>
                <code className="text-lg font-mono">/models/{id}/purchase</code>
              </div>
              <p className="text-gray-600 mb-4">Purchase access to a specific model by providing payment in SUI tokens. This endpoint validates payment amounts, processes the transaction on the SUI blockchain, distributes fees between the platform and creator, and issues an access ticket for model decryption. The transaction is atomic and reversible on failure.</p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">TEE Verification Endpoints</h4>
          
          <div className="space-y-6">
            <div className="border rounded-lg p-6">
              <div className="flex items-center mb-4 border-b border-gray-200 pb-2">
                <span className="px-3 py-1 bg-gray-200 text-black text-sm font-medium rounded mr-3">POST</span>
                <code className="text-lg font-mono">/tee/verify</code>
              </div>
              <p className="text-gray-600 mb-4">Initiate Trusted Execution Environment verification for an AI model to validate its integrity, authenticity, and performance claims. This process runs the model within a secure enclave to generate cryptographic proofs that can be verified by potential buyers. Verification typically takes 5-30 minutes depending on model complexity.</p>
              <div className="bg-gray-50 p-4 rounded border-l-4 border-blue-500">
                <strong className="text-black">Request Body Schema:</strong>
                <pre className="mt-2 text-gray-700 text-sm">
{`{
  "modelId": "0xabc123...",
  "verificationLevel": "standard", // standard, thorough, custom
  "expectedHash": "sha256_hash_of_model",
  "testDataset": "optional_test_data_blob_id",
  "performanceThresholds": {
    "accuracy": 0.95,
    "latency": 100 // ms
  }
}`}
                </pre>
                <p className="mt-2 text-gray-600">Verification levels: standard (basic integrity), thorough (performance validation), custom (user-defined tests)</p>
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <div className="flex items-center mb-4 border-b border-gray-200 pb-2">
                <span className="px-3 py-1 bg-gray-200 text-black text-sm font-medium rounded mr-3">GET</span>
                <code className="text-lg font-mono">/tee/verify/{verification_id}</code>
              </div>
              <p className="text-gray-600 mb-4">Check the status and results of an ongoing or completed TEE verification process. Returns detailed information about verification progress, any errors encountered, and final results including performance metrics, integrity proofs, and verification certificates that can be used for marketplace trust indicators.</p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Error Handling and Response Codes</h4>
          <p className="text-gray-600 mb-4">All API endpoints return standardized error responses with consistent formatting. Error codes follow HTTP conventions and include additional context for debugging and user feedback.</p>
          
          <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
            <strong className="text-black">Standard Error Response Format:</strong>
            <pre className="mt-2 text-gray-700 text-sm">
{`{
  "error": "INVALID_REQUEST",
  "message": "Model not found or access denied",
  "code": 404,
  "timestamp": "2024-11-22T10:30:00Z",
  "details": {
    "field": "modelId",
    "reason": "Invalid format or non-existent model"
  }
}`}
            </pre>
            <div className="mt-4 space-y-2 text-gray-600">
              <p><strong>Common Error Codes:</strong></p>
              <ul className="space-y-1 ml-4">
                <li>400 - Bad Request (invalid parameters or malformed data)</li>
                <li>401 - Unauthorized (missing or invalid authentication)</li>
                <li>403 - Forbidden (insufficient permissions for operation)</li>
                <li>404 - Not Found (resource does not exist)</li>
                <li>409 - Conflict (operation conflicts with current state)</li>
                <li>429 - Too Many Requests (rate limiting active)</li>
                <li>500 - Internal Server Error (unexpected server issue)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SmartContractsContent() {
  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        Satya's smart contracts are deployed on the SUI blockchain and handle marketplace operations, payments, and access control.
      </p>
      
      <div className="bg-gray-50 border-l-4 border-blue-500 p-6">
        <h4 className="font-semibold mb-3 text-black">Smart Contract Addresses (SUI Testnet)</h4>
        <div className="space-y-3 text-gray-700">
          <div><strong>Marketplace Package:</strong> <code className="bg-white px-2 py-1 rounded text-sm">0x2643c7f8f6ea672a2780c8259be490bfc57cfa2c3895cbfd6109bde5e65a0bc7</code></div>
          <div><strong>Registry Object:</strong> <code className="bg-white px-2 py-1 rounded text-sm">0xc6c008c9df4017f000a28b37c4949a931b566258d52eaa3ae4b5be17a6e1bf06</code></div>
          <div><strong>SEAL Package:</strong> <code className="bg-white px-2 py-1 rounded text-sm">0x98f8a6ce208764219b23dc51db45bf11516ec0998810e98f3a94548d788ff679</code></div>
          <p className="mt-4 text-sm text-gray-600">These addresses are for the SUI testnet environment. Mainnet addresses will be different when the platform launches on the main network.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="font-semibold mb-3">Core Contract Functions</h4>
          
          <div className="space-y-6">
            <div className="border rounded-lg p-6">
              <h5 className="font-medium mb-3 text-black">list_model Function</h5>
              <p className="text-gray-600 mb-4">Creates a new marketplace listing for an AI model. This function registers the model in the global registry, sets pricing and access parameters, and makes it available for purchase by other users. The function validates all input parameters and ensures the model data is properly stored before creating the listing.</p>
              <div className="bg-gray-50 p-4 rounded border-l-4 border-blue-500">
                <strong className="text-black">Function Parameters:</strong>
                <ul className="mt-2 space-y-2 text-gray-700">
                  <li><strong>registry:</strong> &mut Registry - Mutable reference to the marketplace registry</li>
                  <li><strong>title:</strong> String - Human-readable name for the model</li>
                  <li><strong>description:</strong> String - Detailed description of model capabilities and use cases</li>
                  <li><strong>price:</strong> u64 - Price in MIST (1 SUI = 1,000,000,000 MIST)</li>
                  <li><strong>blob_id:</strong> String - Walrus storage identifier for the encrypted model data</li>
                </ul>
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <h5 className="font-medium mb-3 text-black">purchase_model Function</h5>
              <p className="text-gray-600 mb-4">Enables users to purchase access to a listed AI model by providing payment in SUI tokens. The function validates the payment amount, transfers fees to the platform treasury and creator, and issues an access ticket that can be used to decrypt the model. All transactions are atomic and reversible if any step fails.</p>
              <div className="bg-gray-50 p-4 rounded border-l-4 border-blue-500">
                <strong className="text-black">Function Parameters:</strong>
                <ul className="mt-2 space-y-2 text-gray-700">
                  <li><strong>registry:</strong> &mut Registry - Mutable reference to the marketplace registry</li>
                  <li><strong>model_id:</strong> ID - Unique identifier of the model to purchase</li>
                  <li><strong>payment:</strong> Coin&lt;SUI&gt; - SUI coin object containing the payment amount</li>
                  <li><strong>ctx:</strong> &mut TxContext - Transaction context for the current operation</li>
                </ul>
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <h5 className="font-medium mb-3 text-black">verify_model Function</h5>
              <p className="text-gray-600 mb-4">Validates model integrity and authenticity through TEE (Trusted Execution Environment) attestation. This function processes cryptographic proofs that demonstrate the model has not been tampered with and performs as advertised. Verified models receive trust badges and improved marketplace positioning.</p>
              <div className="bg-gray-50 p-4 rounded border-l-4 border-blue-500">
                <strong className="text-black">Function Parameters:</strong>
                <ul className="mt-2 space-y-2 text-gray-700">
                  <li><strong>registry:</strong> &mut Registry - Mutable reference to the marketplace registry</li>
                  <li><strong>model_id:</strong> ID - Unique identifier of the model to verify</li>
                  <li><strong>attestation:</strong> vector&lt;u8&gt; - Cryptographic attestation data from TEE verification</li>
                </ul>
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <h5 className="font-medium mb-3 text-black">get_access_key Function</h5>
              <p className="text-gray-600 mb-4">Retrieves the decryption key for a purchased model using the access ticket and SEAL key coordination. This function coordinates with multiple key servers to reconstruct the decryption key through threshold cryptography, ensuring secure access while maintaining the integrity of the encryption system.</p>
              <div className="bg-gray-50 p-4 rounded border-l-4 border-blue-500">
                <strong className="text-black">Function Parameters:</strong>
                <ul className="mt-2 space-y-2 text-gray-700">
                  <li><strong>access:</strong> &AccessTicket - Reference to the access ticket obtained from purchase</li>
                  <li><strong>seal_key:</strong> vector&lt;u8&gt; - SEAL key shares for threshold decryption process</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Data Structures</h4>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-medium mb-3">AIModel Struct</h5>
              <pre className="text-sm text-gray-700">
{`struct AIModel has key, store {
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
}`}
              </pre>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-medium mb-3">AccessTicket Struct</h5>
              <pre className="text-sm text-gray-700">
{`struct AccessTicket has key, store {
    id: UID,
    model_id: ID,
    buyer: address,
    expires_at: u64,
    access_key: Option<vector<u8>>,
    usage_count: u64,
    max_usage: Option<u64>
}`}
              </pre>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Integration Example</h4>
          <p className="text-gray-600 mb-4">Example of interacting with Satya smart contracts using SUI SDK:</p>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-sm text-gray-700 overflow-x-auto">
{`import { SuiClient } from '@mysten/sui.js/client'
import { TransactionBlock } from '@mysten/sui.js/transactions'

// Purchase a model
const txb = new TransactionBlock()

txb.moveCall({
  target: '${MARKETPLACE_PACKAGE_ID}::marketplace::purchase_model',
  arguments: [
    txb.object(MARKETPLACE_REGISTRY_ID),
    txb.pure(modelId),
    txb.pure(payment)
  ]
})

const result = await suiClient.signAndExecuteTransactionBlock({
  transactionBlock: txb,
  signer: keypair
})`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

function SdkUsageContent() {
  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        Use the Satya JavaScript SDK to integrate AI marketplace functionality into your applications.
      </p>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-6">
        <h4 className="font-semibold mb-3 text-blue-800">Installation</h4>
        <div className="bg-blue-100 p-3 rounded">
          <code className="text-blue-900">npm install @satya/ai-marketplace-sdk</code>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="font-semibold mb-3">Quick Start</h4>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-sm text-gray-700 overflow-x-auto">
{`import { SatyaClient } from '@satya/ai-marketplace-sdk'

// Initialize the client
const satya = new SatyaClient({
  network: 'testnet', // or 'mainnet'
  suiClient: suiClient,
  privateKey: process.env.SUI_PRIVATE_KEY
})

// Connect wallet
await satya.connect(wallet)`}
            </pre>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Core SDK Methods</h4>
          
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h5 className="font-medium mb-2 text-green-600">Marketplace Operations</h5>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <pre className="text-gray-700">
{`// Browse models
const models = await satya.marketplace.getModels({
  category: 'computer-vision',
  limit: 10
})

// Get model details
const model = await satya.marketplace.getModel(modelId)

// Purchase a model
const purchase = await satya.marketplace.purchaseModel({
  modelId: 'model_123',
  paymentAmount: '1000000000' // 1 SUI in MIST
})`}
                </pre>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h5 className="font-medium mb-2 text-blue-600">Model Upload & Management</h5>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <pre className="text-gray-700">
{`// Upload a new model
const upload = await satya.models.upload({
  title: 'My AI Model',
  description: 'Computer vision model for object detection',
  category: 'computer-vision',
  price: '2000000000', // 2 SUI
  accessDuration: 2592000000, // 30 days
  modelFile: modelBuffer,
  tags: ['detection', 'yolo', 'computer-vision']
})

// Update model pricing
await satya.models.updatePrice(modelId, newPrice)`}
                </pre>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h5 className="font-medium mb-2 text-purple-600">TEE Verification</h5>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <pre className="text-gray-700">
{`// Request TEE verification
const verification = await satya.tee.requestVerification({
  modelId: 'model_123',
  verificationLevel: 'standard'
})

// Check verification status
const status = await satya.tee.getVerificationStatus(verificationId)

// Get verification result
if (status.completed) {
  const result = await satya.tee.getVerificationResult(verificationId)
}`}
                </pre>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h5 className="font-medium mb-2 text-orange-600">SEAL Encryption</h5>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <pre className="text-gray-700">
{`// Encrypt model data
const encrypted = await satya.seal.encrypt({
  data: modelBuffer,
  accessPolicy: {
    duration: 2592000000,
    allowedUsers: ['0x...']
  }
})

// Decrypt purchased model
const decrypted = await satya.seal.decrypt({
  blobId: model.blobId,
  accessTicket: purchaseTicket
})`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Event Handling</h4>
          <p className="text-gray-600 mb-4">Listen to marketplace events for real-time updates:</p>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-sm text-gray-700 overflow-x-auto">
{`// Listen for new model listings
satya.events.on('ModelListed', (event) => {
  console.log('New model listed:', event.modelId)
  console.log('Creator:', event.creator)
  console.log('Price:', event.price)
})

// Listen for purchases
satya.events.on('ModelPurchased', (event) => {
  console.log('Model purchased:', event.modelId)
  console.log('Buyer:', event.buyer)
})

// Listen for verification updates
satya.events.on('VerificationCompleted', (event) => {
  console.log('Verification completed:', event.modelId)
  console.log('Result:', event.verified)
})`}
            </pre>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Error Handling</h4>
          <p className="text-gray-600 mb-4">Handle common errors gracefully:</p>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-sm text-gray-700 overflow-x-auto">
{`try {
  const purchase = await satya.marketplace.purchaseModel({
    modelId: 'model_123',
    paymentAmount: '1000000000'
  })
} catch (error) {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    console.log('Not enough SUI tokens for purchase')
  } else if (error.code === 'MODEL_NOT_FOUND') {
    console.log('Model not found')
  } else if (error.code === 'ACCESS_DENIED') {
    console.log('Access denied - check wallet connection')
  } else {
    console.log('Unknown error:', error.message)
  }
}`}
            </pre>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">TypeScript Support</h4>
          <p className="text-gray-600 mb-4">Full TypeScript definitions included:</p>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-sm text-gray-700 overflow-x-auto">
{`import { 
  SatyaClient, 
  AIModel, 
  PurchaseOptions, 
  VerificationResult 
} from '@satya/ai-marketplace-sdk'

interface CustomModel extends AIModel {
  customField: string
}

const models: CustomModel[] = await satya.marketplace.getModels()`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}