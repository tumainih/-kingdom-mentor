import type { AppLocale } from "./translations";
import { t } from "./translations";

/** Server-side copy in the active UI language. */
export function serverMessage(
  locale: AppLocale,
  key: Parameters<typeof t>[1],
  vars?: Record<string, string | number>,
): string {
  return t(locale, key, vars);
}

export function bibleTranslationLabel(locale: AppLocale): string {
  return locale === "sw" ? "SUV" : "KJV";
}
