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

const PROMPT_COLORS = [
  "from-rose-500/10 to-pink-500/5 border-rose-200/60 hover:border-rose-300/80",
  "from-blue-500/10 to-indigo-500/5 border-blue-200/60 hover:border-blue-300/80",
  "from-amber-500/10 to-orange-500/5 border-amber-200/60 hover:border-amber-300/80",
  "from-violet-500/10 to-purple-500/5 border-violet-200/60 hover:border-violet-300/80",
  "from-emerald-500/10 to-teal-500/5 border-emerald-200/60 hover:border-emerald-300/80",
];

const ICON_COLORS = [
  "text-rose-500 bg-rose-50",
  "text-blue-500 bg-blue-50",
  "text-amber-600 bg-amber-50",
  "text-violet-500 bg-violet-50",
  "text-emerald-600 bg-emerald-50",
];

interface StarterPromptsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function StarterPrompts({ onSelect, disabled }: StarterPromptsProps) {
  return (
    <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
      {STARTER_PROMPTS.map((prompt, index) => {
        const Icon = PROMPT_ICONS[index] ?? BookOpen;
        const colorClass = PROMPT_COLORS[index] ?? PROMPT_COLORS[0];
        const iconClass = ICON_COLORS[index] ?? ICON_COLORS[0];

        return (
          <button
            key={prompt}
            type="button"
            onClick={() => onSelect(prompt)}
            disabled={disabled}
            className={`group flex items-start gap-3 rounded-2xl border bg-gradient-to-br px-4 py-3.5 text-left shadow-sm transition-all hover:shadow-md disabled:opacity-50 ${colorClass}`}
          >
            <span
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="text-sm leading-snug text-foreground/85 group-hover:text-foreground">
              {prompt}
            </span>
          </button>
        );
      })}
    </div>
  );
}
