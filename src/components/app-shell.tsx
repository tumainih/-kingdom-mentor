"use client";

import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { ChatContainer } from "@/components/chat/chat-container";
import { ConverseView } from "@/components/converse/converse-view";
import { useLocale } from "@/context/locale-context";
import { fetchWithTimeout, isBrowserOffline } from "@/lib/network";

export type AppMode = "chat" | "converse";
export type GuidanceMode = "gemini" | "unavailable";

export function AppShell() {
  const { locale, t } = useLocale();
  const [mode, setMode] = useState<AppMode>("chat");
  const [guidanceMode, setGuidanceMode] = useState<GuidanceMode>("unavailable");
  const [verseCount, setVerseCount] = useState(31102);
  const [mounted, setMounted] = useState(false);
  const [chatKey, setChatKey] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isBrowserOffline()) {
      setGuidanceMode("unavailable");
      return;
    }
    void fetchWithTimeout(`/api/status?locale=${locale}`, {}, 2500)
      .then((r) => r.json())
      .then(
        (data: {
          mode?: GuidanceMode;
          bible?: { verses?: number };
        }) => {
          setGuidanceMode(data.mode === "gemini" ? "gemini" : "unavailable");
          if (data.bible?.verses) setVerseCount(data.bible.verses);
        },
      )
      .catch(() => setGuidanceMode("unavailable"));
  }, [locale, mounted]);

  const handleNewChat = useCallback(() => {
    setChatKey((k) => k + 1);
    setMode("chat");
  }, []);

  return (
    <div className="canvas-gradient relative flex h-dvh min-h-0 flex-col overflow-hidden supports-[height:100dvh]:h-dvh">
      <AppHeader
        aiReady={mounted}
        guidanceMode={guidanceMode}
        showNewChat
        showNav
        compactNav
        hideStatusOnMobile
        onNewChat={handleNewChat}
      />

      {mounted && (
        <div className="shrink-0 border-b border-brand/20 bg-brand/10 px-3 py-1.5 text-center text-xs text-brand-light sm:text-sm">
          {guidanceMode === "gemini"
            ? t("aiBanner", { count: verseCount })
            : t("aiUnavailableBanner")}
        </div>
      )}

      {mode === "chat" ? (
        <ChatContainer
          key={`${chatKey}-${locale}`}
          mode={mode}
          onModeChange={setMode}
        />
      ) : (
        <ConverseView
          key={`${chatKey}-${locale}`}
          mode={mode}
          onModeChange={setMode}
        />
      )}
    </div>
  );
}
