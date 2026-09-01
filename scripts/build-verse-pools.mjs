import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const dataDir = path.join(root, "data");
const poolsDir = path.join(dataDir, "verse-pools");
mkdirSync(poolsDir, { recursive: true });

/** @type {Record<string, { phrases: string[]; words: string[]; secondary?: string[]; exclude?: string[] }>} */
const AREA_RULES = {
  love: {
    phrases: [
      "love one another",
      "loved us",
      "love of god",
      "charity",
      "beloved",
      "god is love",
      "love thy neighbour",
      "love thy neighbor",
    ],
    words: ["love", "loveth", "loved", "beloved", "charity"],
  },
  hope: {
    phrases: [
      "hope in",
      "hope of",
      "hope and",
      "living hope",
      "hope maketh",
      "anchor of the soul",
      "hope toward",
      "hope of the glory",
    ],
    words: ["hope", "hopeful"],
    secondary: [
      "promise",
      "promised",
      "salvation",
      "everlasting",
      "inheritance",
      "restore",
      "renew",
      "expectation",
      "wait on the lord",
    ],
  },
  faith: {
    phrases: [
      "by faith",
      "through faith",
      "faith in",
      "faith of",
      "without faith",
      "measure of faith",
      "just shall live by faith",
    ],
    words: ["faith", "believe", "believeth", "believed", "believing"],
  },
  security: {
    phrases: [
      "shadow of the almighty",
      "secret place",
      "refuge and strength",
      "fortress",
      "deliver thee",
      "keep thee",
      "hide me",
      "under his wings",
      "no evil shall",
    ],
    words: ["refuge", "protect", "deliver", "fortress", "shelter"],
  },
  forgiveness: {
    phrases: [
      "forgive us",
      "forgive them",
      "forgive one another",
      "forgiven you",
      "forgiven him",
      "forgiven sins",
      "forgive trespasses",
      "forgive debts",
      "forgive their iniquity",
      "blot out",
    ],
    words: ["forgive", "forgiven", "forgiveness", "forgiving", "pardon"],
    secondary: [
      "mercy",
      "merciful",
      "blot",
      "cleanse",
      "wash",
      "iniquity",
      "transgression",
      "atonement",
      "reconcile",
      "remission",
      "trespass",
    ],
  },
  strength: {
    phrases: [
      "strengthen thee",
      "strengthened with",
      "be strong",
      "strong in the lord",
      "power of god",
      "power of christ",
    ],
    words: ["strength", "strong", "strengthen", "mighty", "power"],
  },
  wisdom: {
    phrases: [
      "wisdom of",
      "get wisdom",
      "understanding heart",
      "words of wisdom",
      "spirit of wisdom",
    ],
    words: ["wisdom", "wise", "understanding", "prudent", "instruction"],
  },
  joy: {
    phrases: [
      "joy of the lord",
      "rejoice in",
      "rejoice evermore",
      "joyful in",
      "joy and peace",
    ],
    words: ["joy", "joyful", "rejoice", "glad", "gladness", "delight"],
  },
  trust: {
    phrases: [
      "trust in the lord",
      "trust in him",
      "trust in god",
      "lean not unto thine own understanding",
      "commit thy way",
    ],
    words: ["trust", "trusted", "trusteth", "confidence"],
  },
  grace: {
    phrases: [
      "grace of god",
      "grace of our lord",
      "saved by grace",
      "grace wherein",
      "grace to help",
    ],
    words: ["grace", "gracious", "favour", "favor"],
  },
  mercy: {
    phrases: [
      "mercy of god",
      "mercy and truth",
      "tender mercies",
      "great mercy",
      "mercy endureth",
    ],
    words: ["mercy", "merciful", "compassion", "pitiful"],
  },
  comfort: {
    phrases: [
      "comforted us",
      "comfort ye",
      "god of all comfort",
      "comfort my people",
      "consolation in",
      "bind up the brokenhearted",
    ],
    words: ["comfort", "comforted", "consolation", "consolations"],
    secondary: [
      "encourage",
      "strengthen",
      "uphold",
      "help",
      "heal",
      "brokenhearted",
      "sorrow",
      "affliction",
      "trouble",
      "refuge",
      "rest",
      "peace",
    ],
  },
  courage: {
    phrases: [
      "fear not",
      "be not afraid",
      "be strong and of a good courage",
      "good courage",
      "be of good cheer",
      "be not dismayed",
      "be of good courage",
    ],
    words: ["courage", "courageous", "bold", "boldly"],
    secondary: ["valiant", "mighty", "strong", "strengthen", "confident"],
  },
  guidance: {
    phrases: [
      "lead me",
      "lead thee",
      "guide thee",
      "guide me",
      "paths of righteousness",
      "shepherd",
      "direct thy paths",
      "lamp unto my feet",
    ],
    words: ["guide", "guidance", "lead", "direct", "shepherd"],
  },
  patience: {
    phrases: [
      "wait on the lord",
      "patient in tribulation",
      "longsuffering",
      "endure afflictions",
      "run with patience",
      "wait patiently",
    ],
    words: ["patience", "patient", "longsuffering", "endure", "enduring"],
    secondary: ["wait", "persever", "steadfast", "continu", "abide"],
  },
  peace: {
    phrases: [
      "peace of god",
      "peace i leave",
      "peace with god",
      "peace be unto",
      "perfect peace",
      "peace that passeth",
    ],
    words: ["peace", "peaceful", "quietness"],
  },
  anger: {
    phrases: [
      "slow to anger",
      "wrath of man",
      "wrath of god",
      "provoke not",
      "cease from anger",
    ],
    words: ["anger", "angry", "wrath", "wrathful", "provoke"],
    exclude: ["slow to anger"],
  },
  fear: {
    phrases: [
      "fear not",
      "be not afraid",
      "be not dismayed",
      "anxiety",
      "cast all your care",
      "trouble not",
    ],
    words: ["afraid", "fearful", "dismayed", "trouble", "anxious"],
    exclude: ["fear not", "be not afraid", "fear god", "fear the lord"],
  },
  marriage: {
    phrases: [
      "husband and wife",
      "husband love",
      "wife of thy youth",
      "one flesh",
      "marriage is honourable",
    ],
    words: ["husband", "wife", "marriage", "married", "bride", "bridegroom"],
  },
  prayer: {
    phrases: [
      "pray without ceasing",
      "prayer of faith",
      "effectual fervent prayer",
      "continue in prayer",
      "ask in prayer",
    ],
    words: ["pray", "prayer", "prayers", "praying", "supplication", "intercession"],
  },
  doubt: {
    phrases: [
      "doubt not",
      "doubted in",
      "ye of little faith",
      "wavering",
      "unbelief",
      "if ye have faith",
      "why are ye fearful",
      "oh ye of little faith",
      "if thou wouldest believe",
    ],
    words: ["doubt", "doubted", "doubting", "waver", "unbelief"],
    secondary: [
      "believe not",
      "faithless",
      "stagger",
      "wavering",
      "hardness of heart",
      "hardened",
      "question",
      "faith",
      "believe",
      "trust",
      "rebel",
      "stubborn",
      "obstinate",
      "prove",
      "tempt",
      "temptation",
      "fearful",
      "little faith",
    ],
  },
  guilt: {
    phrases: [
      "repent ye",
      "repent and",
      "confess your sins",
      "if we confess",
      "forgive us our sins",
      "turn from their wicked",
    ],
    words: ["guilty", "guilt", "repent", "repentance", "confess", "sin", "sins"],
  },
  grief: {
    phrases: [
      "comfort them",
      "mourning into joy",
      "weep with",
      "sorrow not",
      "tears from their eyes",
    ],
    words: ["grief", "grieve", "mourn", "mourning", "sorrow", "weep", "weeping"],
  },
};

