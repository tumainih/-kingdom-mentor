"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, Plus } from "lucide-react";
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
  showNav?: boolean;
  compactNav?: boolean;
  hideStatusOnMobile?: boolean;
}

export function AppHeader({
  aiReady = true,
  guidanceMode,
  showNewChat,
  onNewChat,
  showNav = false,
  compactNav = false,
  hideStatusOnMobile = false,
}: AppHeaderProps) {
  const { locale, setLocale, t } = useLocale();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-border/50 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-10 max-w-6xl items-center justify-between gap-1 px-2 sm:h-12 sm:gap-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <Link href="/home" className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <BrandLogo size="sm" />
            <BrandTitle size="md" className="hidden min-[360px]:flex" />
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          {showNav && (
            <nav className="flex items-center rounded-lg border border-border/60 bg-muted/40 p-0.5">
              <Link
                href="/home"
                aria-label={t("navHome")}
                className={cn(
                  "flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-semibold transition-colors sm:px-2.5 sm:text-[11px]",
                  pathname === "/home"
                    ? "bg-brand text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Home className="h-3.5 w-3.5" />
                {!compactNav && (
                  <span className="hidden min-[420px]:inline">{t("navHome")}</span>
                )}
              </Link>
              <Link
                href="/"
                aria-label={t("navChat")}
                className={cn(
                  "flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-semibold transition-colors sm:px-2.5 sm:text-[11px]",
                  pathname === "/"
                    ? "bg-brand text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {!compactNav && (
                  <span className="hidden min-[420px]:inline">{t("navChat")}</span>
                )}
              </Link>
            </nav>
          )}

          <div
            className="flex items-center rounded-lg border border-border/60 bg-muted/40 p-0.5"
            role="group"
            aria-label={t("languageLabel")}
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
            <span
              className={cn(
                "hidden items-center gap-1 text-[10px] font-medium text-brand sm:text-xs",
                hideStatusOnMobile ? "min-[480px]:flex" : "min-[400px]:flex",
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
              {guidanceMode === "gemini" ? t("aiLive") : t("aiOffline")}
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
