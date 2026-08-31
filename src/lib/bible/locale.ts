export type BibleLocale = "en" | "sw";

export const DEFAULT_LOCALE: BibleLocale = "en";

export function parseLocale(value: unknown): BibleLocale {
  return value === "sw" ? "sw" : "en";
}

export function bibleLabel(locale: BibleLocale): string {
  return locale === "sw" ? "SUV (Kiswahili)" : "KJV (English)";
}
