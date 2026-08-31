import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const dataDir = path.join(root, "data");
const publicData = path.join(root, "public", "data");
mkdirSync(publicData, { recursive: true });

for (const file of ["kjv-index.json", "swahili-index.json"]) {
  copyFileSync(path.join(dataDir, file), path.join(publicData, file));
  console.log(`Copied ${file} → public/data/`);
}

const HOURLY = [
  { hour: 0, theme: "hope", ref: "Jeremiah 29:11" },
  { hour: 1, theme: "faith", ref: "Hebrews 11:1" },
  { hour: 2, theme: "love", ref: "1 Corinthians 13:4" },
  { hour: 3, theme: "peace", ref: "Philippians 4:7" },
  { hour: 4, theme: "forgiveness", ref: "Ephesians 4:32" },
  { hour: 5, theme: "strength", ref: "Isaiah 41:10" },
  { hour: 6, theme: "wisdom", ref: "Proverbs 3:5" },
  { hour: 7, theme: "joy", ref: "Nehemiah 8:10" },
  { hour: 8, theme: "trust", ref: "Proverbs 3:6" },
  { hour: 9, theme: "grace", ref: "Ephesians 2:8" },
  { hour: 10, theme: "mercy", ref: "Lamentations 3:23" },
  { hour: 11, theme: "comfort", ref: "2 Corinthians 1:3" },
  { hour: 12, theme: "love", ref: "John 3:16" },
  { hour: 13, theme: "hope", ref: "Romans 15:13" },
  { hour: 14, theme: "faith", ref: "Mark 11:22" },
  { hour: 15, theme: "courage", ref: "Joshua 1:9" },
  { hour: 16, theme: "forgiveness", ref: "Matthew 6:14" },
  { hour: 17, theme: "security", ref: "Psalms 91:1" },
  { hour: 18, theme: "guidance", ref: "Psalms 32:8" },
  { hour: 19, theme: "patience", ref: "Romans 12:12" },
  { hour: 20, theme: "peace", ref: "John 14:27" },
  { hour: 21, theme: "love", ref: "1 John 4:19" },
  { hour: 22, theme: "hope", ref: "Romans 5:5" },
  { hour: 23, theme: "faith", ref: "James 1:6" },
];

const THEME_LABELS = {
  love: { en: "Love", sw: "Upendo" },
  hope: { en: "Hope", sw: "Matumaini" },
  faith: { en: "Faith", sw: "Imani" },
  security: { en: "Security", sw: "Usalama" },
  forgiveness: { en: "Forgiveness", sw: "Msamaha" },
  strength: { en: "Strength", sw: "Nguvu" },
  wisdom: { en: "Wisdom", sw: "Hekima" },
  joy: { en: "Joy", sw: "Furaha" },
  trust: { en: "Trust", sw: "Kuamini" },
  grace: { en: "Grace", sw: "Neema" },
  mercy: { en: "Mercy", sw: "Rehema" },
  comfort: { en: "Comfort", sw: "Faraja" },
  courage: { en: "Courage", sw: "Ujasiri" },
  guidance: { en: "Guidance", sw: "Mwongozo" },
  patience: { en: "Patience", sw: "Subira" },
  peace: { en: "Peace", sw: "Amani" },
};

function loadIndex(locale) {
  const file = locale === "sw" ? "swahili-index.json" : "kjv-index.json";
  return JSON.parse(readFileSync(path.join(dataDir, file), "utf8"));
}

function normalizeScheduledRef(ref) {
  return ref.replace(/^Psalm\b/, "Psalms").replace(/\s+/g, " ").trim();
}

function findVerse(verses, ref, locale) {
  const normalized = normalizeScheduledRef(ref);

  if (locale === "sw") {
    const byEn = verses.find(
      (v) => v.refEn === normalized || v.refEn === ref,
    );
    if (byEn) return byEn;
  }

  return (
    verses.find((v) => v.ref === normalized || v.ref === ref) ?? null
  );
}

for (const locale of ["en", "sw"]) {
  const verses = loadIndex(locale);
  const slots = HOURLY.map((slot) => {
    const passage = findVerse(verses, slot.ref, locale);
    return {
      hour: slot.hour,
      theme: slot.theme,
      themeLabel: THEME_LABELS[slot.theme][locale],
      scheduledRef: slot.ref,
      passage: passage
        ? {
            ref: passage.ref,
            text: passage.text,
            ...(passage.refEn ? { refEn: passage.refEn } : {}),
          }
        : null,
    };
  });

  const out = path.join(publicData, `hourly-${locale}.json`);
  writeFileSync(out, JSON.stringify(slots));
  console.log(`Wrote ${out}`);
}

console.log("Offline data ready in public/data/");
