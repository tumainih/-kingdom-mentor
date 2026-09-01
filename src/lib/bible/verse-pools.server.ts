import { readFileSync } from "node:fs";
import path from "node:path";
import type { ContentAreaId } from "./content-areas";
import { AREA_LABELS } from "./content-areas";
import type { HourlyThemeId } from "./hourly-themes";
import { hourlyPoolSeed, pickPoolIndex } from "./pool-seed";
import { normalizePoolRef, findVerseByPoolRef } from "./pool-ref";
import type { BibleLocale } from "./locale";
import type { BibleVerse, RetrievedPassage } from "./types";
import { loadVerses } from "./verse-lookup";

export interface VersePoolMeta {
  id: ContentAreaId;
  labelEn: string;
  labelSw: string;
  count: number;
  kind: "theme" | "topic";
}

export interface VersePoolIndex {
  areas: VersePoolMeta[];
}

interface VersePoolFile {
  id: ContentAreaId;
  refs: string[];
}

const poolRefsCache = new Map<ContentAreaId, string[]>();
let poolIndexCache: VersePoolIndex | null = null;

function poolsDataDir(): string {
  return path.join(process.cwd(), "data", "verse-pools");
}

function readPoolFile(areaId: ContentAreaId): string[] {
  const cached = poolRefsCache.get(areaId);
  if (cached) return cached;

  const filePath = path.join(poolsDataDir(), `${areaId}.json`);
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as VersePoolFile;
  const refs = raw.refs.map(normalizePoolRef);
  poolRefsCache.set(areaId, refs);
  return refs;
}

export function getPoolRefs(areaId: ContentAreaId): string[] {
  return readPoolFile(areaId);
}

export function getPoolIndex(): VersePoolIndex {
  if (poolIndexCache) return poolIndexCache;
  const raw = JSON.parse(
    readFileSync(path.join(poolsDataDir(), "index.json"), "utf8"),
  ) as VersePoolIndex;
  poolIndexCache = raw;
  return raw;
}

export function getPoolCount(areaId: ContentAreaId): number {
  return getPoolRefs(areaId).length;
}

export function areaLabel(areaId: ContentAreaId, locale: BibleLocale): string {
  return AREA_LABELS[areaId][locale];
}

export function pickRefFromPool(
  areaId: ContentAreaId,
  seed: string,
): string | null {
  const refs = getPoolRefs(areaId);
  if (refs.length === 0) return null;
  return refs[pickPoolIndex(seed, refs.length)] ?? null;
}

export function pickHourlyRef(
  theme: HourlyThemeId,
  date: string,
  hour: number,
): string | null {
  return pickRefFromPool(theme, hourlyPoolSeed(theme, date, hour));
}

function findVerseByRef(
  verses: BibleVerse[],
  ref: string,
  locale: BibleLocale,
): BibleVerse | null {
  return findVerseByPoolRef(verses, ref, locale);
}

export async function resolvePoolRef(
  ref: string,
  locale: BibleLocale,
): Promise<RetrievedPassage | null> {
  const verses = await loadVerses(locale);
  const verse = findVerseByRef(verses, ref, locale);
  if (!verse) return null;
  return {
    ref: verse.ref,
    text: verse.text,
    refEn: verse.refEn ?? (locale === "en" ? verse.ref : undefined),
  };
}

export async function retrieveFromPoolsServer(
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
    const refs = getPoolRefs(areaId);
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
