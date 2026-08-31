"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { StarterPrompts } from "./starter-prompts";
import { cn } from "@/lib/utils";

interface RecommendedQuestionsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
  defaultOpen?: boolean;
}

export function RecommendedQuestions({
  onSelect,
  disabled,
  defaultOpen = false,
}: RecommendedQuestionsProps) {
  const [open, setOpen] = useState(defaultOpen);

  const handleSelect = (prompt: string) => {
    onSelect(prompt);
    setOpen(false);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-3 sm:px-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-left shadow-sm transition-colors hover:bg-accent/40 sm:px-3.5 sm:py-2.5",
          open && "rounded-b-none border-b-0",
        )}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-xs font-medium text-foreground sm:text-sm">
          <Lightbulb className="h-3.5 w-3.5 text-brand-gold" />
          Suggested questions
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="rounded-b-xl border border-t-0 border-border/60 bg-background/90 px-2 pb-2 pt-1 sm:px-2.5 sm:pb-2.5">
            <StarterPrompts onSelect={handleSelect} disabled={disabled} compact />
          </div>
        </div>
      </div>
    </div>
  );
}
