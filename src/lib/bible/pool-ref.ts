import type { BibleLocale } from "./locale";
import type { BibleVerse } from "./types";

/** Shared ref normalization (safe for client + server). */
export function normalizePoolRef(ref: string): string {
  return ref.replace(/^Psalm\b/, "Psalms").replace(/\s+/g, " ").trim();
}

export function parsePoolRef(
  ref: string,
): { book: string; chapter: number; verse: number } | null {
  const normalized = normalizePoolRef(ref);
  const match = normalized.match(/^(.+?)\s+(\d{1,3}):(\d{1,3})$/);
  if (!match) return null;
  return {
    book: match[1],
    chapter: Number.parseInt(match[2], 10),
    verse: Number.parseInt(match[3], 10),
  };
}

/** Resolve a KJV-style pool ref against a bundled verse index. */
export function findVerseByPoolRef(
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

    const parsed = parsePoolRef(normalized);
    if (parsed) {
      const byParts = verses.find(
        (v) =>
          v.chapter === parsed.chapter &&
          v.verse === parsed.verse &&
          (v.bookEn === parsed.book ||
            v.refEn?.startsWith(`${parsed.book} ${parsed.chapter}:`)),
      );
      if (byParts) return byParts;
    }
  }

  return verses.find((v) => v.ref === normalized || v.ref === ref) ?? null;
}
