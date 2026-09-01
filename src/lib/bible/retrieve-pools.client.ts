import type { ContentAreaId } from "./content-areas";
import type { BibleLocale } from "./locale";
import { normalizePoolRef } from "./pool-ref";
import { pickPoolIndex } from "./pool-seed";
import type { BibleVerse, RetrievedPassage } from "./types";
import { loadVerses } from "./verse-lookup";

interface PoolFile {
  id: ContentAreaId;
  refs: string[];
}

const poolCache = new Map<ContentAreaId, string[]>();

async function loadPoolRefs(areaId: ContentAreaId): Promise<string[]> {
  const cached = poolCache.get(areaId);
  if (cached) return cached;

  const res = await fetch(`/data/pools/${areaId}.json`);
  if (!res.ok) return [];
  const data = (await res.json()) as PoolFile;
  const refs = data.refs.map(normalizePoolRef);
  poolCache.set(areaId, refs);
  return refs;
}

function findVerseByRef(
  verses: BibleVerse[],
  ref: string,
  locale: BibleLocale,
): BibleVerse | null {
  const normalized = normalizePoolRef(ref);

  if (locale === "sw") {
    const byEn = verses.find(
      (v) => v.refEn === normalized || v.refEn === ref,
    );
    if (byEn) return byEn;
  }

  return verses.find((v) => v.ref === normalized || v.ref === ref) ?? null;
}

export async function retrieveFromPools(
  areas: ContentAreaId[],
  locale: BibleLocale,
  limit = 8,
  seed = "",
): Promise<RetrievedPassage[]> {
  if (areas.length === 0) return [];

  const verses = await loadVerses(locale);
  const perArea = Math.max(4, Math.ceil(limit / areas.length));
  const seen = new Set<string>();
  const result: RetrievedPassage[] = [];

  for (const areaId of areas) {
    const refs = await loadPoolRefs(areaId);
    const start = pickPoolIndex(`${seed}:${areaId}`, refs.length);
    const ordered = [...refs.slice(start), ...refs.slice(0, start)];

    for (const ref of ordered.slice(0, perArea)) {
      if (seen.has(ref)) continue;
      const verse = findVerseByRef(verses, ref, locale);
      if (!verse) continue;
      seen.add(ref);
      result.push({
        ref: verse.ref,
        text: verse.text,
        refEn: verse.refEn ?? (locale === "en" ? verse.ref : undefined),
      });
      if (result.length >= limit) return result;
    }
  }

  return result;
}
