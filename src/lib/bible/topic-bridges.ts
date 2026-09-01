import type { ContentAreaId } from "./content-areas";

export interface TopicBridge {
  /** Match user text (topic words, EN + SW where helpful). */
  match: RegExp;
  /** Curated verse pools to pull from when the topic has no direct keyword hit. */
  areas: ContentAreaId[];
  /** Extra full-text search terms (KJV-oriented; works across the index). */
  searchTerms: string[];
}

/**
 * Maps modern life topics to biblical themes and search expansions so retrieval
 * always finds relevant Scripture — even when the Bible never uses the word
 * "betting", "social media", etc.
 */
export const TOPIC_BRIDGES: TopicBridge[] = [
  {
    match:
      /\b(bet|betting|gambl|gamble|casino|lottery|wager|jackpot|poker|slot|sports\s+bet|bahati\s+nasibu|kamari|bashiri)\b/i,
    areas: ["wisdom", "guidance", "trust", "patience"],
    searchTerms: [
      "covet",
      "covetousness",
      "mammon",
      "treasure",
      "steward",
      "root of all evil",
      "love of money",
      "dishonest gain",
      "quick riches",
      "get rich",
      "temptation",
      "content",
      "contentment",
      "sluggard",
      "labour",
      "honest",
      "faithful",
    ],
  },
  {
    match: /\b(money|debt|loan|borrow|lend|rich|wealth|poor|financ|pesa|deni|kukopa)\b/i,
    areas: ["wisdom", "guidance", "trust"],
    searchTerms: [
      "mammon",
      "steward",
      "treasure",
      "covet",
      "owe no man",
      "borrower",
      "content",
      "provide",
      "diligent",
    ],
  },
  {
    match: /\b(lust|porn|adulter|fornicat|sex|tempt|tamaa|zina|uasherati)\b/i,
    areas: ["wisdom", "strength", "guidance", "guilt"],
    searchTerms: [
      "flee",
      "pure in heart",
      "lust",
      "adultery",
      "temptation",
      "self-control",
      "flesh",
      "sanctify",
    ],
  },
  {
    match: /\b(addict|alcohol|drunk|drug|sober|wine|ulevi|madawa)\b/i,
    areas: ["strength", "wisdom", "guidance", "patience"],
    searchTerms: [
      "sober",
      "temperance",
      "wine",
      "strong drink",
      "self-control",
      "body",
      "temple",
      "overcome",
    ],
  },
  {
    match: /\b(lie|lying|cheat|steal|honest|integrity|uongo|iba|dishonest)\b/i,
    areas: ["wisdom", "guidance", "guilt"],
    searchTerms: [
      "truth",
      "false witness",
      "lying lips",
      "honest",
      "integrity",
      "thou shalt not steal",
      "covet",
    ],
  },
  {
    match: /\b(revenge|hate|enemy|bitter|resent|msamaha|adui|chuki)\b/i,
    areas: ["forgiveness", "mercy", "patience", "love"],
    searchTerms: [
      "forgive",
      "vengeance",
      "enemy",
      "love your enemies",
      "wrath",
      "slow to anger",
    ],
  },
  {
    match: /\b(lonely|alone|isolat|upweke|peke)\b/i,
    areas: ["comfort", "hope", "love", "security"],
    searchTerms: [
      "never leave",
      "companion",
      "lonely",
      "comfort",
      "presence",
    ],
  },
  {
    match: /\b(purpose|meaning|calling|direction|maana|kusudi|lengo)\b/i,
    areas: ["guidance", "hope", "wisdom", "faith"],
    searchTerms: [
      "purpose",
      "plan",
      "path",
      "direct",
      "guide",
      "good works",
      "calling",
    ],
  },
];

export function detectTopicBridges(text: string): TopicBridge[] {
  const cleaned = text.trim();
  if (!cleaned) return [];
  return TOPIC_BRIDGES.filter((bridge) => bridge.match.test(cleaned));
}

export function bridgeAreas(text: string): ContentAreaId[] {
  const seen = new Set<ContentAreaId>();
  for (const bridge of detectTopicBridges(text)) {
    for (const area of bridge.areas) seen.add(area);
  }
  return [...seen];
}

export function bridgeSearchTerms(text: string): string[] {
  const terms = new Set<string>();
  for (const bridge of detectTopicBridges(text)) {
    for (const term of bridge.searchTerms) terms.add(term);
  }
  return [...terms];
}
