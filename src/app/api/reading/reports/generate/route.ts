import { NextResponse } from "next/server";
import { parseLocale } from "@/lib/bible/locale";
import { generateReportForRange } from "@/lib/reading/reports";
import {
  ensureDeviceMeta,
  getReport,
  saveReport,
} from "@/lib/reading/store.server";
import type { ReportUnit } from "@/lib/reading/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    deviceId?: string;
    start?: number;
    end?: number;
    unit?: ReportUnit;
    customLabel?: string;
    locale?: unknown;
    timezone?: string;
  };

  const deviceId = body.deviceId?.trim();
  const start = Number(body.start);
  const end = Number(body.end);

  if (!deviceId || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return NextResponse.json({ error: "Invalid range." }, { status: 400 });
  }

  const locale = parseLocale(body.locale);
  const timezone = body.timezone?.trim() || "UTC";
  const meta = await ensureDeviceMeta(deviceId, timezone, locale);
  const clampedStart = Math.max(start, meta.startedAt);
  const unit = body.unit ?? "custom";

  const report = await generateReportForRange(
    deviceId,
    unit,
    clampedStart,
    end,
    body.customLabel,
  );

  if (!report) {
    return NextResponse.json(
      { error: "No notification activity in this range yet." },
      { status: 404 },
    );
  }

  const existing = await getReport(deviceId, report.id);
  if (!existing) await saveReport(report);

  return NextResponse.json({ ok: true, report: existing ?? report });
}
