import type { Metadata } from "next";
import { Lora, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kingdom AI — Biblical Wisdom Mentor",
  description:
    "Think, decide, and live according to the Kingdom of God with Scripture-grounded guidance from the King James Version.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sourceSans.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background">{children}</body>
    </html>
  );
}
