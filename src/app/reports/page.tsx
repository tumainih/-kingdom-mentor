import { Suspense } from "react";
import { DevelopmentReportView } from "@/components/reports/development-report-view";

export default function ReportsPage() {
  return (
    <Suspense fallback={null}>
      <DevelopmentReportView />
    </Suspense>
  );
}
