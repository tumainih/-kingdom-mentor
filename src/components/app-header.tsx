"use client";

import { Plus } from "lucide-react";
import { BrandLogo, BrandTitle } from "@/components/chat/brand";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  aiReady?: boolean;
  showNewChat?: boolean;
  onNewChat?: () => void;
}

export function AppHeader({
  aiReady = true,
  showNewChat,
  onNewChat,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-border/50 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-11 max-w-6xl items-center justify-between gap-2 px-3 sm:h-12 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <BrandLogo size="sm" />
          <BrandTitle size="md" />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {aiReady && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-brand sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
              Live
            </span>
          )}
          {showNewChat && onNewChat && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onNewChat}
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground sm:h-8"
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
