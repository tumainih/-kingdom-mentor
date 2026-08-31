export type QuestionKind = "biblical" | "off-topic" | "greeting";

const BIBLICAL_RE =
  /\b(god|jesus|christ|lord|holy spirit|bible|scripture|verse|church|pray|prayer|faith|sin|repent|forgive|marriage|husband|wife|adultery|fornicat|love|anger|worry|anxiet|fear|doubt|guilt|shame|hope|salvation|heaven|hell|devil|satan|tempt|obey|commandment|wisdom|righteous|mercy|grace|kingdom|disciple|pastor|worship|honest|lie|truth|humility|pride|neighbor|enemy|revenge|peace|comfort|grief|mourn|loss|death|work|money|rich|poor|covet|lust|divorce|parent|child|friend|betray|trust|lonely|depress|suicid|abuse|addict|alcohol|purpose|meaning|calling|will of god|spirit|soul|heart|conscience|moral|ethic|honor god|glorify|feel|felt|struggl|confused|broken|scared|decision|choose|advice|correct me|reflect|what should i|help me)\b/i;

const OFF_TOPIC_RE =
  /\b(weather|forecast|temperature|recipe|cook|ingredient|score|football|basketball|soccer|nba|nfl|stock|crypto|bitcoin|python|javascript|typescript|code|program|debug|sql|capital of|population|who won|movie|netflix|spotify|game cheat|homework|calculate|math problem|2\+2|translate this|write an essay|email template|resume|cover letter)\b/i;

const GREETING_RE =
  /^(hi|hello|hey|habari|jambo|hujambo|good morning|good evening|asante|thanks|thank you|ok|okay|yes|no|bye|goodbye|kwaheri)[\s!.?,]*$/i;

const STORY_OR_BIBLE_RE =
  /\b(story|stories|tell me|hadithi|simulia|moses|musa|david|daudi|noah|nuhu|jesus|yesu|jonah|yona|daniel|danieli|joseph|yusufu|bible|biblia|scripture|maandiko)\b/i;

export function classifyQuestion(text: string): QuestionKind {
  const trimmed = text.trim();
  if (!trimmed) return "off-topic";

  if (GREETING_RE.test(trimmed)) return "greeting";
  if (OFF_TOPIC_RE.test(trimmed)) return "off-topic";
  if (STORY_OR_BIBLE_RE.test(trimmed)) return "biblical";
  if (BIBLICAL_RE.test(trimmed)) return "biblical";

  // Life/emotional phrasing → biblical mentor territory
  if (
    /\b(why|how|what|should|can i|is it wrong|feel|doubt|hurt|wrong|right|advice|help)\b/i.test(
      trimmed,
    )
  ) {
    return "biblical";
  }

  // Very short generic questions without faith/life signals
  if (trimmed.length < 40) return "off-topic";

  return "biblical";
}
