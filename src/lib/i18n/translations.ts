export type AppLocale = "en" | "sw";

export const translations = {
  en: {
    language: "English",
    languageShort: "EN",
    chat: "Chat",
    talk: "Talk",
    newChat: "New",
    live: "Live",
    free: "Free",
    aiLive: "AI Live",
    aiOffline: "AI Offline",
    aiBanner: "AI guidance · full Bible · {count} verses",
    aiUnavailableBanner:
      "AI offline — verse lookup still works (e.g. John 3:16)",
    canvas: "Canvas",
    freeBanner:
      "Free guidance — full Bible (KJV). No API key or payment needed.",
    placeholder: "Write what you feel or doubt…",
    placeholderContinue: "Continue the conversation…",
    welcomeTitle: "Write what you feel or doubt",
    welcomeSubtitle: "Full Bible · KJV English · ask stories too (e.g. Moses)",
    talkHint: "Share what you feel or doubt — tap the mic",
    talkListening: "Listening… speak now",
    talkStatusIdle: "Share what you feel or doubt",
    talkReflecting: "Reflecting…",
    talkSpeaking: "Speaking…",
    talkListeningShort: "Listening…",
    passagesForQuestion: "Bible · passages for your question",
    storyContext: "Bible story",
    fullBible: "66 books · {count} verses",
    copy: "Copy",
    copied: "Copied",
  },
  sw: {
    language: "Kiswahili",
    languageShort: "SW",
    chat: "Maandishi",
    talk: "Ongea",
    newChat: "Mpya",
    live: "Hai",
    free: "Bure",
    aiLive: "AI Hai",
    aiOffline: "AI Haidhani",
    aiBanner: "Mwongozo wa AI · Biblia kamili · mistari {count}",
    aiUnavailableBanner:
      "AI haipatikani — utafutaji wa mistari unafanya kazi (mf. Yohana 3:16)",
    canvas: "Ubao",
    freeBanner:
      "Mwongozo bure — Biblia kamili (SUV). Hakuna API wala malipo.",
    placeholder: "Andika unachohisi au shaka yako…",
    placeholderContinue: "Endelea mazungumzo…",
    welcomeTitle: "Andika unachohisi au shaka yako",
    welcomeSubtitle:
      "Biblia kamili · Kiswahili SUV · uliza hadithi (mf. Musa)",
    talkHint: "Shiriki unachohisi — gusa kipaza sauti",
    talkListening: "Nasikiliza… sema sasa",
    talkStatusIdle: "Shiriki unachohisi au shaka yako",
    talkReflecting: "Nafikiri…",
    talkSpeaking: "Nasema…",
    talkListeningShort: "Nasikiliza…",
    passagesForQuestion: "Biblia · mistari kwa swali lako",
    storyContext: "Hadithi ya Biblia",
    fullBible: "Vitabu 66 · mistari {count}",
    copy: "Nakili",
    copied: "Imenakiliwa",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["en"];

export function t(locale: AppLocale, key: TranslationKey, vars?: Record<string, string | number>): string {
  let text: string = translations[locale][key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}
