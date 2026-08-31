import { readFile } from "node:fs/promises";
import path from "node:path";
import type { BibleLocale } from "./locale";
import type { BibleVerse, RetrievedPassage } from "./types";

export interface ParsedReference {
  book: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
}

const verseCache = new Map<BibleLocale, BibleVerse[]>();
const bookAliasCache = new Map<BibleLocale, Map<string, string>>();

async function loadVerses(locale: BibleLocale): Promise<BibleVerse[]> {
  const cached = verseCache.get(locale);
  if (cached) return cached;
  const file = locale === "sw" ? "swahili-index.json" : "kjv-index.json";
  const raw = await readFile(path.join(process.cwd(), "data", file), "utf8");
  const verses = JSON.parse(raw) as BibleVerse[];
  verseCache.set(locale, verses);
  return verses;
}

function normalizeAlias(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildBookAliases(
  verses: BibleVerse[],
  locale: BibleLocale,
): Map<string, string> {
  const aliases = new Map<string, string>();

  const add = (alias: string, book: string) => {
    const key = normalizeAlias(alias);
    if (key && !aliases.has(key)) aliases.set(key, book);
  };

  for (const v of verses) {
    add(v.book, v.book);
    if (v.bookEn) add(v.bookEn, v.book);
  }

  const enExtra: Record<string, string[]> = {
    Genesis: ["gen", "ge"],
    Exodus: ["ex", "exod"],
    Leviticus: ["lev"],
    Numbers: ["num"],
    Deuteronomy: ["deut", "dt"],
    Joshua: ["josh"],
    Judges: ["judg", "jdg"],
    "1 Samuel": ["1 sam", "1sam", "1st samuel"],
    "2 Samuel": ["2 sam", "2sam", "2nd samuel"],
    "1 Kings": ["1 kgs", "1kgs", "1st kings"],
    "2 Kings": ["2 kgs", "2kgs", "2nd kings"],
    "1 Chronicles": ["1 chr", "1chronicles"],
    "2 Chronicles": ["2 chr", "2chronicles"],
    Psalms: ["ps", "psalm", "psa"],
    Proverbs: ["prov", "pr"],
    Ecclesiastes: ["eccl", "ecc"],
    "Song of Solomon": ["song", "sos", "canticles"],
    Isaiah: ["isa", "is"],
    Jeremiah: ["jer", "je"],
    Lamentations: ["lam"],
    Ezekiel: ["ezek", "ezk"],
    Daniel: ["dan", "dn"],
    Hosea: ["hos"],
    Obadiah: ["obad"],
    Jonah: ["jon"],
    Micah: ["mic"],
    Nahum: ["nah"],
    Habakkuk: ["hab"],
    Zephaniah: ["zeph", "zep"],
    Haggai: ["hag"],
    Zechariah: ["zech", "zec"],
    Malachi: ["mal"],
    Matthew: ["matt", "mt"],
    Mark: ["mk", "mrk"],
    Luke: ["lk", "luk"],
    John: ["jn", "jhn"],
    Acts: ["act"],
    Romans: ["rom", "ro"],
    "1 Corinthians": ["1 cor", "1cor", "1st corinthians"],
    "2 Corinthians": ["2 cor", "2cor", "2nd corinthians"],
    Galatians: ["gal"],
    Ephesians: ["eph"],
    Philippians: ["phil", "php"],
    Colossians: ["col"],
    "1 Thessalonians": ["1 thess", "1thess"],
    "2 Thessalonians": ["2 thess", "2thess"],
    "1 Timothy": ["1 tim", "1tim"],
    "2 Timothy": ["2 tim", "2tim"],
    Titus: ["tit"],
    Philemon: ["phlm", "phm"],
    Hebrews: ["heb"],
    James: ["jas", "jm"],
    "1 Peter": ["1 pet", "1pet"],
    "2 Peter": ["2 pet", "2pet"],
    "1 John": ["1 jn", "1jn", "1 john"],
    "2 John": ["2 jn", "2jn"],
    "3 John": ["3 jn", "3jn"],
    Jude: ["jud"],
    Revelation: ["rev", "revelations", "apocalypse"],
  };

  const swExtra: Record<string, string[]> = {
    Mwanzo: ["mwanzo", "gen"],
    Kutoka: ["kutoka", "kut", "ex"],
    "Mambo ya Walawi": ["walawi", "lev"],
    Hesabu: ["hesabu", "num"],
    "Kumbukumbu la Torati": ["kumbukumbu", "deut"],
    Yoshua: ["yoshua", "josh"],
    Waamuzi: ["waamuzi", "amuzi"],
    Ruthu: ["ruthu"],
    "1 Samueli": ["1 samueli", "1 sam"],
    "2 Samueli": ["2 samueli", "2 sam"],
    "1 Wafalme": ["1 wafalme", "1 wafalme"],
    "2 Wafalme": ["2 wafalme"],
    "1 Mambo ya Nyakati": ["1 mambo ya nyakati", "1 nyakati"],
    "2 Mambo ya Nyakati": ["2 mambo ya nyakati", "2 nyakati"],
    Zaburi: ["zaburi", "zab", "ps"],
    Mithali: ["mithali", "mith"],
    Mhubiri: ["mhubiri"],
    "Wimbo Ulio Bora": ["wimbo"],
    Isaya: ["isaya", "isa"],
    Yeremia: ["yeremia", "jer"],
    Maombolezo: ["maombolezo"],
    Ezekieli: ["ezekieli", "ezek"],
    Danieli: ["danieli", "dan"],
    Mathayo: ["mathayo", "mat"],
    Marko: ["marko", "mk"],
    Luka: ["luka", "lk"],
    Yohana: ["yohana", "jn"],
    "Matendo ya Mitume": ["matendo", "acts"],
    Warumi: ["warumi", "rom"],
    "1 Wakorintho": ["1 wakorintho", "1 kor", "1 korintho"],
    "2 Wakorintho": ["2 wakorintho", "2 kor", "2 korintho"],
    Wagalatia: ["wagalatia", "gal"],
    Waefeso: ["waefeso", "efeso", "eph"],
    Wafilipi: ["wafilipi", "fil"],
    Wakolosai: ["wakolosai", "kol"],
    "1 Wathesalonike": ["1 wathesalonike", "1 thess"],
    "2 Wathesalonike": ["2 wathesalonike", "2 thess"],
    "1 Timotheo": ["1 timotheo", "1 tim"],
    "2 Timotheo": ["2 timotheo", "2 tim"],
    Tito: ["tito"],
    Filemoni: ["filemoni"],
    Waebrania: ["waebrania", "ebr"],
    Yakobo: ["yakobo", "jak"],
    "1 Petro": ["1 petro", "1 pet"],
    "2 Petro": ["2 petro", "2 pet"],
    "1 Yohana": ["1 yohana", "1 yn"],
    "2 Yohana": ["2 yohana", "2 yn"],
    "3 Yohana": ["3 yohana", "3 yn"],
    Yuda: ["yuda"],
    "Ufunuo wa Yohana": ["ufunuo", "rev"],
  };

  for (const v of verses) {
    const extras = locale === "sw" ? swExtra[v.book] ?? [] : enExtra[v.book] ?? [];
    for (const alias of extras) add(alias, v.book);
  }

  return aliases;
}

async function getBookAliases(locale: BibleLocale): Promise<Map<string, string>> {
  const cached = bookAliasCache.get(locale);
  if (cached) return cached;
  const verses = await loadVerses(locale);
  const map = buildBookAliases(verses, locale);
  bookAliasCache.set(locale, map);
  return map;
}

/** Match book + chapter, optional :verse or :verse-verse */
const REF_PATTERNS = [
  /(?:^|[\s,;("'])(?:(\d)\s+)?([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s.'-]{0,40}?)\s+(\d{1,3})\s*:\s*(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?(?=$|[\s,;.!?)"'])/i,
  /(?:^|[\s,;("'])(?:(\d)\s+)?([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s.'-]{0,40}?)\s+(\d{1,3})(?!\s*:)(?=$|[\s,;.!?)"'])/i,
];

function resolveBook(
  rawBook: string,
  prefix: string | undefined,
  aliases: Map<string, string>,
): string | null {
  const combined = prefix ? `${prefix} ${rawBook}` : rawBook;
  const key = normalizeAlias(combined);
  if (aliases.has(key)) return aliases.get(key)!;

  const shortKey = normalizeAlias(rawBook);
  if (prefix && aliases.has(`${prefix} ${shortKey}`)) {
    return aliases.get(`${prefix} ${shortKey}`)!;
  }
  if (aliases.has(shortKey)) return aliases.get(shortKey)!;

  for (const [alias, book] of aliases) {
    if (key.startsWith(alias) || alias.startsWith(key)) return book;
  }
  return null;
}

export function parseVerseReference(
  text: string,
  locale: BibleLocale,
  aliases: Map<string, string>,
): ParsedReference | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  for (const pattern of REF_PATTERNS) {
    const match = trimmed.match(pattern);
    if (!match) continue;

    const [, prefix, rawBook, chapterStr, verseStartStr, verseEndStr] = match;
    const book = resolveBook(rawBook.trim(), prefix, aliases);
    if (!book) continue;

    const chapter = Number(chapterStr);
    if (!Number.isFinite(chapter) || chapter < 1) continue;

    const ref: ParsedReference = { book, chapter };
    if (verseStartStr) {
      ref.verseStart = Number(verseStartStr);
      ref.verseEnd = verseEndStr ? Number(verseEndStr) : ref.verseStart;
    }
    return ref;
  }

  return null;
}

export function looksLikeVerseRequest(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (/\b(read|quote|show|give|find|lookup|what does|what is|nipe|nisomee|onyesha|tafuta)\b/i.test(t)) {
    return REF_PATTERNS.some((p) => p.test(t));
  }
  const stripped = t.replace(/[^\d:A-Za-zÀ-ÿ\s-]/g, "").trim();
  return REF_PATTERNS.some((p) => {
    const m = stripped.match(p);
    return m !== null && stripped.length <= 60;
  });
}

export async function lookupVerseReference(
  text: string,
  locale: BibleLocale,
): Promise<{ passages: RetrievedPassage[]; parsed: ParsedReference | null }> {
  const aliases = await getBookAliases(locale);
  const parsed = parseVerseReference(text, locale, aliases);
  if (!parsed) return { passages: [], parsed: null };

  const verses = await loadVerses(locale);
  const inChapter = verses
    .filter((v) => v.book === parsed.book && v.chapter === parsed.chapter)
    .sort((a, b) => a.verse - b.verse);

  if (inChapter.length === 0) return { passages: [], parsed };

  let selected: BibleVerse[];
  if (parsed.verseStart !== undefined) {
    const end = parsed.verseEnd ?? parsed.verseStart;
    selected = inChapter.filter(
      (v) => v.verse >= parsed.verseStart! && v.verse <= end,
    );
  } else {
    selected = inChapter;
  }

  return {
    parsed,
    passages: selected.map((v) => ({
      ref: v.ref,
      text: v.text,
      refEn: v.refEn ?? (locale === "en" ? v.ref : undefined),
    })),
  };
}

export function formatVerseLookupBlock(
  passages: RetrievedPassage[],
  locale: BibleLocale,
): string {
  return passages
    .map((p) => {
      const label =
        locale === "sw" && p.refEn ? `${p.ref} (${p.refEn})` : p.ref;
      return `**${label}**\n${p.text}`;
    })
    .join("\n\n");
}
