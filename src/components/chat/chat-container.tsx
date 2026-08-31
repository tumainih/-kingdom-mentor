"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { ChatHeader } from "./chat-header";
import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";
import { AiThinking } from "./ai-badge";
import { BrandLogo, BrandTitle } from "./brand";
import { DecorativeBackground } from "./decorative-background";
import { StarterPrompts } from "./starter-prompts";
import { speakText } from "@/hooks/use-speech";
import {
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
    async (
      history: ChatMessage[],
      assistantId: string,
    ) => {
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
    <div className="canvas-gradient relative flex h-full flex-col">
      <DecorativeBackground />
      <ChatHeader
        onNewChat={handleNewChat}
        showNewChat={hasMessages}
        aiReady={mounted && aiReady}
      />

      {mounted && !aiReady && (
        <div className="border-b border-amber-200/60 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          <strong>To talk with Kingdom AI,</strong> add your OpenAI key to{" "}
          <code className="rounded bg-amber-100/80 px-1.5 py-0.5 text-xs">
            .env.local
          </code>
          :{" "}
          <code className="rounded bg-amber-100/80 px-1.5 py-0.5 text-xs">
            OPENAI_API_KEY=sk-...
          </code>{" "}
          then restart the dev server. You can type or use the mic to talk.
        </div>
      )}

      <div className="relative flex min-h-0 flex-1 flex-col">
        {!hasMessages ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 pb-8">
            <div className="relative mb-6">
              <div className="absolute inset-0 scale-110 rounded-3xl bg-brand/10 blur-xl" />
              <BrandLogo
                size="lg"
                className="logo-glow-ring relative rounded-2xl"
              />
            </div>

            <div className="mb-3">
              <BrandTitle size="lg" />
            </div>

            <div className="mb-10 text-center">
              <h2 className="brand-gradient-text text-xl font-semibold sm:text-2xl">
                Tell me what&apos;s on your heart
              </h2>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[15px] text-muted-foreground">
                <Sparkles className="h-4 w-4 text-brand" />
                Have a real conversation — type or tap the mic to talk
              </p>
            </div>

            <div className="mb-8 flex w-full justify-center">
              <ChatInput
                value={input}
                onChange={setInput}
                onSend={() => sendMessage(input)}
                disabled={inputDisabled}
                centered
                placeholder="Share your situation — I'll walk through it with you…"
              />
            </div>

            <StarterPrompts onSelect={sendMessage} disabled={inputDisabled} />
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <MessageList messages={messages} isStreaming={isStreaming} />
            <AiThinking visible={isThinking} />
          </div>
        )}

        {hasMessages && (
          <div className="shrink-0 bg-gradient-to-t from-[#f4f7fc] from-60% to-transparent px-0 pb-5 pt-6">
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={() => sendMessage(input)}
              disabled={inputDisabled}
              placeholder="Continue the conversation…"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="absolute bottom-24 left-1/2 z-30 max-w-md -translate-x-1/2 rounded-2xl border border-destructive/20 bg-white px-4 py-2 text-center text-sm text-destructive shadow-lg">
          {error}
        </div>
      )}

      <div className="flex shrink-0 items-center justify-center gap-3 pb-3">
        <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
          <input
            type="checkbox"
            checked={autoSpeak}
            onChange={(e) => setAutoSpeak(e.target.checked)}
            className="rounded border-border text-brand focus:ring-brand"
          />
          AI reads replies aloud
        </label>
        <span className="text-muted-foreground/40">·</span>
        <p className="text-[11px] text-muted-foreground/80">
          <span className="font-medium text-brand">Kingdom AI</span> remembers
          this conversation
        </p>
      </div>
    </div>
  );
}
