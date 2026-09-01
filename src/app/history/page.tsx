import type { Metadata } from "next";
import { VerseHistoryView } from "@/components/history/verse-history-view";

export const metadata: Metadata = {
  title: "Verse History · Kingdom AI",
  description: "Look up Scripture by date and hour — catch up on verses you missed.",
};

export default function HistoryPage() {
  return (
    <main className="h-dvh max-h-dvh overflow-hidden supports-[height:100dvh]:h-dvh">
      <VerseHistoryView />
    </main>
  );
}
