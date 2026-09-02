import type { ContentAreaId } from "./content-areas";
import type { BibleLocale } from "./locale";
import type { RetrievedPassage } from "./types";

const bundleCache = new Map<string, RetrievedPassage[]>();

function cacheKey(locale: BibleLocale, areaId: ContentAreaId): string {
  return `${locale}:${areaId}`;
}

/** Precomputed verses for a theme/topic — small JSON, no full Bible index. */
export async function loadAreaVerseBundle(
  areaId: ContentAreaId,
  locale: BibleLocale,
): Promise<RetrievedPassage[]> {
  const key = cacheKey(locale, areaId);
  const cached = bundleCache.get(key);
  if (cached) return cached;

  try {
    const res = await fetch(`/data/areas/${locale}/${areaId}.json`, {
      cache: "force-cache",
    });
    if (res.ok) {
      const data = (await res.json()) as { verses?: RetrievedPassage[] };
      const verses = data.verses ?? [];
      bundleCache.set(key, verses);
      return verses;
    }
  } catch {
    /* offline or missing bundle */
  }

  return [];
}
