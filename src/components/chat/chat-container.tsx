"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";
import {
  STARTER_PROMPTS,
  type ChatMessage,
  type ScripturePassage,
} from "./types";

function createId() {
  return crypto.randomUUID();
}

export function ChatContainer() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scripture, setScripture] = useState<ScripturePassage[]>([]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      setError(null);
      const userMessage: ChatMessage = {
        id: createId(),
        role: "user",
        content: trimmed,
      };
      const assistantId = createId();
      const nextMessages = [
        ...messages,
        userMessage,
        { id: assistantId, role: "assistant" as const, content: "" },
      ];

      setMessages(nextMessages);
      setInput("");
      setIsStreaming(true);
      setScripture([]);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextMessages
              .slice(0, -1)
              .map(({ role, content }) => ({ role, content })),
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
              setScripture(payload.passages);
            } else if (payload.type === "content" && payload.text) {
              accumulated += payload.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: accumulated } : m,
                ),
              );
            } else if (payload.type === "error") {
              throw new Error(payload.message ?? "Stream error");
            }
          }
        }

        if (!accumulated) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content:
                      "I was unable to generate a response. Please try again.",
                  }
                : m,
            ),
          );
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong.";
        setError(message);
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, messages],
  );

  const showWelcome = messages.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {showWelcome ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              What would a Kingdom-of-God response look like?
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Kingdom AI helps you think, decide, and live according to
              Scripture. Every response is grounded in retrieved King James
              Version passages — not invented verses.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {STARTER_PROMPTS.map((prompt) => (
                <Button
                  key={prompt}
                  variant="outline"
                  size="sm"
                  className="h-auto whitespace-normal px-3 py-2 text-left text-xs leading-snug"
                  onClick={() => sendMessage(prompt)}
                  disabled={isStreaming}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {scripture.length > 0 && (
            <div className="border-b border-border bg-muted/40 px-4 py-2">
              <p className="mx-auto max-w-3xl text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  Scripture context (KJV):
                </span>{" "}
                {scripture.map((p) => p.ref).join(" · ")}
              </p>
            </div>
          )}
          <MessageList messages={messages} isStreaming={isStreaming} />
        </>
      )}

      {error && (
        <div className="border-t border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
          {error}
        </div>
      )}

      <ChatInput
        value={input}
        onChange={setInput}
        onSend={() => sendMessage(input)}
        disabled={isStreaming}
      />
    </div>
  );
}
