import { getModel, isAIConfigured } from "@/lib/gemini";

export async function GET() {
  return Response.json({
    aiReady: isAIConfigured(),
    provider: "gemini",
    model: getModel(),
  });
}
