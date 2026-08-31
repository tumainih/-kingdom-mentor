"use client";

import { STARTER_PROMPTS } from "./types";

interface ExampleQuestionsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function ExampleQuestions({ onSelect, disabled }: ExampleQuestionsProps) {
  return (
    <div className="shrink-0 px-3 pb-2 sm:px-4">
      <div className="mx-auto w-full max-w-4xl">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
          Example questions
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onSelect(prompt)}
              disabled={disabled}
              className="shrink-0 rounded-full border border-border/80 bg-card/80 px-3 py-1.5 text-left text-xs text-foreground/90 transition-colors hover:border-brand/40 hover:bg-accent disabled:opacity-50 sm:max-w-[280px] sm:truncate sm:text-[13px]"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
