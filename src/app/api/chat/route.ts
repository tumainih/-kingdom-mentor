import { buildSystemPrompt } from "@/lib/prompts/kingdom-ai-system-prompt";
import { retrieveAndFormat } from "@/lib/bible/retrieval";
import { formatAIError } from "@/lib/format-ai-error";
import { getGeminiClient, getModel, isAIConfigured } from "@/lib/gemini";

export const runtime = "nodejs";

const MAX_MESSAGES = 40;
const MAX_MESSAGE_LENGTH = 4000;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function validateMessages(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) {
    throw new Error("Messages must be an array.");
  }

  if (messages.length === 0) {
    throw new Error("At least one message is required.");
  }

  if (messages.length > MAX_MESSAGES) {
    throw new Error(`Too many messages. Maximum is ${MAX_MESSAGES}.`);
  }

  return messages.map((msg, index) => {
    if (
      typeof msg !== "object" ||
      msg === null ||
      !("role" in msg) ||
      !("content" in msg)
    ) {
      throw new Error(`Invalid message at index ${index}.`);
    }

    const { role, content } = msg as { role: string; content: string };

    if (role !== "user" && role !== "assistant") {
      throw new Error(`Invalid role at index ${index}.`);
    }

    if (typeof content !== "string" || !content.trim()) {
      throw new Error(`Message content at index ${index} cannot be empty.`);
    }

    if (content.length > MAX_MESSAGE_LENGTH) {
      throw new Error(
        `Message at index ${index} exceeds ${MAX_MESSAGE_LENGTH} characters.`,
      );
    }

    return { role, content: content.trim() };
  });
}

function buildRetrievalQuery(messages: ChatMessage[]): string {
  const recent = messages.slice(-10);
  return recent.map((m) => `${m.role}: ${m.content}`).join("\n");
}

/** Gemini requires history to start with a user turn and alternate roles. */
function toGeminiHistory(messages: ChatMessage[]) {
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: m.content }],
  }));

  while (history.length > 0 && history[0].role === "model") {
    history.shift();
  }

  return history;
}

export async function POST(request: Request) {
  try {
    if (!isAIConfigured()) {
      return Response.json(
        {
          error:
            "Gemini API key is not configured. Add GEMINI_API_KEY to your environment.",
        },
        { status: 503 },
      );
    }

    const client = getGeminiClient();
    if (!client) {
      return Response.json(
        { error: "Gemini client failed to initialize." },
        { status: 503 },
      );
    }

    const body = await request.json();
    const messages = validateMessages(body.messages);
    const retrievalQuery = buildRetrievalQuery(messages);

    const { block: scriptureBlock, passages } =
      await retrieveAndFormat(retrievalQuery);

    const systemPrompt = buildSystemPrompt(scriptureBlock);
    const latestMessage = messages[messages.length - 1];

    const model = client.getGenerativeModel({
      model: getModel(),
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.75,
        maxOutputTokens: 2500,
      },
    });

    const chat = model.startChat({
      history: toGeminiHistory(messages),
    });

    const result = await chat
      .sendMessageStream(latestMessage.content)
      .catch((err) => {
        throw new Error(formatAIError(err));
      });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "scripture", passages })}\n\n`,
          ),
        );

        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "content", text })}\n\n`,
                ),
              );
            }
          }
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`),
          );
        } catch (err) {
          const message = formatAIError(err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message })}\n\n`,
            ),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const message = formatAIError(err);
    const status = message.includes("Invalid") || message.includes("Too many")
      ? 400
      : message.includes("quota")
        ? 402
        : 500;
    return Response.json({ error: message }, { status });
  }
}
