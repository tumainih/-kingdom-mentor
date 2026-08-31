"use client";

import { useCallback, useState } from "react";
import { Sparkles } from "lucide-react";
import { ChatHeader } from "./chat-header";
import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";
import { BrandLogo, BrandTitle } from "./brand";
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

  const hasMessages = messages.length > 0;

  return (
    <div className="canvas-gradient flex h-full flex-col">
      <ChatHeader />

      <div className="relative flex min-h-0 flex-1 flex-col">
        {!hasMessages ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 pb-8">
            <BrandLogo size="lg" className="mb-6 rounded-2xl shadow-lg shadow-brand/20" />

            <div className="mb-3">
              <BrandTitle size="lg" />
            </div>

            <div className="mb-10 text-center">
              <h2 className="text-xl font-medium text-brand-navy sm:text-2xl">
                What would wisdom require?
              </h2>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[15px] text-muted-foreground">
                <Sparkles className="h-4 w-4 text-brand" />
                Scripture-grounded AI guidance from the King James Version
              </p>
            </div>

            <div className="mb-8 flex w-full justify-center">
              <ChatInput
                value={input}
                onChange={setInput}
                onSend={() => sendMessage(input)}
                disabled={isStreaming}
                centered
                placeholder="Describe your situation or ask Kingdom AI…"
              />
            </div>

            <div className="grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  disabled={isStreaming}
                  className="rounded-2xl border border-brand/10 bg-white/80 px-4 py-3 text-left text-sm leading-snug text-foreground/80 shadow-sm transition-all hover:border-brand/25 hover:bg-white hover:shadow-md disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <MessageList
              messages={messages}
              isStreaming={isStreaming}
              scripture={scripture}
            />
          </div>
        )}

        {hasMessages && (
          <div className="shrink-0 bg-gradient-to-t from-[#f4f7fc] from-60% to-transparent px-0 pb-5 pt-6">
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={() => sendMessage(input)}
              disabled={isStreaming}
              placeholder="Message Kingdom AI…"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="absolute bottom-24 left-1/2 z-30 -translate-x-1/2 rounded-full border border-destructive/20 bg-white px-4 py-2 text-sm text-destructive shadow-lg">
          {error}
        </div>
      )}

      <p className="shrink-0 pb-3 text-center text-[11px] text-muted-foreground/80">
        <span className="font-medium text-brand">Kingdom AI</span> is not a
        replacement for God, pastoral care, or qualified professionals.
      </p>
    </div>
  );
}
