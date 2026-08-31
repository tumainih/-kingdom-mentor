import { getModel, isAIConfigured } from "@/lib/gemini";

export async function GET() {
  const hasGemini = isAIConfigured();

  return Response.json({
    aiReady: true,
    mode: hasGemini ? "gemini" : "free",
    provider: hasGemini ? "gemini" : "free-guidance",
    model: hasGemini ? getModel() : "kjv-templates",
    freeFallback: true,
  });
}
