import type { Metadata } from "next";
import { NotificationSettingsView } from "@/components/notifications/notification-settings-view";

export const metadata: Metadata = {
  title: "Alerts · Kingdom AI",
  description: "Hourly Scripture notifications — choose your hours and turn alerts on.",
};

export default function NotificationsPage() {
  return (
    <main className="h-dvh max-h-dvh overflow-hidden supports-[height:100dvh]:h-dvh">
      <NotificationSettingsView />
    </main>
  );
}
