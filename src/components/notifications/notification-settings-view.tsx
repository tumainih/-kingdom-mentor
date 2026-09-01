"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Home, Zap } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { VerseNotificationsToggle } from "@/components/pwa/verse-notifications-toggle";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/context/locale-context";
import {
  DEFAULT_NOTIFY_HOURS,
  getNotifyHours,
  isVerseNotificationsEnabled,
  previewHourVerseNotification,
  setNotifyHours,
  syncVerseNotifications,
} from "@/lib/notifications/verse-notifications";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function defaultSendAtLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 1, 0, 0);
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function NotificationSettingsView() {
  const { locale, t } = useLocale();
  const [selectedHours, setSelectedHours] = useState<number[]>(DEFAULT_NOTIFY_HOURS);
  const [testHour, setTestHour] = useState(() => new Date().getHours());
  const [testAt, setTestAt] = useState(defaultSendAtLocal);
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState<"sent" | "failed" | "scheduled" | null>(null);
  const [pushServerReady, setPushServerReady] = useState<boolean | null>(null);
  const [backgroundPushReady, setBackgroundPushReady] = useState<boolean | null>(null);
  const scheduleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendTest = useCallback(async () => {
    const shown = await previewHourVerseNotification(locale, testHour);
    setTestMessage(shown ? "sent" : "failed");
    setTesting(false);
  }, [locale, testHour]);

  const testNotification = useCallback(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") {
      setTestMessage("failed");
      return;
    }

    if (scheduleRef.current) {
      clearTimeout(scheduleRef.current);
      scheduleRef.current = null;
    }

    setTesting(true);
    setTestMessage(null);

    const targetMs = new Date(testAt).getTime();
    const delay = targetMs - Date.now();

    if (Number.isFinite(targetMs) && delay > 15_000) {
      scheduleRef.current = setTimeout(() => {
        scheduleRef.current = null;
        void sendTest();
      }, delay);
      setTestMessage("scheduled");
      setTesting(false);
      return;
    }

    void sendTest();
  }, [sendTest, testAt]);

  useEffect(() => {
    return () => {
      if (scheduleRef.current) clearTimeout(scheduleRef.current);
    };
  }, []);

  useEffect(() => {
    setSelectedHours(getNotifyHours());
  }, []);

  useEffect(() => {
    void fetch("/api/health")
      .then((res) => res.json())
      .then(
        (data: {
          pushConfigured?: boolean;
          backgroundPushReady?: boolean;
        }) => {
          setPushServerReady(Boolean(data.pushConfigured));
          setBackgroundPushReady(Boolean(data.backgroundPushReady));
        },
      )
      .catch(() => {
        setPushServerReady(false);
        setBackgroundPushReady(false);
      });
  }, []);

  useEffect(() => {
    if (!isVerseNotificationsEnabled()) return;
    void syncVerseNotifications(locale).catch(() => {
      /* background sync is best-effort */
    });
  }, [selectedHours, locale]);

  const toggleHour = useCallback((h: number) => {
    setSelectedHours((prev) => {
      const next = prev.includes(h)
        ? prev.filter((x) => x !== h)
        : [...prev, h].sort((a, b) => a - b);
      setNotifyHours(next);
      return next;
    });
  }, []);

  const selectPreset = useCallback((hours: number[]) => {
    setNotifyHours(hours);
    setSelectedHours(hours);
  }, []);

  return (
    <div className="canvas-gradient flex h-dvh min-h-0 flex-col overflow-hidden supports-[height:100dvh]:h-dvh">
      <AppHeader aiReady showNav compactNav hideStatusOnMobile />

      <main className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-4">
        <div className="shrink-0 text-center">
          <Bell className="mx-auto h-7 w-7 text-brand sm:h-8 sm:w-8" />
          <h1 className="mt-1.5 font-heading text-lg font-semibold sm:text-xl">
            {t("notifyPageTitle")}
          </h1>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground sm:text-xs">
            {t("notifyPageSubtitle")}
          </p>
        </div>

        <div className="mt-3 shrink-0">
          <VerseNotificationsToggle compact />
          {typeof Notification !== "undefined" &&
          Notification.permission === "granted" &&
          isVerseNotificationsEnabled() ? (
            <div className="mt-2 rounded-lg border border-border/50 bg-card/40 p-3">
              <p className="text-xs font-semibold">{t("notifyTestNow")}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="text-[10px] text-muted-foreground">
                  {t("notifyTestHour")}
                  <select
                    value={testHour}
                    onChange={(e) => setTestHour(Number(e.target.value))}
                    className="mt-1 w-full rounded-md border border-border/50 bg-background px-2 py-1.5 text-xs"
                  >
                    {Array.from({ length: 24 }, (_, h) => (
                      <option key={h} value={h}>
                        {pad(h)}:00
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-[10px] text-muted-foreground">
                  {t("notifyTestAt")}
                  <input
                    type="datetime-local"
                    value={testAt}
                    onChange={(e) => setTestAt(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border/50 bg-background px-2 py-1.5 text-xs"
                  />
                </label>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 w-full gap-2 text-xs"
                disabled={testing}
                onClick={() => testNotification()}
              >
                <Zap className="h-3.5 w-3.5" />
                {testing ? t("notifyWorking") : t("notifyTestSend")}
              </Button>
            </div>
          ) : null}
          {testMessage === "sent" ? (
            <p className="mt-2 text-[10px] text-brand-light">{t("notifyTestSent")}</p>
          ) : testMessage === "scheduled" ? (
            <p className="mt-2 text-[10px] text-brand-light">{t("notifyTestScheduled")}</p>
          ) : testMessage === "failed" ? (
            <p className="mt-2 text-[10px] text-amber-200/90">{t("notifyTestFailed")}</p>
          ) : null}
          {backgroundPushReady ? (
            <p className="mt-2 text-[10px] leading-snug text-brand-light">
              {t("notifyBackgroundReady")}
            </p>
          ) : pushServerReady === false ? (
            <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
              {t("notifyPushServerOff")}
            </p>
          ) : null}
          <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
            {t("notifyReEnable")}
          </p>
          <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
            {t("notifySoundHint")}
          </p>
        </div>

        <div className="mt-3 flex min-h-0 flex-1 flex-col rounded-xl border border-border/50 bg-card/40 p-3 sm:p-4">
          <p className="shrink-0 text-left text-xs font-semibold text-foreground">
            {t("historyNotifyHoursTitle")}
          </p>
          <p className="mt-1 shrink-0 text-left text-[10px] leading-snug text-muted-foreground sm:text-[11px]">
            {t("historyNotifyHoursHint")}
          </p>

          <div className="mt-2 flex shrink-0 flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => selectPreset([6, 9, 12, 15, 18])}
              className="rounded-md border border-brand/30 bg-brand/10 px-2 py-1 text-[10px] font-medium text-brand-light"
            >
              {t("notifyPresetPrayer")}
            </button>
            <button
              type="button"
              onClick={() => selectPreset(Array.from({ length: 24 }, (_, i) => i))}
              className="rounded-md border border-border/50 px-2 py-1 text-[10px] font-medium text-muted-foreground"
            >
              {t("notifyPresetAll")}
            </button>
          </div>

          <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0.5">
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
              {Array.from({ length: 24 }, (_, h) => {
                const active = selectedHours.includes(h);
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => toggleHour(h)}
                    className={`rounded-md border py-2 text-[10px] font-semibold sm:text-xs ${
                      active
                        ? "border-brand bg-brand/15 text-brand-light"
                        : "border-border/50 text-muted-foreground"
                    }`}
                  >
                    {pad(h)}:00
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-2 shrink-0 flex justify-center gap-2 pb-0.5">
          <Link
            href="/home"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-brand/30 px-3 text-xs font-medium"
          >
            <Home className="h-3.5 w-3.5" />
            {t("navHome")}
          </Link>
          <Link
            href="/history"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/50 px-3 text-xs font-medium text-muted-foreground"
          >
            {t("navHistory")}
          </Link>
        </div>
      </main>
    </div>
  );
}
