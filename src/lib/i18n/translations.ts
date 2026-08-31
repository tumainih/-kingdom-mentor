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
    welcomeSubtitle:
      "Full Bible · English or Swahili · verses, stories, guidance (e.g. Moses / Musa)",
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
    assistantName: "Kingdom AI",
    morePassages: "+{count} more in context",
    thinking: "Kingdom AI is thinking…",
    errorGeneric: "Something went wrong.",
    micError: "Could not hear you. Check your microphone and try again.",
    micActive: "Microphone is already active.",
    languageLabel: "Language",
    greetingReply:
      "Peace to you. I'm Kingdom AI — I help through the full Bible (KJV). Share what you feel or doubt.",
    offTopicReply:
      "That question is outside Bible and faith-life guidance. Try faith, doubt, relationships, decisions — or type a verse (e.g. John 3:16 or Yohana 3:16).",
    verseNotFound:
      "I couldn't find that reference. Try: **John 3:16**, **Psalm 23:1**, **Yohana 3:16**, or **Zaburi 23:1**.",
    verseIntroOne: "Here is the verse from the full Bible:",
    verseIntroMany: "Here are the verses from the full Bible:",
    storyIntro: "Here is the story of **{title}** from passages across the full Bible:",
    kingdomStep: "Kingdom step",
    spiritualStep: "Spiritual step",
    heardYou: "I hear you. Guidance from the full Bible:",
    noPassagesYet:
      "Thank you for sharing. I couldn't match clear passages yet — try a name (Moses/Musa, David/Daudi, Jesus/Yesu) or topic (forgiveness/msamaha, anxiety/wasiwasi).",
    defaultStep:
      "Ask: What would love require? Humility? Integrity before God?",
    aiUnavailable:
      "I can't reach the AI right now, so I can't give the thoughtful guidance this question deserves. Please try again in a moment.\n\nYou can still type a Bible reference in English or Swahili (e.g. **John 3:16** or **Yohana 3:16**).",
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
      "Biblia kamili · Kiingereza au Kiswahili · mistari, hadithi, mwongozo (mf. Musa / Moses)",
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
    assistantName: "Kingdom AI",
    morePassages: "+{count} zaidi katika muktadha",
    thinking: "Kingdom AI inafikiri…",
    errorGeneric: "Kuna hitilafu.",
    micError: "Sikuweza kukusikia. Angalia kipaza sauti na ujaribu tena.",
    micActive: "Kipaza sauti tayari kinatumika.",
    languageLabel: "Lugha",
    greetingReply:
      "Amani iwe kwako. Mimi ni Kingdom AI — ninasaidia kupitia Biblia kamili (SUV). Shiriki unachohisi au shaka yako.",
    offTopicReply:
      "Swali hilo ni nje ya Biblia na maisha ya imani. Jaribu imani, shaka, mahusiano, maamuzi, au andika mstari (mf. Yohana 3:16 au John 3:16).",
    verseNotFound:
      "Sikupata mstari huo. Jaribu: **Yohana 3:16**, **Zaburi 23:1**, **John 3:16**, au **Psalm 23:1**.",
    verseIntroOne: "Huu ndio mstari kutoka Biblia kamili:",
    verseIntroMany: "Hii ndio mistari kutoka Biblia kamili:",
    storyIntro:
      "Hii ni muhtasari wa hadithi ya **{title}** kutoka mistari katika Biblia kamili:",
    kingdomStep: "Hatua ya kiroho",
    spiritualStep: "Hatua",
    heardYou: "Nimekusikia. Hii ni mwongozo kutoka Biblia kamili:",
    noPassagesYet:
      "Asante kwa kushiriki. Bado sijapata mistari wazi — jaribu jina (Musa/Moses, Daudi/David, Yesu/Jesus) au mada (msamaha, wasiwasi).",
    defaultStep:
      "Jiulize: Upendo unahitaji nini? Unyenyekevu unahitaji nini? Uaminifu unahitaji nini mbele za Mungu?",
    aiUnavailable:
      "Siwezi kufikia AI kwa sasa, kwa hivyo siwezi kutoa mwongozo wa kina unaostahili swali hili. Tafadhali jaribu tena baada ya muda mfupi.\n\nUnaweza bado kuandika mstari kwa Kiingereza au Kiswahili (mf. **Yohana 3:16** au **John 3:16**).",
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
