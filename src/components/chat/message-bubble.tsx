"use client";

import { useCallback, useState } from "react";
import { Check, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BrandLogo } from "./brand";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/context/locale-context";
import type { ScripturePassage } from "./types";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  scripture?: ScripturePassage[];
}

function toPlainCopyText(content: string, scripture?: ScripturePassage[]): string {
  const parts: string[] = [];
  if (scripture?.length) {
    for (const p of scripture) {
      const label = p.refEn && p.refEn !== p.ref ? `${p.ref} (${p.refEn})` : p.ref;
      parts.push(`${label}\n${p.text}`);
    }
    parts.push("");
  }
  parts.push(
    content
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/^#+\s+/gm, "")
      .trim(),
  );
  return parts.join("\n").trim();
}

export function MessageBubble({
  role,
  content,
  isStreaming,
  scripture,
}: MessageBubbleProps) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);
  const isUser = role === "user";

  const handleCopy = useCallback(async () => {
    const text = toPlainCopyText(content, scripture);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [content, scripture]);

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
          {!isStreaming && content.trim() && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void handleCopy()}
              className="ml-auto h-7 gap-1 px-2 text-[10px] text-muted-foreground hover:text-foreground"
              aria-label={t("copy")}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-brand" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? t("copied") : t("copy")}
            </Button>
          )}
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
