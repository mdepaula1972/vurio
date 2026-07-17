import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

// Inicializa o cliente Gemini com chave fallback para tempo de build
export const genAI = new GoogleGenerativeAI(apiKey || "dummy-key-for-build-time");

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

// Helper de verificação
export function checkGeminiConfig() {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("[Gemini] GEMINI_API_KEY is not defined in environment variables.");
    return false;
  }
  return true;
}
