import type { BibleLocale } from "./locale";
import type { BibleVerse } from "./types";

export async function readVersesFromNetwork(
  locale: BibleLocale,
): Promise<BibleVerse[]> {
  const file = locale === "sw" ? "swahili-index.json" : "kjv-index.json";
  const res = await fetch(`/data/${file}`, { cache: "force-cache" });
  if (!res.ok) {
    throw new Error(`Bible data unavailable (${res.status})`);
  }
  return (await res.json()) as BibleVerse[];
}
