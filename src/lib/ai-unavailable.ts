import type { BibleLocale } from "@/lib/bible/locale";
import type { QuestionKind } from "@/lib/question-classifier";

/** Life guidance, stories, and faith questions need the AI — not template fallbacks. */
export function requiresAI(kind: QuestionKind): boolean {
  return kind === "biblical";
}

export function aiUnavailableMessage(locale: BibleLocale): string {
  return locale === "sw"
    ? "Siwezi kufikia AI kwa sasa, kwa hivyo siwezi kutoa mwongozo wa kina unaostahili swali hili. Tafadhali jaribu tena baada ya muda mfupi.\n\nUnaweza bado kuandika mstari wa Biblia (mf. **Yohana 3:16**) na nitaupata kutoka Biblia kamili."
    : "I can't reach the AI right now, so I can't give the thoughtful guidance this question deserves. Please try again in a moment.\n\nYou can still type a Bible reference (e.g. **John 3:16**) and I'll retrieve it from the full Bible.";
}
