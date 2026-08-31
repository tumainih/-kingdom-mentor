"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./message-bubble";
import type { ChatMessage, ScripturePassage } from "./types";

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  scripture: ScripturePassage[];
}

export function MessageList({
  messages,
  isStreaming,
  scripture,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      {scripture.length > 0 && (
        <div className="mb-6 rounded-2xl border border-brand/15 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">
            Scripture context · KJV
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {scripture.map((p) => p.ref).join(" · ")}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {messages.map((message, index) => (
          <MessageBubble
            key={`${message.id}-${index}`}
            role={message.role}
            content={message.content}
            isStreaming={
              isStreaming &&
              index === messages.length - 1 &&
              message.role === "assistant"
            }
          />
        ))}
      </div>
      <div ref={bottomRef} className="h-4" />
    </div>
  );
}
