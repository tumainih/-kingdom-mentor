import "@/lib/bible/init-server";
import type { ContentAreaId } from "@/lib/bible/content-areas";
import { CONTENT_AREA_IDS } from "@/lib/bible/content-areas";
import { parseLocale } from "@/lib/bible/locale";
import {
  getPoolCount,
  retrieveFromPoolsServer,
} from "@/lib/bible/verse-pools.server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = parseLocale(searchParams.get("locale") ?? "en");
  const area = searchParams.get("area") as ContentAreaId | null;

  if (!area || !CONTENT_AREA_IDS.includes(area)) {
    return Response.json({ error: "Invalid area." }, { status: 400 });
  }

  const limit = getPoolCount(area);
  const verses = await retrieveFromPoolsServer([area], locale, limit);

  return Response.json({ area, locale, verses });
}
