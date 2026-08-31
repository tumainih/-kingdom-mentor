"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Volume2 } from "lucide-react";
import { BrandLogo } from "./brand";
import { speakText } from "@/hooks/use-speech";
import type { ScripturePassage } from "./types";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  scripture?: ScripturePassage[];
}

export function MessageBubble({
  role,
  content,
  isStreaming,
  scripture,
}: MessageBubbleProps) {
  const isUser = role === "user";

  if (isUser) {
    return (
      <div className="flex w-full justify-end py-1">
        <div className="max-w-[min(85%,640px)] rounded-[24px] border border-brand/15 bg-gradient-to-br from-secondary to-indigo-50 px-4 py-2.5 text-[15px] leading-relaxed text-foreground shadow-sm">
          <p className="whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full gap-3 py-1">
      <BrandLogo size="sm" className="mt-0.5 rounded-full" />
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="mb-1 flex items-center gap-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-brand">
            Kingdom AI
          </p>
          {content && !isStreaming && (
            <button
              type="button"
              onClick={() => speakText(content)}
              aria-label="Listen to response"
              className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-brand/10 hover:text-brand"
            >
              <Volume2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {scripture && scripture.length > 0 && (
          <div className="mb-3 rounded-xl border border-brand/10 bg-white/70 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-brand">
              KJV passages for this reply
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {scripture.map((p) => p.ref).join(" · ")}
            </p>
          </div>
        )}

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
