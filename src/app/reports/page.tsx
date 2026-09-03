import { Suspense } from "react";
import type { Metadata } from "next";
import { DevelopmentReportView } from "@/components/reports/development-report-view";

export const metadata: Metadata = {
  title: "Reports · Kingdom AI",
  description: "Self-development reading reports — colored calendar from hour to year.",
};

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex h-dvh items-center justify-center text-xs text-muted-foreground">
          Loading reports…
        </main>
      }
    >
      <DevelopmentReportView />
    </Suspense>
  );
}
