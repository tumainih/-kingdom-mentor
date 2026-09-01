import { NextResponse } from "next/server";
import { getReport, saveReport } from "@/lib/reading/store.server";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json()) as { deviceId?: string; note?: string };
  const deviceId = body.deviceId?.trim();
  const note = body.note?.trim() ?? "";

  if (!deviceId) {
    return NextResponse.json({ error: "Missing deviceId." }, { status: 400 });
  }

  const report = await getReport(deviceId, id);
  if (!report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  report.note = note;
  report.submittedAt = Date.now();
  await saveReport(report);

  return NextResponse.json({ ok: true, report });
}
