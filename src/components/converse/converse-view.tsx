"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { BrandTitle } from "@/components/chat/brand";
import { ComposerBar } from "@/components/chat/composer-bar";
import { Button } from "@/components/ui/button";
import { fetchKingdomReply, type StreamMessage } from "@/lib/chat-stream";
import type { AppMode } from "@/components/app-shell";
import { useLocale } from "@/context/locale-context";
import {
  speakTextAsync,
  stopSpeaking,
  useSpeechRecognition,
} from "@/hooks/use-speech";

function speechLang(locale: "en" | "sw") {
  return locale === "sw" ? "sw-KE" : "en-US";
}

interface ConverseViewProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export function ConverseView({ mode, onModeChange }: ConverseViewProps) {
  const { locale, t } = useLocale();
  const [liveTranscript, setLiveTranscript] = useState("");
  const [lastUser, setLastUser] = useState("");
  const [lastReply, setLastReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");

  const historyRef = useRef<StreamMessage[]>([]);
  const busyRef = useRef(false);

  const askKingdom = useCallback(async (question: string) => {
    if (busyRef.current) return;
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
      const { text: reply } = await fetchKingdomReply(history, locale);
      setLastReply(reply);

      historyRef.current = [...history, { role: "assistant", content: reply }];

      setPhase("speaking");
      await speakTextAsync(reply, speechLang(locale));
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
  }, [locale]);

  const {
    isListening,
    startListening,
    stopListening,
    error: speechError,
    clearError,
  } = useSpeechRecognition(
    {
      onResult: setLiveTranscript,
      onUtteranceComplete: (transcript) => {
        if (!transcript.trim() || busyRef.current) return;
        void askKingdom(transcript.trim());
      },
    },
    speechLang(locale),
  );

  useEffect(() => {
    if (isListening) setPhase("listening");
    else if (!busyRef.current && phase === "listening") setPhase("idle");
  }, [isListening, phase]);

  const toggleMic = () => {
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

  const talkDisabled = phase === "thinking" || phase === "speaking";
  const displayError = error ?? speechError;

  const status =
    phase === "listening"
      ? t("talkListeningShort")
      : phase === "thinking"
        ? t("talkReflecting")
        : phase === "speaking"
          ? t("talkSpeaking")
          : t("talkStatusIdle");

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-1 pt-2 sm:px-4 sm:pt-3">
      <div className="chat-canvas mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col overflow-hidden">
        <span className="canvas-label">{t("canvas")}</span>

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
