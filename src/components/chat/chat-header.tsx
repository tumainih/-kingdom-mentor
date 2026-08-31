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
    <header className="sticky top-0 z-20 shrink-0 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <BrandLogo size="sm" />
          <BrandTitle size="md" />
          <AiBadge variant="scripture" />
          <AiBadge variant="model" className="hidden sm:inline-flex" />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {aiReady && (
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AI online
            </span>
          )}
          {!aiReady && (
            <span className="hidden rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 sm:inline">
              AI key needed
            </span>
          )}
          {showNewChat && onNewChat && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNewChat}
              className="h-8 gap-1.5 border-brand/15 text-xs text-brand hover:bg-brand/5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New chat</span>
            </Button>
          )}
        </div>
      </div>
      <div className="header-shine h-px w-full opacity-60" />
      <div className="h-px bg-border/50" />
    </header>
  );
}