const MIN_POOL_SIZE = 200;
const TARGET_POOL_SIZE = 300;

const kjv = JSON.parse(
  readFileSync(path.join(dataDir, "kjv-index.json"), "utf8"),
);

function normalizeRef(ref) {
  return ref.replace(/^Psalm\b/, "Psalms").replace(/\s+/g, " ").trim();
}

function scoreVerse(text, rules) {
  const lower = text.toLowerCase();
  let score = 0;

  if (rules.exclude) {
    for (const ex of rules.exclude) {
      if (lower.includes(ex.toLowerCase())) return -1;
    }
  }

  for (const phrase of rules.phrases) {
    if (lower.includes(phrase.toLowerCase())) score += 5;
  }

  for (const word of rules.words) {
    const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(lower)) score += 2;
  }

  if (rules.secondary) {
    for (const word of rules.secondary) {
      if (lower.includes(word.toLowerCase())) score += 1;
    }
  }

  return score;
}

/** @type {{ areas: Array<{ id: string; labelEn: string; labelSw: string; count: number; kind: string }> }} */
const index = { areas: [] };

const LABELS = {
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
  anger: { en: "Anger", sw: "Hasira" },
  fear: { en: "Fear & Anxiety", sw: "Hofu na Wasiwasi" },
  marriage: { en: "Marriage", sw: "Ndoa" },
  prayer: { en: "Prayer", sw: "Sala" },
  doubt: { en: "Doubt", sw: "Shaka" },
  guilt: { en: "Guilt & Repentance", sw: "Hatia na Toba" },
  grief: { en: "Grief", sw: "Huzuni" },
};

