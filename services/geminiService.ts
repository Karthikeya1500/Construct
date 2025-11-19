
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, TaskCategory } from '../types';

// Helper to sanitize JSON strings if they contain markdown code blocks
const cleanJsonString = (text: string): string => {
  return text.replace(/```json\n?|\n?```/g, '').trim();
};

export const analyzeTaskDescription = async (promptText: string): Promise<AIAnalysisResult | null> => {
  try {
    // Use process.env.API_KEY exclusively as per guidelines
    if (!process.env.API_KEY) {
      console.warn("API Key not found. Returning mock data for demo purposes.");
      // Fallback mock data if no key provided
      return {
        title: "Task based on description",
        description: promptText,
        budget: null,
        category: TaskCategory.OTHER,
        date: null,
        locationText: null
      };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Extract structured task data from the user description.
      
      Return a JSON object STRICTLY matching this schema:
      {
        "title": string,
        "description": string,
        "budget": number | null,
        "category": "Cleaning" | "Shifting" | "Helper" | "Repair" | "Delivery" | "Other",
        "date": string | null,
        "locationText": string | null
      }

      Rules:
      1. If budget is not mentioned, set "budget" to null.
      2. If date is not mentioned, set "date" to null.
      3. If location is not mentioned, set "locationText" to null.
      4. Infer the best "category" from the list.
      
      User Description: "${promptText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            budget: { type: Type.NUMBER, nullable: true },
            category: { type: Type.STRING, enum: Object.values(TaskCategory) },
            date: { type: Type.STRING, nullable: true },
            locationText: { type: Type.STRING, nullable: true }
          },
          required: ["title", "description", "category"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(cleanJsonString(text)) as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback on error
    return {
      title: "New Request",
      description: promptText,
      budget: null,
      category: TaskCategory.OTHER,
      date: null,
      locationText: null
    };
  }
};
