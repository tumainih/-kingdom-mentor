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
    placeholder: "Write the verse you need, ask whatever you feel or doubt…",
    placeholderContinue: "Continue the conversation…",
    welcomeHint:
      "Write the verse you need, ask whatever you feel or doubt.",
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
    navHome: "Home",
    navChat: "Chat",
    navHistory: "History",
    navAlerts: "Alerts",
    navReports: "Reports",
    navAreas: "Areas",
    areasTitle: "Scripture by area",
    areasSubtitle:
      "Curated verse pools — each area has 200+ relevant passages from the full Bible (KJV / SUV).",
    areasThemes: "Hourly themes",
    areasTopics: "Chat topics",
    areasVerses: "{count} verses",
    areasTotal: "{areas} areas · {verses} curated verses",
    areasBack: "All areas",
    areasBrowseHint: "Tap an area to read all related verses",
    areasShowing: "{count} verses",
    homeHourLabel: "Hour {hour} · verse for this hour",
    homeLoading: "Loading this hour's verse…",
    homeChangesAt: "New verse at {hour}:00",
    homePoolSize: "{count} verses in this theme pool",
    homeVerseUnavailable: "Verse unavailable for this hour. Try again shortly.",
    homeSubtitle:
      "One Scripture each hour — love, hope, faith, security, forgiveness, and more. Changes when the hour changes.",
    homeGoChat: "Talk with Kingdom AI",
    installTitle: "Install Kingdom AI",
    installSubtitle:
      "One link for iPhone and Android — add to your home screen for hourly Scripture and chat.",
    installOneLink: "Same link for every phone",
    installCopyLink: "Copy link",
    installShareLink: "Share link",
    installShareText: "Install Kingdom AI — Scripture and biblical guidance on your phone.",
    installButton: "Install app",
    installWorking: "Installing…",
    installDone: "App ready on your home screen.",
    installOpenApp: "Open Kingdom AI",
    installOpenBrowser: "Continue in browser",
    installIosTitle: "iPhone / iPad",
    installIosSafariRequired: "Open this link in Safari to add Kingdom AI to your home screen.",
    installIosOpenSafari: "Copy the link above, open Safari, paste it in the address bar, and go.",
    installIosStep1: "Tap Share in Safari (square with arrow at the bottom).",
    installIosStep2: 'Scroll and tap "Add to Home Screen", then tap Add.',
    installAndroidTitle: "Android",
    installAndroidTapButton: "Tap the Install app button above.",
    installAndroidStep1: "Open this link in Chrome (or Samsung Internet / Edge).",
    installAndroidStep2: 'Tap Install — or menu (⋮) → "Install app" / "Add to Home screen".',
    installAndroidStep3: "Confirm — Kingdom AI opens from your home screen like an app.",
    installDesktopTitle: "On your computer",
    installDesktopHint:
      "Send this link to your phone, or scan it from another device. Works on iPhone (Safari) and Android (Chrome).",
    installOfflineTitle: "Works offline",
    installOfflineHint:
      "After one online visit (this page does it automatically), Home, History, Areas, Chat, and the full Bible work without internet.",
    installOfflinePreparing: "Downloading Bible and app pages for offline use…",
    installOfflineReady: "Ready for offline — open from your home screen anytime",
    offlineBanner: "Offline — hourly verses, Bible lookup, and guidance still work.",
    notifyTitle: "Hourly verse alerts",
    notifyHint:
      "Get a Scripture notification at the start of each selected hour — even when the app is closed (installed PWA + push). Uses your phone's notification sound.",
    notifyEnable: "Turn on hourly notifications",
    notifyDisable: "Turn off notifications",
    notifyWorking: "Updating…",
    notifyActive: "Hourly notifications are on for your selected hours.",
    notifyTestNow: "Send test notification now",
    notifyTestSent:
      "Test sent — tap Read (Nimesoma) on the notification to record your reading speed.",
    notifyTestFailed:
      "Could not show a notification. Install the app, allow alerts, and open it once online.",
    notifyPushServerOff:
      "Background push is not configured on the server yet — alerts work while the app is installed and has been opened recently.",
    notifyBackgroundReady:
      "Background alerts are on — you'll get Scripture even when the app is closed (re-enable alerts once after updates).",
    notifyReEnable:
      "After an update: turn alerts off, then on again so your phone registers for background push.",
    notifySoundHint:
      "Sound uses your phone's default notification tone. In Settings, allow notifications and sound for Kingdom AI.",
    reportPageTitle: "Self-development reports",
    reportPageSubtitle:
      "Reading speed from verse alerts — tap Read (Nimesoma) when you finish. Data starts from when you first use the app.",
    reportEmpty: "No reports yet. Mark verse notifications as Read to build your trend.",
    reportUnit: "Period",
    reportLapseAvg: "Avg unread time",
    reportScaleAvg: "Avg scale",
    reportEvents: "Verses read",
    reportWhatHappened: "What happened",
    reportNotePlaceholder: "What did this period mean for you?",
    reportSubmit: "Submit note",
    reportSubmitted: "Note saved",
    reportCalendar: "Daily reading pace",
    reportTrend: "Report trend",
    reportSince: "Tracking since",
    reportOpen: "Open",
    reportRateHint:
      "Scale 0 (brown) = unread by hour end. 1 (fast) → 6+ (slow). Light = quick, red = longer.",
    reportCustomTitle: "Report for any time",
    reportFrom: "From",
    reportTo: "To",
    reportGenerate: "Generate report",
    reportGenerated: "Report ready — see below.",
    reportNoActivity: "No alerts in this range yet.",
    reportUnread: "Unread",
    reportClose: "Close",
    notifyDenied: "Notifications blocked. Allow them in your browser or phone settings.",
    notifyPageTitle: "Verse alerts",
    notifyPageSubtitle:
      "Choose the hours you want a Scripture notification — works when the app is closed after install.",
    notifyPresetPrayer: "6 · 9 · 12 · 15 · 18",
    notifyPresetAll: "Every hour",
    notifyInstallLink: "Set up hourly alerts",
    historyTitle: "Verse by date & hour",
    historySubtitle:
      "Look up one hour or a range (from — to). Past hours only; future hours are not available yet.",
    historyDate: "Date",
    historyHour: "Hour",
    historyHourLabel: "Hour {hour}",
    historyModeSingle: "Single",
    historyModeRange: "Range",
    historyFrom: "From",
    historyTo: "To",
    historyLookUp: "Look up",
    historyRangeCount: "{count} hours in range",
    historyRangeTruncated:
      "Showing first {shown} of {total} hours — narrow your range for more.",
    historyRangeEmpty: "No past hours in that range. Adjust from/to dates or hours.",
    historyCopyAll: "Copy all",
    historyCopiedAll: "Copied",
    historyTodayLimit: "Today: only hours up to {hour}:00 — not the next hour yet.",
    historyFutureDate: "That date hasn't arrived yet. Choose today or an earlier date.",
    historyNotifyHoursTitle: "Notification hours",
    historyNotifyHoursHint:
      "Tap the hours when you want a verse alert (e.g. 6am, 9am, 12pm, 3pm, 6pm). Default: 6 · 9 · 12 · 15 · 18.",
    historyBackHome: "Back to live hour",
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
    placeholder: "Andika mstari unayohitaji, uliza unachohisi au shaka yako…",
    placeholderContinue: "Endelea mazungumzo…",
    welcomeHint:
      "Andika mstari unayohitaji, uliza unachohisi au shaka yako.",
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
    navHome: "Nyumbani",
    navChat: "Maandishi",
    navHistory: "Historia",
    navAlerts: "Arifa",
    navReports: "Ripoti",
    navAreas: "Maeneo",
    areasTitle: "Maandiko kwa eneo",
    areasSubtitle:
      "Makundi ya mistari — kila eneo lina mistari 200+ muhimu kutoka Biblia kamili (KJV / SUV).",
    areasThemes: "Mada za saa",
    areasTopics: "Mada za mazungumzo",
    areasVerses: "mistari {count}",
    areasTotal: "maeneo {areas} · mistari {verses} yaliyochaguliwa",
    areasBack: "Maeneo yote",
    areasBrowseHint: "Gusa eneo kusoma mistari yote husika",
    areasShowing: "mistari {count}",
    homeHourLabel: "Saa {hour} · mstari wa saa hii",
    homeLoading: "Inapakia mstari wa saa hii…",
    homeChangesAt: "Mstari mpya saa {hour}:00",
    homePoolSize: "mistari {count} katika mada hii",
    homeVerseUnavailable: "Mstari haupatikani kwa saa hii. Jaribu tena.",
    homeSubtitle:
      "Mstari mmoja kila saa — upendo, matumaini, imani, usalama, msamaha, na zaidi. Hubadilika saa ikibadilika.",
    homeGoChat: "Ongea na Kingdom AI",
    installTitle: "Sakinisha Kingdom AI",
    installSubtitle:
      "Kiungo kimoja kwa iPhone na Android — ongeza kwenye skrini ya nyumbani.",
    installOneLink: "Kiungo kimoja kwa kila simu",
    installCopyLink: "Nakili kiungo",
    installShareLink: "Shiriki kiungo",
    installShareText: "Sakinisha Kingdom AI — Biblia na mwongozo kwenye simu yako.",
    installButton: "Sakinisha programu",
    installWorking: "Inasakinisha…",
    installDone: "Programu iko tayari kwenye skrini ya nyumbani.",
    installOpenApp: "Fungua Kingdom AI",
    installOpenBrowser: "Endelea kwenye kivinjari",
    installIosTitle: "iPhone / iPad",
    installIosSafariRequired:
      "Fungua kiungo hiki kwenye Safari ili kuongeza Kingdom AI kwenye skrini ya nyumbani.",
    installIosOpenSafari:
      "Nakili kiungo hapo juu, fungua Safari, bandika kwenye anwani, kisha nenda.",
    installIosStep1: "Gusa Share katika Safari (mraba na mshale chini).",
    installIosStep2: 'Sogeza chini na gusa "Add to Home Screen", kisha Add.',
    installAndroidTitle: "Android",
    installAndroidTapButton: "Gusa kitufe cha Sakinisha programu hapo juu.",
    installAndroidStep1: "Fungua kiungo hiki kwenye Chrome (au Samsung Internet / Edge).",
    installAndroidStep2:
      'Gusa Sakinisha — au menyu (⋮) → "Install app" / "Add to Home screen".',
    installAndroidStep3:
      "Thibitisha — Kingdom AI itafunguka kutoka skrini ya nyumbani kama programu.",
    installDesktopTitle: "Kwenye kompyuta",
    installDesktopHint:
      "Tuma kiungo hiki kwenye simu yako. Kinafanya kazi iPhone (Safari) na Android (Chrome).",
    installOfflineTitle: "Inafanya kazi bila mtandao",
    installOfflineHint:
      "Baada ya kutembelea mara moja ukiwa mtandaoni (ukurasa huu hufanya hivyo), Nyumbani, Historia, Maeneo, Mazungumzo, na Biblia kamili hufanya kazi bila intaneti.",
    installOfflinePreparing: "Inapakua Biblia na kurasa za programu kwa matumizi bila mtandao…",
    installOfflineReady: "Tayari bila mtandao — fungua kutoka skrini ya nyumbani wakati wowote",
    offlineBanner:
      "Nje ya mtandao — mistari ya kila saa, utafutaji wa mistari, na mwongozo bado vinafanya kazi.",
    notifyTitle: "Arifa za mstari kila saa",
    notifyHint:
      "Pokea arifa ya mstari mwanzoni mwa kila saa uliyochagua — hata app imefungwa (PWA + push). Inatumia sauti ya arifa ya simu.",
    notifyEnable: "Washa arifa za kila saa",
    notifyDisable: "Zima arifa",
    notifyWorking: "Inasasisha…",
    notifyActive: "Arifa za kila saa zimewashwa kwa saa ulizochagua.",
    notifyTestNow: "Tuma arifa ya majaribio sasa",
    notifyTestSent:
      "Jaribio limetumwa — gusa Nimesoma kwenye arifa ili kurekodi kasi yako ya kusoma.",
    notifyTestFailed:
      "Imeshindwa kuonyesha arifa. Sakinisha app, ruhusu arifa, na ufungue mara moja ukiwa mtandaoni.",
    notifyPushServerOff:
      "Push ya nyuma haijasanidiwa bado — arifa zinafanya kazi app imesakinishwa na imefunguliwa hivi karibuni.",
    notifyBackgroundReady:
      "Arifa za nyuma zimewashwa — utapokea mistari hata app imefungwa (washa tena arifa mara moja baada ya sasisho).",
    notifyReEnable:
      "Baada ya sasisho: zima arifa, kisha washa tena ili simu ijisajili kwa push ya nyuma.",
    notifySoundHint:
      "Sauti hutumia mlio wa arifa wa simu. Katika Mipangilio, ruhusu arifa na sauti kwa Kingdom AI.",
    reportPageTitle: "Ripoti za maendeleo",
    reportPageSubtitle:
      "Kasi ya kusoma kutoka arifa za mistari — gusa Nimesoma ukimaliza. Data inaanza ulipoanza kutumia programu.",
    reportEmpty: "Hakuna ripoti bado. Weka alama Nimesoma kwenye arifa za mistari.",
    reportUnit: "Kipindi",
    reportLapseAvg: "Wastani wa muda",
    reportScaleAvg: "Wastani wa kiwango",
    reportEvents: "Mistari iliyosomwa",
    reportWhatHappened: "Kilichotokea",
    reportNotePlaceholder: "Kipindi hiki kilikuwa maana gani kwako?",
    reportSubmit: "Wasilisha maelezo",
    reportSubmitted: "Maelezo yamehifadhiwa",
    reportCalendar: "Kasi ya kusoma kila siku",
    reportTrend: "Mwenendo wa ripoti",
    reportSince: "Kufuatilia tangu",
    reportOpen: "Fungua",
    reportRateHint:
      "Kiwango 0 (kahawia) = haijasomwa ndani ya saa. 1 (haraka) → 6+ (polepole).",
    reportCustomTitle: "Ripoti kwa muda wowote",
    reportFrom: "Kutoka",
    reportTo: "Hadi",
    reportGenerate: "Tengeneza ripoti",
    reportGenerated: "Ripoti iko tayari — angalia hapa chini.",
    reportNoActivity: "Hakuna arifa katika masafa haya bado.",
    reportUnread: "Haijasomwa",
    reportClose: "Funga",
    notifyDenied:
      "Arifa zimezuiwa. Ziruhusu katika mipangilio ya kivinjari au simu yako.",
    notifyPageTitle: "Arifa za mistari",
    notifyPageSubtitle:
      "Chagua saa unazotaka arifa ya mstari — inafanya kazi app imefungwa baada ya kusakinisha.",
    notifyPresetPrayer: "6 · 9 · 12 · 15 · 18",
    notifyPresetAll: "Kila saa",
    notifyInstallLink: "Weka arifa za kila saa",
    historyTitle: "Mstari kwa tarehe na saa",
    historySubtitle:
      "Tafuta saa moja au masafa (kutoka — hadi). Saa zilizopita tu; saa zijazo hazipatikani.",
    historyDate: "Tarehe",
    historyHour: "Saa",
    historyHourLabel: "Saa {hour}",
    historyModeSingle: "Moja",
    historyModeRange: "Masafa",
    historyFrom: "Kutoka",
    historyTo: "Hadi",
    historyLookUp: "Tafuta",
    historyRangeCount: "saa {count} katika masafa",
    historyRangeTruncated:
      "Inaonyesha {shown} kwanza kati ya {total} — punguza masafa.",
    historyRangeEmpty:
      "Hakuna saa zilizopita katika masafa hiyo. Rekebisha tarehe au saa.",
    historyCopyAll: "Nakili zote",
    historyCopiedAll: "Imenakiliwa",
    historyTodayLimit: "Leo: saa hadi {hour}:00 tu — si saa ijayo bado.",
    historyFutureDate: "Tarehe hiyo bado haijafika. Chagua leo au tarehe iliyopita.",
    historyNotifyHoursTitle: "Saa za arifa",
    historyNotifyHoursHint:
      "Gusa saa unazotaka arifa (mf. 6, 9, 12, 15, 18). Chaguo-msingi: 6 · 9 · 12 · 15 · 18.",
    historyBackHome: "Rudi kwenye saa ya sasa",
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
