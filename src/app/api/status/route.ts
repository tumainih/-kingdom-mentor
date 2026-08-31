import { getOpenAIClient, getModel } from "@/lib/openai";

export async function GET() {
  const client = getOpenAIClient();
  return Response.json({
    aiReady: Boolean(client),
    model: getModel(),
  });
}
