import type { BibleLocale } from "@/lib/bible/locale";
import { serverMessage } from "@/lib/i18n/server-messages";
import type { QuestionKind } from "@/lib/question-classifier";

/** Life guidance, stories, and faith questions need the AI — not template fallbacks. */
export function requiresAI(kind: QuestionKind): boolean {
  return kind === "biblical";
}

export function aiUnavailableMessage(locale: BibleLocale): string {
  return serverMessage(locale, "aiUnavailable");
}
