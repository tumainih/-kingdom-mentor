import { classifyQuestion } from "@/lib/question-classifier";
import {
  buildSystemPromptForKind,
  type PromptKind,
} from "@/lib/prompts/kingdom-ai-system-prompt";
import {
  buildRetrievalQueryFromMessages,
  retrieveAndFormat,
} from "@/lib/bible/retrieval";
import { formatAIError } from "@/lib/format-ai-error";
import { getGeminiClient, getModel, isAIConfigured } from "@/lib/gemini";
import type { RetrievedPassage } from "@/lib/bible/types";

export interface KingdomMessage {
  role: "user" | "assistant";
  content: string;
}

export interface KingdomReply {
  text: string;
  passages: RetrievedPassage[];
  questionKind: PromptKind;
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
      return { temperature: 0.6, maxOutputTokens: 180 };
    case "off-topic":
      return { temperature: 0.5, maxOutputTokens: 220 };
    default:
      return { temperature: 0.65, maxOutputTokens: 900 };
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

  // Drop trailing model turn if history ends unevenly
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

export async function generateKingdomReply(
  messages: KingdomMessage[],
): Promise<KingdomReply> {
  if (!isAIConfigured()) {
    throw new Error(
      "Gemini API key is not configured. Add GEMINI_API_KEY to your environment.",
    );
  }

  const client = getGeminiClient();
  if (!client) {
    throw new Error("Gemini client failed to initialize.");
  }

  const sanitized = sanitizeMessages(messages);
  if (sanitized.length === 0) {
    throw new Error("At least one message is required.");
  }

  const questionKind = resolveQuestionKind(sanitized);
  const retrievalQuery = buildRetrievalQueryFromMessages(sanitized);

  let scriptureBlock = "";
  let passages: RetrievedPassage[] = [];

  if (questionKind === "biblical") {
    const retrieved = await retrieveAndFormat(retrievalQuery);
    scriptureBlock = retrieved.block;
    passages = retrieved.passages;
  }

  const systemPrompt = buildSystemPromptForKind(questionKind, scriptureBlock);
  const latestMessage = sanitized[sanitized.length - 1];

  const model = client.getGenerativeModel({
    model: getModel(),
    systemInstruction: systemPrompt,
    generationConfig: generationConfigForKind(questionKind),
  });

  const chat = model.startChat({
    history: toGeminiHistory(sanitized),
  });

  try {
    const result = await chat.sendMessage(latestMessage.content);
    const text = extractTextFromResponse(result.response);
    if (!text) {
      throw new Error("Kingdom AI returned an empty response. Please try again.");
    }
    return { text, passages, questionKind };
  } catch (err) {
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

export async function prepareKingdomStream(messages: KingdomMessage[]) {
  const sanitized = sanitizeMessages(messages);
  if (sanitized.length === 0) {
    throw new Error("At least one message is required.");
  }

  const questionKind = resolveQuestionKind(sanitized);
  const retrievalQuery = buildRetrievalQueryFromMessages(sanitized);

  let scriptureBlock = "";
  let passages: RetrievedPassage[] = [];

  if (questionKind === "biblical") {
    const retrieved = await retrieveAndFormat(retrievalQuery);
    scriptureBlock = retrieved.block;
    passages = retrieved.passages;
  }

  const client = getGeminiClient();
  if (!client) {
    throw new Error("Gemini client failed to initialize.");
  }

  const latestMessage = sanitized[sanitized.length - 1];
  const model = client.getGenerativeModel({
    model: getModel(),
    systemInstruction: buildSystemPromptForKind(questionKind, scriptureBlock),
    generationConfig: generationConfigForKind(questionKind),
  });

  const chat = model.startChat({
    history: toGeminiHistory(sanitized),
  });

  const result = await chat.sendMessageStream(latestMessage.content);

  return { result, passages, sanitized };
}
