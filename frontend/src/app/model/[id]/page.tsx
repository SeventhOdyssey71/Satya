import Link from 'next/link'
import Header from '@/components/ui/Header'

interface ModelPageProps {
  params: Promise<{ id: string }>
}

export default async function ModelPage({ params }: ModelPageProps) {
  const { id } = await params
  // Mock data based on model ID
  const getModelData = (id: string) => {
    const models: Record<string, any> = {
      'ai-model-x129': {
        name: 'AI Model x129',
        description: 'Advanced healthcare AI model trained on comprehensive medical datasets from leading NHS hospitals. This model provides state-of-the-art diagnostic capabilities for medical imaging and patient care optimization.',
        category: 'HealthCare',
        price: '$299',
        rating: 4.8,
        downloads: 1247,
        author: 'NHS Research Labs',
        image: 'https://placehold.co/600x400/000000/FFFFFF',
        features: [
          'Medical image analysis',
          'Diagnostic accuracy: 94.2%',
          'Real-time processing',
          'HIPAA compliant',
          'Multi-language support'
        ],
        specifications: {
          'Model Type': 'Convolutional Neural Network',
          'Training Data': '2.4M medical images',
          'Accuracy': '94.2%',
          'Processing Time': '< 200ms',
          'Memory Usage': '2.1 GB',
          'Supported Formats': 'DICOM, PNG, JPEG'
        }
      },
      'opus-model-x229': {
        name: 'Opus Model x229',
        description: 'Revolutionary machine learning model designed for complex data analysis and predictive modeling. Trained on diverse datasets with exceptional performance across multiple domains.',
        category: 'Machine Learning',
        price: '$199',
        rating: 4.6,
        downloads: 892,
        author: 'OpusAI Labs',
        image: 'https://placehold.co/600x400/6B7280/FFFFFF',
        features: [
          'Multi-domain analysis',
          'Predictive modeling',
          'Real-time inference',
          'Scalable architecture',
          'API integration ready'
        ],
        specifications: {
          'Model Type': 'Transformer',
          'Parameters': '175B',
          'Training Data': '1.2TB mixed datasets',
          'Accuracy': '89.7%',
          'Processing Time': '< 500ms',
          'Memory Usage': '4.2 GB'
        }
      },
      'self-drive-model': {
        name: 'Self Drive Model',
        description: 'Cutting-edge autonomous vehicle navigation system with advanced computer vision and decision-making capabilities. Trained on millions of driving scenarios for optimal safety and performance.',
        category: 'Autonomous Systems',
        price: '$599',
        rating: 4.9,
        downloads: 534,
        author: 'AutoDrive Technologies',
        image: 'https://placehold.co/600x400/1F2937/FFFFFF',
        features: [
          'Real-time object detection',
          'Path planning optimization',
          'Weather adaptation',
          'Emergency response system',
          'Fleet management integration'
        ],
        specifications: {
          'Model Type': 'Multi-modal CNN-RNN',
          'Training Miles': '10M+ autonomous miles',
          'Accuracy': '99.1%',
          'Processing Time': '< 50ms',
          'Memory Usage': '8.5 GB',
          'Sensors': 'LiDAR, Camera, Radar'
        }
      }
    }
    return models[id] || models['opus-model-x229']
  }

  const model = getModelData(id)

  return (
    <div className="min-h-screen bg-white">
      <Header activeTab="marketplace" />
      
      <main className="relative z-10">
        <div className="container max-w-7xl mx-auto px-6 py-8">
          {/* Back Button */}
          <Link href="/marketplace" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-8 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Marketplace
          </Link>

          <div className="grid grid-cols-12 gap-12">
            {/* Left Column - Model Image */}
            <div className="col-span-5">
              <ModelImage image={model.image} name={model.name} price={model.price} />
            </div>

            {/* Right Column - Model Details */}
            <div className="col-span-7">
              <ModelHeader model={model} />
              <ModelTabs model={model} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function ModelImage({ image, name, price }: { image: string; name: string; price: string }) {
  return (
    <div className="sticky top-8">
      <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-[4/3] mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-4 left-4">
          <button className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-2 text-sm font-medium text-white hover:bg-white/30 transition-colors">
            Gallery View
          </button>
        </div>
      </div>
      
      <div className="flex gap-3">
        <button className="flex-1 bg-black text-white rounded-lg px-6 py-3 font-medium hover:bg-gray-800 transition-colors">
          Verify Model ({price})
        </button>
      </div>
    </div>
  )
}

function ModelHeader({ model }: { model: any }) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-3xl font-russo text-black mb-2">{model.name}</h1>
          <p className="text-lg text-gray-600 font-albert">by {model.author}</p>
        </div>
      </div>
    </div>
  )
}

function ModelTabs({ model }: { model: any }) {
  return (
    <div>
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          <button className="pb-3 text-base font-medium text-black border-b-2 border-black">
            Overview
          </button>
          <button className="pb-3 text-base font-medium text-gray-500 hover:text-gray-700">
            Specifications
          </button>
          <button className="pb-3 text-base font-medium text-gray-500 hover:text-gray-700">
            Reviews
          </button>
        </nav>
      </div>

      <div className="space-y-8">
        {/* Description */}
        <div>
          <h3 className="text-xl font-russo text-black mb-4">Description</h3>
          <p className="text-gray-700 font-albert leading-relaxed">
            {model.description}
          </p>
        </div>

        {/* Key Features */}
        <div>
          <h3 className="text-xl font-russo text-black mb-4">Key Features</h3>
          <div className="grid grid-cols-2 gap-3">
            {model.features.map((feature: string, index: number) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700 font-albert">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Specifications */}
        <div>
          <h3 className="text-xl font-russo text-black mb-4">Technical Specifications</h3>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="grid grid-cols-2 gap-6">
              {Object.entries(model.specifications).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-sm font-medium text-gray-500 mb-1">{key}</dt>
                  <dd className="text-base text-gray-900 font-albert">{value as string}</dd>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}