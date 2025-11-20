
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, TaskCategory } from '../types';

// Helper to sanitize JSON strings if they contain markdown code blocks
const cleanJsonString = (text: string): string => {
  // Remove markdown code blocks
  let cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
  // Sometimes model might output text before/after json, try to extract valid json object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
};

export const analyzeTaskDescription = async (promptText: string): Promise<AIAnalysisResult | null> => {
  try {
    // Use process.env.API_KEY exclusively as per guidelines
    if (!process.env.API_KEY) {
      console.warn("API Key not found. Returning mock data for demo purposes.");
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Fallback mock data if no key provided
      return {
        title: "Task from: " + promptText.substring(0, 20) + "...",
        description: promptText,
        budget: 50,
        category: TaskCategory.OTHER,
        date: "This Weekend",
        locationText: "123 Main St, Downtown",
        skills: ["General Help", "Communication"]
      };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an AI assistant for a gig marketplace app. 
      Extract structured task data from the user's raw description.
      
      User Description: "${promptText}"
      
      Task:
      1. Create a catchy Title.
      2. Write a professional Description.
      3. Estimate a fair Budget in USD (if not specified, estimate based on market rates for such a task).
      4. Select the best Category.
      5. Suggest a Date/Time (e.g., "This Weekend", "ASAP", or specific date if mentioned).
      6. List 2-4 required Skills for this job.
      7. Extract or suggest a location/address if mentioned, otherwise leave generic or null.
      
      Return a JSON object STRICTLY matching this schema:
      {
        "title": string,
        "description": string,
        "budget": number,
        "category": "Cleaning" | "Shifting" | "Helper" | "Repair" | "Delivery" | "Other",
        "date": string,
        "locationText": string | null,
        "skills": string[]
      }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            budget: { type: Type.NUMBER },
            category: { type: Type.STRING, enum: Object.values(TaskCategory) },
            date: { type: Type.STRING },
            locationText: { type: Type.STRING, nullable: true },
            skills: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["title", "description", "budget", "category", "date", "skills"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    const parsed = JSON.parse(cleanJsonString(text));
    return parsed as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback on error to prevent app crash
    return {
      title: "New Request",
      description: promptText,
      budget: 0,
      category: TaskCategory.OTHER,
      date: null,
      locationText: null,
      skills: []
    };
  }
};
