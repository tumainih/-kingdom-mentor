export type ReportUnit =
  | "3h"
  | "6h"
  | "12h"
  | "24h"
  | "week"
  | "fortnight"
  | "month"
  | "quarter"
  | "year"
  | "4year"
  | "10year"
  | "custom";

export interface ReadEvent {
  id: string;
  deviceId: string;
  notificationId: string;
  shownAt: number;
  readAt: number;
  lapseMs: number;
  rate: number;
  hour: number;
  verseRef: string;
  theme: string;
  themeLabel: string;
  locale: "en" | "sw";
  timezone: string;
  missed?: boolean;
}

export interface PendingNotification {
  notificationId: string;
  deviceId: string;
  shownAt: number;
  hour: number;
  hourEndsAt: number;
  verseRef: string;
  theme: string;
  themeLabel: string;
  locale: "en" | "sw";
  timezone: string;
  isTest?: boolean;
}

export interface DevelopmentReport {
  id: string;
  deviceId: string;
  unit: ReportUnit;
  periodStart: number;
  periodEnd: number;
  generatedAt: number;
  eventCount: number;
  avgLapseMs: number;
  avgRate: number;
  color: string;
  note: string | null;
  submittedAt: number | null;
  notifiedAt: number | null;
  customLabel?: string;
}

export interface DeviceReadingMeta {
  deviceId: string;
  startedAt: number;
  timezone: string;
  locale: "en" | "sw";
}
