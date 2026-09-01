import type { ContentAreaId } from "./content-areas";
import { AREA_KEYWORDS, CONTENT_AREA_IDS } from "./content-areas";

export function detectContentAreas(text: string): ContentAreaId[] {
  const cleaned = text.toLowerCase().trim();
  if (!cleaned) return [];

  const matched: ContentAreaId[] = [];
  for (const areaId of CONTENT_AREA_IDS) {
    const keywords = AREA_KEYWORDS[areaId];
    if (
      cleaned.includes(areaId) ||
      keywords.some((kw) => cleaned.includes(kw.toLowerCase()))
    ) {
      matched.push(areaId);
    }
  }
  return matched;
}
