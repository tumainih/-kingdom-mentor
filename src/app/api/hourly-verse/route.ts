import "@/lib/bible/init-server";
import { getHourlyVerse } from "@/lib/bible/get-hourly-verse";
import { parseLocale } from "@/lib/bible/locale";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = parseLocale(searchParams.get("locale") ?? "en");
  const hourParam = searchParams.get("hour");
  const dateParam = searchParams.get("date") ?? undefined;
  const hour =
    hourParam !== null && hourParam !== ""
      ? Number.parseInt(hourParam, 10)
      : undefined;

  if (hour !== undefined && (Number.isNaN(hour) || hour < 0 || hour > 23)) {
    return Response.json({ error: "Hour must be 0–23." }, { status: 400 });
  }

  if (dateParam && !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return Response.json({ error: "Date must be YYYY-MM-DD." }, { status: 400 });
  }

  const result = await getHourlyVerse(locale, hour, dateParam);
  return Response.json(result);
}
