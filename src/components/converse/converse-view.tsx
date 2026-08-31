"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Sparkles } from "lucide-react";
import { DecorativeBackground } from "@/components/chat/decorative-background";
import { streamKingdomReply, type StreamMessage } from "@/lib/chat-stream";
import {
  speakTextAsync,
  stopSpeaking,
  useSpeechRecognition,
} from "@/hooks/use-speech";
import { cn } from "@/lib/utils";

type Phase = "idle" | "listening" | "thinking" | "speaking";

interface ConverseViewProps {
  aiReady: boolean;
  onNewConversation?: () => void;
}

function createId() {
  return crypto.randomUUID();
}

const phaseLabel: Record<Phase, string> = {
  idle: "Tap the mic and share what's on your heart",
  listening: "Listening… speak naturally",
  thinking: "Kingdom AI is reflecting…",
  speaking: "Kingdom AI is speaking…",
};

export function ConverseView({ aiReady }: ConverseViewProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [lastUser, setLastUser] = useState("");
  const [lastReply, setLastReply] = useState("");
  const [error, setError] = useState<string | null>(null);

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
    isSupported,
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
      setError("Add GEMINI_API_KEY to .env.local to talk with Kingdom AI.");
      return;
    }
    if (busyRef.current) return;

    clearError();
    setError(null);

    if (isListening) {
      stopListening();
    } else {
      stopSpeaking();
      setLiveTranscript("");
      startListening();
    }
  };

  const micDisabled = !aiReady || phase === "thinking" || phase === "speaking";
  const displayError = error ?? speechError;

  return (
    <div className="canvas-gradient relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <DecorativeBackground />

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-1.5 text-brand-gold">
          <Sparkles className="h-4 w-4" />
          <span className="font-heading text-sm font-semibold tracking-wide text-brand-navy sm:text-base">
            Voice conversation
          </span>
        </div>

        <p className="mb-8 max-w-sm text-center text-sm text-muted-foreground sm:text-base">
          {phaseLabel[phase]}
        </p>

        <button
          type="button"
          onClick={toggleMic}
          disabled={micDisabled || !isSupported}
          aria-label={
            isListening ? "Stop listening" : "Start talking to Kingdom AI"
          }
          className={cn(
            "relative flex h-28 w-28 items-center justify-center rounded-full shadow-xl transition-all sm:h-32 sm:w-32",
            isListening
              ? "bg-red-500 text-white shadow-red-500/30 ring-4 ring-red-200 animate-pulse"
              : "brand-gradient text-white shadow-brand/35 hover:scale-[1.02] active:scale-[0.98]",
            micDisabled && "pointer-events-none opacity-50",
          )}
        >
          <span
            className={cn(
              "absolute inset-0 rounded-full",
              isListening && "animate-ping bg-red-400/40",
            )}
          />
          {isListening ? (
            <MicOff className="relative h-10 w-10 sm:h-11 sm:w-11" />
          ) : (
            <Mic className="relative h-10 w-10 sm:h-11 sm:w-11" />
          )}
        </button>

        {!isSupported && (
          <p className="mt-6 max-w-xs text-center text-xs text-muted-foreground sm:text-sm">
            Voice conversation works best in Chrome or Edge on desktop and mobile.
          </p>
        )}

        {(liveTranscript || lastUser || lastReply) && (
          <div className="mt-10 w-full max-w-md space-y-3 rounded-2xl border border-border/60 bg-white/80 p-4 text-sm shadow-sm backdrop-blur-sm">
            {liveTranscript && phase === "listening" && (
              <p className="text-muted-foreground">
                <span className="font-medium text-brand">You: </span>
                {liveTranscript}
              </p>
            )}
            {lastUser && phase !== "listening" && (
              <p>
                <span className="font-medium text-brand">You: </span>
                {lastUser}
              </p>
            )}
            {lastReply && (
              <p className="text-foreground/90">
                <span className="font-medium text-brand-gold">Kingdom AI: </span>
                {lastReply}
              </p>
            )}
          </div>
        )}
      </div>

      {displayError && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-30 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-destructive/25 bg-white px-3 py-2.5 text-center text-xs text-destructive shadow-lg sm:text-sm">
          {displayError}
        </div>
      )}
    </div>
  );
}
