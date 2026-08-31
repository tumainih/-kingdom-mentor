/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: { resultIndex: number; results: SpeechRecognitionResultList }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
};

interface UseSpeechRecognitionOptions {
  /** Called as the user speaks (interim + final). */
  onResult?: (transcript: string) => void;
  /** Called when recognition ends with the best final transcript. */
  onUtteranceComplete?: (transcript: string) => void;
  continuous?: boolean;
}

interface UseSpeechRecognitionResult {
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  error: string | null;
  clearError: () => void;
}

function getSpeechRecognitionCtor():
  | (new () => SpeechRecognitionInstance)
  | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions | ((transcript: string) => void) = {},
): UseSpeechRecognitionResult {
  const opts =
    typeof options === "function" ? { onResult: options } : options;

  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onResultRef = useRef(opts.onResult);
  const onUtteranceCompleteRef = useRef(opts.onUtteranceComplete);
  const transcriptRef = useRef("");

  onResultRef.current = opts.onResult;
  onUtteranceCompleteRef.current = opts.onUtteranceComplete;

  useEffect(() => {
    setIsSupported(Boolean(getSpeechRecognitionCtor()));
  }, []);

  useEffect(() => {
    if (!isSupported) return;

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.continuous = opts.continuous ?? false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0]?.transcript ?? "";
      }
      transcriptRef.current = transcript.trim();
      if (transcriptRef.current) onResultRef.current?.(transcriptRef.current);
    };

    recognition.onend = () => {
      setIsListening(false);
      const final = transcriptRef.current.trim();
      transcriptRef.current = "";
      if (final) onUtteranceCompleteRef.current?.(final);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      transcriptRef.current = "";
      if (event.error !== "aborted") {
        setError("Could not hear you. Check your microphone and try again.");
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [isSupported, opts.continuous]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setError(null);
    transcriptRef.current = "";
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      setError("Microphone is already active.");
    }
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    error,
    clearError,
  };
}

export function speakText(text: string): void {
  void speakTextAsync(text);
}

export function speakTextAsync(text: string): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve();
  }

  window.speechSynthesis.cancel();

  const plain = text
    .replace(/[#*_`>]/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .trim();

  if (!plain) return Promise.resolve();

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(plain);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.lang = "en-US";
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined") {
    window.speechSynthesis?.cancel();
  }
}
