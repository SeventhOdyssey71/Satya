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
        <button className="bg-gray-100 text-gray-700 rounded-lg px-4 py-3 hover:bg-gray-200 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
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
        <div className="text-right">
          <div className="flex items-center gap-1 mb-1">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className={`w-4 h-4 ${i < Math.floor(model.rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-gray-500 ml-1">({model.rating})</span>
          </div>
          <p className="text-sm text-gray-500">{model.downloads.toLocaleString()} downloads</p>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
          {model.category}
        </span>
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