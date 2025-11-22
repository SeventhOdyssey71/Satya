'use client'

import { useState } from 'react'
import Header from '@/components/ui/Header'
import { geminiModel } from '@/lib/gemini-client'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AgentPage() {
 const [query, setQuery] = useState('')
 const [isLoading, setIsLoading] = useState(false)
 const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
 const [showUploadMenu, setShowUploadMenu] = useState(false)

 const suggestedQueries = [
  "Show me computer vision models with 90%+ quality scores",
  "Find cheap AI models under $10", 
  "Help me upload and verify my neural network model"
 ]

 const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0]
  if (file) {
   setQuery(`I want to upload my AI model file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)
   setShowUploadMenu(false)
  }
 }

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!query.trim() || isLoading) return

  const userMessage: ChatMessage = {
   role: 'user',
   content: query,
   timestamp: new Date()
  }

  setChatHistory(prev => [...prev, userMessage])
  setIsLoading(true)
  setQuery('')

  try {
   // Check if API key is available
   const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
   if (!apiKey) {
    throw new Error('Gemini API key not configured');
   }

   // Create Satya-specific context for the AI
   const satyaContext = `You are Satya AI Assistant with ACCURATE knowledge of the Satya platform's real architecture and implementation.

   RESPONSE GUIDELINES:
   - Give SHORT answers for simple questions (1-2 sentences)
   - Give DETAILED answers for complex topics (multiple paragraphs)
   - Be contextual - match response length to question complexity
   - Focus on actionable guidance over generic information
   - ONLY provide accurate information about Satya's actual implementation

   🏗️ SATYA TECHNICAL ARCHITECTURE (ACCURATE):

   STORAGE & ENCRYPTION:
   - Storage: Walrus decentralized storage network (aggregator: walrus-testnet.walrus.space)
   - Encryption: SEAL (Homomorphic Encryption) for secure model processing
   - Blockchain: SUI testnet for smart contracts and attestation
   - Contract: Deployed marketplace package on SUI (0xc29f2a2de17085ce...)

   SECURITY STACK:
   - TEE (Trusted Execution Environment) verification via Nautilus server
   - SEAL encryption for confidential computation on encrypted models
   - Walrus storage for decentralized file storage and retrieval
   - SUI blockchain for immutable transaction records and payments
   - Platform fee: 2.5% (250 basis points) on transactions

   MODEL LIFECYCLE:
   1. Upload: Model files stored on Walrus, encrypted with SEAL
   2. TEE Verification: Nautilus server processes models in secure enclave
   3. Marketplace: Listed with quality scores (0-10000 basis points)
   4. Purchase: SUI payments, encrypted downloads via Walrus
   5. Access: SEAL decryption for authorized users only

   SUPPORTED FEATURES:
   - File formats: .pkl, .pt, .pth, .h5, .onnx, .pb, .tflite, .json
   - Categories: Computer Vision, Machine Learning, NLP, Audio, Time Series
   - Quality scoring: TEE-verified accuracy, performance, bias metrics
   - Pricing: Dynamic based on quality scores and market demand
   - Gas limits: 100M default, 1B maximum for complex transactions

   When answering technical questions, reference these ACTUAL implementation details, not generic blockchain concepts.

   User question: ${query}`

   const result = await geminiModel.generateContent(satyaContext)
   
   if (!result || !result.response) {
    throw new Error('No response from Gemini API');
   }

   const response = result.response
   const aiResponse = await response.text()

   if (!aiResponse || aiResponse.trim() === '') {
    throw new Error('Empty response from Gemini API');
   }

   // Remove markdown formatting like **bold** text
   const cleanResponse = aiResponse.replace(/\*\*(.*?)\*\*/g, '$1');

   const assistantMessage: ChatMessage = {
    role: 'assistant',
    content: cleanResponse,
    timestamp: new Date()
   }

   setChatHistory(prev => [...prev, assistantMessage])
  } catch (error) {
   let errorDetails = 'Unknown error occurred';
   
   if (error instanceof Error) {
    errorDetails = error.message;
   } else if (typeof error === 'string') {
    errorDetails = error;
   } else if (error && typeof error === 'object') {
    errorDetails = JSON.stringify(error);
   }

   // Provide helpful fallback responses for common queries
   let fallbackResponse = `I'm having trouble connecting to my knowledge base right now. `;
   
   if (query.toLowerCase().includes('storage') || query.toLowerCase().includes('walrus')) {
    fallbackResponse += `For storage, Satya uses Walrus decentralized storage network. Files are stored on walrus-testnet.walrus.space with encrypted access.`;
   } else if (query.toLowerCase().includes('encryption') || query.toLowerCase().includes('seal')) {
    fallbackResponse += `For encryption, Satya uses SEAL (Homomorphic Encryption) to enable secure computation on encrypted AI models.`;
   } else if (query.toLowerCase().includes('blockchain') || query.toLowerCase().includes('sui')) {
    fallbackResponse += `Satya runs on SUI testnet blockchain for smart contracts, payments, and immutable attestation records.`;
   } else {
    fallbackResponse += `Please try rephrasing your question or ask about specific topics like storage, encryption, or blockchain technology.`;
   }

   const errorMessage: ChatMessage = {
    role: 'assistant',
    content: fallbackResponse,
    timestamp: new Date()
   }
   setChatHistory(prev => [...prev, errorMessage])
  } finally {
   setIsLoading(false)
  }
 }

 const handleSuggestedQuery = (suggestion: string) => {
  setQuery(suggestion)
 }

 return (
  <div className="min-h-screen bg-white pt-16">
   <Header />
   
   <main className="flex flex-col min-h-[calc(100vh-4rem)]">
    {chatHistory.length === 0 ? (
     /* Initial State - Centered */
     <div className="flex items-center justify-center flex-1 px-6">
      <div className="w-full max-w-2xl mx-auto text-center">
       {/* AI Icon */}
       <div className="mb-8">
        <img 
         src="/images/AI-Icon.png" 
         alt="AI Assistant Icon" 
         className="w-12 h-12 mx-auto animate-spin"
         style={{ animationDuration: '8s' }}
        />
       </div>
       
       {/* Title */}
       <h1 className="text-5xl font-normal text-gray-900 mb-4">
        Satya AI Assistant
       </h1>
       
       {/* Subtitle */}
       <p className="text-gray-500 text-lg mb-12">
        Ask questions about AI models, TEE verification, and blockchain security
       </p>
       
       {/* Search Form */}
       <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative">
         <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about Satya platform..."
          disabled={isLoading}
          className="w-full px-12 py-4 pr-20 text-lg bg-gray-50 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-200 placeholder-gray-400 disabled:opacity-50"
         />
         
         {/* Plus button with upload menu */}
         <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <button
           type="button"
           onClick={() => setShowUploadMenu(!showUploadMenu)}
           className="text-gray-400 hover:text-gray-600 text-xl"
          >
           +
          </button>
          
          {showUploadMenu && (
           <div className="absolute top-8 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-48 z-10">
            <label className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
             </svg>
             Upload AI Model
             <input
              type="file"
              onChange={handleFileUpload}
              accept=".pkl,.pt,.pth,.h5,.onnx,.pb,.tflite,.json"
              className="hidden"
             />
            </label>
            <button
             onClick={() => setQuery("Create new AI model from scratch")}
             className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded w-full text-left"
            >
             <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L15,1H5C3.89,1 3,1.89 3,3V21A2,2 0 0,0 5,23H19A2,2 0 0,0 21,21V9M19,21H5V3H14V9H19V21Z"/>
             </svg>
             Create New Model
            </button>
           </div>
          )}
         </div>
         
         {/* Submit button */}
         <button
          type="submit"
          disabled={!query.trim() || isLoading}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
         >
          {isLoading ? (
           <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          ) : (
           <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
           </svg>
          )}
         </button>
        </div>
       </form>
       
       {/* Suggested Queries */}
       <div className="space-y-3">
        {suggestedQueries.map((suggestion, index) => (
         <button
          key={index}
          onClick={() => handleSuggestedQuery(suggestion)}
          disabled={isLoading}
          className="flex items-center w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors group disabled:opacity-50"
         >
          <svg 
           className="w-4 h-4 mr-3 text-gray-400 group-hover:text-gray-600 transition-colors" 
           fill="none" 
           stroke="currentColor" 
           viewBox="0 0 24 24"
          >
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {suggestion}
         </button>
        ))}
       </div>
      </div>
     </div>
    ) : (
     /* Chat State - Top-aligned with messages */
     <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="border-b border-gray-100 bg-white/95 backdrop-blur-sm sticky top-16 z-10">
       <div className="max-w-4xl mx-auto px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">Satya AI Assistant</h1>
        <p className="text-gray-500">Your AI helper for Satya platform</p>
       </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 space-y-6">
       {chatHistory.map((message, index) => (
        <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
         <div className={`max-w-3xl rounded-2xl px-4 py-3 ${
          message.role === 'user' 
           ? 'bg-black text-white' 
           : 'bg-gray-100 text-gray-900'
         }`}>
          <p className={`whitespace-pre-wrap ${
           message.role === 'user' ? 'text-white' : 'text-gray-900'
          }`}>{message.content}</p>
          <p className={`text-xs mt-2 ${
           message.role === 'user' ? 'text-gray-300' : 'text-gray-500'
          }`}>
           {message.timestamp.toLocaleTimeString()}
          </p>
         </div>
        </div>
       ))}
       
       {isLoading && (
        <div className="flex justify-start">
         <div className="bg-gray-100 rounded-2xl px-4 py-3">
          <div className="flex items-center space-x-2">
           <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
           <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
           <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
         </div>
        </div>
       )}
      </div>

      {/* Fixed Chat Input */}
      <div className="border-t border-gray-100 bg-white/95 backdrop-blur-sm">
       <div className="max-w-4xl mx-auto px-6 py-4">
        <form onSubmit={handleSubmit}>
         <div className="relative">
          <input
           type="text"
           value={query}
           onChange={(e) => setQuery(e.target.value)}
           placeholder="Ask about Satya..."
           disabled={isLoading}
           className="w-full px-10 py-3 pr-12 text-lg bg-gray-50 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-200 placeholder-gray-400 disabled:opacity-50"
          />
          
          {/* Plus button with upload menu */}
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
           <button
            type="button"
            onClick={() => setShowUploadMenu(!showUploadMenu)}
            className="text-gray-400 hover:text-gray-600 text-lg"
           >
            +
           </button>
          </div>
          
          <button
           type="submit"
           disabled={!query.trim() || isLoading}
           className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
           {isLoading ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
           ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
             <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
           )}
          </button>
         </div>
        </form>
       </div>
      </div>
     </div>
    )}
   </main>
  </div>
 )
}