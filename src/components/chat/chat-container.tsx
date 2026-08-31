"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Sparkles } from "lucide-react";
import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";
import { AiThinking } from "./ai-badge";
import { BrandLogo, BrandTitle } from "./brand";
import { RecommendedQuestions } from "./recommended-questions";
import { speakText } from "@/hooks/use-speech";
import { streamKingdomReply } from "@/lib/chat-stream";
import { type ChatMessage, type ScripturePassage } from "./types";

function createId() {
  return crypto.randomUUID();
}

interface ChatContainerProps {
  aiReady?: boolean;
}

export function ChatContainer({ aiReady = false }: ChatContainerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const messagesRef = useRef<ChatMessage[]>([]);

  messagesRef.current = messages;

  const streamReply = useCallback(
    async (history: ChatMessage[], assistantId: string) => {
      setIsStreaming(true);
      setError(null);

      try {
        let passages: ScripturePassage[] = [];
        const accumulated = await streamKingdomReply(
          history.map(({ role, content }) => ({ role, content })),
          {
            onScripture: (p) => {
              passages = p;
            },
            onText: (_chunk, text) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: text, scripture: passages }
                    : m,
                ),
              );
            },
            onError: (message) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: message } : m,
                ),
              );
            },
          },
        );

        if (accumulated && autoSpeak) {
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
          "Add GEMINI_API_KEY to .env.local to start conversing with Kingdom AI.",
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
      setError(null);

      await streamReply(history, assistantId);
    },
    [aiReady, isStreaming, streamReply],
  );

  const lastMessage = messages[messages.length - 1];
  const isThinking =
    isStreaming &&
    lastMessage?.role === "assistant" &&
    !lastMessage.content.trim();

  const inputDisabled = isStreaming || !aiReady;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {messages.length === 0 ? (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center px-3 py-6 sm:px-4 sm:py-10">
              <div className="relative mb-4 sm:mb-5">
                <BrandLogo size="lg" className="logo-glow relative rounded-2xl" />
              </div>

              <BrandTitle size="lg" />

              <div className="mt-4 max-w-md text-center sm:mt-5">
                <h2 className="font-heading text-lg font-semibold brand-gradient-text sm:text-xl">
                  Biblical wisdom for life&apos;s questions
                </h2>
                <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
                  <BookOpen className="h-3.5 w-3.5 text-brand-gold" />
                  KJV Scripture · type your questions here
                </p>
              </div>
            </div>
          ) : (
            <>
              <MessageList messages={messages} isStreaming={isStreaming} />
              <AiThinking visible={isThinking} />
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-border/50 bg-composer/95 backdrop-blur-md">
          <div className="pt-2">
            <RecommendedQuestions
              onSelect={sendMessage}
              disabled={inputDisabled}
              defaultOpen={false}
            />
          </div>

          <div className="px-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:pt-2.5">
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={() => sendMessage(input)}
              disabled={inputDisabled}
              placeholder={
                messages.length
                  ? "Continue the conversation…"
                  : "Share what's on your heart…"
              }
            />

            <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 pt-1.5">
              <label className="flex cursor-pointer items-center gap-1.5 text-[10px] text-muted-foreground sm:text-[11px]">
                <input
                  type="checkbox"
                  checked={autoSpeak}
                  onChange={(e) => setAutoSpeak(e.target.checked)}
                  className="rounded border-border text-brand focus:ring-brand"
                />
                Read replies aloud
              </label>
              <span className="hidden text-muted-foreground sm:inline">·</span>
              <p className="flex items-center gap-1 text-[10px] text-muted-foreground sm:text-[11px]">
                <Sparkles className="h-3 w-3 text-brand-gold" />
                <span className="font-medium text-brand">Kingdom AI</span> remembers
                this thread
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="pointer-events-none absolute bottom-36 left-1/2 z-30 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-destructive/25 bg-white px-3 py-2.5 text-center text-xs text-destructive shadow-lg sm:text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
