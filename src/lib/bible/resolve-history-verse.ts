import type { BibleLocale } from "./locale";
import { isBrowserOffline } from "@/lib/network";
import { getSlotForHour, themeLabel, type HourlyThemeId } from "./hourly-themes";
import {
  fetchHourlyVerseFromApi,
  getHourlyVerseFromSnapshot,
  type HourlySnapshotEntry,
} from "./hourly-snapshot.client";
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

async function resolveHistoryVerseLocal(
  date: string,
  hour: number,
  locale: BibleLocale,
): Promise<HistoryVerseResult> {
  const slot = getSlotForHour(hour);
  const local = await resolveHourlyVerseClient(slot.theme, locale, hour, date);
  return {
    date,
    hour,
    theme: slot.theme,
    themeLabel: themeLabel(slot.theme, locale),
    scheduledRef: local.scheduledRef,
    poolSize: local.poolSize,
    passage: local.passage,
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

  const local = await resolveHistoryVerseLocal(date, hour, locale);
  if (local.passage) return local;

  if (!isBrowserOffline()) {
    const fromApi = await fetchHourlyVerseFromApi(locale, hour, date);
    if (fromApi?.passage) {
      return snapshotToHistory(fromApi, date);
    }
  }

  return local;
}

export async function resolveHistoryVerseBatch(
  slots: { date: string; hour: number }[],
  locale: BibleLocale,
): Promise<HistoryVerseResult[]> {
  const results: HistoryVerseResult[] = [];

  for (const { date, hour } of slots) {
    const fromSnapshot = await getHourlyVerseFromSnapshot(locale, hour, date);
    if (fromSnapshot?.passage) {
      results.push(snapshotToHistory(fromSnapshot, date));
      continue;
    }

    const local = await resolveHistoryVerseLocal(date, hour, locale);
    if (local.passage) {
      results.push(local);
      continue;
    }

    if (!isBrowserOffline()) {
      const fromApi = await fetchHourlyVerseFromApi(locale, hour, date);
      if (fromApi?.passage) {
        results.push(snapshotToHistory(fromApi, date));
        continue;
      }
    }

    results.push(local);
  }

  return results.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.hour - b.hour;
  });
}
