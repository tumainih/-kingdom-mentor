"use client";

import { useEffect, useRef } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  centered?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = "Ask Kingdom AI anything…",
  centered = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  };

  const canSend = !disabled && value.trim().length > 0;

  return (
    <div
      className={cn(
        "w-full px-4",
        centered ? "max-w-2xl" : "mx-auto max-w-3xl",
      )}
    >
      <div
        className={cn(
          "flex items-end gap-2 rounded-[26px] border border-brand/15 bg-composer px-4 py-3 shadow-[0_4px_24px_rgba(79,70,229,0.08)] transition-all focus-within:border-brand/30 focus-within:shadow-[0_6px_32px_rgba(79,70,229,0.14)]",
          disabled && "opacity-70",
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="max-h-[200px] min-h-[24px] flex-1 resize-none bg-transparent text-[15px] leading-6 text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          aria-label="Send message"
          className={cn(
            "mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all",
            canSend
              ? "brand-gradient text-white shadow-md shadow-brand/30 hover:opacity-90"
              : "bg-muted text-muted-foreground cursor-not-allowed",
          )}
        >
          <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
