"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrandTitle } from "@/components/chat/brand";
import { ComposerBar } from "@/components/chat/composer-bar";
import { streamKingdomReply, type StreamMessage } from "@/lib/chat-stream";
import type { AppMode } from "@/components/app-shell";
import {
  speakTextAsync,
  stopSpeaking,
  useSpeechRecognition,
} from "@/hooks/use-speech";

interface ConverseViewProps {
  aiReady: boolean;
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export function ConverseView({
  aiReady,
  mode,
  onModeChange,
}: ConverseViewProps) {
  const [liveTranscript, setLiveTranscript] = useState("");
  const [lastUser, setLastUser] = useState("");
  const [lastReply, setLastReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");

  const historyRef = useRef<StreamMessage[]>([]);
  const busyRef = useRef(false);

  const askKingdom = useCallback(
    async (question: string) => {
      if (busyRef.current || !aiReady) return;
      busyRef.current = true;
      setError(null);
      setLiveTranscript("");
      setLastUser(question);
      setLastReply("");
      setPhase("thinking");

      const history: StreamMessage[] = [
        ...historyRef.current,
        { role: "user", content: question },
      ];
      historyRef.current = history;

      try {
        const reply = await streamKingdomReply(history, {
          onText: (_chunk, accumulated) => setLastReply(accumulated),
          onError: (message) => setLastReply(message),
        });

        historyRef.current = [...history, { role: "assistant", content: reply }];

        if (reply.trim()) {
          setPhase("speaking");
          await speakTextAsync(reply);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong.";
        setError(message);
        historyRef.current = history;
      } finally {
        busyRef.current = false;
        setPhase("idle");
        setLiveTranscript("");
      }
    },
    [aiReady],
  );

  const {
    isListening,
    startListening,
    stopListening,
    error: speechError,
    clearError,
  } = useSpeechRecognition({
    onResult: setLiveTranscript,
    onUtteranceComplete: (transcript) => {
      if (!transcript.trim() || busyRef.current) return;
      void askKingdom(transcript.trim());
    },
  });

  useEffect(() => {
    if (isListening) setPhase("listening");
    else if (!busyRef.current && phase === "listening") setPhase("idle");
  }, [isListening, phase]);

  const toggleMic = () => {
    if (!aiReady) {
      setError("Add GEMINI_API_KEY to .env.local.");
      return;
    }
    if (busyRef.current) return;
    clearError();
    setError(null);
    if (isListening) stopListening();
    else {
      stopSpeaking();
      setLiveTranscript("");
      startListening();
    }
  };

  const talkDisabled =
    !aiReady || phase === "thinking" || phase === "speaking";
  const displayError = error ?? speechError;

  const status =
    phase === "listening"
      ? "Listening…"
      : phase === "thinking"
        ? "Reflecting…"
        : phase === "speaking"
          ? "Speaking…"
          : "Share what you feel or doubt";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-1 pt-2 sm:px-4 sm:pt-3">
      <div className="chat-canvas mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col overflow-hidden">
        <span className="canvas-label">Canvas</span>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-8 pt-12 text-center">
          <BrandTitle size="lg" />
          <p className="mt-4 text-lg font-medium text-brand sm:text-xl">{status}</p>

          {(liveTranscript || lastUser || lastReply) && (
            <div className="mt-8 w-full max-w-3xl space-y-3 rounded-xl border border-border/50 bg-background/40 p-4 text-left text-sm sm:p-5">
              {liveTranscript && phase === "listening" && (
                <p className="text-muted-foreground">
                  <span className="text-brand">You: </span>
                  {liveTranscript}
                </p>
              )}
              {lastUser && phase !== "listening" && (
                <p>
                  <span className="text-brand">You: </span>
                  {lastUser}
                </p>
              )}
              {lastReply && (
                <p className="text-foreground/90">
                  <span className="text-brand-light">Kingdom AI: </span>
                  {lastReply}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <ComposerBar
        mode={mode}
        onModeChange={onModeChange}
        value=""
        onChange={() => {}}
        onSend={() => {}}
        isListening={isListening}
        onTalkToggle={toggleMic}
        talkDisabled={talkDisabled}
      />

      {displayError && (
        <div className="pointer-events-none absolute bottom-28 left-1/2 z-30 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-lg border border-destructive/40 bg-card px-3 py-2 text-center text-xs text-destructive">
          {displayError}
        </div>
      )}
    </div>
  );
}
