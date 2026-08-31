"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    <ScrollArea className="flex-1 px-4 py-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
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
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
