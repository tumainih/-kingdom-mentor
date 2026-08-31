import type { BibleLocale } from "./locale";
import type { BibleVerse, RetrievedPassage } from "./types";

interface NarrativeBookRange {
  book: string;
  chapters: number[];
}

interface NarrativeLocale {
  figure: string;
  aliases: string[];
  books: NarrativeBookRange[];
}

export interface BibleNarrative {
  id: string;
  en: NarrativeLocale;
  sw: NarrativeLocale;
}

/** Key Bible stories — chapter ranges across the full 66-book canon. */
export const BIBLE_NARRATIVES: BibleNarrative[] = [
  {
    id: "creation",
    en: {
      figure: "Creation",
      aliases: ["creation", "genesis", "adam", "eve", "beginning"],
      books: [{ book: "Genesis", chapters: [1, 2, 3] }],
    },
    sw: {
      figure: "Uumbaji",
      aliases: ["uumbaji", "mwanzo", "adamu", "hawa", "mwanzo"],
      books: [{ book: "Mwanzo", chapters: [1, 2, 3] }],
    },
  },
  {
    id: "moses",
    en: {
      figure: "Moses",
      aliases: ["moses", "moses'", "musa"],
      books: [
        { book: "Exodus", chapters: [2, 3, 4, 12, 14, 20] },
        { book: "Numbers", chapters: [20] },
        { book: "Deuteronomy", chapters: [34] },
      ],
    },
    sw: {
      figure: "Musa",
      aliases: ["musa", "mosi", "mus"],
      books: [
        { book: "Kutoka", chapters: [2, 3, 4, 12, 14, 20] },
        { book: "Hesabu", chapters: [20] },
        { book: "Kumbukumbu la Torati", chapters: [34] },
      ],
    },
  },
  {
    id: "david",
    en: {
      figure: "David",
      aliases: ["david", "goliath"],
      books: [
        { book: "1 Samuel", chapters: [16, 17] },
        { book: "2 Samuel", chapters: [7, 11, 12] },
        { book: "Psalms", chapters: [23, 51] },
      ],
    },
    sw: {
      figure: "Daudi",
      aliases: ["daudi", "goliathi"],
      books: [
        { book: "1 Samueli", chapters: [16, 17] },
        { book: "2 Samueli", chapters: [7, 11, 12] },
        { book: "Zaburi", chapters: [23, 51] },
      ],
    },
  },
  {
    id: "noah",
    en: {
      figure: "Noah",
      aliases: ["noah", "flood", "ark"],
      books: [{ book: "Genesis", chapters: [6, 7, 8, 9] }],
    },
    sw: {
      figure: "Nuhu",
      aliases: ["nuhu", "gharika", "safina"],
      books: [{ book: "Mwanzo", chapters: [6, 7, 8, 9] }],
    },
  },
  {
    id: "jesus",
    en: {
      figure: "Jesus",
      aliases: ["jesus", "christ", "saviour", "savior", "birth of jesus"],
      books: [
        { book: "Matthew", chapters: [1, 2, 5, 6, 7] },
        { book: "Luke", chapters: [2, 15, 23, 24] },
        { book: "John", chapters: [3, 11, 19, 20] },
      ],
    },
    sw: {
      figure: "Yesu",
      aliases: ["yesu", "kristo", "mwokozi"],
      books: [
        { book: "Mathayo", chapters: [1, 2, 5, 6, 7] },
        { book: "Luka", chapters: [2, 15, 23, 24] },
        { book: "Yohana", chapters: [3, 11, 19, 20] },
      ],
    },
  },
  {
    id: "jonah",
    en: {
      figure: "Jonah",
      aliases: ["jonah", "nineveh"],
      books: [{ book: "Jonah", chapters: [1, 2, 3, 4] }],
    },
    sw: {
      figure: "Yona",
      aliases: ["yona", "ninawi"],
      books: [{ book: "Yona", chapters: [1, 2, 3, 4] }],
    },
  },
  {
    id: "daniel",
    en: {
      figure: "Daniel",
      aliases: ["daniel", "lions den", "lion's den"],
      books: [{ book: "Daniel", chapters: [1, 3, 6] }],
    },
    sw: {
      figure: "Danieli",
      aliases: ["danieli", "simba"],
      books: [{ book: "Danieli", chapters: [1, 3, 6] }],
    },
  },
  {
    id: "joseph",
    en: {
      figure: "Joseph",
      aliases: ["joseph", "coat of many colours", "coat of many colors"],
      books: [{ book: "Genesis", chapters: [37, 39, 40, 41, 45, 50] }],
    },
    sw: {
      figure: "Yusufu",
      aliases: ["yusufu", "joseph"],
      books: [{ book: "Mwanzo", chapters: [37, 39, 40, 41, 45, 50] }],
    },
  },
];

const STORY_REQUEST_RE =
  /\b(story|stories|tell me about|tell me the|life of|who was|what happened|narrative|history of|simulia|hadithi|eleza|ni nani|kuhusu|hadithi ya|simulie|msimulie)\b/i;

const FIGURE_HINT_RE =
  /\b(moses|musa|david|daudi|noah|nuhu|jesus|yesu|jonah|yona|daniel|danieli|joseph|yusufu|creation|uumbaji|adam|adamu|eve|hawa|goliath|goliathi|gharika|safina)\b/i;

export function detectNarrative(
  text: string,
  _locale: BibleLocale,
): BibleNarrative | null {
  const lower = text.toLowerCase();
  if (!STORY_REQUEST_RE.test(lower) && !FIGURE_HINT_RE.test(lower)) {
    return null;
  }

  for (const narrative of BIBLE_NARRATIVES) {
    const configs = [narrative.en, narrative.sw];
    const matched = configs.some(
      (cfg) =>
        cfg.aliases.some((alias) => lower.includes(alias)) ||
        lower.includes(cfg.figure.toLowerCase()),
    );
    if (matched) return narrative;
  }

  return null;
}

export function retrieveNarrativePassages(
  narrative: BibleNarrative,
  locale: BibleLocale,
  allVerses: BibleVerse[],
  limit = 18,
): RetrievedPassage[] {
  const cfg = locale === "sw" ? narrative.sw : narrative.en;
  const picked: BibleVerse[] = [];
  const seen = new Set<string>();

  const addVerse = (v: BibleVerse) => {
    if (seen.has(v.ref)) return;
    seen.add(v.ref);
    picked.push(v);
  };

  for (const { book, chapters } of cfg.books) {
    for (const chapter of chapters) {
      const chapterVerses = allVerses
        .filter((v) => v.book === book && v.chapter === chapter)
        .sort((a, b) => a.verse - b.verse);

      if (chapterVerses.length === 0) continue;

      addVerse(chapterVerses[0]);
      if (chapterVerses.length > 1) {
        addVerse(chapterVerses[Math.min(2, chapterVerses.length - 1)]);
      }
      if (chapterVerses.length > 4) {
        addVerse(chapterVerses[Math.floor(chapterVerses.length / 2)]);
      }
    }
  }

  for (const v of allVerses) {
    if (picked.length >= limit) break;
    const inBook = cfg.books.some((b) => b.book === v.book);
    if (!inBook) continue;
    const lower = v.text.toLowerCase();
    if (cfg.aliases.some((a) => lower.includes(a))) addVerse(v);
  }

  return picked.slice(0, limit).map((v) => ({
    ref: v.ref,
    text: v.text,
    refEn: v.refEn,
  }));
}

export function narrativeTitle(
  narrative: BibleNarrative,
  locale: BibleLocale,
): string {
  return locale === "sw" ? narrative.sw.figure : narrative.en.figure;
}
