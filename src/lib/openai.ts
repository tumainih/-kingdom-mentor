import OpenAI from "openai";

export function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export function getModel(): string {
  return process.env.OPENAI_MODEL ?? "gpt-4o";
}
