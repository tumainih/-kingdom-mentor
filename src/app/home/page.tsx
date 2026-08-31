import type { Metadata } from "next";
import { HourlyVerseHome } from "@/components/home/hourly-verse-home";

export const metadata: Metadata = {
  title: "Home · Kingdom AI",
  description:
    "Hourly Scripture for love, hope, faith, security, forgiveness, and more.",
};

export default function HomePage() {
  return (
    <main className="h-dvh max-h-dvh overflow-hidden supports-[height:100dvh]:h-dvh">
      <HourlyVerseHome />
    </main>
  );
}
