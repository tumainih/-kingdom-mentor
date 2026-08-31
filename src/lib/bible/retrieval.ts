import Fuse from "fuse.js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { BibleLocale } from "./locale";
import {
  detectNarrative,
  retrieveNarrativePassages,
  narrativeTitle,
} from "./narratives";
import type { BibleVerse, RetrievedPassage } from "./types";
import { lookupVerseReference } from "./verse-lookup";

export type { BibleLocale };

const TOPIC_KEYWORDS: Record<string, string[]> = {
  forgiveness: ["forgive", "mercy", "pardon", "reconcile", "msamaha", "samehe"],
  anger: ["anger", "wrath", "slow to anger", "hasira", "ghadhabu"],
  love: ["love one another", "charity", "beloved", "upendo", "penda"],
  wisdom: ["wisdom", "understanding", "prudent", "wise", "hekima", "busara"],
  fear: ["fear not", "afraid", "anxious", "trust in the lord", "ogopa", "wasiwasi", "hofu"],
  marriage: ["husband", "wife", "marriage", "adultery", "mume", "mke", "ndoa"],
  prayer: ["pray", "prayer", "supplication", "omba", "sala", "ombea"],
  faith: ["faith", "believe", "trust", "imani", "amini"],
  doubt: ["doubt", "unbelief", "shaka", "waswas"],
  guilt: ["guilty", "repent", "forgive", "confess", "hatia", "toba"],
  grief: ["grief", "mourn", "loss", "huzuni", "ombolezo", "faraja"],
  peace: ["peace", "comfort", "amani", "faraja"],
};

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

const verseCache = new Map<BibleLocale, BibleVerse[]>();
const fuseCache = new Map<BibleLocale, Fuse<BibleVerse>>();

async function loadVerses(locale: BibleLocale): Promise<BibleVerse[]> {
  const cached = verseCache.get(locale);
  if (cached) return cached;

  const file =
    locale === "sw" ? "swahili-index.json" : "kjv-index.json";
  const indexPath = path.join(process.cwd(), "data", file);
  const raw = await readFile(indexPath, "utf8");
  const verses = JSON.parse(raw) as BibleVerse[];
  verseCache.set(locale, verses);
  return verses;
}

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

  const refMatch = userText.match(
    /(\d?\s?[A-Za-z\u00C0-\u024F]+)\s+(\d+):(\d+)(?:-(\d+))?/,
  );
  if (refMatch) queries.add(refMatch[0]);

  return [...queries].slice(0, 6);
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

const STRONG_MATCH_MAX_SCORE = 0.28;
const FALLBACK_MAX_SCORE = 0.38;

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

  const fuse = await getFuse(locale);
  const queries = extractSearchQueries(userText);
  if (queries.length === 0) return [];

  const scored = new Map<string, { verse: BibleVerse; score: number }>();

  for (const query of queries) {
    const perQueryLimit = query.split(/\s+/).length >= 2 ? 6 : 4;
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

  if (ranked.length === 0) {
    ranked = [...scored.values()]
      .filter(({ score }) => score <= FALLBACK_MAX_SCORE)
      .sort((a, b) => a.score - b.score);
  }

  return dedupeByRef(ranked.slice(0, limit).map(({ verse }) => verse)).map(
    (v) => ({
      ref: v.ref,
      text: v.text,
      refEn: v.refEn ?? (locale === "en" ? v.ref : undefined),
    }),
  );
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
