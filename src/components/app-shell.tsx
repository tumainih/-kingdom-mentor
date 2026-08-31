"use client";

import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { ChatContainer } from "@/components/chat/chat-container";
import { ConverseView } from "@/components/converse/converse-view";

export type AppMode = "chat" | "converse";

export function AppShell() {
  const [mode, setMode] = useState<AppMode>("chat");
  const [aiReady, setAiReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [chatKey, setChatKey] = useState(0);

  useEffect(() => {
    setMounted(true);
    fetch("/api/status")
      .then((r) => r.json())
      .then((data: { aiReady?: boolean }) => setAiReady(data.aiReady ?? false))
      .catch(() => setAiReady(false));
  }, []);

  const handleNewChat = useCallback(() => {
    setChatKey((k) => k + 1);
    setMode("chat");
  }, []);

  const ready = mounted && aiReady;

  return (
    <div className="canvas-gradient relative flex h-dvh min-h-0 flex-col overflow-hidden supports-[height:100dvh]:h-dvh">
      <AppHeader aiReady={ready} showNewChat onNewChat={handleNewChat} />

      {mounted && !aiReady && (
        <div className="shrink-0 border-b border-amber-500/30 bg-amber-950/40 px-3 py-1.5 text-center text-xs text-amber-200">
          Add <code className="rounded bg-black/30 px-1">GEMINI_API_KEY</code> to{" "}
          <code className="rounded bg-black/30 px-1">.env.local</code>
        </div>
      )}

      {mode === "chat" ? (
        <ChatContainer
          key={chatKey}
          aiReady={ready}
          mode={mode}
          onModeChange={setMode}
        />
      ) : (
        <ConverseView
          key={chatKey}
          aiReady={ready}
          mode={mode}
          onModeChange={setMode}
        />
      )}
    </div>
  );
}
