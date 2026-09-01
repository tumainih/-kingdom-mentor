import { buildReadEvent } from "@/lib/reading/report-math";
import {
  coveredSlotKeys,
  DEFAULT_TRACKING_HOURS,
  iterExpectedSlots,
} from "@/lib/reading/slots";
import {
  ensureDeviceMetaClient,
  getDeviceMetaClient,
  listReadEventsClient,
  saveReadEventClient,
} from "@/lib/reading/store.client";

export async function backfillAbsentSlotsClient(
  deviceId: string,
  now = Date.now(),
): Promise<number> {
  const meta = await getDeviceMetaClient(deviceId);
  if (!meta) return 0;

  const notifyHours =
    meta.notifyHours?.length ? meta.notifyHours : DEFAULT_TRACKING_HOURS;
  const events = await listReadEventsClient(deviceId);
  const covered = coveredSlotKeys(events);
  let added = 0;

  for (const slot of iterExpectedSlots(
    meta.startedAt,
    now,
    meta.timezone,
    notifyHours,
  )) {
    if (covered.has(slot.slotKey)) continue;

    await saveReadEventClient(
      buildReadEvent({
        deviceId,
        notificationId: `absent:${slot.slotKey}`,
        shownAt: slot.startMs,
        readAt: slot.endMs,
        hour: slot.hour,
        verseRef: "",
        theme: "",
        themeLabel: "",
        locale: meta.locale,
        timezone: meta.timezone,
        missed: true,
      }),
    );
    covered.add(slot.slotKey);
    added++;
  }

  return added;
}

export async function ensureReadingMetaClient(
  deviceId: string,
  timezone: string,
  locale: "en" | "sw",
  notifyHours?: number[],
): Promise<void> {
  await ensureDeviceMetaClient(deviceId, timezone, locale, notifyHours);
  await backfillAbsentSlotsClient(deviceId);
}
