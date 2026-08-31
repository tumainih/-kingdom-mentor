"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = "Describe your situation, ask for wisdom, or request prayer…",
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  };

  return (
    <div className="border-t border-border bg-card/80 px-4 py-4 backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={2}
          className="min-h-[52px] resize-none bg-background text-[15px]"
        />
        <Button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          size="icon"
          className="h-[52px] w-[52px] shrink-0"
          aria-label="Send message"
        >
          <SendHorizontal className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
