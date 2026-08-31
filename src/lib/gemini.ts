import { GoogleGenerativeAI } from "@google/generative-ai";

export function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

export function getModel(): string {
  return process.env.GEMINI_MODEL ?? "gemini-3.6-flash";
}

export function isAIConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}
