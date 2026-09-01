"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History, Bell, MessageSquare, Plus, BarChart3 } from "lucide-react";
import { BrandLogo, BrandTitle } from "@/components/chat/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GuidanceMode } from "@/components/app-shell";
import type { AppLocale } from "@/lib/i18n/translations";
import { useLocale } from "@/context/locale-context";
import { offlineNavigate } from "@/lib/pwa/offline-nav";

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
          <Link
            href="/home"
            onClick={(e) => offlineNavigate("/home", e)}
            className="flex min-w-0 items-center gap-1.5 sm:gap-2"
          >
            <BrandLogo size="sm" />
            <BrandTitle size="md" className="hidden min-[360px]:flex" />
          </Link>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-0.5 overflow-hidden sm:gap-1.5">
          {showNav && (
            <nav
              className="flex min-w-0 shrink items-center overflow-x-auto rounded-lg border border-border/60 bg-muted/40 p-0.5 [scrollbar-width:none] sm:shrink-0 [&::-webkit-scrollbar]:hidden"
              aria-label="Main"
            >
              <Link
                href="/home"
                onClick={(e) => offlineNavigate("/home", e)}
                aria-label={t("navHome")}
                title={t("navHome")}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-semibold transition-colors sm:px-2.5 sm:text-[11px]",
                  pathname === "/home"
                    ? "bg-brand text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Home className="h-3.5 w-3.5 shrink-0" />
                {!compactNav && (
                  <span className="hidden min-[420px]:inline">{t("navHome")}</span>
                )}
              </Link>
              <Link
                href="/history"
                onClick={(e) => offlineNavigate("/history", e)}
                aria-label={t("navHistory")}
                title={t("navHistory")}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-semibold transition-colors sm:px-2.5 sm:text-[11px]",
                  pathname === "/history"
                    ? "bg-brand text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <History className="h-3.5 w-3.5 shrink-0" />
                {!compactNav && (
                  <span className="hidden min-[420px]:inline">{t("navHistory")}</span>
                )}
              </Link>
              <Link
                href="/notifications"
                onClick={(e) => offlineNavigate("/notifications", e)}
                aria-label={t("navAlerts")}
                title={t("navAlerts")}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-semibold transition-colors sm:px-2.5 sm:text-[11px]",
                  pathname === "/notifications"
                    ? "bg-brand text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Bell className="h-3.5 w-3.5 shrink-0" />
                {!compactNav && (
                  <span className="hidden min-[480px]:inline">{t("navAlerts")}</span>
                )}
              </Link>
              <Link
                href="/reports"
                onClick={(e) => offlineNavigate("/reports", e)}
                aria-label={t("navReports")}
                title={t("navReports")}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-semibold transition-colors sm:px-2.5 sm:text-[11px]",
                  pathname === "/reports"
                    ? "bg-brand text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <BarChart3 className="h-3.5 w-3.5 shrink-0" />
                {!compactNav && (
                  <span className="hidden min-[520px]:inline">{t("navReports")}</span>
                )}
              </Link>
              <Link
                href="/"
                onClick={(e) => offlineNavigate("/", e)}
                aria-label={t("navChat")}
                title={t("navChat")}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-semibold transition-colors sm:px-2.5 sm:text-[11px]",
                  pathname === "/"
                    ? "bg-brand text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                {!compactNav && (
                  <span className="hidden min-[420px]:inline">{t("navChat")}</span>
                )}
              </Link>
            </nav>
          )}

          <div
            className="flex shrink-0 items-center rounded-lg border border-border/60 bg-muted/40 p-0.5"
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
              aria-label={t("newChat")}
              title={t("newChat")}
              className="h-7 shrink-0 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground sm:h-8"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden min-[400px]:inline">{t("newChat")}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
