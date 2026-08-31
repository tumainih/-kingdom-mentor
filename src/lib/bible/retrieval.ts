import Fuse from "fuse.js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { BibleVerse, RetrievedPassage } from "./types";

const TOPIC_KEYWORDS: Record<string, string[]> = {
  forgiveness: ["forgive", "mercy", "pardon", "reconcile"],
  anger: ["anger", "wrath", "slow to anger", "temper"],
  love: ["love one another", "charity", "beloved"],
  wisdom: ["wisdom", "understanding", "prudent", "wise"],
  fear: ["fear not", "afraid", "anxious", "trust in the lord"],
  pride: ["pride", "humble", "humility", "exalt himself"],
  money: ["money", "riches", "treasure", "covetous"],
  marriage: ["husband", "wife", "marriage", "adultery"],
  work: ["work", "labor", "diligent", "slothful"],
  prayer: ["pray", "prayer", "supplication"],
  temptation: ["temptation", "escape", "overcome evil"],
  grief: ["mourn", "comfort", "sorrow", "weep"],
  justice: ["justice", "judgment", "righteous", "equity"],
  revenge: ["revenge", "vengeance", "repay evil"],
  honesty: ["truth", "lie", "honest", "deceit"],
  patience: ["patience", "longsuffering", "wait on the lord"],
  faith: ["faith", "believe", "trust in the lord"],
  obedience: ["obey", "commandment", "do his will"],
  doubt: ["doubt", "unbelief", "faith", "trust"],
  guilt: ["guilty", "repent", "forgive", "confess"],
};

/** Words that match too many unrelated KJV verses when searched alone. */
const WEAK_SINGLE_WORDS = new Set([
  "about",
  "accuse",
  "accusers",
  "after",
  "also",
  "been",
  "before",
  "being",
  "could",
  "does",
  "doing",
  "feel",
  "felt",
  "from",
  "full",
  "good",
  "have",
  "help",
  "here",
  "just",
  "know",
  "like",
  "lord",
  "make",
  "more",
  "much",
  "natural",
  "need",
  "none",
  "shall",
  "should",
  "some",
  "that",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "those",
  "thine",
  "very",
  "want",
  "what",
  "when",
  "where",
  "which",
  "without",
  "with",
  "would",
  "write",
  "your",
  "user",
  "assistant",
  "kingdom",
]);

const STOP_WORDS = new Set([
  "about",
  "again",
  "been",
  "could",
  "does",
  "from",
  "have",
  "help",
  "here",
  "just",
  "like",
  "make",
  "more",
  "much",
  "need",
  "should",
  "some",
  "that",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "very",
  "want",
  "what",
  "when",
  "where",
  "which",
  "with",
  "would",
  "your",
]);

let cachedVerses: BibleVerse[] | null = null;
let cachedFuse: Fuse<BibleVerse> | null = null;

async function loadVerses(): Promise<BibleVerse[]> {
  if (cachedVerses) return cachedVerses;

  const indexPath = path.join(process.cwd(), "data", "kjv-index.json");
  const raw = await readFile(indexPath, "utf8");
  cachedVerses = JSON.parse(raw) as BibleVerse[];
  return cachedVerses;
}

async function getFuse(): Promise<Fuse<BibleVerse>> {
  if (cachedFuse) return cachedFuse;
  const verses = await loadVerses();
  cachedFuse = new Fuse(verses, {
    keys: [{ name: "text", weight: 0.85 }, { name: "ref", weight: 0.15 }],
    threshold: 0.32,
    includeScore: true,
    ignoreLocation: false,
    minMatchCharLength: 4,
    distance: 80,
  });
  return cachedFuse;
}

function extractSearchQueries(userText: string): string[] {
  const queries = new Set<string>();
  const cleaned = userText.toLowerCase().trim();

  if (!cleaned) return [];

  // Prefer the full question (most specific signal).
  if (cleaned.length >= 12) {
    queries.add(userText.trim().slice(0, 200));
  }

  const words = cleaned
    .replace(/[^\w\s']/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

  // Multi-word phrases beat isolated words.
  if (words.length >= 2) {
    queries.add(words.slice(0, 5).join(" "));
    queries.add(words.slice(0, 3).join(" "));
  }

  for (const word of words.slice(0, 6)) {
    if (!WEAK_SINGLE_WORDS.has(word)) {
      queries.add(word);
    }
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
    /(\d?\s?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?/,
  );
  if (refMatch) {
    queries.add(refMatch[0]);
  }

  return [...queries].slice(0, 8);
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

/** Build retrieval text from chat — last user message only, not assistant replies. */
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

export async function retrieveScripture(
  userText: string,
  limit = 8,
): Promise<RetrievedPassage[]> {
  const fuse = await getFuse();
  const queries = extractSearchQueries(userText);

  if (queries.length === 0) {
    return [];
  }

  const scored = new Map<string, { verse: BibleVerse; score: number }>();

  for (const query of queries) {
    const perQueryLimit = query.split(/\s+/).length >= 2 ? 6 : 4;
    const results = fuse.search(query, { limit: perQueryLimit });
    for (const result of results) {
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
    }),
  );
}

export function formatScriptureBlock(passages: RetrievedPassage[]): string {
  return passages.map((p) => `**${p.ref}** — ${p.text}`).join("\n\n");
}

export async function retrieveAndFormat(
  userText: string,
): Promise<{ passages: RetrievedPassage[]; block: string }> {
  const passages = await retrieveScripture(userText);
  return { passages, block: formatScriptureBlock(passages) };
}
