import type { ScripturePassage } from "@/components/chat/types";
import type { AppLocale } from "@/lib/i18n/translations";

export interface StreamMessage {
  role: "user" | "assistant";
  content: string;
}

export async function fetchKingdomReply(
  history: StreamMessage[],
  locale: AppLocale = "en",
): Promise<{ text: string; passages: ScripturePassage[] }> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      stream: false,
      locale,
      messages: history.map(({ role, content }) => ({ role, content })),
    }),
  });

  const data = (await response.json().catch(() => ({}))) as {
    content?: string;
    passages?: ScripturePassage[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? `Request failed (${response.status})`);
  }

  const text = data.content?.trim() ?? "";
  if (!text) {
    throw new Error("Kingdom AI returned an empty response. Please try again.");
  }

  return {
    text,
    passages: data.passages ?? [],
  };
}

export async function streamKingdomReply(
  history: StreamMessage[],
  handlers: {
    onScripture?: (passages: ScripturePassage[]) => void;
    onText: (chunk: string, accumulated: string) => void;
    onError: (message: string) => void;
  },
  locale: AppLocale = "en",
): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      stream: true,
      locale,
      messages: history.map(({ role, content }) => ({ role, content })),
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      (data as { error?: string }).error ??
        `Request failed (${response.status})`,
    );
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response stream available.");

  const decoder = new TextDecoder();
  let buffer = "";
  let accumulated = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = JSON.parse(line.slice(6)) as {
        type: string;
        text?: string;
        message?: string;
        passages?: ScripturePassage[];
      };

      if (payload.type === "scripture" && payload.passages) {
        handlers.onScripture?.(payload.passages);
      } else if (payload.type === "content" && payload.text) {
        accumulated += payload.text;
        handlers.onText(payload.text, accumulated);
      } else if (payload.type === "error") {
        throw new Error(payload.message ?? "Stream error");
      }
    }
  }

  if (!accumulated) {
    handlers.onError("I was unable to generate a response. Please try again.");
  }

  return accumulated;
}
