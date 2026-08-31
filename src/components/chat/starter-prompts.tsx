"use client";

import {
  BookOpen,
  Briefcase,
  Heart,
  Moon,
  Scale,
  type LucideIcon,
} from "lucide-react";
import { STARTER_PROMPTS } from "./types";

const PROMPT_ICONS: LucideIcon[] = [Heart, Briefcase, Scale, Moon, BookOpen];

const PROMPT_STYLES = [
  { card: "border-brand/15 bg-gradient-to-br from-teal-50/80 to-white hover:border-brand/30", icon: "text-brand bg-teal-50" },
  { card: "border-brand-navy/10 bg-gradient-to-br from-slate-50/80 to-white hover:border-brand-navy/20", icon: "text-brand-navy bg-slate-100" },
  { card: "border-brand-gold/20 bg-gradient-to-br from-amber-50/80 to-white hover:border-brand-gold/35", icon: "text-brand-gold bg-amber-50" },
  { card: "border-brand-sage/20 bg-gradient-to-br from-stone-50/80 to-white hover:border-brand-sage/30", icon: "text-brand-sage bg-stone-100" },
  { card: "border-brand/15 bg-gradient-to-br from-cyan-50/60 to-white hover:border-brand/25", icon: "text-brand-light bg-cyan-50" },
];

interface StarterPromptsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function StarterPrompts({ onSelect, disabled }: StarterPromptsProps) {
  return (
    <div className="grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5">
      {STARTER_PROMPTS.map((prompt, index) => {
        const Icon = PROMPT_ICONS[index] ?? BookOpen;
        const style = PROMPT_STYLES[index] ?? PROMPT_STYLES[0];

        return (
          <button
            key={prompt}
            type="button"
            onClick={() => onSelect(prompt)}
            disabled={disabled}
            className={`group flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left shadow-sm transition-all hover:shadow-md disabled:opacity-50 sm:gap-3 sm:rounded-2xl sm:px-3.5 sm:py-3 ${style.card}`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8 sm:rounded-xl ${style.icon}`}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
            <span className="text-xs leading-snug text-foreground/85 group-hover:text-foreground sm:text-sm">
              {prompt}
            </span>
          </button>
        );
      })}
    </div>
  );
}
