import type { ScripturePassage } from "@/components/chat/types";
import type { AppLocale } from "@/lib/i18n/translations";
import type { StreamMessage } from "@/lib/chat-stream";
import "@/lib/bible/init-client";

/** Local Bible guidance when offline or API unreachable. */
export async function generateOfflineReply(
  history: StreamMessage[],
  locale: AppLocale = "en",
): Promise<{ text: string; passages: ScripturePassage[] }> {
  const latest = history.filter((m) => m.role === "user").at(-1)?.content ?? "";
  const { generateFreeFeedback } = await import("@/lib/free-feedback");
  const reply = await generateFreeFeedback(latest, locale);
  return {
    text: reply.text,
    passages: reply.passages,
  };
}

export async function warmOfflineCache(): Promise<void> {
  if (typeof window === "undefined" || !navigator.onLine) return;

  const urls = [
    "/data/kjv-index.json",
    "/data/swahili-index.json",
    "/data/hourly-en.json",
    "/data/hourly-sw.json",
    "/data/notification-en.json",
    "/data/notification-sw.json",
  ];

  await Promise.allSettled(
    urls.map((url) => fetch(url, { cache: "force-cache" })),
  );
}
