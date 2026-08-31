"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Sparkles } from "lucide-react";
import { ChatHeader } from "./chat-header";
import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";
import { AiThinking } from "./ai-badge";
import { BrandLogo, BrandTitle } from "./brand";
import { DecorativeBackground } from "./decorative-background";
import { StarterPrompts } from "./starter-prompts";
import { speakText } from "@/hooks/use-speech";
import { type ChatMessage, type ScripturePassage } from "./types";

function createId() {
  return crypto.randomUUID();
}

export function ChatContainer() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiReady, setAiReady] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [mounted, setMounted] = useState(false);
  const messagesRef = useRef<ChatMessage[]>([]);

  messagesRef.current = messages;

  useEffect(() => {
    setMounted(true);
    fetch("/api/status")
      .then((r) => r.json())
      .then((data: { aiReady?: boolean }) => setAiReady(data.aiReady ?? false))
      .catch(() => setAiReady(false));
  }, []);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setInput("");
    setError(null);
    setIsStreaming(false);
  }, []);

  const streamReply = useCallback(
    async (history: ChatMessage[], assistantId: string) => {
      setIsStreaming(true);
      setError(null);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
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
        let passages: ScripturePassage[] = [];

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
              passages = payload.passages;
            } else if (payload.type === "content" && payload.text) {
              accumulated += payload.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: accumulated, scripture: passages }
                    : m,
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
        } else if (autoSpeak) {
          speakText(accumulated);
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
    [autoSpeak],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      if (!aiReady) {
        setError(
          "Add OPENAI_API_KEY to .env.local to start conversing with Kingdom AI.",
        );
        return;
      }

      const userMessage: ChatMessage = {
        id: createId(),
        role: "user",
        content: trimmed,
      };
      const assistantId = createId();
      const history = [...messagesRef.current, userMessage];

      setMessages([
        ...history,
        { id: assistantId, role: "assistant", content: "" },
      ]);
      setInput("");

      await streamReply(history, assistantId);
    },
    [aiReady, isStreaming, streamReply],
  );

  const hasMessages = messages.length > 0;
  const lastMessage = messages[messages.length - 1];
  const isThinking =
    isStreaming &&
    lastMessage?.role === "assistant" &&
    !lastMessage.content.trim();

  const inputDisabled = isStreaming || !aiReady;

  return (
    <div className="canvas-gradient relative flex h-full min-h-0 flex-col overflow-hidden">
      <DecorativeBackground />

      <ChatHeader
        onNewChat={handleNewChat}
        showNewChat={hasMessages}
        aiReady={mounted && aiReady}
      />

      {mounted && !aiReady && (
        <div className="shrink-0 border-b border-amber-200/60 bg-amber-50 px-3 py-2 text-center text-xs text-amber-900 sm:text-sm">
          Add <code className="rounded bg-amber-100/80 px-1 text-[10px] sm:text-xs">OPENAI_API_KEY</code> to{" "}
          <code className="rounded bg-amber-100/80 px-1 text-[10px] sm:text-xs">.env.local</code> to enable chat.
        </div>
      )}

      {/* Scrollable main area — fits remaining viewport height */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {!hasMessages ? (
            <div className="flex min-h-min flex-col items-center px-3 py-5 sm:px-4 sm:py-8">
              <div className="relative mb-4 sm:mb-5">
                <BrandLogo size="lg" className="logo-glow-ring relative rounded-2xl" />
              </div>

              <BrandTitle size="lg" />

              <div className="mt-4 max-w-md text-center sm:mt-5">
                <h2 className="font-heading text-lg font-semibold brand-gradient-text sm:text-xl">
                  Biblical wisdom for life&apos;s questions
                </h2>
                <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
                  <BookOpen className="h-3.5 w-3.5 text-brand-gold" />
                  KJV Scripture · conversational guidance
                </p>
              </div>

              <div className="mt-5 w-full sm:mt-7">
                <StarterPrompts onSelect={sendMessage} disabled={inputDisabled} />
              </div>
            </div>
          ) : (
            <>
              <MessageList messages={messages} isStreaming={isStreaming} />
              <AiThinking visible={isThinking} />
            </>
          )}
        </div>

        {/* Input always pinned to bottom — fits screen on mobile & desktop */}
        <div className="shrink-0 border-t border-border/50 bg-composer/95 px-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md sm:pt-3">
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={() => sendMessage(input)}
            disabled={inputDisabled}
            placeholder={
              hasMessages
                ? "Continue the conversation…"
                : "Share what's on your heart…"
            }
          />

          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 pt-1.5">
            <label className="flex cursor-pointer items-center gap-1 text-[10px] text-muted-foreground sm:text-[11px]">
              <input
                type="checkbox"
                checked={autoSpeak}
                onChange={(e) => setAutoSpeak(e.target.checked)}
                className="rounded border-border text-brand focus:ring-brand"
              />
              Read aloud
            </label>
            <span className="hidden text-muted-foreground/30 sm:inline">·</span>
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground sm:text-[11px]">
              <Sparkles className="h-3 w-3 text-brand-gold" />
              <span className="font-medium text-brand">Kingdom AI</span>
              remembers this thread
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="pointer-events-none absolute bottom-28 left-1/2 z-30 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-xl border border-destructive/20 bg-white px-3 py-2 text-center text-xs text-destructive shadow-lg sm:text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
