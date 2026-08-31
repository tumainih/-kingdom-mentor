import { readFile } from "node:fs/promises";
import path from "node:path";
import type { BibleLocale } from "./locale";
import type { BibleVerse } from "./types";

export async function readVersesFromDisk(
  locale: BibleLocale,
): Promise<BibleVerse[]> {
  const file = locale === "sw" ? "swahili-index.json" : "kjv-index.json";
  const indexPath = path.join(process.cwd(), "data", file);
  const raw = await readFile(indexPath, "utf8");
  return JSON.parse(raw) as BibleVerse[];
}
