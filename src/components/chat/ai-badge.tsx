"use client";

import { cn } from "@/lib/utils";

interface AiBadgeProps {
  className?: string;
  variant?: "default" | "model" | "scripture";
}

export function AiBadge({
  className,
  variant = "default",
}: AiBadgeProps) {
  if (variant === "model") {
    return (
      <span
        className={cn(
          "rounded-full border border-brand/20 bg-brand/8 px-2.5 py-0.5 text-[11px] font-medium text-brand",
          className,
        )}
      >
        Gemini
      </span>
    );
  }

  if (variant === "scripture") {
    return (
      <span
        className={cn(
          "rounded-full border border-brand-gold/25 bg-accent/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-accent-foreground sm:text-[10px]",
          className,
        )}
      >
        KJV Wisdom
      </span>
    );
  }

  return (
    <span
      className={cn(
        "brand-gradient rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white",
        className,
      )}
    >
      AI
    </span>
  );
}

interface AiThinkingProps {
  visible: boolean;
}

export function AiThinking({ visible }: AiThinkingProps) {
  if (!visible) return null;

  return (
    <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-2">
      <div className="flex gap-1">
        <span className="h-2 w-2 animate-bounce rounded-full bg-brand [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-brand [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-brand [animation-delay:300ms]" />
      </div>
      <span className="text-sm text-muted-foreground">
        Kingdom AI is thinking…
      </span>
    </div>
  );
}