const HOURLY_IDS = new Set([
  "love", "hope", "faith", "security", "forgiveness", "strength", "wisdom",
  "joy", "trust", "grace", "mercy", "comfort", "courage", "guidance",
  "patience", "peace",
]);

for (const [areaId, rules] of Object.entries(AREA_RULES)) {
  const scored = [];

  for (const verse of kjv) {
    const s = scoreVerse(verse.text, rules);
    if (s > 0) {
      scored.push({ ref: normalizeRef(verse.ref), score: s });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.ref.localeCompare(b.ref));

  let refs = scored.map((v) => v.ref);

  if (refs.length < MIN_POOL_SIZE) {
    console.warn(
      `⚠ ${areaId}: only ${refs.length} verses matched — relaxing to secondary keywords`,
    );
    const relaxed = [];
    const allTerms = [
      ...rules.words,
      ...(rules.secondary ?? []),
    ];
    for (const verse of kjv) {
      const lower = verse.text.toLowerCase();
      const hit = allTerms.some((w) => lower.includes(w.toLowerCase()));
      if (hit) relaxed.push(normalizeRef(verse.ref));
    }
    refs = [...new Set([...refs, ...relaxed])];
  }

  refs = refs.slice(0, Math.max(MIN_POOL_SIZE, Math.min(refs.length, TARGET_POOL_SIZE)));

  if (refs.length < MIN_POOL_SIZE) {
    throw new Error(
      `${areaId}: pool has ${refs.length} verses (need at least ${MIN_POOL_SIZE})`,
    );
  }

  writeFileSync(
    path.join(poolsDir, `${areaId}.json`),
    JSON.stringify({ id: areaId, refs }, null, 0),
  );

  index.areas.push({
    id: areaId,
    labelEn: LABELS[areaId].en,
    labelSw: LABELS[areaId].sw,
    count: refs.length,
    kind: HOURLY_IDS.has(areaId) ? "theme" : "topic",
  });

  console.log(`✓ ${areaId}: ${refs.length} verses`);
}

writeFileSync(path.join(poolsDir, "index.json"), JSON.stringify(index, null, 2));
console.log(`\nWrote ${index.areas.length} pools to data/verse-pools/`);
