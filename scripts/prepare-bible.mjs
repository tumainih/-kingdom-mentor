import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const SOURCE_DIR = path.join(DATA_DIR, "source");
const OUTPUT = path.join(DATA_DIR, "kjv-index.json");
const BASE_URL =
  "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master";

async function download(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  return res.json();
}

async function main() {
  await mkdir(SOURCE_DIR, { recursive: true });

  const booksPath = path.join(SOURCE_DIR, "Books.json");
  let books;
  if (existsSync(booksPath)) {
    books = JSON.parse(await readFile(booksPath, "utf8"));
  } else {
    books = await download(`${BASE_URL}/Books.json`);
    await writeFile(booksPath, JSON.stringify(books));
  }

  const verses = [];

  for (const book of books) {
    const safeName = book.replace(/\s+/g, "");
    const bookPath = path.join(SOURCE_DIR, `${safeName}.json`);

    let bookData;
    if (existsSync(bookPath)) {
      bookData = JSON.parse(await readFile(bookPath, "utf8"));
    } else {
      bookData = await download(`${BASE_URL}/${safeName}.json`);
      await writeFile(bookPath, JSON.stringify(bookData));
      await new Promise((r) => setTimeout(r, 100));
    }

    for (const chapter of bookData.chapters) {
      for (const verse of chapter.verses) {
        const ref = `${bookData.book} ${chapter.chapter}:${verse.verse}`;
        verses.push({
          ref,
          book: bookData.book,
          chapter: Number(chapter.chapter),
          verse: Number(verse.verse),
          text: verse.text.trim(),
        });
      }
    }
    console.log(`Processed ${bookData.book} (${verses.length} verses so far)`);
  }

  await writeFile(OUTPUT, JSON.stringify(verses));
  console.log(`Wrote ${verses.length} verses to ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
