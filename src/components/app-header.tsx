"use client";

import { MessageSquare, Mic, Plus } from "lucide-react";
import { BrandLogo, BrandTitle } from "@/components/chat/brand";
import { AiBadge } from "@/components/chat/ai-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AppMode = "chat" | "converse";

interface AppHeaderProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  aiReady?: boolean;
  showNewChat?: boolean;
  onNewChat?: () => void;
}

export function AppHeader({
  mode,
  onModeChange,
  aiReady = true,
  showNewChat,
  onNewChat,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 shrink-0 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-3xl items-center justify-between gap-2 px-3 sm:h-14 sm:gap-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <BrandLogo size="sm" />
          <BrandTitle size="md" />
          <AiBadge variant="scripture" className="hidden min-[480px]:inline-flex" />
          <AiBadge variant="model" className="hidden sm:inline-flex" />
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          {aiReady && (
            <span className="flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-1.5 py-0.5 text-[9px] font-medium text-emerald-800 sm:gap-1.5 sm:px-2 sm:text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          )}

          <div
            className="flex items-center rounded-lg border border-brand/15 bg-muted/30 p-0.5"
            role="tablist"
            aria-label="Conversation mode"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "chat"}
              aria-label="Text chat"
              onClick={() => onModeChange("chat")}
              className={cn(
                "flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium transition-colors sm:h-8 sm:px-2.5 sm:text-xs",
                mode === "chat"
                  ? "bg-white text-brand shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="hidden min-[400px]:inline">Chat</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "converse"}
              aria-label="Voice conversation"
              onClick={() => onModeChange("converse")}
              className={cn(
                "flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium transition-colors sm:h-8 sm:px-2.5 sm:text-xs",
                mode === "converse"
                  ? "bg-white text-brand shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Mic className="h-3.5 w-3.5" />
              <span className="hidden min-[400px]:inline">Talk</span>
            </button>
          </div>

          {showNewChat && onNewChat && mode === "chat" && (
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
