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

 const suggestedQueries = [
  "Show me models with the highest quality scores",
  "Find cheap AI models under $5", 
  "What computer vision models are available?",
  "Browse machine learning models for classification",
  "How do I purchase a model from the marketplace?",
  "Check the status of my uploaded models"
 ]

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
   const satyaContext = `You are Satya AI Assistant, a specialized AI helper for the Satya marketplace - a decentralized platform for AI models with TEE verification and blockchain security.

   SATYA MARKETPLACE FUNCTIONALITY:
   
   🏪 BROWSING & DISCOVERY:
   - Browse models by category: Computer Vision, Machine Learning, NLP, etc.
   - Filter by quality score (0-100% verified by TEE)
   - Sort by price (find cheap models or premium ones)
   - Search by model type: classification, detection, prediction, etc.
   - View model details: file size, upload date, verification status

   💰 PRICING & PURCHASING:
   - Models have different price ranges (from free to premium)
   - Quality scores affect pricing (higher scores = more expensive typically)
   - Purchase process: wallet connection → buy → encrypted download
   - Support for SUI blockchain payments
   
   📊 QUALITY METRICS:
   - TEE verification provides quality scores (accuracy, performance, bias metrics)
   - Blockchain attestation ensures score authenticity  
   - Models with 90%+ scores are considered premium
   - Quality assessment includes: accuracy, performance, bias detection

   🔐 SECURITY FEATURES:
   - All models undergo TEE (Trusted Execution Environment) verification
   - Blockchain attestation on SUI network
   - Encrypted storage and secure downloads
   - Verification prevents tampered or malicious models

   📤 UPLOAD & SELLING:
   - Users can upload their own AI models
   - TEE verification process for quality assessment
   - Dashboard tracks: pending models, verification status, sales
   - Revenue sharing for successful model sales

   💻 SUPPORTED CATEGORIES:
   - Computer Vision: image classification, object detection, facial recognition
   - Machine Learning: regression, clustering, recommendation systems  
   - Natural Language: sentiment analysis, text classification, translation
   - Audio Processing: speech recognition, music analysis
   - Time Series: forecasting, anomaly detection

   When users ask about specific functionality, provide helpful guidance on how to use the Satya platform. For requests like "show models" or "find cheap models", explain how to navigate the marketplace interface.

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

   const errorMessage: ChatMessage = {
    role: 'assistant',
    content: `Sorry, I encountered an error: ${errorDetails}. Please try again or contact support if the issue persists.`,
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
          className="w-full px-6 py-4 pr-20 text-lg bg-gray-50 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-200 placeholder-gray-400 disabled:opacity-50"
         />
         
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
           className="w-full px-4 py-3 pr-12 text-lg bg-gray-50 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-200 placeholder-gray-400 disabled:opacity-50"
          />
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