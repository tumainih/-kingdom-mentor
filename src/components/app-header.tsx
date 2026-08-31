"use client";

import { Plus } from "lucide-react";
import { BrandLogo, BrandTitle } from "@/components/chat/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GuidanceMode } from "@/components/app-shell";
import type { AppLocale } from "@/lib/i18n/translations";
import { useLocale } from "@/context/locale-context";

interface AppHeaderProps {
  aiReady?: boolean;
  guidanceMode?: GuidanceMode;
  showNewChat?: boolean;
  onNewChat?: () => void;
}

export function AppHeader({
  aiReady = true,
  guidanceMode,
  showNewChat,
  onNewChat,
}: AppHeaderProps) {
  const { locale, setLocale, t } = useLocale();

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-border/50 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-11 max-w-6xl items-center justify-between gap-2 px-3 sm:h-12 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <BrandLogo size="sm" />
          <BrandTitle size="md" />
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div
            className="flex items-center rounded-lg border border-border/60 bg-muted/40 p-0.5"
            role="group"
            aria-label="Language"
          >
            {(["en", "sw"] as AppLocale[]).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLocale(code)}
                className={cn(
                  "rounded-md px-2 py-1 text-[10px] font-semibold uppercase transition-colors sm:px-2.5 sm:text-[11px]",
                  locale === code
                    ? "bg-brand text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {code === "en" ? "EN" : "SW"}
              </button>
            ))}
          </div>

          {aiReady && (
            <span className="hidden items-center gap-1 text-[10px] font-medium text-brand min-[400px]:flex sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
              {guidanceMode === "gemini" ? t("aiLive") : t("free")}
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
              {t("newChat")}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
