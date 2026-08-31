"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./message-bubble";
import type { ChatMessage } from "./types";

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-3 sm:px-5 sm:py-4">
      <div className="flex flex-col gap-4 sm:gap-5">
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            role={message.role}
            content={message.content}
            scripture={message.scripture}
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
