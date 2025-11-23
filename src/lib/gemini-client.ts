import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// Create a safe gemini client that doesn't throw during import
let geminiModel: any = null;
let isGeminiAvailable = false;

if (apiKey) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    isGeminiAvailable = true;
  } catch (error) {
    console.warn('Failed to initialize Gemini client:', error);
    isGeminiAvailable = false;
  }
} else {
  console.warn('NEXT_PUBLIC_GEMINI_API_KEY is not set. Gemini features will be disabled.');
}

export { geminiModel, isGeminiAvailable };

// Helper function to check if Gemini is available
export function checkGeminiAvailability(): { available: boolean; error?: string } {
  if (!apiKey) {
    return { 
      available: false, 
      error: 'GEMINI_API_KEY is not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY in your environment variables.' 
    };
  }
  
  if (!isGeminiAvailable || !geminiModel) {
    return { 
      available: false, 
      error: 'Gemini client failed to initialize. Please check your API key.' 
    };
  }
  
  return { available: true };
}
