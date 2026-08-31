"use client";

import { useCallback, useEffect, useState } from "react";
import { AppHeader, type AppMode } from "@/components/app-header";
import { ChatContainer } from "@/components/chat/chat-container";
import { ConverseView } from "@/components/converse/converse-view";

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
  }, []);

  return (
    <div className="canvas-gradient relative flex h-dvh min-h-0 flex-col overflow-hidden supports-[height:100dvh]:h-dvh">
      <AppHeader
        mode={mode}
        onModeChange={setMode}
        aiReady={mounted && aiReady}
        showNewChat={mode === "chat"}
        onNewChat={handleNewChat}
      />

      {mounted && !aiReady && (
        <div className="shrink-0 border-b border-amber-200/60 bg-amber-50 px-3 py-2 text-center text-xs text-amber-900 sm:text-sm">
          Add{" "}
          <code className="rounded bg-amber-100/80 px-1 text-[10px] sm:text-xs">
            GEMINI_API_KEY
          </code>{" "}
          to{" "}
          <code className="rounded bg-amber-100/80 px-1 text-[10px] sm:text-xs">
            .env.local
          </code>{" "}
          to enable Kingdom AI.
        </div>
      )}

      {mode === "chat" ? (
        <ChatContainer key={chatKey} aiReady={mounted && aiReady} />
      ) : (
        <ConverseView key={chatKey} aiReady={mounted && aiReady} />
      )}
    </div>
  );
}
