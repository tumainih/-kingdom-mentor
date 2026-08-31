import Fuse from "fuse.js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { BibleVerse, RetrievedPassage } from "./types";

const TOPIC_KEYWORDS: Record<string, string[]> = {
  forgiveness: ["forgive", "mercy", "pardon", "reconcile"],
  anger: ["anger", "wrath", "slow to anger", "temper"],
  love: ["love", "charity", "beloved", "one another"],
  wisdom: ["wisdom", "understanding", "prudent", "wise"],
  fear: ["fear not", "afraid", "anxious", "trust"],
  pride: ["pride", "humble", "humility", "exalt"],
  money: ["money", "riches", "treasure", "covetous"],
  marriage: ["husband", "wife", "marriage", "adultery"],
  work: ["work", "labor", "diligent", "slothful"],
  prayer: ["pray", "prayer", "supplication", "petition"],
  temptation: ["tempt", "temptation", "escape", "overcome"],
  grief: ["mourn", "comfort", "sorrow", "weep"],
  justice: ["justice", "judgment", "righteous", "equity"],
  revenge: ["revenge", "vengeance", "repay evil", "overcome evil"],
  honesty: ["truth", "lie", "honest", "deceit"],
  patience: ["patience", "longsuffering", "wait", "endure"],
  faith: ["faith", "believe", "trust", "unbelief"],
  obedience: ["obey", "commandment", "keep my words", "do his will"],
};

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
    keys: [
      { name: "text", weight: 0.7 },
      { name: "ref", weight: 0.2 },
      { name: "book", weight: 0.1 },
    ],
    threshold: 0.45,
    includeScore: true,
    ignoreLocation: true,
    minMatchCharLength: 3,
  });
  return cachedFuse;
}

function extractSearchQueries(userText: string): string[] {
  const queries = new Set<string>();
  const cleaned = userText.toLowerCase();

  const words = cleaned
    .replace(/[^\w\s']/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

  for (const word of words.slice(0, 8)) {
    queries.add(word);
  }

  if (words.length >= 2) {
    queries.add(words.slice(0, 4).join(" "));
  }

  queries.add(userText.slice(0, 120));

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (
      cleaned.includes(topic) ||
      keywords.some((kw) => cleaned.includes(kw.split(" ")[0]))
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

  return [...queries].slice(0, 12);
}

const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "been",
  "before",
  "being",
  "could",
  "does",
  "doing",
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

export async function retrieveScripture(
  userText: string,
  limit = 20,
): Promise<RetrievedPassage[]> {
  const fuse = await getFuse();
  const queries = extractSearchQueries(userText);
  const scored = new Map<string, { verse: BibleVerse; score: number }>();

  for (const query of queries) {
    const results = fuse.search(query, { limit: 8 });
    for (const result of results) {
      const existing = scored.get(result.item.ref);
      const score = result.score ?? 1;
      if (!existing || score < existing.score) {
        scored.set(result.item.ref, { verse: result.item, score });
      }
    }
  }

  const ranked = [...scored.values()]
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map(({ verse }) => verse);

  return dedupeByRef(ranked).map((v) => ({
    ref: v.ref,
    text: v.text,
  }));
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
