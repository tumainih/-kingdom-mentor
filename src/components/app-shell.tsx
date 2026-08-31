"use client";

import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { ChatContainer } from "@/components/chat/chat-container";
import { ConverseView } from "@/components/converse/converse-view";

export type AppMode = "chat" | "converse";
export type GuidanceMode = "gemini" | "free";

export function AppShell() {
  const [mode, setMode] = useState<AppMode>("chat");
  const [guidanceMode, setGuidanceMode] = useState<GuidanceMode>("free");
  const [mounted, setMounted] = useState(false);
  const [chatKey, setChatKey] = useState(0);

  useEffect(() => {
    setMounted(true);
    fetch("/api/status")
      .then((r) => r.json())
      .then((data: { mode?: GuidanceMode }) =>
        setGuidanceMode(data.mode === "gemini" ? "gemini" : "free"),
      )
      .catch(() => setGuidanceMode("free"));
  }, []);

  const handleNewChat = useCallback(() => {
    setChatKey((k) => k + 1);
    setMode("chat");
  }, []);

  return (
    <div className="canvas-gradient relative flex h-dvh min-h-0 flex-col overflow-hidden supports-[height:100dvh]:h-dvh">
      <AppHeader
        aiReady={mounted}
        guidanceMode={mounted ? guidanceMode : undefined}
        showNewChat
        onNewChat={handleNewChat}
      />

      {mounted && guidanceMode === "free" && (
        <div className="shrink-0 border-b border-brand/20 bg-brand/10 px-3 py-1.5 text-center text-xs text-brand-light sm:text-sm">
          Free guidance — KJV Scripture wisdom. No API key or payment needed.
        </div>
      )}

      {mode === "chat" ? (
        <ChatContainer
          key={chatKey}
          mode={mode}
          onModeChange={setMode}
        />
      ) : (
        <ConverseView key={chatKey} mode={mode} onModeChange={setMode} />
      )}
    </div>
  );
}
