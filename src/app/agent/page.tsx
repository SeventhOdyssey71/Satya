'use client'

import { useState, useEffect, useRef } from 'react'
import Header from '@/components/ui/Header'
import { geminiModel, checkGeminiAvailability } from '@/lib/gemini-client'
import { MarketplaceContractService } from '@/lib/services/marketplace-contract.service'
import { EventService } from '@/lib/services/event-service'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isAction?: boolean
  actionData?: any
  data?: any
  dataType?: string
}

export default function AgentPage() {
 const [query, setQuery] = useState('')
 const [isLoading, setIsLoading] = useState(false)
 const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
 const [showUploadMenu, setShowUploadMenu] = useState(false)
 const [lastSuggestedAction, setLastSuggestedAction] = useState<string | null>(null)
 const messagesEndRef = useRef<HTMLDivElement>(null)
 const chatMessagesRef = useRef<HTMLDivElement>(null)
 const chatEndRef = useRef<HTMLDivElement>(null)
 
 const marketplaceService = new MarketplaceContractService()
 const eventService = new EventService()

 // Scroll to bottom function
 const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
 }

 // Detect user intent from query
 const detectAdvancedIntent = (query: string): string => {
  const lowerQuery = query.toLowerCase()
  
  if (lowerQuery.includes('pending') || lowerQuery.includes('upload') || lowerQuery.includes('queue')) {
   return 'pending_models'
  } else if (lowerQuery.includes('marketplace') || lowerQuery.includes('browse') || lowerQuery.includes('buy')) {
   return 'marketplace_models'
  } else if (lowerQuery.includes('stats') || lowerQuery.includes('dashboard') || lowerQuery.includes('overview')) {
   return 'platform_stats'
  }
  
  return 'general'
 }

 // Update conversation context
 const updateConversationContext = (query: string, intent: string) => {
  // Simple context tracking - could be expanded later
  console.log(`Query: "${query}" detected as intent: ${intent}`)
 }

 // Auto scroll to bottom when messages change
 useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
 }, [chatHistory, isLoading])

 const suggestedQueries = [
  "Upload my AI model and start TEE verification",
  "Show me all pending models in my dashboard", 
  "Find the best computer vision models under $20 and purchase one"
 ]
 
 // Data fetching functions
 const fetchPendingModels = async () => {
  try {
   const pendingModels = await marketplaceService.getUserPendingModels('0x1234567890abcdef')
   return pendingModels
  } catch (error) {
   console.error('Error fetching pending models:', error)
   return []
  }
 }
 
 const fetchMarketplaceModels = async () => {
  try {
   const result = await eventService.getModelListings(20)
   return result.events
  } catch (error) {
   console.error('Error fetching marketplace models:', error)
   return []
  }
 }
 
 // Intent detection function
 const detectIntent = (userQuery: string) => {
  const query = userQuery.toLowerCase()
  
  if (query.includes('pending') || query.includes('my models') || query.includes('dashboard')) {
   return 'pending_models'
  }
  if (query.includes('marketplace') || query.includes('available models') || query.includes('browse')) {
   return 'marketplace_models'
  }
  if (query.includes('upload') || query.includes('add model')) {
   return 'upload_guidance'
  }
  if (query.includes('stats') || query.includes('how many') || query.includes('count')) {
   return 'platform_stats'
  }
  
  return 'general_query'
 }

 const executeAction = async (action: string, params?: any) => {
  try {
   switch (action) {
    case 'check_pending_models':
     const pendingModels = await marketplaceService.getMarketplaceModels(20)
     return {
      success: true,
      data: pendingModels,
      message: `Found ${pendingModels.length} models in marketplace`
     }
    
    case 'check_marketplace':
     const marketplaceModels = await eventService.getModelListings(10)
     return {
      success: true,
      data: marketplaceModels.events,
      message: `Found ${marketplaceModels.events.length} models in marketplace`
     }
    
    case 'redirect_upload':
     // Use Next.js router for proper navigation
     window.location.href = '/upload'
     return {
      success: true,
      message: 'Opening the upload page...'
     }
    
    case 'redirect_dashboard':
     // Use Next.js router for proper navigation
     window.location.href = '/dashboard'
     return {
      success: true,
      message: 'Opening the dashboard...'
     }
    
    default:
     return {
      success: false,
      message: `Action "${action}" not implemented yet`
     }
   }
  } catch (error) {
   return {
    success: false,
    message: `Error executing action: ${error instanceof Error ? error.message : 'Unknown error'}`
   }
  }
 }

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
  const currentQuery = query
  setQuery('')
  
  // Scroll to bottom when starting to process
  setTimeout(() => scrollToBottom(), 100)

  try {
   // Detect user intent with advanced pattern matching
   const intent = detectAdvancedIntent(currentQuery)
   
   // Update conversation context with new interaction
   updateConversationContext(currentQuery, intent)
   
   let fetchedData = null
   let dataType = undefined
   
   // Fetch relevant data based on intent
   if (intent === 'pending_models') {
    fetchedData = await fetchPendingModels()
    dataType = 'pending_models'
   } else if (intent === 'marketplace_models') {
    fetchedData = await fetchMarketplaceModels()
    dataType = 'marketplace_models'
   } else if (intent === 'platform_stats') {
    const [pending, marketplace] = await Promise.all([
     fetchPendingModels(),
     fetchMarketplaceModels()
    ])
    fetchedData = {
     pendingCount: pending.length,
     marketplaceCount: marketplace.length,
     totalModels: pending.length + marketplace.length
    }
    dataType = 'dashboard_stats'
   }

   // Check if API key is available
   const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
   if (!apiKey) {
    throw new Error('Gemini API key not configured');
   }

   // Create Satya Agent context with comprehensive training
   const satyaContext = `You are the Satya Agent. You are DIRECT, HELPFUL, and ACTION-ORIENTED.

   CORE RULES:

   1. WHEN USER ASKS FOR DATA - SUGGEST ACTION IMMEDIATELY:
   User: "How many models in marketplace?"
   You: "I can check the marketplace data for you. Would you like me to do this now?"

   2. WHEN USER SAYS YES/PROCEED - BE HONEST ABOUT WHAT HAPPENS:
   If it's a data query → Say "I'll fetch the data from our services"
   If it's upload → Say "I'll open the upload page for you"
   If it's dashboard → Say "I'll take you to your dashboard"

   3. BE HONEST ABOUT REDIRECTS:
   For upload: "I'll redirect you to the upload page where you can select your model files."
   For dashboard: "I'll take you to your dashboard to view your models."

   4. NO FAKE PROGRESS MESSAGES:
   Don't say "Executing redirect_upload now..." if you're just going to redirect
   Say "Opening the upload page for you..." then let the redirect happen

   5. KEEP RESPONSES SHORT AND DIRECT:
   - Don't explain the entire platform unless asked
   - Suggest ONE clear action at a time
   - Ask "Would you like me to do this now?" for actionable requests

   6. FOR ACTION SUGGESTIONS, USE THIS EXACT FORMAT:
   "I can [specific action]. Would you like me to do this now?"

   EXAMPLE CONVERSATIONS:

   User: "Upload my AI model and start TEE verification"
   You: "I can take you to the upload page where you can select your model file and configure TEE verification. Would you like me to do this now?"

   User: "Yes"
   You: "Opening the upload page for you..."

   User: "I haven't been redirected"
   You: "Let me try opening the upload page again. If it doesn't work, you can manually go to the Upload section in the navigation."

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

   SMART ACTION DETECTION & EXECUTION:
   
   If user says redirect didn't work:
   - "I haven't been redirected" → Apologize and suggest manual navigation
   - "It didn't work" → Try again or give manual instructions
   
   If user query contains:
   - "how many models" + "marketplace" → Suggest "check_marketplace" action
   - "pending models" or "my models" → Suggest "check_pending_models" action
   - "upload" or "add model" → Suggest "redirect_upload" action  
   - "dashboard" → Suggest "redirect_dashboard" action
   
   RESPONSE EXAMPLES:
   
   User: "How many models exist in the marketplace?"
   You: "I can check the marketplace data for you. Would you like me to do this now?"
   
   User: "Yes"
   You: "I'll fetch the marketplace data from our services..." [Execute check_marketplace]
   
   User: "Upload my AI model"
   You: "I can take you to the upload page where you can select your model file. Would you like me to do this now?"
   
   User: "Yes"
   You: "Opening the upload page for you..."
   
   User: "I haven't been redirected"
   You: "I apologize for the redirect issue. You can manually navigate to the Upload section in the navigation bar at the top of the page, or try clicking this link: /upload"
   
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

   // Remove all markdown formatting for clean, clear text
   let cleanResponse = aiResponse
     .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove **bold**
     .replace(/\*(.*?)\*/g, '$1')     // Remove *italic*  
     .replace(/#{1,6}\s+/g, '')       // Remove headers (# ## ###)
     .replace(/^\s*[\*\-\+]\s+/gm, '') // Remove bullet points (*, -, +)
     .replace(/^\s*\d+\.\s+/gm, '')   // Remove numbered lists (1. 2. 3.)
     .replace(/`([^`]+)`/g, '$1')     // Remove `code` backticks
     .replace(/```[\s\S]*?```/g, '')  // Remove code blocks
     .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links [text](url)
     .replace(/^\s*>/gm, '')          // Remove blockquotes
     .replace(/\n{3,}/g, '\n\n')      // Reduce multiple newlines
     .trim();

   // Detect if response suggests an action
   const actionSuggestions = {
    'check_marketplace': ['check the marketplace', 'marketplace data', 'fetch the marketplace'],
    'check_pending_models': ['check your pending', 'pending models', 'your models'],
    'redirect_upload': ['take you to the upload', 'open the upload', 'upload page'],
    'redirect_dashboard': ['take you to your dashboard', 'open the dashboard', 'your dashboard']
   }

   let detectedAction = null
   for (const [action, patterns] of Object.entries(actionSuggestions)) {
     if (patterns.some(pattern => cleanResponse.toLowerCase().includes(pattern))) {
       detectedAction = action
       break
     }
   }

   // If response ends with "Would you like me to do this now?" or similar, store the action
   if (detectedAction && (
     cleanResponse.includes('Would you like me to do this now?') ||
     cleanResponse.includes('Would you like me to') ||
     cleanResponse.includes('Should I proceed') ||
     cleanResponse.includes('Shall I')
   )) {
     setLastSuggestedAction(detectedAction)
   }

   const assistantMessage: ChatMessage = {
    role: 'assistant',
    content: cleanResponse,
    timestamp: new Date(),
    data: fetchedData,
    dataType: dataType as any
   }

   setChatHistory(prev => [...prev, assistantMessage])
   // Scroll to bottom after adding response
   setTimeout(() => scrollToBottom(), 100)
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
  <div className="h-screen bg-white flex flex-col">
   <Header />
   
   <main className="flex-1 flex flex-col overflow-hidden">
    {chatHistory.length === 0 ? (
     /* Initial State - Centered */
     <div className="flex items-center justify-center flex-1 px-4 sm:px-6">
      <div className="w-full max-w-2xl mx-auto text-center">       
       {/* Title */}
       <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal text-gray-900 mb-3 sm:mb-4">
        Satya Agent
       </h1>
       
       {/* Subtitle */}
       <p className="text-gray-500 text-sm sm:text-base md:text-lg mb-8 sm:mb-10 md:mb-12 px-4">
        Your AI agent that can perform actions on the Satya platform - upload models, check marketplace, verify TEE, and more
       </p>
       
       {/* Search Form */}
       <form onSubmit={handleSubmit} className="mb-6 sm:mb-8">
        <div className="relative">
         <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about Satya platform..."
          disabled={isLoading}
          className="w-full px-10 sm:px-12 py-3 sm:py-4 pr-16 sm:pr-20 text-base sm:text-lg bg-gray-50 border-none rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-200 placeholder-gray-400 disabled:opacity-50"
         />
         
         {/* Plus button with upload menu */}
         <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2">
          <button
           type="button"
           onClick={() => setShowUploadMenu(!showUploadMenu)}
           className="text-gray-400 hover:text-gray-600 text-lg sm:text-xl"
          >
           +
          </button>
          
          {showUploadMenu && (
           <div className="absolute top-8 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-40 sm:min-w-48 z-10">
            <label className="flex items-center gap-2 px-2 sm:px-3 py-2 hover:bg-gray-50 rounded cursor-pointer">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="sm:w-4 sm:h-4">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
             </svg>
             <span className="text-sm sm:text-base">Upload AI Model</span>
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
          className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
         >
          {isLoading ? (
           <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          ) : (
           <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="sm:w-5 sm:h-5">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
           </svg>
          )}
         </button>
        </div>
       </form>
       
       {/* Suggested Queries */}
       <div className="space-y-2 sm:space-y-3">
        {suggestedQueries.map((suggestion, index) => (
         <button
          key={index}
          onClick={() => handleSuggestedQuery(suggestion)}
          disabled={isLoading}
          className="flex items-center w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-600 hover:bg-gray-50 rounded-lg transition-colors group disabled:opacity-50"
         >
          <svg 
           className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" 
           fill="none" 
           stroke="currentColor" 
           viewBox="0 0 24 24"
          >
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="leading-tight">{suggestion}</span>
         </button>
        ))}
       </div>
      </div>
     </div>
    ) : (
     /* Chat State - Fixed layout with auto-scroll */
     <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b border-gray-100 bg-white/95 backdrop-blur-sm sticky top-16 z-10 shrink-0">
       <div className="max-w-4xl mx-auto px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">Satya AI Assistant</h1>
        <p className="text-gray-500">Your AI helper for Satya platform</p>
       </div>
      </div>

      {/* Chat Messages - Scrollable */}
      <div 
       ref={chatMessagesRef}
       className="flex-1 overflow-y-auto"
      >
       <div className="max-w-4xl mx-auto w-full px-6 py-8 space-y-6 pb-20">
       {chatHistory.map((message, index) => (
        <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
         <div className={`max-w-[85%] sm:max-w-3xl rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${
          message.role === 'user' 
           ? 'bg-black text-white' 
           : 'bg-gray-100 text-gray-900'
         }`}>
          <p className={`whitespace-pre-wrap text-sm sm:text-base ${
           message.role === 'user' ? 'text-white' : 'text-gray-900'
          }`}>{message.content}</p>
          
          {/* Data Visualization for Assistant Messages */}
          {message.role === 'assistant' && message.data && (
           <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
            {message.dataType === 'pending_models' && (
             <div>
              <h4 className="font-semibold text-gray-900 mb-3">Your Pending Models ({message.data.length})</h4>
              {message.data.length > 0 ? (
               <div className="space-y-2 max-h-60 overflow-y-auto">
                {message.data.slice(0, 5).map((model: any, idx: number) => (
                 <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                   <p className="font-medium text-sm">Model {model.id?.slice(0, 8)}...</p>
                   <p className="text-xs text-gray-600">Status: Pending Verification</p>
                  </div>
                  <div className="text-xs text-gray-500">
                   {new Date().toLocaleDateString()}
                  </div>
                 </div>
                ))}
                {message.data.length > 5 && (
                 <p className="text-xs text-gray-500 text-center">+ {message.data.length - 5} more models</p>
                )}
               </div>
              ) : (
               <p className="text-gray-600 text-sm">No pending models found.</p>
              )}
             </div>
            )}
            
            {message.dataType === 'marketplace_models' && (
             <div>
              <h4 className="font-semibold text-gray-900 mb-3">Marketplace Models ({message.data.length})</h4>
              {message.data.length > 0 ? (
               <div className="space-y-2 max-h-60 overflow-y-auto">
                {message.data.slice(0, 5).map((model: any, idx: number) => (
                 <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                   <p className="font-medium text-sm">{model.title || `Model ${model.listingId?.slice(0, 8)}...`}</p>
                   <p className="text-xs text-gray-600">Price: {((parseFloat(model.downloadPrice || '0') / 1e9).toFixed(4))} SUI</p>
                  </div>
                  <div className="text-xs text-gray-500">
                   Listed: {new Date(model.timestamp).toLocaleDateString()}
                  </div>
                 </div>
                ))}
                {message.data.length > 5 && (
                 <p className="text-xs text-gray-500 text-center">+ {message.data.length - 5} more models</p>
                )}
               </div>
              ) : (
               <p className="text-gray-600 text-sm">No models found in marketplace.</p>
              )}
             </div>
            )}
            
            {message.dataType === 'dashboard_stats' && (
             <div>
              <h4 className="font-semibold text-gray-900 mb-3">Platform Statistics</h4>
              <div className="grid grid-cols-3 gap-4">
               <div className="text-center p-3 bg-blue-50 rounded">
                <p className="text-2xl font-bold text-blue-600">{message.data.pendingCount}</p>
                <p className="text-xs text-blue-700">Pending Models</p>
               </div>
               <div className="text-center p-3 bg-green-50 rounded">
                <p className="text-2xl font-bold text-green-600">{message.data.marketplaceCount}</p>
                <p className="text-xs text-green-700">Live Models</p>
               </div>
               <div className="text-center p-3 bg-purple-50 rounded">
                <p className="text-2xl font-bold text-purple-600">{message.data.totalModels}</p>
                <p className="text-xs text-purple-700">Total Models</p>
               </div>
              </div>
             </div>
            )}
           </div>
          )}
          
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
         <div className="bg-gray-100 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center space-x-1 sm:space-x-2">
           <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"></div>
           <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
           <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
         </div>
        </div>
       )}
       
       {/* Scroll anchor */}
       <div ref={chatEndRef} />
       </div>
      </div>

      {/* Fixed Chat Input */}
      <div className="border-t border-gray-100 bg-white/95 backdrop-blur-sm sticky bottom-0 shrink-0 z-20">
       <div className="max-w-4xl mx-auto px-6 py-4">
        <form onSubmit={handleSubmit}>
         <div className="relative">
          <input
           type="text"
           value={query}
           onChange={(e) => setQuery(e.target.value)}
           placeholder="Ask about Satya..."
           disabled={isLoading}
           className="w-full px-8 sm:px-10 py-3 sm:py-4 pr-10 sm:pr-12 text-base sm:text-lg bg-gray-50 border-none rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-200 placeholder-gray-400 disabled:opacity-50"
          />
          
          {/* Plus button with upload menu */}
          <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2">
           <button
            type="button"
            onClick={() => setShowUploadMenu(!showUploadMenu)}
            className="text-gray-400 hover:text-gray-600 text-base sm:text-lg"
           >
            +
           </button>
           
           {showUploadMenu && (
            <div className="absolute bottom-8 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-40 sm:min-w-48 z-30">
             <label className="flex items-center gap-2 px-2 sm:px-3 py-2 hover:bg-gray-50 rounded cursor-pointer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="sm:w-4 sm:h-4">
               <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
              <span className="text-sm sm:text-base">Upload AI Model</span>
              <input
               type="file"
               onChange={handleFileUpload}
               accept=".pkl,.pt,.pth,.h5,.onnx,.pb,.tflite,.json"
               className="hidden"
              />
             </label>
             <button
              onClick={() => {
               setQuery("Create new AI model from scratch")
               setShowUploadMenu(false)
              }}
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
          
          <button
           type="submit"
           disabled={!query.trim() || isLoading}
           className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
           {isLoading ? (
            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
           ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="sm:w-5 sm:h-5">
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