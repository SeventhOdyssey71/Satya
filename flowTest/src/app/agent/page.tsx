'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/ui/Header'
import { geminiModel } from '@/lib/gemini-client'
import { MarketplaceContractService } from '@/lib/services/marketplace-contract.service'
import { EventService } from '@/lib/services/event-service'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  data?: any
  dataType?: 'pending_models' | 'marketplace_models' | 'model_details' | 'dashboard_stats'
}

export default function AgentPage() {
 const [query, setQuery] = useState('')
 const [isLoading, setIsLoading] = useState(false)
 const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
 const [showUploadMenu, setShowUploadMenu] = useState(false)
 const [conversationContext, setConversationContext] = useState<{
   userExpertiseLevel: 'beginner' | 'intermediate' | 'expert' | 'unknown'
   recentTopics: string[]
   workflowState: any
   userPreferences: any
 }>({
   userExpertiseLevel: 'unknown',
   recentTopics: [],
   workflowState: null,
   userPreferences: {}
 })
 
 const marketplaceService = new MarketplaceContractService()
 const eventService = new EventService()
 
 // Analyze user expertise based on query patterns and vocabulary
 const analyzeUserExpertise = (query: string, currentLevel: 'beginner' | 'intermediate' | 'expert' | 'unknown'): 'beginner' | 'intermediate' | 'expert' | 'unknown' => {
   const expertTerms = ['smart contract', 'gas limit', 'tee verification', 'homomorphic', 'proof-of-stake', 'sgx', 'onnx', 'quantization', 'pruning']
   const intermediateTerms = ['verification', 'marketplace', 'quality score', 'blockchain', 'upload', 'pricing', 'optimization']
   const beginnerTerms = ['how to', 'what is', 'help me', 'guide', 'explain', 'simple']
   
   const expertCount = expertTerms.filter(term => query.toLowerCase().includes(term)).length
   const intermediateCount = intermediateTerms.filter(term => query.toLowerCase().includes(term)).length  
   const beginnerCount = beginnerTerms.filter(term => query.toLowerCase().includes(term)).length
   
   if (expertCount >= 2 || query.includes('API') || query.includes('SDK')) return 'expert'
   if (expertCount >= 1 || intermediateCount >= 2) return 'intermediate'
   if (beginnerCount >= 1 && expertCount === 0) return 'beginner'
   
   return currentLevel // Keep existing level if unclear
 }
 
 // Update conversation context with new interaction
 const updateConversationContext = (query: string, intent: string) => {
   setConversationContext(prev => {
     const newExpertiseLevel = analyzeUserExpertise(query, prev.userExpertiseLevel)
     const newTopics = [...prev.recentTopics, intent].slice(-5) // Keep last 5 topics
     
     return {
       ...prev,
       userExpertiseLevel: newExpertiseLevel,
       recentTopics: newTopics,
       workflowState: intent === 'pending_models' || intent === 'marketplace_models' ? 
         { lastDataFetch: Date.now(), intent } : prev.workflowState
     }
   })
 }
 
 // Enhanced AI knowledge integration
 const getAdvancedKnowledge = (userQuery: string, intent: string, userData: any) => {
   const queryLower = userQuery.toLowerCase()
   let enhancedKnowledge = ''
   
   // Technical Architecture Knowledge
   if (queryLower.includes('architecture') || queryLower.includes('technical') || queryLower.includes('how does')) {
     enhancedKnowledge += `
ADVANCED TECHNICAL CONTEXT:
SUI Blockchain uses Proof-of-Stake consensus with validator network and 100M-1B gas limits. Walrus Storage provides multi-node replication with automatic failover and content-addressed storage. TEE Security utilizes Intel SGX secure enclaves via Nautilus with zero-knowledge proofs for integrity. SEAL Encryption enables homomorphic computation for secure processing on encrypted models. Performance Targets include response time under 2 seconds, 99.5% upload success rate, and verification under 10 minutes.

INTEGRATION PATTERNS:
Event-driven architecture with WebSocket real-time updates. Parallel data fetching with Promise.allSettled error isolation. Intelligent caching with dependency tracking and smart invalidation. Exponential backoff retry logic for network resilience.
`
   }
   
   // User Experience & Interaction Patterns
   if (queryLower.includes('help') || queryLower.includes('guide') || queryLower.includes('how to')) {
     enhancedKnowledge += `
USER INTERACTION OPTIMIZATION:
Adaptive technical depth based on user expertise detected from vocabulary. Context preservation across conversation turns with intelligent memory. Multi-turn conversation support maintaining workflow state. Proactive assistance with predictive error prevention.

RESPONSE PERSONALIZATION:
For beginners: Conceptual explanations with analogies and step-by-step guidance. For intermediate users: Process explanations with practical examples and best practices. For experts: Implementation details with technical specifics and optimization techniques. For power users: Bulk operations, API-level control, and automation capabilities.
`
   }
   
   // Problem Resolution Knowledge
   if (queryLower.includes('error') || queryLower.includes('failed') || queryLower.includes('problem')) {
     enhancedKnowledge += `
INTELLIGENT ERROR RESOLUTION:
Graduated response follows this pattern: Auto-retry then guided troubleshooting then alternative approach then escalation. Context-preserving recovery maintains user workflow state and progress. Predictive error prevention based on usage patterns and platform metrics. Root cause analysis with specific solutions for each error category.

COMMON ISSUE PATTERNS:
Upload failures require file format validation, size optimization, and network stability checks. Verification delays need queue analysis, complexity assessment, and resource allocation review. Transaction errors involve gas estimation, balance validation, and contract interaction debugging. Performance issues require caching strategies, parallel processing optimization, and load balancing adjustments.
`
   }
   
   // Advanced Workflow Knowledge
   if (intent === 'pending_models' || intent === 'marketplace_models' || intent === 'platform_stats') {
     enhancedKnowledge += `
WORKFLOW INTELLIGENCE:
Multi-step task orchestration with conditional branching and error recovery. Parallel operation coordination with resource conflict resolution. State-based decision making adapting to platform and user context. Automated monitoring with proactive recommendations and insights.

DATA INTEGRATION EXCELLENCE:
Real-time data synchronization with confidence indicators. Intelligent filtering based on user intent and historical patterns. Progressive disclosure from overview to detailed analysis. Contextual memory utilization for conversation continuity.
`
   }
   
   return enhancedKnowledge
 }
 
 // Enhanced intent detection with sophisticated patterns
 const detectAdvancedIntent = (userQuery: string) => {
   const query = userQuery.toLowerCase()
   
   // Multi-intent detection
   const intents = []
   
   if (query.match(/(show|display|list|get).*pending|my models.*status/)) {
     intents.push('pending_models')
   }
   if (query.match(/(marketplace|available|browse).*models/)) {
     intents.push('marketplace_models')  
   }
   if (query.match(/(stats|statistics|count|how many|metrics)/)) {
     intents.push('platform_stats')
   }
   if (query.match(/(upload|add|create).*model/)) {
     intents.push('upload_guidance')
   }
   if (query.match(/(error|failed|problem|issue|troubleshoot)/)) {
     intents.push('troubleshooting')
   }
   if (query.match(/(optimize|improve|enhance|performance)/)) {
     intents.push('optimization')
   }
   if (query.match(/(price|pricing|cost|market)/)) {
     intents.push('pricing_analysis')
   }
   
   return intents.length > 0 ? intents[0] : 'general_query'
 }

 const suggestedQueries = [
  "Analyze my model performance and suggest optimizations",
  "What are the current market trends in computer vision models?", 
  "Help me troubleshoot my verification delays and optimize upload workflow"
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

   // Create enhanced AI context with advanced knowledge
   const advancedKnowledge = getAdvancedKnowledge(currentQuery, intent, fetchedData)
   
   const satyaContext = `You are Satya Agent - an advanced AI assistant with deep expertise in the Satya platform's architecture, user interaction patterns, and sophisticated problem-solving capabilities.

🧠 CONVERSATION INTELLIGENCE:
- User Expertise Level: ${conversationContext.userExpertiseLevel}
- Recent Topics: ${conversationContext.recentTopics.join(', ') || 'None'}
- Conversation History: ${chatHistory.length} previous exchanges
- Current Intent: ${intent}

📈 ADAPTIVE BEHAVIOR INSTRUCTIONS:
Based on user expertise level "${conversationContext.userExpertiseLevel}":
${conversationContext.userExpertiseLevel === 'beginner' ? 
`- Use simple, clear language with analogies
- Provide step-by-step guidance
- Explain technical concepts thoroughly
- Offer reassurance and encouragement` :
conversationContext.userExpertiseLevel === 'intermediate' ?
`- Use moderate technical terminology
- Provide practical examples and best practices
- Focus on workflow optimization
- Explain reasoning behind recommendations` :
conversationContext.userExpertiseLevel === 'expert' ?
`- Use precise technical language
- Provide implementation details
- Offer advanced optimization techniques
- Reference specific architecture components` :
`- Adapt dynamically based on query complexity
- Provide balanced technical depth
- Include both simple and advanced options`}

   ${fetchedData ? `
🔄 REAL-TIME PLATFORM DATA:
${JSON.stringify(fetchedData, null, 2)}

📊 DATA INSIGHTS: Use this current data to provide specific, actionable responses with exact numbers and status information.
` : ''}

${advancedKnowledge}

CRITICAL FORMATTING INSTRUCTION: Respond with clean, clear text only. Do NOT use any markdown formatting, bullet points, asterisks, hashtags, or special symbols. Write in plain text with natural paragraphs and clear sentences.

ENHANCED RESPONSE GUIDELINES:

INTELLIGENT RESPONSE ADAPTATION:
Detect user expertise level from vocabulary and question complexity. Match technical depth to user's demonstrated knowledge level. Provide context-aware responses that build on conversation history. Anticipate follow-up questions and provide comprehensive initial responses. Use progressive disclosure: overview then details then implementation specifics.

ADVANCED QUERY PROCESSING:
Analyze multi-faceted queries and address all components systematically. Identify underlying user goals beyond surface-level questions. Provide proactive suggestions based on detected user patterns and platform state. Offer alternative approaches when primary solutions may have limitations.

INTELLIGENT ACTION EXECUTION:
Suggest specific next steps with clear, actionable guidance. Predict potential issues and provide preventive recommendations. Integrate real-time data seamlessly into conversational responses. Maintain conversation context while executing platform operations.

SOPHISTICATED DATA PRESENTATION:
Organize information using visual hierarchies and progressive disclosure. Highlight key insights and actionable items prominently. Provide comparative analysis when multiple options exist. Use contextual examples that match user's specific situation.

PROACTIVE ERROR PREVENTION:
Identify potential issues before they occur based on usage patterns. Suggest optimizations and best practices contextually. Provide graduated guidance from simple fixes to advanced solutions. Maintain conversation continuity even when services are degraded.

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

   User question: ${currentQuery}`

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

   const assistantMessage: ChatMessage = {
    role: 'assistant',
    content: cleanResponse,
    timestamp: new Date(),
    data: fetchedData,
    dataType: dataType as any
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