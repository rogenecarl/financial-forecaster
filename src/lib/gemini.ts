import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables");
}

// Initialize the client
export const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// Model configuration
export const MODEL_NAME =  "gemini-2.5-flash";
