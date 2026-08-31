import { retrieveScripture, formatScriptureBlock } from "@/lib/bible/retrieval";
import type { BibleLocale } from "@/lib/bible/locale";
import { detectNarrative, narrativeTitle } from "@/lib/bible/narratives";
import { classifyQuestion, type QuestionKind } from "@/lib/question-classifier";
import type { RetrievedPassage } from "@/lib/bible/types";

const TOPIC_STEPS_EN: Array<{ re: RegExp; step: string }> = [
  {
    re: /\b(forgive|forgiveness|hurt|betray)\b/i,
    step: "Forgiveness does not mean pretending the wound didn't happen — it means refusing to carry revenge. Start with honest prayer.",
  },
  {
    re: /\b(anxiet|worry|fear|afraid)\b/i,
    step: "Focus on today's faithful step rather than tomorrow's unknown. Bring your fear to God in prayer.",
  },
  {
    re: /\b(marriage|husband|wife)\b/i,
    step: "Seek understanding before defending yourself. Speak truth in love.",
  },
];

const TOPIC_STEPS_SW: Array<{ re: RegExp; step: string }> = [
  {
    re: /\b(msamaha|samehe|umewaumiza)\b/i,
    step: "Msamaha si kufanya kama hukuumizwa — ni kuacha kulipa kisasi moyoni. Anza kwa sala ya uaminifu.",
  },
  {
    re: /\b(wasiwasi|ogopa|hofu|waswas)\b/i,
    step: "Zingatia hatua ya leo badala ya kesho isiyojulikana. Mlete Mungu katika sala.",
  },
  {
    re: /\b(ndoa|mume|mke)\b/i,
    step: "Tafuta kuelewa kabla ya kujitetea. Sema ukweli kwa upendo.",
  },
];

function practicalStep(question: string, locale: BibleLocale): string {
  const steps = locale === "sw" ? TOPIC_STEPS_SW : TOPIC_STEPS_EN;
  for (const { re, step } of steps) {
    if (re.test(question)) return step;
  }
  return locale === "sw"
    ? "Jiulize: Upendo unahitaji nini? Unyenyekevu unahitaji nini? Uaminifu unahitaji nini mbele za Mungu?"
    : "Ask: What would love require? Humility? Integrity before God?";
}

function greetingReply(locale: BibleLocale): string {
  return locale === "sw"
    ? "Amani iwe kwako. Mimi ni Kingdom AI katika **mwongozo bure** — Biblia kamili (SUV), bila malipo. Shiriki unachohisi au shaka yako."
    : "Peace to you. I'm Kingdom AI in **free guidance mode** — full Bible (KJV), no payment needed. Share what you feel or doubt.";
}

function offTopicReply(locale: BibleLocale): string {
  return locale === "sw"
    ? "Ninasaidia kupitia **Biblia kamili** kwa imani, shaka, mahusiano, na maamuzi — si maswali ya nje kama hali ya hewa au code. Unachohisi au shaka gani leo?"
    : "I help through the **full Bible** for faith, doubt, relationships, and decisions — not off-topic questions. What's on your heart?";
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

  if (narrative && passages.length > 0) {
    const title = narrativeTitle(narrative, locale);
    const intro =
      locale === "sw"
        ? `Hii ni muhtasari wa hadithi ya **${title}** kutoka mistari iliyopatikana katika Biblia kamili:`
        : `Here is the story of **${title}** from passages across the full Bible:`;

    return {
      passages,
      text: `${intro}

${scripture}

**${locale === "sw" ? "Hatua ya kiroho" : "Kingdom step"}:** ${step}`,
    };
  }

  if (!scripture) {
    return {
      passages: [],
      text:
        locale === "sw"
          ? `Asante kwa kushiriki. Bado sijapata mistari wazi — jaribu kuuliza kwa jina (mf. Musa, Daudi, Yesu) au mada (msamaha, wasiwasi).

${step}`
          : `Thank you for sharing. I couldn't match clear passages yet — try a name (Moses, David, Jesus) or topic (forgiveness, anxiety).

${step}`,
    };
  }

  return {
    passages,
    text:
      locale === "sw"
        ? `Nimekusikia. Hii ni mwongozo kutoka Biblia kamili:

${scripture}

**Hatua:** ${step}`
        : `I hear you. Guidance from the full Bible:

${scripture}

**Kingdom step:** ${step}`,
  };
}

export async function generateFreeFeedback(
  userText: string,
  locale: BibleLocale = "en",
): Promise<{ text: string; passages: RetrievedPassage[]; questionKind: QuestionKind }> {
  const kind = classifyQuestion(userText);

  if (kind === "greeting") {
    return { text: greetingReply(locale), passages: [], questionKind: kind };
  }

  if (kind === "off-topic") {
    return { text: offTopicReply(locale), passages: [], questionKind: kind };
  }

  const biblical = await biblicalReply(userText, locale);
  return { ...biblical, questionKind: "biblical" };
}
