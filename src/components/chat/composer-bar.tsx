"use client";

import { useEffect, useRef } from "react";
import { ArrowUp, MessageSquare, Mic, MicOff } from "lucide-react";
import type { AppMode } from "@/components/app-shell";
import { useLocale } from "@/context/locale-context";
import { cn } from "@/lib/utils";

interface ComposerBarProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  isListening?: boolean;
  onTalkToggle?: () => void;
  talkDisabled?: boolean;
}

export function ComposerBar({
  mode,
  onModeChange,
  value,
  onChange,
  onSend,
  disabled,
  placeholder,
  isListening,
  onTalkToggle,
  talkDisabled,
}: ComposerBarProps) {
  const { t } = useLocale();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resolvedPlaceholder = placeholder ?? t("placeholder");

  useEffect(() => {
    if (mode !== "chat") return;
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value, mode]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  };

  const canSend = !disabled && value.trim().length > 0;

  return (
    <div className="composer-shell shrink-0 border-t border-border/40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-4">
      <div className="mx-auto w-full max-w-6xl">
        <div
          className={cn(
            "flex flex-col gap-2 rounded-[28px] border border-border/80 bg-composer px-3 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.35)] sm:px-3.5 sm:py-3",
            isListening && "border-brand/50 ring-2 ring-brand/20",
          )}
        >
          {mode === "chat" ? (
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={resolvedPlaceholder}
              disabled={disabled}
              rows={1}
              className="max-h-40 min-h-[44px] w-full resize-none bg-transparent text-[15px] leading-6 text-foreground outline-none placeholder:text-muted-foreground"
            />
          ) : (
            <p className="min-h-[44px] py-1.5 text-left text-sm text-muted-foreground sm:text-[15px]">
              {isListening ? t("talkListening") : t("talkHint")}
            </p>
          )}

          <div className="flex items-center justify-between gap-2">
            <div
              className="flex shrink-0 items-center rounded-2xl bg-muted/60 p-0.5"
              role="tablist"
              aria-label="Mode"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "chat"}
                onClick={() => onModeChange("chat")}
                className={cn(
                  "flex h-8 items-center gap-1 rounded-[14px] px-2.5 text-xs font-medium transition-colors sm:h-9 sm:px-3 sm:text-sm",
                  mode === "chat"
                    ? "bg-brand text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {t("chat")}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "converse"}
                onClick={() => onModeChange("converse")}
                className={cn(
                  "flex h-8 items-center gap-1 rounded-[14px] px-2.5 text-xs font-medium transition-colors sm:h-9 sm:px-3 sm:text-sm",
                  mode === "converse"
                    ? "bg-brand text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {t("talk")}
              </button>
            </div>

            {mode === "chat" ? (
              <button
                type="button"
                onClick={onSend}
                disabled={!canSend}
                aria-label="Send"
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all sm:h-10 sm:w-10",
                  canSend
                    ? "bg-brand text-primary-foreground hover:bg-brand-light"
                    : "cursor-not-allowed bg-muted text-muted-foreground",
                )}
              >
                <ArrowUp className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2.5} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onTalkToggle}
                disabled={talkDisabled}
                aria-label={isListening ? "Stop" : "Start talking"}
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all sm:h-11 sm:w-11",
                  isListening
                    ? "animate-pulse bg-red-500 text-white hover:bg-red-600"
                    : "bg-brand text-primary-foreground hover:bg-brand-light",
                  talkDisabled && "cursor-not-allowed opacity-50",
                )}
              >
                {isListening ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
