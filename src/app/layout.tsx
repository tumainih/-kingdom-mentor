import type { Metadata, Viewport } from "next";
import { Inter, Lora } from "next/font/google";
import { LocaleProvider } from "@/context/locale-context";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Kingdom AI",
  description:
    "Scripture-grounded wisdom for life decisions — a conversational biblical mentor.",
  applicationName: "Kingdom AI",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kingdom AI",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="h-full overflow-hidden bg-background text-foreground">
        <RegisterServiceWorker />
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
