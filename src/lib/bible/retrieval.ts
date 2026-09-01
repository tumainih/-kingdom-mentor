import Fuse from "fuse.js";
import type { BibleLocale } from "./locale";
import type { ContentAreaId } from "./content-areas";
import { AREA_KEYWORDS } from "./content-areas";
import { loadVerses } from "./verse-lookup";
import {
  detectNarrative,
  retrieveNarrativePassages,
  narrativeTitle,
} from "./narratives";
import type { BibleVerse, RetrievedPassage } from "./types";
import { lookupVerseReference } from "./verse-lookup";
import { detectContentAreas } from "./verse-pools-detect";
import { bridgeSearchTerms } from "./topic-bridges";
import { retrieveFromPools as retrieveFromPoolsClient } from "./retrieve-pools.client";

export type { BibleLocale };

/** @deprecated Use AREA_KEYWORDS from content-areas.ts */
const TOPIC_KEYWORDS = AREA_KEYWORDS;

const WEAK_SINGLE_WORDS = new Set([
  "about", "accuse", "after", "also", "been", "before", "being", "could",
  "does", "feel", "felt", "from", "full", "good", "have", "help", "here",
  "just", "know", "like", "lord", "make", "more", "much", "natural", "need",
  "shall", "should", "some", "that", "their", "them", "then", "there", "these",
  "they", "this", "those", "very", "want", "what", "when", "where", "which",
  "without", "with", "would", "write", "your", "user", "assistant", "kingdom",
  "story", "stories", "tell", "hadithi", "simulia", "eleza", "kuhusu",
  "nina", "nime", "yangu", "yako", "yetu", "wao", "hii", "hiyo", "hilo",
  "kwamba", "kama", "pia", "sana", "tu", "bado", "hapa", "hapo",
]);

const STOP_WORDS = new Set([
  "about", "again", "been", "could", "does", "from", "have", "help", "here",
  "just", "like", "make", "more", "much", "need", "should", "some", "that",
  "their", "them", "then", "there", "these", "they", "this", "very", "want",
  "what", "when", "where", "which", "with", "would", "your",
  "nina", "nime", "yangu", "yako", "yetu", "wao", "hii", "hiyo", "kwamba",
  "kama", "pia", "sana", "tu", "bado", "hapa", "na", "ya", "wa", "ni",
]);

const fuseCache = new Map<BibleLocale, Fuse<BibleVerse>>();

const STRONG_MATCH_MAX_SCORE = 0.28;
const FALLBACK_MAX_SCORE = 0.38;
const LAST_RESORT_MAX_SCORE = 0.55;
const MIN_PASSAGES = 4;

async function getFuse(locale: BibleLocale): Promise<Fuse<BibleVerse>> {
  const cached = fuseCache.get(locale);
  if (cached) return cached;

  const verses = await loadVerses(locale);
  const fuse = new Fuse(verses, {
    keys: [{ name: "text", weight: 0.85 }, { name: "ref", weight: 0.15 }],
    threshold: 0.32,
    includeScore: true,
    ignoreLocation: false,
    minMatchCharLength: locale === "sw" ? 3 : 4,
    distance: 80,
  });
  fuseCache.set(locale, fuse);
  return fuse;
}

function extractSearchQueries(userText: string): string[] {
  const queries = new Set<string>();
  const cleaned = userText.toLowerCase().trim();
  if (!cleaned) return [];

  if (cleaned.length >= 12) {
    queries.add(userText.trim().slice(0, 200));
  }

  const words = cleaned
    .replace(/[^\w\s']/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  if (words.length >= 2) {
    queries.add(words.slice(0, 5).join(" "));
    queries.add(words.slice(0, 3).join(" "));
  }

  for (const word of words.slice(0, 6)) {
    if (!WEAK_SINGLE_WORDS.has(word)) queries.add(word);
  }

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (
      cleaned.includes(topic) ||
      keywords.some((kw) => cleaned.includes(kw))
    ) {
      for (const kw of keywords) queries.add(kw);
    }
  }

  for (const term of bridgeSearchTerms(userText)) {
    queries.add(term);
  }

  const refMatch = userText.match(
    /(\d?\s?[A-Za-z\u00C0-\u024F]+)\s+(\d+):(\d+)(?:-(\d+))?/,
  );
  if (refMatch) queries.add(refMatch[0]);

  return [...queries].slice(0, 10);
}

function fuseRankedPassages(
  fuse: Fuse<BibleVerse>,
  queries: string[],
  limit: number,
  locale: BibleLocale,
): RetrievedPassage[] {
  const scored = new Map<string, { verse: BibleVerse; score: number }>();

  for (const query of queries) {
    const perQueryLimit = query.split(/\s+/).length >= 2 ? 8 : 5;
    for (const result of fuse.search(query, { limit: perQueryLimit })) {
      const existing = scored.get(result.item.ref);
      const score = result.score ?? 1;
      if (!existing || score < existing.score) {
        scored.set(result.item.ref, { verse: result.item, score });
      }
    }
  }

  let ranked = [...scored.values()]
    .filter(({ score }) => score <= STRONG_MATCH_MAX_SCORE)
    .sort((a, b) => a.score - b.score);

  if (ranked.length < MIN_PASSAGES) {
    const fallback = [...scored.values()]
      .filter(({ score }) => score <= FALLBACK_MAX_SCORE)
      .sort((a, b) => a.score - b.score);
    ranked = dedupeRanked([...ranked, ...fallback]);
  }

  if (ranked.length < MIN_PASSAGES) {
    const lastResort = [...scored.values()]
      .filter(({ score }) => score <= LAST_RESORT_MAX_SCORE)
      .sort((a, b) => a.score - b.score);
    ranked = dedupeRanked([...ranked, ...lastResort]);
  }

  if (ranked.length < MIN_PASSAGES) {
    ranked = [...scored.values()].sort((a, b) => a.score - b.score);
  }

  return dedupeByRef(ranked.slice(0, limit).map(({ verse }) => verse)).map(
    (v) => ({
      ref: v.ref,
      text: v.text,
      refEn: v.refEn ?? (locale === "en" ? v.ref : undefined),
    }),
  );
}

