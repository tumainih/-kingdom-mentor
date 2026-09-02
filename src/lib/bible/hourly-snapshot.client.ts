import type { HourlyThemeId } from "./hourly-themes";
import type { BibleLocale } from "./locale";
import { isBrowserOffline } from "@/lib/network";
import type { RetrievedPassage } from "./types";

export interface HourlySnapshotEntry {
  hour: number;
  theme: HourlyThemeId;
  themeLabel: string;
  scheduledRef: string;
  date: string;
  poolSize: number;
  passage: RetrievedPassage | null;
}

const snapshotCache = new Map<BibleLocale, HourlySnapshotEntry[]>();

export async function loadHourlySnapshot(
  locale: BibleLocale,
): Promise<HourlySnapshotEntry[]> {
  const cached = snapshotCache.get(locale);
  if (cached) return cached;

  const res = await fetch(`/data/hourly-${locale}.json`, { cache: "force-cache" });
  if (!res.ok) return [];

  const data = (await res.json()) as HourlySnapshotEntry[];
  snapshotCache.set(locale, data);
  return data;
}

export async function getHourlyVerseFromSnapshot(
  locale: BibleLocale,
  hour: number,
  date: string,
): Promise<HourlySnapshotEntry | null> {
  const snapshot = await loadHourlySnapshot(locale);
  if (snapshot.length === 0) return null;

  const snapshotDate = snapshot[0]?.date;
  if (snapshotDate && date !== snapshotDate && !isBrowserOffline()) return null;

  const entry = snapshot.find((s) => s.hour === hour);
  if (!entry?.passage) return null;
  return entry;
}

export async function fetchHourlyVerseFromApi(
  locale: BibleLocale,
  hour: number,
  date: string,
): Promise<HourlySnapshotEntry | null> {
  if (isBrowserOffline()) return null;

  try {
    const { fetchWithTimeout } = await import("@/lib/network");
    const res = await fetchWithTimeout(
      `/api/hourly-verse?locale=${locale}&hour=${hour}&date=${encodeURIComponent(date)}`,
      { cache: "no-store" },
      2500,
    );
    if (!res.ok) return null;
    return (await res.json()) as HourlySnapshotEntry;
  } catch {
    return null;
  }
}

export async function resolveHourlyVerseFast(
  locale: BibleLocale,
  hour: number,
  date: string,
): Promise<HourlySnapshotEntry | null> {
  const snapshot = await loadHourlySnapshot(locale);
  const byHour = snapshot.find((s) => s.hour === hour && s.passage);

  const fromSnapshot = await getHourlyVerseFromSnapshot(locale, hour, date);
  if (fromSnapshot?.passage) return fromSnapshot;

  if (!isBrowserOffline()) {
    const fromApi = await fetchHourlyVerseFromApi(locale, hour, date);
    if (fromApi?.passage) return fromApi;
  }

  if (byHour?.passage) return byHour;

  return null;
}
