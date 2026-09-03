import { NextResponse } from "next/server";
import { backfillAbsentSlots } from "@/lib/reading/backfill";
import { generateDueReportsForDevice } from "@/lib/reading/reports";
import {
  ensureDeviceMeta,
  getDeviceMeta,
  listReadEvents,
  listReports,
} from "@/lib/reading/store.server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get("deviceId")?.trim();
  if (!deviceId) {
    return NextResponse.json({ error: "Missing deviceId." }, { status: 400 });
  }

  const timezone = searchParams.get("timezone")?.trim() || "UTC";
  const locale = searchParams.get("locale") === "sw" ? "sw" : "en";
  const notifyHoursRaw = searchParams.get("notifyHours");
  let notifyHours: number[] | undefined;
  if (notifyHoursRaw) {
    try {
      const parsed = JSON.parse(notifyHoursRaw) as number[];
      if (Array.isArray(parsed)) notifyHours = parsed;
    } catch {
      /* ignore */
    }
  }

  await ensureDeviceMeta(deviceId, timezone, locale, notifyHours);
  await backfillAbsentSlots(deviceId);
  await generateDueReportsForDevice(deviceId);

  const meta = await getDeviceMeta(deviceId);
  const events = await listReadEvents(deviceId);
  const reports = await listReports(deviceId);

  return NextResponse.json({
    meta,
    events,
    reports,
  });
}