function dedupeRanked(
  ranked: { verse: BibleVerse; score: number }[],
): { verse: BibleVerse; score: number }[] {
  const seen = new Set<string>();
  const out: { verse: BibleVerse; score: number }[] = [];
  for (const item of ranked) {
    if (seen.has(item.verse.ref)) continue;
    seen.add(item.verse.ref);
    out.push(item);
  }
  return out;
}

async function retrieveFromPoolAreas(
  areas: ContentAreaId[],
  locale: BibleLocale,
  limit: number,
  userText: string,
): Promise<RetrievedPassage[]> {
  if (areas.length === 0) return [];
  if (typeof window !== "undefined") {
    return retrieveFromPoolsClient(areas, locale, limit, userText);
  }
  return (
    await import("./verse-pools.server")
  ).retrieveFromPoolsServer(areas, locale, limit, userText);
}

function dedupeByRef(verses: BibleVerse[]): BibleVerse[] {
  const seen = new Set<string>();
  const result: BibleVerse[] = [];
  for (const v of verses) {
    if (!seen.has(v.ref)) {
      seen.add(v.ref);
      result.push(v);
    }
  }
  return result;
}

function mergePassages(
  primary: RetrievedPassage[],
  extra: RetrievedPassage[],
  limit: number,
): RetrievedPassage[] {
  const seen = new Set(primary.map((p) => p.ref));
  const merged = [...primary];
  for (const p of extra) {
    if (seen.has(p.ref)) continue;
    seen.add(p.ref);
    merged.push(p);
    if (merged.length >= limit) break;
  }
  return merged.slice(0, limit);
}

export function buildRetrievalQueryFromMessages(
  messages: { role: string; content: string }[],
): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user" && messages[i].content.trim()) {
      return messages[i].content.trim();
    }
  }
  return messages[messages.length - 1]?.content.trim() ?? "";
}

export async function getBibleStats(locale: BibleLocale = "en") {
  const verses = await loadVerses(locale);
  return {
    verses: verses.length,
    books: new Set(verses.map((v) => v.book)).size,
    locale,
  };
}

export async function retrieveScripture(
  userText: string,
  limit = 8,
  locale: BibleLocale = "en",
): Promise<RetrievedPassage[]> {
  const verseLookup = await lookupVerseReference(userText, locale);
  if (verseLookup.passages.length > 0) {
    return verseLookup.passages;
  }

  const allVerses = await loadVerses(locale);

  const narrative = detectNarrative(userText, locale);
  if (narrative) {
    return retrieveNarrativePassages(narrative, locale, allVerses, Math.max(limit, 15));
  }

  const areas = detectContentAreas(userText);
  const fuse = await getFuse(locale);
  const queries = extractSearchQueries(userText);

  let passages: RetrievedPassage[] = [];

  if (areas.length > 0) {
    passages = await retrieveFromPoolAreas(areas, locale, limit, userText);
  }

  if (queries.length > 0) {
    const fusePassages = fuseRankedPassages(fuse, queries, limit, locale);
    passages = mergePassages(passages, fusePassages, limit);
  }

  if (passages.length < MIN_PASSAGES && areas.length === 0) {
    const wisdomFallback = await retrieveFromPoolAreas(
      ["wisdom", "guidance", "trust"],
      locale,
      limit,
      userText,
    );
    passages = mergePassages(passages, wisdomFallback, limit);
  }

  return passages.slice(0, limit);
}

export function formatScriptureBlock(
  passages: RetrievedPassage[],
  locale: BibleLocale = "en",
): string {
  return passages
    .map((p) => {
      const label =
        locale === "sw" && p.refEn ? `${p.ref} (${p.refEn})` : p.ref;
      return `**${label}** — ${p.text}`;
    })
    .join("\n\n");
}

export async function retrieveAndFormat(
  userText: string,
  locale: BibleLocale = "en",
): Promise<{ passages: RetrievedPassage[]; block: string; narrative?: string; verseLookup?: boolean }> {
  const verseLookup = await lookupVerseReference(userText, locale);
  if (verseLookup.passages.length > 0) {
    return {
      passages: verseLookup.passages,
      block: formatScriptureBlock(verseLookup.passages, locale),
      verseLookup: true,
    };
  }

  const narrative = detectNarrative(userText, locale);
  const passages = await retrieveScripture(userText, narrative ? 18 : 8, locale);
  return {
    passages,
    block: formatScriptureBlock(passages, locale),
    narrative: narrative ? narrativeTitle(narrative, locale) : undefined,
  };
}
