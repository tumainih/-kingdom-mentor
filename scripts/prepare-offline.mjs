import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const dataDir = path.join(root, "data");
const publicData = path.join(root, "public", "data");
const poolsSrc = path.join(dataDir, "verse-pools");
const poolsPublic = path.join(publicData, "pools");

mkdirSync(publicData, { recursive: true });
mkdirSync(poolsPublic, { recursive: true });

for (const file of ["kjv-index.json", "swahili-index.json"]) {
  copyFileSync(path.join(dataDir, file), path.join(publicData, file));
  console.log(`Copied ${file} → public/data/`);
}

for (const file of readdirSync(poolsSrc)) {
  copyFileSync(path.join(poolsSrc, file), path.join(poolsPublic, file));
}
console.log(`Copied verse pools → public/data/pools/`);

const HOURLY = [
  { hour: 0, theme: "hope" },
  { hour: 1, theme: "faith" },
  { hour: 2, theme: "love" },
  { hour: 3, theme: "peace" },
  { hour: 4, theme: "forgiveness" },
  { hour: 5, theme: "strength" },
  { hour: 6, theme: "wisdom" },
  { hour: 7, theme: "joy" },
  { hour: 8, theme: "trust" },
  { hour: 9, theme: "grace" },
  { hour: 10, theme: "mercy" },
  { hour: 11, theme: "comfort" },
  { hour: 12, theme: "love" },
  { hour: 13, theme: "hope" },
  { hour: 14, theme: "faith" },
  { hour: 15, theme: "courage" },
  { hour: 16, theme: "forgiveness" },
  { hour: 17, theme: "security" },
  { hour: 18, theme: "guidance" },
  { hour: 19, theme: "patience" },
  { hour: 20, theme: "peace" },
  { hour: 21, theme: "love" },
  { hour: 22, theme: "hope" },
  { hour: 23, theme: "faith" },
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

function hashSeed(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickPoolIndex(seed, length) {
  if (length <= 0) return 0;
  return hashSeed(seed) % length;
}

function hourlyPoolSeed(areaId, date, hour) {
  return `${areaId}:${date}:${hour}`;
}

function normalizeRef(ref) {
  return ref.replace(/^Psalm\b/, "Psalms").replace(/\s+/g, " ").trim();
}

function loadIndex(locale) {
  const file = locale === "sw" ? "swahili-index.json" : "kjv-index.json";
  return JSON.parse(readFileSync(path.join(dataDir, file), "utf8"));
}

function loadPoolRefs(theme) {
  const raw = JSON.parse(
    readFileSync(path.join(poolsSrc, `${theme}.json`), "utf8"),
  );
  return raw.refs.map(normalizeRef);
}

function findVerse(verses, ref, locale) {
  const normalized = normalizeRef(ref);
  if (locale === "sw") {
    const byEn = verses.find(
      (v) => v.refEn === normalized || v.refEn === ref,
    );
    if (byEn) return byEn;
  }
  return verses.find((v) => v.ref === normalized || v.ref === ref) ?? null;
}

function localDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const today = localDateString();

writeFileSync(
  path.join(publicData, "hourly-schedule.json"),
  JSON.stringify(HOURLY),
);
console.log("Wrote hourly-schedule.json");

for (const locale of ["en", "sw"]) {
  const verses = loadIndex(locale);
  const slots = HOURLY.map((slot) => {
    const refs = loadPoolRefs(slot.theme);
    const seed = hourlyPoolSeed(slot.theme, today, slot.hour);
    const scheduledRef = refs[pickPoolIndex(seed, refs.length)] ?? refs[0];
    const passage = findVerse(verses, scheduledRef, locale);

    return {
      hour: slot.hour,
      theme: slot.theme,
      themeLabel: THEME_LABELS[slot.theme][locale],
      scheduledRef,
      date: today,
      poolSize: refs.length,
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
  console.log(`Wrote ${out} (${today})`);
}

console.log("Offline data ready in public/data/");
