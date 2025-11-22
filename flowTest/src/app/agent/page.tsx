'use client'

import { useState } from 'react'
import Header from '@/components/ui/Header'

export default function AgentPage() {
 const [query, setQuery] = useState('')

 const suggestedQueries = [
  "Free local events happening this week",
  "Make a table comparing memory foam vs hybrid mattresses", 
  "How do I get started playing padel?"
 ]

 const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  // TODO: Implement agent query handling
  console.log('Query submitted:', query)
 }

 const handleSuggestedQuery = (suggestion: string) => {
  setQuery(suggestion)
 }

 return (
  <div className="min-h-screen bg-white pt-16">
   <Header />
   
   <main className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-6">
    <div className="w-full max-w-2xl mx-auto text-center">
     {/* Title */}
     <h1 className="text-5xl font-normal text-gray-900 mb-4">
      Meet AI Mode
     </h1>
     
     {/* Subtitle */}
     <p className="text-gray-500 text-lg mb-12">
      Ask detailed questions for better responses
     </p>
     
     {/* Search Form */}
     <form onSubmit={handleSubmit} className="mb-8">
      <div className="relative">
       <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask anything"
        className="w-full px-6 py-4 pr-20 text-lg bg-gray-50 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-200 placeholder-gray-400"
       />
       
       {/* Add button */}
       <button
        type="button"
        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl"
       >
        +
       </button>
       
       {/* Microphone button */}
       <button
        type="button"
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
       >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
         <path d="M12 2C10.34 2 9 3.34 9 5v6c0 1.66 1.34 3 3 3s3-1.34 3-3V5c0-1.66-1.34-3-3-3z"/>
         <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
       </button>
      </div>
     </form>
     
     {/* Suggested Queries */}
     <div className="space-y-3">
      {suggestedQueries.map((suggestion, index) => (
       <button
        key={index}
        onClick={() => handleSuggestedQuery(suggestion)}
        className="flex items-center w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors group"
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
   </main>
  </div>
 )
}