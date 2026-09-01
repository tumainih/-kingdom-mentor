import type { ContentAreaId } from "./content-areas";
import type { HourlyThemeId } from "./hourly-themes";
import type { BibleLocale } from "./locale";
import { hourlyPoolSeed, pickPoolIndex } from "./pool-seed";
import type { BibleVerse, RetrievedPassage } from "./types";
import { normalizePoolRef } from "./pool-ref";

interface PoolFile {
  id: ContentAreaId;
  refs: string[];
}

const poolCache = new Map<string, string[]>();
const verseIndexCache = new Map<BibleLocale, BibleVerse[]>();

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

async function loadVerseIndex(locale: BibleLocale): Promise<BibleVerse[]> {
  const cached = verseIndexCache.get(locale);
  if (cached) return cached;

  const file = locale === "sw" ? "swahili-index.json" : "kjv-index.json";
  const res = await fetch(`/data/${file}`);
  if (!res.ok) return [];
  const data = (await res.json()) as BibleVerse[];
  verseIndexCache.set(locale, data);
  return data;
}

function findVerse(
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

export async function resolveHourlyVerseClient(
  theme: HourlyThemeId,
  locale: BibleLocale,
  hour: number,
  date: string,
): Promise<{
  scheduledRef: string;
  poolSize: number;
  passage: RetrievedPassage | null;
}> {
  const refs = await loadPoolRefs(theme);
  if (refs.length === 0) {
    return { scheduledRef: "", poolSize: 0, passage: null };
  }

  const seed = hourlyPoolSeed(theme, date, hour);
  const scheduledRef = refs[pickPoolIndex(seed, refs.length)] ?? refs[0];
  const verses = await loadVerseIndex(locale);
  const verse = findVerse(verses, scheduledRef, locale);

  if (!verse) {
    return { scheduledRef, poolSize: refs.length, passage: null };
  }

  return {
    scheduledRef,
    poolSize: refs.length,
    passage: {
      ref: verse.ref,
      text: verse.text,
      refEn: verse.refEn ?? (locale === "en" ? verse.ref : undefined),
    },
  };
}

export async function resolveAreaPoolVerses(
  areaId: ContentAreaId,
  locale: BibleLocale,
): Promise<RetrievedPassage[]> {
  const refs = await loadPoolRefs(areaId);
  const verses = await loadVerseIndex(locale);
  const result: RetrievedPassage[] = [];

  for (const ref of refs) {
    const verse = findVerse(verses, ref, locale);
    if (!verse) continue;
    result.push({
      ref: verse.ref,
      text: verse.text,
      refEn: verse.refEn ?? (locale === "en" ? verse.ref : undefined),
    });
  }

  return result;
}

export async function fetchPoolIndex(): Promise<
  { id: ContentAreaId; count: number; labelEn: string; labelSw: string; kind: string }[]
> {
  const res = await fetch("/data/pools/index.json");
  if (!res.ok) return [];
  const data = (await res.json()) as {
    areas: {
      id: ContentAreaId;
      count: number;
      labelEn: string;
      labelSw: string;
      kind: string;
    }[];
  };
  return data.areas;
}

export { localDateString } from "./pool-seed";
