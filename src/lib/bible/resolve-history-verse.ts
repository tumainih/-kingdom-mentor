import type { BibleLocale } from "./locale";
import { isBrowserOffline } from "@/lib/network";
import { getSlotForHour, themeLabel, type HourlyThemeId } from "./hourly-themes";
import {
  fetchHourlyVerseFromApi,
  getHourlyVerseFromSnapshot,
  loadHourlySnapshot,
  type HourlySnapshotEntry,
} from "./hourly-snapshot.client";

export interface HistoryVerseResult {
  date: string;
  hour: number;
  theme: HourlyThemeId;
  themeLabel: string;
  scheduledRef: string;
  poolSize: number;
  passage: { ref: string; text: string; refEn?: string } | null;
}

function snapshotToHistory(entry: HourlySnapshotEntry, date: string): HistoryVerseResult {
  return {
    date,
    hour: entry.hour,
    theme: entry.theme,
    themeLabel: entry.themeLabel,
    scheduledRef: entry.scheduledRef,
    poolSize: entry.poolSize,
    passage: entry.passage,
  };
}

export async function resolveHistoryVerse(
  date: string,
  hour: number,
  locale: BibleLocale,
): Promise<HistoryVerseResult | null> {
  const fromSnapshot = await getHourlyVerseFromSnapshot(locale, hour, date);
  if (fromSnapshot?.passage) {
    return snapshotToHistory(fromSnapshot, date);
  }

  const fromApi = await fetchHourlyVerseFromApi(locale, hour, date);
  if (fromApi?.passage) {
    return snapshotToHistory(fromApi, date);
  }

  const slot = getSlotForHour(hour);
  return {
    date,
    hour,
    theme: slot.theme,
    themeLabel: themeLabel(slot.theme, locale),
    scheduledRef: "",
    poolSize: 0,
    passage: null,
  };
}

export async function resolveHistoryVerseBatch(
  slots: { date: string; hour: number }[],
  locale: BibleLocale,
  concurrency = 8,
): Promise<HistoryVerseResult[]> {
  const snapshot = await loadHourlySnapshot(locale);
  const snapshotDate = snapshot[0]?.date;
  const snapshotByKey = new Map(
    snapshot.map((entry) => [`${entry.date}:${entry.hour}`, entry]),
  );

  const results: HistoryVerseResult[] = [];
  const pending: { date: string; hour: number }[] = [];

  for (const { date, hour } of slots) {
    const key = `${date}:${hour}`;
    const cached = snapshotByKey.get(key);
    if (cached?.passage && (!snapshotDate || date === snapshotDate)) {
      results.push(snapshotToHistory(cached, date));
      continue;
    }
    pending.push({ date, hour });
  }

  for (let i = 0; i < pending.length; i += concurrency) {
    if (isBrowserOffline()) break;
    const chunk = pending.slice(i, i + concurrency);
    const batch = await Promise.all(
      chunk.map(({ date, hour }) => fetchHourlyVerseFromApi(locale, hour, date)),
    );
    for (let j = 0; j < batch.length; j++) {
      const item = batch[j];
      if (item?.passage) {
        results.push(snapshotToHistory(item, chunk[j].date));
      }
    }
  }

  return results.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.hour - b.hour;
  });
}
