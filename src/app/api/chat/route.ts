import {
  generateKingdomReply,
  getChunkText,
  prepareKingdomStream,
  type KingdomMessage,
} from "@/lib/generate-kingdom-reply";
import { formatAIError } from "@/lib/format-ai-error";
import { isAIConfigured } from "@/lib/gemini";

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

    const body = (await request.json()) as {
      messages?: unknown;
      stream?: boolean;
    };

    const messages = validateMessages(body.messages);
    const kingdomMessages: KingdomMessage[] = messages;
    const useStream = body.stream !== false;

    if (!useStream) {
      const reply = await generateKingdomReply(kingdomMessages);
      return Response.json({
        content: reply.text,
        passages: reply.passages,
      });
    }

    let streamResult;
    try {
      streamResult = await prepareKingdomStream(kingdomMessages);
    } catch (err) {
      const reply = await generateKingdomReply(kingdomMessages);
      return streamJsonFallback(reply.text, reply.passages);
    }

    const { result, passages } = streamResult;
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "scripture", passages })}\n\n`,
          ),
        );

        let accumulated = "";

        try {
          for await (const chunk of result.stream) {
            const text = getChunkText(chunk);
            if (text) {
              accumulated += text;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "content", text })}\n\n`,
                ),
              );
            }
          }

          if (!accumulated.trim()) {
            throw new Error("Empty stream");
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`),
          );
        } catch {
          try {
            const fallback = await generateKingdomReply(kingdomMessages);
            if (fallback.text) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "content", text: fallback.text })}\n\n`,
                ),
              );
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`),
              );
              return;
            }
          } catch (fallbackErr) {
            const message = formatAIError(fallbackErr);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "error", message })}\n\n`,
              ),
            );
            return;
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                message: "Could not get a response. Please try again.",
              })}\n\n`,
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

function streamJsonFallback(content: string, passages: unknown[]) {
  const encoder = new TextEncoder();
  const body = [
    `data: ${JSON.stringify({ type: "scripture", passages })}\n\n`,
    `data: ${JSON.stringify({ type: "content", text: content })}\n\n`,
    `data: ${JSON.stringify({ type: "done" })}\n\n`,
  ].join("");

  return new Response(encoder.encode(body), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
