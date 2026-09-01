import type { ScripturePassage } from "@/components/chat/types";
import type { AppLocale } from "@/lib/i18n/translations";
import type { StreamMessage } from "@/lib/chat-stream";
import "@/lib/bible/init-client";

export {
  ensureOfflineReady,
  isOfflineReadyFlagSet,
  markOfflineReady,
  warmOfflineCache,
} from "@/lib/offline/warm-cache";

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
