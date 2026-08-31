export type InstallPlatform = "ios-safari" | "ios-other" | "android" | "desktop" | "unknown";

export function detectInstallPlatform(): InstallPlatform {
  if (typeof window === "undefined") return "unknown";

  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isIOS) {
    const isSafari =
      /Safari/.test(ua) &&
      !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/.test(ua);
    return isSafari ? "ios-safari" : "ios-other";
  }

  if (/Android/.test(ua)) return "android";

  if (/Mobi|Mobile/.test(ua)) return "unknown";

  return "desktop";
}

export function isStandaloneApp(): boolean {
  if (typeof window === "undefined") return false;

  const iosStandalone =
    "standalone" in navigator &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  return (
    iosStandalone ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches
  );
}

export function getInstallPageUrl(): string {
  if (typeof window === "undefined") return "/install";
  return `${window.location.origin}/install`;
}
