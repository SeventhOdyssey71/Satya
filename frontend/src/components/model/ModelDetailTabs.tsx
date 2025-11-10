'use client'

import React, { useState } from 'react'
import { 
  FileText, 
  MessageSquare, 
  Activity, 
  Code, 
  Download,
  Star,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react'
import { ModelCard } from '@/components/marketplace'

interface ModelDetailTabsProps {
  model: ModelCard
  className?: string
}

interface Review {
  id: string
  author: string
  authorAvatar?: string
  rating: number
  title: string
  content: string
  createdAt: string
  helpful: number
  verified: boolean
}

interface ModelVersion {
  version: string
  releaseDate: string
  description: string
  downloadUrl?: string
  size: string
  improvements: string[]
  isCurrent: boolean
}

export default function ModelDetailTabs({ model, className = '' }: ModelDetailTabsProps) {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare },
    { id: 'versions', label: 'Versions', icon: Activity },
    { id: 'api', label: 'API Usage', icon: Code },
  ]

  // Mock data - in real app, this would come from props or API
  const reviews: Review[] = [
    {
      id: '1',
      author: 'DataScientist_42',
      rating: 5,
      title: 'Excellent performance on our dataset',
      content: 'This model performed exceptionally well on our image classification tasks. The accuracy is impressive and inference time is fast. Highly recommend for production use.',
      createdAt: '2024-01-15',
      helpful: 12,
      verified: true
    },
    {
      id: '2',
      author: 'MLEngineer',
      rating: 4,
      title: 'Good model, minor integration issues',
      content: 'The model quality is great, but I had some issues with the preprocessing pipeline. Documentation could be clearer on input format requirements.',
      createdAt: '2024-01-10',
      helpful: 8,
      verified: false
    }
  ]

  const versions: ModelVersion[] = [
    {
      version: '2.1.0',
      releaseDate: '2024-01-20',
      description: 'Latest version with improved accuracy and faster inference',
      size: '127 MB',
      improvements: [
        'Improved accuracy by 3.2%',
        'Reduced inference time by 15%',
        'Better handling of edge cases',
        'Updated preprocessing pipeline'
      ],
      isCurrent: true
    },
    {
      version: '2.0.0',
      releaseDate: '2024-01-01',
      description: 'Major update with architecture improvements',
      size: '134 MB',
      improvements: [
        'Complete model architecture redesign',
        'Support for batch processing',
        'Enhanced feature extraction'
      ],
      isCurrent: false
    }
  ]

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Model Description */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">About This Model</h3>
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed mb-4">
            {model.description}
          </p>
          <p className="text-gray-700 leading-relaxed">
            This model has been trained on a comprehensive dataset and optimized for production use. 
            It provides state-of-the-art performance while maintaining efficiency for real-time applications.
          </p>
        </div>
      </div>

      {/* Model Specifications */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Technical Specifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Model Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Architecture</span>
                <span className="font-medium">ResNet-50</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Framework</span>
                <span className="font-medium">PyTorch</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Input Size</span>
                <span className="font-medium">224x224x3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Output Classes</span>
                <span className="font-medium">1000</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Performance Metrics</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Top-1 Accuracy</span>
                <span className="font-medium">76.1%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Top-5 Accuracy</span>
                <span className="font-medium">92.9%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Inference Time</span>
                <span className="font-medium">~15ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Memory Usage</span>
                <span className="font-medium">~512MB</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Usage Instructions</h3>
        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
          <pre className="text-green-400 text-sm">
{`# Basic usage example
import onnxruntime as ort
import numpy as np
from PIL import Image

# Load the model
session = ort.InferenceSession('model.onnx')

# Preprocess image
def preprocess(image_path):
    image = Image.open(image_path).convert('RGB')
    image = image.resize((224, 224))
    image_array = np.array(image).astype(np.float32) / 255.0
    image_array = np.transpose(image_array, (2, 0, 1))
    return np.expand_dims(image_array, axis=0)

# Run inference
input_data = preprocess('your_image.jpg')
outputs = session.run(None, {'input': input_data})
predictions = outputs[0]`}
          </pre>
        </div>
      </div>
    </div>
  )

  const renderReviews = () => (
    <div className="space-y-6">
      {/* Review Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{model.rating.toFixed(1)}</div>
            <div className="flex items-center justify-center gap-1 mb-1">
              {renderStars(Math.round(model.rating))}
            </div>
            <div className="text-sm text-gray-600">{model.reviewCount} reviews</div>
          </div>
          <div className="flex-1">
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = Math.floor(Math.random() * model.reviewCount / 2)
                const percentage = (count / model.reviewCount) * 100
                return (
                  <div key={stars} className="flex items-center gap-2 text-sm">
                    <span className="w-3 text-gray-600">{stars}</span>
                    <Star className="w-4 h-4 text-yellow-400" />
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-gray-600 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Individual Reviews */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{review.author}</span>
                    {review.verified && (
                      <CheckCircle className="w-4 h-4 text-green-500" title="Verified Purchase" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      {renderStars(review.rating)}
                    </div>
                    <span>•</span>
                    <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
            <p className="text-gray-700 mb-4">{review.content}</p>
            
            <div className="flex items-center justify-between text-sm">
              <button className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
                Helpful ({review.helpful})
              </button>
              <button className="text-gray-500 hover:text-gray-700">
                Report
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderVersions = () => (
    <div className="space-y-6">
      {versions.map((version) => (
        <div key={version.version} className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">v{version.version}</h3>
                {version.isCurrent && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    Current
                  </span>
                )}
              </div>
              <p className="text-gray-600 mb-2">{version.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(version.releaseDate).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  {version.size}
                </span>
              </div>
            </div>
            {version.isCurrent && (
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                Download
              </button>
            )}
          </div>
          
          {version.improvements.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">What's New</h4>
              <ul className="space-y-1">
                {version.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  )

  const renderAPI = () => (
    <div className="space-y-8">
      {/* API Endpoints */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">API Endpoints</h3>
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">POST</span>
              <code className="text-sm font-mono">/api/predict</code>
            </div>
            <p className="text-gray-600 text-sm mb-3">Run inference on the model</p>
            <div className="bg-gray-900 rounded p-3 overflow-x-auto">
              <pre className="text-green-400 text-xs">
{`curl -X POST https://api.satya.ai/v1/predict \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model_id": "${model.id}",
    "input": {
      "image_url": "https://example.com/image.jpg"
    }
  }'`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* SDK Examples */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">SDK Examples</h3>
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Python SDK</h4>
            <div className="bg-gray-900 rounded p-3 overflow-x-auto">
              <pre className="text-green-400 text-sm">
{`from satya_sdk import SatyaClient

client = SatyaClient(api_key="YOUR_API_KEY")

# Run prediction
result = client.predict(
    model_id="${model.id}",
    input_data={"image_url": "https://example.com/image.jpg"}
)

print(result.predictions)`}
              </pre>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">JavaScript SDK</h4>
            <div className="bg-gray-900 rounded p-3 overflow-x-auto">
              <pre className="text-green-400 text-sm">
{`import { SatyaClient } from '@satya/sdk';

const client = new SatyaClient({ 
  apiKey: 'YOUR_API_KEY' 
});

// Run prediction
const result = await client.predict({
  modelId: '${model.id}',
  input: { imageUrl: 'https://example.com/image.jpg' }
});

console.log(result.predictions);`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Rate Limits */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Rate Limits & Pricing</h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-yellow-800 font-medium mb-1">API Usage Limits</p>
              <p className="text-yellow-700 text-sm">
                Free tier: 1,000 requests/month • Paid plans available for higher usage
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className={className}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'reviews' && renderReviews()}
        {activeTab === 'versions' && renderVersions()}
        {activeTab === 'api' && renderAPI()}
      </div>
    </div>
  )
}