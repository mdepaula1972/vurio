import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

// Nos certificamos de que não inicializamos o cliente no client-side sem apiKey para segurança
export const openai = new OpenAI({
  apiKey: apiKey || "dummy-key-for-build-time",
});

// Helper de validação
export function checkOpenAIConfig() {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("[OpenAI] OPENAI_API_KEY is not defined in environment variables.");
    return false;
  }
  return true;
}
