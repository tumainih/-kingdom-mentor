export const READING_SYNC_CHANNEL = "kingdom-reading";

export type ReadingSyncMessage = {
  type: "READING_UPDATED";
  deviceId?: string;
};

/** Listen for service-worker read saves (works offline). */
export function subscribeReadingUpdates(
  onUpdate: (message: ReadingSyncMessage) => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  const onMessage = (event: MessageEvent<ReadingSyncMessage>) => {
    if (event.data?.type === "READING_UPDATED") {
      onUpdate(event.data);
    }
  };

  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(READING_SYNC_CHANNEL);
    channel.onmessage = onMessage;
  } catch {
    /* BroadcastChannel unavailable */
  }

  const onSwMessage = (event: MessageEvent) => {
    onMessage(event);
  };
  navigator.serviceWorker?.addEventListener("message", onSwMessage);

  return () => {
    channel?.close();
    navigator.serviceWorker?.removeEventListener("message", onSwMessage);
  };
}
