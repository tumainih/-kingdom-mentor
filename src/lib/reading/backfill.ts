import { buildReadEvent } from "@/lib/reading/reports";
import {
  coveredSlotKeys,
  DEFAULT_TRACKING_HOURS,
  iterExpectedSlots,
} from "@/lib/reading/slots";
import {
  getDeviceMeta,
  listReadEvents,
  saveReadEvent,
  updateDeviceNotifyHours,
} from "@/lib/reading/store.server";

export async function backfillAbsentSlots(
  deviceId: string,
  now = Date.now(),
): Promise<number> {
  const meta = await getDeviceMeta(deviceId);
  if (!meta) return 0;

  const notifyHours =
    meta.notifyHours?.length ? meta.notifyHours : DEFAULT_TRACKING_HOURS;
  const events = await listReadEvents(deviceId);
  const covered = coveredSlotKeys(events);
  let added = 0;

  for (const slot of iterExpectedSlots(
    meta.startedAt,
    now,
    meta.timezone,
    notifyHours,
  )) {
    if (covered.has(slot.slotKey)) continue;

    await saveReadEvent(
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

export async function backfillAllDevices(now = Date.now()): Promise<number> {
  const { listReadingDeviceIds } = await import("@/lib/reading/store.server");
  const deviceIds = await listReadingDeviceIds();
  let total = 0;
  for (const deviceId of deviceIds) {
    total += await backfillAbsentSlots(deviceId, now);
  }
  return total;
}

export async function syncDeviceNotifyHours(
  deviceId: string,
  notifyHours: number[],
): Promise<void> {
  if (!notifyHours.length) return;
  await updateDeviceNotifyHours(deviceId, notifyHours);
}
