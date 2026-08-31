import { retrieveScripture } from "@/lib/bible/retrieval";
import { classifyQuestion, type QuestionKind } from "@/lib/question-classifier";
import type { RetrievedPassage } from "@/lib/bible/types";

const TOPIC_STEPS: Array<{ re: RegExp; step: string }> = [
  {
    re: /\b(forgive|forgiveness|hurt|betray|offend)\b/i,
    step: "Forgiveness does not mean pretending the wound didn't happen — it means you refuse to carry revenge in your heart. Start with honest prayer and one small act of release.",
  },
  {
    re: /\b(anxiet|worry|fear|afraid|future|tomorrow)\b/i,
    step: "Anxiety often grows when we try to control what we cannot. Focus on today's duty — one faithful step — and bring tomorrow to God in prayer.",
  },
  {
    re: /\b(marriage|husband|wife|divorce|partner)\b/i,
    step: "In conflict, seek understanding before defending yourself. Speak truth in love, and consider wise counsel from someone who knows you both.",
  },
  {
    re: /\b(guilt|shame|sin|repent|wrong)\b/i,
    step: "Bring this honestly to God — confess, receive mercy, and make amends where you can. Shame hides; repentance moves toward light and repair.",
  },
  {
    re: /\b(anger|wrath|bitter|resent)\b/i,
    step: "Pause before you speak or act. Ask what wound is driving the anger, and what a slow, righteous response would look like.",
  },
  {
    re: /\b(lonely|alone|isolat|depress|sad)\b/i,
    step: "You were not meant to carry everything alone. Reach out to one trusted person — and keep praying through the heaviness.",
  },
  {
    re: /\b(decision|choose|job|offer|should i)\b/i,
    step: "List what you know, what you fear, and what integrity requires. Seek counsel, pray for clarity, and avoid rushing a decision driven by fear or pride.",
  },
  {
    re: /\b(pray|prayer)\b/i,
    step: "Pray simply and honestly — tell God what you feel, ask for wisdom, and wait with an open heart to obey what is clear.",
  },
];

function practicalStep(question: string): string {
  for (const { re, step } of TOPIC_STEPS) {
    if (re.test(question)) return step;
  }
  return "Ask yourself: What would love require? What would humility require? What would integrity require before God?";
}

function formatPassages(passages: RetrievedPassage[]): string {
  if (passages.length === 0) return "";
  return passages
    .slice(0, 3)
    .map((p) => `**${p.ref}** — "${p.text}"`)
    .join("\n\n");
}

function greetingReply(): string {
  return "Peace to you. I'm Kingdom AI in **free guidance mode** — no paid API needed. Share what you feel or doubt, and I'll respond with wisdom from retrieved KJV Scripture.";
}

function offTopicReply(): string {
  return "I'm here for **faith, doubt, relationships, and life decisions** through KJV Scripture — that's my focus in free guidance mode. What's weighing on your heart that you'd like biblical wisdom for?";
}

async function biblicalReply(question: string): Promise<{
  text: string;
  passages: RetrievedPassage[];
}> {
  const passages = await retrieveScripture(question, 5);
  const scripture = formatPassages(passages);
  const step = practicalStep(question);

  if (!scripture) {
    return {
      passages: [],
      text: `Thank you for sharing. I hear you're working through something important.

I couldn't match clear KJV passages to this yet — try naming it more specifically (forgiveness, anxiety, marriage, guilt, a decision).

Meanwhile: ${step}

What part of this feels heaviest right now?`,
    };
  }

  return {
    passages,
    text: `I hear you. Here is free biblical guidance from retrieved KJV Scripture:

${scripture}

**A Kingdom-minded step:** ${step}

What would help most — going deeper on the Scripture, or thinking through your next action?`,
  };
}

export async function generateFreeFeedback(
  userText: string,
): Promise<{ text: string; passages: RetrievedPassage[]; questionKind: QuestionKind }> {
  const kind = classifyQuestion(userText);

  if (kind === "greeting") {
    return { text: greetingReply(), passages: [], questionKind: kind };
  }

  if (kind === "off-topic") {
    return { text: offTopicReply(), passages: [], questionKind: kind };
  }

  const biblical = await biblicalReply(userText);
  return { ...biblical, questionKind: "biblical" };
}
