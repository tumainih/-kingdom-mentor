"use client";

import { useCallback, useEffect, useRef } from "react";
import { ArrowUp, Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpeechRecognition } from "@/hooks/use-speech";

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
  const baseValueRef = useRef("");

  const handleSpeechResult = useCallback(
    (transcript: string) => {
      const combined = baseValueRef.current
        ? `${baseValueRef.current} ${transcript}`.trim()
        : transcript;
      onChange(combined);
    },
    [onChange],
  );

  const {
    isListening,
    isSupported,
    startListening,
    stopListening,
    error: speechError,
  } = useSpeechRecognition(handleSpeechResult);

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

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      baseValueRef.current = value;
      startListening();
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
          "flex items-end gap-1.5 rounded-[22px] border bg-composer px-3 py-2.5 shadow-[0_2px_16px_rgba(26,101,117,0.1)] transition-all focus-within:border-brand/35 focus-within:shadow-[0_4px_20px_rgba(26,101,117,0.14)] sm:gap-2 sm:rounded-[26px] sm:px-4 sm:py-3",
          isListening ? "border-brand ring-2 ring-brand/20" : "border-brand/15",
          disabled && "opacity-70",
        )}
      >
        {/* Fixed slot prevents layout shift when mic mounts after hydration */}
        <div className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center">
          {isSupported ? (
            <button
              type="button"
              onClick={toggleMic}
              disabled={disabled}
              aria-label={isListening ? "Stop listening" : "Talk to Kingdom AI"}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                isListening
                  ? "bg-red-100 text-red-600 animate-pulse"
                  : "text-muted-foreground hover:bg-brand/10 hover:text-brand",
              )}
            >
              {isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
          ) : null}
        </div>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening ? "Listening… speak now" : placeholder
          }
          disabled={disabled}
          rows={1}
          suppressHydrationWarning
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

      {isListening && (
        <p className="mt-2 text-center text-xs text-brand">
          Speak your question — tap the mic when done
        </p>
      )}
      {speechError && (
        <p className="mt-2 text-center text-xs text-destructive">{speechError}</p>
      )}
    </div>
  );
}
