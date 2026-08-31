"use client";

import { useCallback, useRef, useState } from "react";
import { BrandLogo, BrandTitle } from "./brand";
import { MessageList } from "./message-list";
import { AiThinking } from "./ai-badge";
import { ComposerBar } from "./composer-bar";
import { streamKingdomReply } from "@/lib/chat-stream";
import type { AppMode } from "@/components/app-shell";
import { type ChatMessage, type ScripturePassage } from "./types";

function createId() {
  return crypto.randomUUID();
}

interface ChatContainerProps {
  aiReady?: boolean;
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export function ChatContainer({
  aiReady = false,
  mode,
  onModeChange,
}: ChatContainerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  messagesRef.current = messages;

  const streamReply = useCallback(
    async (history: ChatMessage[], assistantId: string) => {
      setIsStreaming(true);
      setError(null);

      try {
        let passages: ScripturePassage[] = [];
        await streamKingdomReply(
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
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong.";
        setError(message);
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setIsStreaming(false);
      }
    },
    [],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      if (!aiReady) {
        setError("Add GEMINI_API_KEY to .env.local to chat.");
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
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-1 pt-2 sm:px-4 sm:pt-3">
      <div className="chat-canvas mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col overflow-hidden">
        <span className="canvas-label">Canvas</span>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-10">
          {messages.length === 0 ? (
            <div className="flex h-full min-h-[160px] flex-col items-center justify-center px-6 py-10 text-center">
              <BrandLogo size="lg" className="logo-glow-ring rounded-2xl" />
              <BrandTitle size="lg" className="mt-5" />
              <p className="mt-6 max-w-lg text-lg font-medium text-foreground/90 sm:text-xl">
                Write what you feel or doubt
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                KJV Scripture · Kingdom AI listens here
              </p>
            </div>
          ) : (
            <>
              <MessageList messages={messages} isStreaming={isStreaming} />
              <AiThinking visible={isThinking} />
            </>
          )}
        </div>
      </div>

      <ComposerBar
        mode={mode}
        onModeChange={onModeChange}
        value={input}
        onChange={setInput}
        onSend={() => sendMessage(input)}
        disabled={inputDisabled}
        placeholder="Write what you feel or doubt…"
      />

      {error && (
        <div className="pointer-events-none absolute bottom-28 left-1/2 z-30 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-lg border border-destructive/40 bg-card px-3 py-2 text-center text-xs text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
