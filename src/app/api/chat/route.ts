import { buildSystemPrompt } from "@/lib/prompts/kingdom-ai-system-prompt";
import { retrieveAndFormat } from "@/lib/bible/retrieval";
import { getOpenAIClient, getModel } from "@/lib/openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

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


/** Build retrieval query from full conversation so follow-ups stay on topic. */
function buildRetrievalQuery(messages: ChatMessage[]): string {
  const recent = messages.slice(-10);
  return recent.map((m) => `${m.role}: ${m.content}`).join("\n");
}

export async function POST(request: Request) {
  try {
    const client = getOpenAIClient();
    if (!client) {
      return Response.json(
        {
          error:
            "OpenAI API key is not configured. Add OPENAI_API_KEY to your environment.",
        },
        { status: 503 },
      );
    }

    const body = await request.json();
    const messages = validateMessages(body.messages);
    const retrievalQuery = buildRetrievalQuery(messages);

    const { block: scriptureBlock, passages } =
      await retrieveAndFormat(retrievalQuery);

    const systemPrompt = buildSystemPrompt(scriptureBlock);

    const openaiMessages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const stream = await client.chat.completions.create({
      model: getModel(),
      messages: openaiMessages,
      stream: true,
      temperature: 0.75,
      max_tokens: 2500,
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
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
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
          const message =
            err instanceof Error ? err.message : "Stream error occurred.";
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
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    const status = message.includes("Invalid") || message.includes("Too many")
      ? 400
      : 500;
    return Response.json({ error: message }, { status });
  }
}
