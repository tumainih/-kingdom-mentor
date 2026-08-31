import { retrieveScripture, formatScriptureBlock } from "@/lib/bible/retrieval";
import type { BibleLocale } from "@/lib/bible/locale";
import { detectNarrative, narrativeTitle } from "@/lib/bible/narratives";
import {
  formatVerseLookupBlock,
  lookupVerseReference,
} from "@/lib/bible/verse-lookup";
import { classifyQuestion, type QuestionKind } from "@/lib/question-classifier";
import { serverMessage } from "@/lib/i18n/server-messages";
import type { RetrievedPassage } from "@/lib/bible/types";

const TOPIC_STEPS: Array<{ re: RegExp; en: string; sw: string }> = [
  {
    re: /\b(forgive|forgiveness|hurt|betray|msamaha|samehe|umewaumiza)\b/i,
    en: "Forgiveness does not mean pretending the wound didn't happen — it means refusing to carry revenge. Start with honest prayer.",
    sw: "Msamaha si kufanya kama hukuumizwa — ni kuacha kulipa kisasi moyoni. Anza kwa sala ya uaminifu.",
  },
  {
    re: /\b(anxiet|worry|fear|afraid|wasiwasi|ogopa|hofu|waswas)\b/i,
    en: "Focus on today's faithful step rather than tomorrow's unknown. Bring your fear to God in prayer.",
    sw: "Zingatia hatua ya leo badala ya kesho isiyojulikana. Mlete Mungu katika sala.",
  },
  {
    re: /\b(marriage|husband|wife|ndoa|mume|mke)\b/i,
    en: "Seek understanding before defending yourself. Speak truth in love.",
    sw: "Tafuta kuelewa kabla ya kujitetea. Sema ukweli kwa upendo.",
  },
];

function practicalStep(question: string, locale: BibleLocale): string {
  for (const { re, en, sw } of TOPIC_STEPS) {
    if (re.test(question)) return locale === "sw" ? sw : en;
  }
  return serverMessage(locale, "defaultStep");
}

async function verseLookupReply(
  question: string,
  locale: BibleLocale,
): Promise<{ text: string; passages: RetrievedPassage[] }> {
  const { passages } = await lookupVerseReference(question, locale);
  if (passages.length === 0) {
    return {
      passages: [],
      text: serverMessage(locale, "verseNotFound"),
    };
  }

  const block = formatVerseLookupBlock(passages, locale);
  const intro = serverMessage(
    locale,
    passages.length === 1 ? "verseIntroOne" : "verseIntroMany",
  );

  return {
    passages,
    text: `${intro}\n\n${block}`,
  };
}

async function biblicalReply(
  question: string,
  locale: BibleLocale,
): Promise<{ text: string; passages: RetrievedPassage[] }> {
  const narrative = detectNarrative(question, locale);
  const limit = narrative ? 18 : 8;
  const passages = await retrieveScripture(question, limit, locale);
  const scripture = formatScriptureBlock(passages, locale);
  const step = practicalStep(question, locale);
  const stepLabel = serverMessage(locale, "kingdomStep");

  if (narrative && passages.length > 0) {
    const title = narrativeTitle(narrative, locale);
    const intro = serverMessage(locale, "storyIntro", { title });

    return {
      passages,
      text: `${intro}

${scripture}

**${stepLabel}:** ${step}`,
    };
  }

  if (!scripture) {
    return {
      passages: [],
      text: `${serverMessage(locale, "noPassagesYet")}

${step}`,
    };
  }

  return {
    passages,
    text: `${serverMessage(locale, "heardYou")}

${scripture}

**${stepLabel}:** ${step}`,
  };
}

export async function generateFreeFeedback(
  userText: string,
  locale: BibleLocale = "en",
): Promise<{ text: string; passages: RetrievedPassage[]; questionKind: QuestionKind }> {
  const kind = classifyQuestion(userText);

  if (kind === "greeting") {
    return {
      text: serverMessage(locale, "greetingReply"),
      passages: [],
      questionKind: kind,
    };
  }

  if (kind === "off-topic") {
    return {
      text: serverMessage(locale, "offTopicReply"),
      passages: [],
      questionKind: kind,
    };
  }

  if (kind === "verse") {
    const verse = await verseLookupReply(userText, locale);
    return { ...verse, questionKind: kind };
  }

  const biblical = await biblicalReply(userText, locale);
  return { ...biblical, questionKind: "biblical" };
}
