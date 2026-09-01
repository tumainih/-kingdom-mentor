"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/context/locale-context";
import {
  disableVerseNotifications,
  enableVerseNotifications,
  getNotifyHours,
  isVerseNotificationsEnabled,
  isVerseNotificationsSupported,
  syncVerseNotifications,
} from "@/lib/notifications/verse-notifications";

interface VerseNotificationsToggleProps {
  compact?: boolean;
}

export function VerseNotificationsToggle({
  compact = false,
}: VerseNotificationsToggleProps) {
  const { locale, t } = useLocale();
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    setSupported(isVerseNotificationsSupported());
    setEnabled(isVerseNotificationsEnabled());
    setDenied(
      typeof Notification !== "undefined" &&
        Notification.permission === "denied",
    );
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void syncVerseNotifications(locale).catch(() => {
      /* background sync is best-effort */
    });
  }, [enabled, locale]);

  const toggle = useCallback(async () => {
    if (!supported || busy) return;
    setBusy(true);
    try {
      if (enabled) {
        await disableVerseNotifications();
        setEnabled(false);
        setDenied(false);
        return;
      }

      const permission = await enableVerseNotifications(locale, {
        showNow: true,
        notifyHours: getNotifyHours(),
      });
      setDenied(permission === "denied");
      setEnabled(permission === "granted");
    } catch {
      /* permission or push setup failed */
    } finally {
      setBusy(false);
    }
  }, [busy, enabled, locale, supported]);

  if (!supported) return null;

  return (
    <div
      className={
        compact
          ? "mt-3"
          : "mt-4 rounded-lg border border-brand/25 bg-brand/5 px-3 py-2.5 text-left"
      }
    >
      {!compact && (
        <>
          <p className="flex items-center gap-2 text-xs font-semibold text-brand-light">
            <Bell className="h-3.5 w-3.5 shrink-0" />
            {t("notifyTitle")}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
            {t("notifyHint")}
          </p>
        </>
      )}

      <Button
        type="button"
        variant={enabled ? "default" : "outline"}
        size="sm"
        className={compact ? "w-full gap-2 text-xs" : "mt-3 w-full gap-2 text-xs"}
        disabled={busy || denied}
        onClick={() => void toggle()}
      >
        {enabled ? (
          <>
            <BellOff className="h-3.5 w-3.5" />
            {busy ? t("notifyWorking") : t("notifyDisable")}
          </>
        ) : (
          <>
            <Bell className="h-3.5 w-3.5" />
            {busy ? t("notifyWorking") : t("notifyEnable")}
          </>
        )}
      </Button>

      {denied ? (
        <p className="mt-2 text-[10px] text-amber-200/90">{t("notifyDenied")}</p>
      ) : enabled ? (
        <p className="mt-2 text-[10px] text-brand-light">{t("notifyActive")}</p>
      ) : null}
    </div>
  );
}
