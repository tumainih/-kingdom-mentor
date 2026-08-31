"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BrandLogo } from "./brand";
import { useLocale } from "@/context/locale-context";
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
  const { t } = useLocale();
  const isUser = role === "user";

  if (isUser) {
    return (
      <div className="flex w-full justify-end py-1">
        <div className="max-w-[min(90%,640px)] rounded-2xl border border-brand/30 bg-secondary px-3.5 py-2 text-sm leading-relaxed text-foreground sm:rounded-[20px] sm:px-4 sm:py-2.5 sm:text-[15px]">
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
        </div>

        {scripture && scripture.length > 0 && (
          <div className="knowledge-card mb-2.5 rounded-xl px-3 py-2 sm:mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-gold">
              {t("passagesForQuestion")}
            </p>
            <ul className="mt-1.5 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
              {scripture.slice(0, 5).map((p) => (
                <li key={p.ref}>
                  <span className="font-medium text-brand-light">
                    {p.ref}
                    {p.refEn && p.refEn !== p.ref ? (
                      <span className="text-muted-foreground/70"> ({p.refEn})</span>
                    ) : null}
                  </span>
                  {" — "}
                  {p.text.length > 120 ? `${p.text.slice(0, 117)}…` : p.text}
                </li>
              ))}
            </ul>
            {scripture.length > 5 && (
              <p className="mt-1.5 text-[10px] text-muted-foreground/80">
                +{scripture.length - 5} more in context
              </p>
            )}
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
