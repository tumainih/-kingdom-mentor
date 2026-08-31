import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const SOURCE = path.join(DATA_DIR, "source", "swahili-raw.json");
const OUTPUT = path.join(DATA_DIR, "swahili-index.json");
const REMOTE =
  "https://raw.githubusercontent.com/shemmjunior/swahili-bible-edition/main/json/full_version/swahili-bible-edition.json";

/** English KJV book name ↔ Swahili SUV book name */
export const SWAHILI_TO_ENGLISH_BOOK = {
  Mwanzo: "Genesis",
  Kutoka: "Exodus",
  "Mambo ya Walawi": "Leviticus",
  Hesabu: "Numbers",
  "Kumbukumbu la Torati": "Deuteronomy",
  Yoshua: "Joshua",
  Waamuzi: "Judges",
  Ruthu: "Ruth",
  "1 Samueli": "1 Samuel",
  "2 Samueli": "2 Samuel",
  "1 Wafalme": "1 Kings",
  "2 Wafalme": "2 Kings",
  "1 Mambo ya Nyakati": "1 Chronicles",
  "2 Mambo ya Nyakati": "2 Chronicles",
  Ezra: "Ezra",
  Nehemia: "Nehemiah",
  Estha: "Esther",
  Ayubu: "Job",
  Zaburi: "Psalms",
  Mithali: "Proverbs",
  Mhubiri: "Ecclesiastes",
  "Wimbo Ulio Bora": "Song of Solomon",
  Isaya: "Isaiah",
  Yeremia: "Jeremiah",
  Maombolezo: "Lamentations",
  Ezekieli: "Ezekiel",
  Danieli: "Daniel",
  Hosea: "Hosea",
  Yoeli: "Joel",
  Amosi: "Amos",
  Obadia: "Obadiah",
  Yona: "Jonah",
  Mika: "Micah",
  Nahumu: "Nahum",
  Habakuki: "Habakkuk",
  Sefania: "Zephaniah",
  Hagai: "Haggai",
  Zekaria: "Zechariah",
  Malaki: "Malachi",
  Mathayo: "Matthew",
  Marko: "Mark",
  Luka: "Luke",
  Yohana: "John",
  Matendo: "Acts",
  Warumi: "Romans",
  "1 Wakorintho": "1 Corinthians",
  "2 Wakorintho": "2 Corinthians",
  Wagalatia: "Galatians",
  Waefeso: "Ephesians",
  Wafilipi: "Philippians",
  Wakolosai: "Colossians",
  "1 Wathesalonike": "1 Thessalonians",
  "2 Wathesalonike": "2 Thessalonians",
  "1 Timotheo": "1 Timothy",
  "2 Timotheo": "2 Timothy",
  Tito: "Titus",
  Filemoni: "Philemon",
  Waebrania: "Hebrews",
  Yakobo: "James",
  "1 Petro": "1 Peter",
  "2 Petro": "2 Peter",
  "1 Yohana": "1 John",
  "2 Yohana": "2 John",
  "3 Yohana": "3 John",
  Yuda: "Jude",
  Ufunuo: "Revelation",
};

async function ensureSource() {
  if (existsSync(SOURCE)) return;
  await mkdir(path.dirname(SOURCE), { recursive: true });
  console.log("Downloading Swahili Bible JSON…");
  const res = await fetch(REMOTE);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  await writeFile(SOURCE, await res.text());
}

async function main() {
  await ensureSource();
  const raw = JSON.parse(await readFile(SOURCE, "utf8"));
  const verses = [];

  for (const book of raw.BIBLEBOOK) {
    const swBook = book.book_name.trim();
    const enBook = SWAHILI_TO_ENGLISH_BOOK[swBook] ?? swBook;

    const chapters = Array.isArray(book.CHAPTER)
      ? book.CHAPTER
      : [book.CHAPTER];

    for (const chapter of chapters) {
      const ch = Number(chapter.chapter_number);
      for (const verse of chapter.VERSES) {
        const v = Number(verse.verse_number);
        verses.push({
          ref: `${swBook} ${ch}:${v}`,
          refEn: `${enBook} ${ch}:${v}`,
          book: swBook,
          bookEn: enBook,
          chapter: ch,
          verse: v,
          text: verse.verse_text.trim(),
        });
      }
    }
    console.log(`Processed ${swBook} (${verses.length} verses)`);
  }

  await writeFile(OUTPUT, JSON.stringify(verses));
  console.log(`Wrote ${verses.length} Swahili verses to ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
