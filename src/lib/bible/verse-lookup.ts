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
const sortedAliasCache = new Map<
  BibleLocale,
  Array<{ alias: string; book: string }>
>();
let crossBookPairs: Array<{ en: string; sw: string }> | null = null;

async function loadCrossBookPairs(): Promise<Array<{ en: string; sw: string }>> {
  if (crossBookPairs) return crossBookPairs;
  const swVerses = await loadVerses("sw");
  const seen = new Set<string>();
  const pairs: Array<{ en: string; sw: string }> = [];
  for (const v of swVerses) {
    if (!v.bookEn) continue;
    const key = `${v.bookEn}::${v.book}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push({ en: v.bookEn, sw: v.book });
  }
  crossBookPairs = pairs;
  return pairs;
}

const LEADING_FILLER_RE =
  /^(?:(?:please|kindly|can you|could you|would you|show me|tell me|read|quote|give me|what is|what does|what's|find|lookup|get|share|the book of|book of|from|in|about|verse|mstari|nipe|nisomee|nisome|onyesha|tafuta|eleza|ni|kwa|nipe mstari wa|nisomee mstari|tafadhali)\s+)+/i;

async function loadVerses(locale: BibleLocale): Promise<BibleVerse[]> {
  const cached = verseCache.get(locale);
  if (cached) return cached;
  const file = locale === "sw" ? "swahili-index.json" : "kjv-index.json";
  const indexPath = path.join(process.cwd(), "data", file);
  const raw = await readFile(indexPath, "utf8");
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

function normalizeInput(text: string): string {
  return text
    .trim()
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[：﹕]/g, ":")
    .replace(/\s+/g, " ");
}

function buildBookAliases(
  verses: BibleVerse[],
  locale: BibleLocale,
  crossPairs: Array<{ en: string; sw: string }>,
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
    Ruth: ["ruth"],
    "1 Samuel": ["1 sam", "1sam", "1st samuel", "first samuel"],
    "2 Samuel": ["2 sam", "2sam", "2nd samuel", "second samuel"],
    "1 Kings": ["1 kgs", "1kgs", "1st kings", "first kings"],
    "2 Kings": ["2 kgs", "2kgs", "2nd kings", "second kings"],
    "1 Chronicles": ["1 chr", "1chronicles", "1 chronicles"],
    "2 Chronicles": ["2 chr", "2chronicles", "2 chronicles"],
    Ezra: ["ezra"],
    Nehemiah: ["neh"],
    Esther: ["est"],
    Job: ["job"],
    Psalms: ["ps", "psalm", "psa", "psalms"],
    Proverbs: ["prov", "pr", "proverb"],
    Ecclesiastes: ["eccl", "ecc"],
    "Song of Solomon": ["song", "sos", "canticles", "song of songs"],
    Isaiah: ["isa", "is"],
    Jeremiah: ["jer", "je"],
    Lamentations: ["lam"],
    Ezekiel: ["ezek", "ezk"],
    Daniel: ["dan", "dn"],
    Hosea: ["hos"],
    Joel: ["joe"],
    Amos: ["amos"],
    Obadiah: ["obad"],
    Jonah: ["jon"],
    Micah: ["mic"],
    Nahum: ["nah"],
    Habakkuk: ["hab"],
    Zephaniah: ["zeph", "zep"],
    Haggai: ["hag"],
    Zechariah: ["zech", "zec"],
    Malachi: ["mal"],
    Matthew: ["matt", "mt", "mathew", "matthew"],
    Mark: ["mk", "mrk"],
    Luke: ["lk", "luk"],
    John: ["jn", "jhn", "john"],
    Acts: ["act", "acts"],
    Romans: ["rom", "ro"],
    "1 Corinthians": ["1 cor", "1cor", "1 corinthians", "1st corinthians"],
    "2 Corinthians": ["2 cor", "2cor", "2 corinthians", "2nd corinthians"],
    Galatians: ["gal"],
    Ephesians: ["eph"],
    Philippians: ["phil", "php"],
    Colossians: ["col"],
    "1 Thessalonians": ["1 thess", "1thess", "1 thessalonians"],
    "2 Thessalonians": ["2 thess", "2thess", "2 thessalonians"],
    "1 Timothy": ["1 tim", "1tim", "1 timothy"],
    "2 Timothy": ["2 tim", "2tim", "2 timothy"],
    Titus: ["tit"],
    Philemon: ["phlm", "phm"],
    Hebrews: ["heb"],
    James: ["jas", "jm"],
    "1 Peter": ["1 pet", "1pet", "1 peter"],
    "2 Peter": ["2 pet", "2pet", "2 peter"],
    "1 John": ["1 jn", "1jn", "1 john"],
    "2 John": ["2 jn", "2jn", "2 john"],
    "3 John": ["3 jn", "3jn", "3 john"],
    Jude: ["jud"],
    Revelation: ["rev", "revelations", "apocalypse"],
  };

  const swExtra: Record<string, string[]> = {
    Mwanzo: ["mwanzo", "gen", "genesis"],
    Kutoka: ["kutoka", "kut", "ex", "exodus"],
    "Mambo ya Walawi": ["walawi", "lev", "leviticus"],
    Hesabu: ["hesabu", "num", "numbers"],
    "Kumbukumbu la Torati": ["kumbukumbu", "deut", "deuteronomy"],
    Yoshua: ["yoshua", "josh", "joshua"],
    Waamuzi: ["waamuzi", "amuzi", "judges"],
    Ruthu: ["ruthu", "ruth"],
    "1 Samueli": ["1 samueli", "1 sam", "1 samuel"],
    "2 Samueli": ["2 samueli", "2 sam", "2 samuel"],
    "1 Wafalme": ["1 wafalme", "1 kings"],
    "2 Wafalme": ["2 wafalme", "2 kings"],
    "1 Mambo ya Nyakati": ["1 mambo ya nyakati", "1 nyakati", "1 chronicles"],
    "2 Mambo ya Nyakati": ["2 mambo ya nyakati", "2 nyakati", "2 chronicles"],
    Ezra: ["ezra"],
    Nehemia: ["nehemia", "nehemiah"],
    Esta: ["esta", "esther"],
    Ayubu: ["ayubu", "job"],
    Zaburi: ["zaburi", "zab", "ps", "psalm", "psalms"],
    Mithali: ["mithali", "mith", "proverbs"],
    Mhubiri: ["mhubiri", "ecclesiastes"],
    "Wimbo Ulio Bora": ["wimbo", "song of solomon"],
    Isaya: ["isaya", "isa", "isaiah"],
    Yeremia: ["yeremia", "jer", "jeremiah"],
    Maombolezo: ["maombolezo", "lamentations"],
    Ezekieli: ["ezekieli", "ezek", "ezekiel"],
    Danieli: ["danieli", "dan", "daniel"],
    Hosea: ["hosea"],
    Yoeli: ["yoeli", "joel"],
    Amosi: ["amosi", "amos"],
    Obadia: ["obadia", "obadiah"],
    Yona: ["yona", "jonah"],
    Mika: ["mika", "micah"],
    Nahumu: ["nahumu", "nahum"],
    Habakuki: ["habakuki", "habakkuk"],
    Sefania: ["sefania", "zephaniah"],
    Hagai: ["hagai", "haggai"],
    Zekaria: ["zekaria", "zechariah"],
    Malaki: ["malaki", "malachi"],
    Mathayo: ["mathayo", "mat", "matthew", "mathew"],
    Marko: ["marko", "mk", "mark"],
    Luka: ["luka", "lk", "luke"],
    Yohana: ["yohana", "jn", "john"],
    "Matendo ya Mitume": ["matendo", "acts"],
    Warumi: ["warumi", "rom", "romans"],
    "1 Wakorintho": ["1 wakorintho", "1 kor", "1 korintho", "1 corinthians"],
    "2 Wakorintho": ["2 wakorintho", "2 kor", "2 korintho", "2 corinthians"],
    Wagalatia: ["wagalatia", "gal", "galatians"],
    Waefeso: ["waefeso", "efeso", "eph", "ephesians"],
    Wafilipi: ["wafilipi", "fil", "philippians"],
    Wakolosai: ["wakolosai", "kol", "colossians"],
    "1 Wathesalonike": ["1 wathesalonike", "1 thess", "1 thessalonians"],
    "2 Wathesalonike": ["2 wathesalonike", "2 thess", "2 thessalonians"],
    "1 Timotheo": ["1 timotheo", "1 tim", "1 timothy"],
    "2 Timotheo": ["2 timotheo", "2 tim", "2 timothy"],
    Tito: ["tito", "titus"],
    Filemoni: ["filemoni", "philemon"],
    Waebrania: ["waebrania", "ebr", "hebrews"],
    Yakobo: ["yakobo", "jak", "james"],
    "1 Petro": ["1 petro", "1 pet", "1 peter"],
    "2 Petro": ["2 petro", "2 pet", "2 peter"],
    "1 Yohana": ["1 yohana", "1 yn", "1 john"],
    "2 Yohana": ["2 yohana", "2 yn", "2 john"],
    "3 Yohana": ["3 yohana", "3 yn", "3 john"],
    Yuda: ["yuda", "jude"],
    "Ufunuo wa Yohana": ["ufunuo", "rev", "revelation"],
  };

  for (const v of verses) {
    const extras = locale === "sw" ? swExtra[v.book] ?? [] : enExtra[v.book] ?? [];
    for (const alias of extras) add(alias, v.book);
  }

  for (const { en, sw } of crossPairs) {
    const canonical = locale === "sw" ? sw : en;
    add(en, canonical);
    add(sw, canonical);
    const enAliases = enExtra[en] ?? [];
    const swAliases = swExtra[sw] ?? [];
    for (const alias of enAliases) add(alias, canonical);
    for (const alias of swAliases) add(alias, canonical);
  }

  return aliases;
}

async function getBookAliases(locale: BibleLocale): Promise<Map<string, string>> {
  const cached = bookAliasCache.get(locale);
  if (cached) return cached;
  const [verses, crossPairs] = await Promise.all([
    loadVerses(locale),
    loadCrossBookPairs(),
  ]);
  const map = buildBookAliases(verses, locale, crossPairs);
  bookAliasCache.set(locale, map);
  sortedAliasCache.set(
    locale,
    [...map.entries()]
      .map(([alias, book]) => ({ alias, book }))
      .sort((a, b) => b.alias.length - a.alias.length),
  );
  return map;
}

function stripLeadingFiller(text: string): string {
  let current = text.trim();
  for (let i = 0; i < 4; i++) {
    const next = current.replace(LEADING_FILLER_RE, "").trim();
    if (next === current) break;
    current = next;
  }
  return current;
}

function matchBookName(
  raw: string,
  sortedAliases: Array<{ alias: string; book: string }>,
  aliases: Map<string, string>,
): string | null {
  const cleaned = stripLeadingFiller(raw);
  const key = normalizeAlias(cleaned);
  if (!key) return null;

  if (aliases.has(key)) return aliases.get(key)!;

  for (const { alias, book } of sortedAliases) {
    if (key === alias || key.endsWith(` ${alias}`)) return book;
  }

  return null;
}

export function parseVerseReference(
  text: string,
  _locale: BibleLocale,
  aliases: Map<string, string>,
  sortedAliases: Array<{ alias: string; book: string }>,
): ParsedReference | null {
  const input = normalizeInput(text);
  if (!input) return null;

  const chapterVerseEnd = input.match(
    /(\d{1,3})\s*:\s*(\d{1,3})(?:\s*-\s*(\d{1,3}))?\s*$/,
  );
  if (chapterVerseEnd) {
    const bookPart = input.slice(0, chapterVerseEnd.index).trim();
    const book = matchBookName(bookPart, sortedAliases, aliases);
    if (book) {
      return {
        book,
        chapter: Number(chapterVerseEnd[1]),
        verseStart: Number(chapterVerseEnd[2]),
        verseEnd: chapterVerseEnd[3]
          ? Number(chapterVerseEnd[3])
          : Number(chapterVerseEnd[2]),
      };
    }
  }

  const chapterOnlyEnd = input.match(/(\d{1,3})\s*$/);
  if (chapterOnlyEnd && !chapterOnlyEnd[0].includes(":")) {
    const bookPart = input.slice(0, chapterOnlyEnd.index).trim();
    const book = matchBookName(bookPart, sortedAliases, aliases);
    if (book) {
      return {
        book,
        chapter: Number(chapterOnlyEnd[1]),
      };
    }
  }

  const glued = input.match(
    /^(.+?)(\d{1,3})\s*:\s*(\d{1,3})(?:\s*-\s*(\d{1,3}))?\s*$/,
  );
  if (glued) {
    const book = matchBookName(glued[1].trim(), sortedAliases, aliases);
    if (book) {
      return {
        book,
        chapter: Number(glued[2]),
        verseStart: Number(glued[3]),
        verseEnd: glued[4] ? Number(glued[4]) : Number(glued[3]),
      };
    }
  }

  return null;
}

export function looksLikeVerseRequest(text: string): boolean {
  const t = normalizeInput(text);
  if (!t) return false;
  if (/\d{1,3}\s*:\s*\d{1,3}/.test(t)) return true;
  if (
    /\b(read|quote|show|give|find|lookup|what does|what is|nipe|nisomee|nisome|onyesha|tafuta|mstari|verse|andika|soma)\b/i.test(
      t,
    ) &&
    /\b\d{1,3}\b/.test(t)
  ) {
    return true;
  }
  const stripped = t.replace(/[^\d:A-Za-zÀ-ÿ\s-]/g, "").trim();
  return (
    /\d{1,3}\s*:\s*\d{1,3}/.test(stripped) ||
    (/^[A-Za-zÀ-ÿ0-9\s]{2,40}\s+\d{1,3}$/.test(stripped) &&
      stripped.length <= 48)
  );
}

export async function lookupVerseReference(
  text: string,
  locale: BibleLocale,
): Promise<{ passages: RetrievedPassage[]; parsed: ParsedReference | null }> {
  const aliases = await getBookAliases(locale);
  const sortedAliases = sortedAliasCache.get(locale) ?? [];
  const parsed = parseVerseReference(text, locale, aliases, sortedAliases);
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
