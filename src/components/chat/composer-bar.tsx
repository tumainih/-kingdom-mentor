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

const ACTION_BTN =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all";

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
          <div className="min-h-[44px] max-h-40 overflow-y-auto overscroll-contain">
            {mode === "chat" ? (
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={resolvedPlaceholder}
                disabled={disabled}
                rows={1}
                className="block min-h-[44px] w-full resize-none bg-transparent text-[15px] leading-6 text-foreground outline-none placeholder:text-muted-foreground"
              />
            ) : (
              <p className="py-1.5 text-left text-sm leading-6 text-muted-foreground sm:text-[15px]">
                {isListening ? t("talkListening") : t("talkHint")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_2.5rem] items-center gap-3">
            <div
              className="flex min-w-0 items-center rounded-2xl bg-muted/60 p-0.5"
              role="tablist"
              aria-label="Mode"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "chat"}
                aria-label={t("chat")}
                title={t("chat")}
                onClick={() => onModeChange("chat")}
                className={cn(
                  "flex h-9 min-w-0 flex-1 items-center justify-center gap-1 rounded-[14px] px-2 text-xs font-medium transition-colors sm:h-9 sm:px-2.5 sm:text-sm",
                  mode === "chat"
                    ? "bg-brand text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="hidden truncate min-[400px]:inline">{t("chat")}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "converse"}
                aria-label={t("talk")}
                title={t("talk")}
                onClick={() => onModeChange("converse")}
                className={cn(
                  "flex h-9 min-w-0 flex-1 items-center justify-center gap-1 rounded-[14px] px-2 text-xs font-medium transition-colors sm:h-9 sm:px-2.5 sm:text-sm",
                  mode === "converse"
                    ? "bg-brand text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Mic className="h-4 w-4 shrink-0" />
                <span className="hidden truncate min-[400px]:inline">{t("talk")}</span>
              </button>
            </div>

            <div className="flex h-10 w-10 items-center justify-center">
              {mode === "chat" ? (
                <button
                  type="button"
                  onClick={onSend}
                  disabled={!canSend}
                  aria-label="Send"
                  className={cn(
                    ACTION_BTN,
                    canSend
                      ? "bg-brand text-primary-foreground hover:bg-brand-light"
                      : "cursor-not-allowed bg-muted text-muted-foreground",
                  )}
                >
                  <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.5} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onTalkToggle}
                  disabled={talkDisabled}
                  aria-label={isListening ? "Stop" : "Start talking"}
                  className={cn(
                    ACTION_BTN,
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
    </div>
  );
}
