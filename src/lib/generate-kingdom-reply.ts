import { classifyQuestion } from "@/lib/question-classifier";
import {
  buildSystemPromptForKind,
  type PromptKind,
} from "@/lib/prompts/kingdom-ai-system-prompt";
import {
  buildRetrievalQueryFromMessages,
  retrieveAndFormat,
  type BibleLocale,
} from "@/lib/bible/retrieval";
import { formatAIError } from "@/lib/format-ai-error";
import { generateFreeFeedback } from "@/lib/free-feedback";
import { isApiUnavailableError } from "@/lib/is-api-unavailable-error";
import { getGeminiClient, getModel, isAIConfigured } from "@/lib/gemini";
import type { RetrievedPassage } from "@/lib/bible/types";

export interface KingdomMessage {
  role: "user" | "assistant";
  content: string;
}

export type ReplyMode = "gemini" | "free";

export interface KingdomReply {
  text: string;
  passages: RetrievedPassage[];
  questionKind: PromptKind;
  mode: ReplyMode;
  locale: BibleLocale;
}

function sanitizeMessages(messages: KingdomMessage[]): KingdomMessage[] {
  return messages
    .map((m) => ({ ...m, content: m.content.trim() }))
    .filter((m) => m.content.length > 0);
}

function resolveQuestionKind(messages: KingdomMessage[]): PromptKind {
  const latest = messages[messages.length - 1]?.content ?? "";
  let kind = classifyQuestion(latest);

  if (kind === "off-topic" && messages.length > 1) {
    const priorUser = messages.filter((m) => m.role === "user").slice(0, -1);
    if (priorUser.some((m) => classifyQuestion(m.content) === "biblical")) {
      kind = "biblical";
    }
  }

  return kind;
}

function generationConfigForKind(kind: PromptKind) {
  switch (kind) {
    case "greeting":
      return { temperature: 0.6, maxOutputTokens: 220 };
    case "off-topic":
      return { temperature: 0.5, maxOutputTokens: 260 };
    default:
      return { temperature: 0.65, maxOutputTokens: 1000 };
  }
}

function toGeminiHistory(messages: KingdomMessage[]) {
  const recent = sanitizeMessages(messages).slice(-8);
  const history = recent.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: m.content }],
  }));

  while (history.length > 0 && history[0].role === "model") {
    history.shift();
  }

  while (history.length > 0 && history[history.length - 1].role === "model") {
    history.pop();
  }

  return history;
}

function extractTextFromResponse(response: {
  text?: () => string;
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
}): string {
  try {
    const direct = response.text?.();
    if (direct?.trim()) return direct.trim();
  } catch {
    /* fall through */
  }

  const parts =
    response.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("") ?? "";

  return parts.trim();
}

async function generateWithGemini(
  messages: KingdomMessage[],
  locale: BibleLocale,
): Promise<KingdomReply> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error("Gemini client failed to initialize.");
  }

  const sanitized = sanitizeMessages(messages);
  const questionKind = resolveQuestionKind(sanitized);
  const retrievalQuery = buildRetrievalQueryFromMessages(sanitized);

  const { block: scriptureBlock, passages, narrative } =
    await retrieveAndFormat(retrievalQuery, locale);

  const latestMessage = sanitized[sanitized.length - 1];
  const model = client.getGenerativeModel({
    model: getModel(),
    systemInstruction: buildSystemPromptForKind(
      questionKind,
      scriptureBlock,
      locale,
      narrative,
    ),
    generationConfig: generationConfigForKind(questionKind),
  });

  const chat = model.startChat({
    history: toGeminiHistory(sanitized),
  });

  const result = await chat.sendMessage(latestMessage.content);
  const text = extractTextFromResponse(result.response);
  if (!text) {
    throw new Error("Kingdom AI returned an empty response.");
  }

  return { text, passages, questionKind, mode: "gemini", locale };
}

export async function generateKingdomReply(
  messages: KingdomMessage[],
  locale: BibleLocale = "en",
): Promise<KingdomReply> {
  const sanitized = sanitizeMessages(messages);
  if (sanitized.length === 0) {
    throw new Error("At least one message is required.");
  }

  const latest = sanitized[sanitized.length - 1].content;

  if (!isAIConfigured()) {
    const free = await generateFreeFeedback(latest, locale);
    return { ...free, mode: "free", locale };
  }

  try {
    return await generateWithGemini(sanitized, locale);
  } catch (err) {
    if (isApiUnavailableError(err)) {
      const free = await generateFreeFeedback(latest, locale);
      return { ...free, mode: "free", locale };
    }
    throw new Error(formatAIError(err));
  }
}

export function getChunkText(chunk: {
  text?: () => string;
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
}): string {
  try {
    return chunk.text?.() ?? "";
  } catch {
    return (
      chunk.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? "")
        .join("") ?? ""
    );
  }
}

export async function prepareKingdomStream(
  messages: KingdomMessage[],
  locale: BibleLocale = "en",
) {
  if (!isAIConfigured()) {
    throw new Error("free-mode");
  }

  const sanitized = sanitizeMessages(messages);
  if (sanitized.length === 0) {
    throw new Error("At least one message is required.");
  }

  const questionKind = resolveQuestionKind(sanitized);
  const retrievalQuery = buildRetrievalQueryFromMessages(sanitized);

  const { block: scriptureBlock, passages, narrative } =
    await retrieveAndFormat(retrievalQuery, locale);

  const client = getGeminiClient();
  if (!client) {
    throw new Error("free-mode");
  }

  const latestMessage = sanitized[sanitized.length - 1];
  const model = client.getGenerativeModel({
    model: getModel(),
    systemInstruction: buildSystemPromptForKind(
      questionKind,
      scriptureBlock,
      locale,
      narrative,
    ),
    generationConfig: generationConfigForKind(questionKind),
  });

  const chat = model.startChat({
    history: toGeminiHistory(sanitized),
  });

  const result = await chat.sendMessageStream(latestMessage.content);

  return { result, passages, sanitized };
}
