import "@/lib/bible/init-server";
import { getModel, isAIConfigured } from "@/lib/gemini";
import { getBibleStats } from "@/lib/bible/retrieval";
import { parseLocale } from "@/lib/bible/locale";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = parseLocale(searchParams.get("locale") ?? "en");
  const hasGemini = isAIConfigured();
  const bible = await getBibleStats(locale);

  return Response.json({
    aiReady: isAIConfigured(),
    mode: hasGemini ? "gemini" : "unavailable",
    provider: hasGemini ? "gemini" : "offline",
    model: hasGemini ? getModel() : null,
    verseLookup: true,
    locale,
    bible,
  });
}
