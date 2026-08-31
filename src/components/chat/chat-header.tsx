"use client";

import { Plus } from "lucide-react";
import { BrandLogo, BrandTitle } from "./brand";
import { AiBadge } from "./ai-badge";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  onNewChat?: () => void;
  showNewChat?: boolean;
  aiReady?: boolean;
}

export function ChatHeader({
  onNewChat,
  showNewChat,
  aiReady = true,
}: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-20 shrink-0 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-3xl items-center justify-between gap-2 px-3 sm:h-14 sm:gap-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <BrandLogo size="sm" />
          <BrandTitle size="md" />
          <AiBadge variant="scripture" className="hidden min-[480px]:inline-flex" />
          <AiBadge variant="model" className="hidden sm:inline-flex" />
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {aiReady && (
            <span className="flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-1.5 py-0.5 text-[9px] font-medium text-emerald-800 sm:gap-1.5 sm:px-2 sm:text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          )}
          {showNewChat && onNewChat && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNewChat}
              className="h-7 gap-1 border-brand/20 px-2 text-[11px] text-brand hover:bg-brand/5 sm:h-8 sm:px-3 sm:text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New</span>
            </Button>
          )}
        </div>
      </div>
      <div className="header-shine h-px w-full opacity-70" />
    </header>
  );
}
