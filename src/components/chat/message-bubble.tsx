"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BrandLogo } from "./brand";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function MessageBubble({
  role,
  content,
  isStreaming,
}: MessageBubbleProps) {
  const isUser = role === "user";

  if (isUser) {
    return (
      <div className="flex w-full justify-end py-1">
        <div className="max-w-[min(85%,640px)] rounded-[24px] border border-brand/10 bg-secondary px-4 py-2.5 text-[15px] leading-relaxed text-foreground">
          <p className="whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full gap-3 py-1">
      <BrandLogo size="sm" className="mt-0.5 rounded-full" />
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-brand">
          Kingdom AI
        </p>
        <div className="chat-prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content || (isStreaming ? " " : "")}
          </ReactMarkdown>
        </div>
        {isStreaming && (
          <span className="mt-1 inline-block h-4 w-0.5 animate-pulse bg-brand/60" />
        )}
      </div>
    </div>
  );
}
