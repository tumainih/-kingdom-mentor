import type { BibleLocale } from "./locale";
import { getSlotForHour, themeLabel, type HourlyThemeId } from "./hourly-themes";
import { resolveHourlyVerseClient } from "./resolve-hourly-verse.client";

export interface HistoryVerseResult {
  date: string;
  hour: number;
  theme: HourlyThemeId;
  themeLabel: string;
  scheduledRef: string;
  poolSize: number;
  passage: { ref: string; text: string; refEn?: string } | null;
}

export async function resolveHistoryVerse(
  date: string,
  hour: number,
  locale: BibleLocale,
): Promise<HistoryVerseResult | null> {
  const slot = getSlotForHour(hour);
  const resolved = await resolveHourlyVerseClient(
    slot.theme,
    locale,
    hour,
    date,
  );

  if (resolved.passage) {
    return {
      date,
      hour,
      theme: slot.theme,
      themeLabel: themeLabel(slot.theme, locale),
      scheduledRef: resolved.scheduledRef,
      poolSize: resolved.poolSize,
      passage: resolved.passage,
    };
  }

  try {
    const res = await fetch(
      `/api/hourly-verse?locale=${locale}&hour=${hour}&date=${date}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Omit<HistoryVerseResult, "date"> & {
      date?: string;
    };
    return { ...data, date: data.date ?? date, hour: data.hour ?? hour };
  } catch {
    return null;
  }
}

export async function resolveHistoryVerseBatch(
  slots: { date: string; hour: number }[],
  locale: BibleLocale,
  concurrency = 8,
): Promise<HistoryVerseResult[]> {
  const results: HistoryVerseResult[] = [];

  for (let i = 0; i < slots.length; i += concurrency) {
    const chunk = slots.slice(i, i + concurrency);
    const batch = await Promise.all(
      chunk.map(({ date, hour }) => resolveHistoryVerse(date, hour, locale)),
    );
    for (const item of batch) {
      if (item?.passage) results.push(item);
    }
  }

  return results;
}
