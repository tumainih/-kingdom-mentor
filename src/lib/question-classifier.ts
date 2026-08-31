import { looksLikeVerseRequest } from "@/lib/bible/verse-lookup";

export type QuestionKind = "biblical" | "off-topic" | "greeting" | "verse";

const BIBLICAL_RE =
  /\b(god|jesus|christ|lord|holy spirit|bible|scripture|verse|church|pray|prayer|faith|sin|repent|forgive|marriage|husband|wife|adultery|fornicat|love|anger|worry|anxiet|fear|doubt|guilt|shame|hope|salvation|heaven|hell|devil|satan|tempt|obey|commandment|wisdom|righteous|mercy|grace|kingdom|disciple|pastor|worship|honest|lie|truth|humility|pride|neighbor|enemy|revenge|peace|comfort|grief|mourn|loss|death|work|money|rich|poor|covet|lust|divorce|parent|child|friend|betray|trust|lonely|depress|suicid|abuse|addict|alcohol|purpose|meaning|calling|will of god|spirit|soul|heart|conscience|moral|ethic|honor god|glorify|feel|felt|struggl|confused|broken|scared|decision|choose|advice|correct me|reflect|what should i|help me)\b/i;

const SW_BIBLICAL_RE =
  /\b(mungu|yesu|kristo|bwana|roho mtakatifu|biblia|maandiko|mstari|kanisa|omba|sala|imani|dhambi|toba|msamaha|samehe|ndoa|mume|mke|zina|upendo|hasira|wasiwasi|ogopa|hofu|shaka|hatia|aibu|matumaini|wokovu|mbingu|kuzimu|shetani|jaribu|tii|amri|hekima|haki|rehema|neema|ufalme|mwanafunzi|mchungaji|abudu|uaminifu|uongo|kweli|unyenyekevu|kiburi|jirani|adui|msamaha|amani|faraja|huzuni|kifo|kazi|pesa|maskini|tamaa|talaka|mzazi|mtoto|rafiki|umekwamisha|amini|upweke|huzuni|unachohisi|nina|nime|najisikia|msaada|ushauri|amua|chagua|nifanye|nifanyie|maamuzi|moyo|roho|kanuni|adili)\b/i;

/** Only block clearly non-biblical requests — never guess off-topic from length or language. */
const OFF_TOPIC_RE =
  /\b(weather|forecast|temperature|recipe|cook|ingredient|score|football|basketball|soccer|nba|nfl|stock|crypto|bitcoin|python|javascript|typescript|code|program|debug|sql|capital of|population|who won|movie|netflix|spotify|game cheat|homework|calculate|math problem|2\+2|translate this|write an essay|email template|resume|cover letter|hali ya hewa|mpira|mapishi|programu|kompyuta)\b/i;

const GREETING_RE =
  /^(hi|hello|hey|habari|jambo|hujambo|salamu|good morning|good evening|asante|thanks|thank you|ok|okay|yes|no|bye|goodbye|kwaheri|shikamoo|marahaba)[\s!.?,]*$/i;

const STORY_OR_BIBLE_RE =
  /\b(story|stories|tell me|hadithi|simulia|eleza|moses|musa|david|daudi|noah|nuhu|jesus|yesu|jonah|yona|daniel|danieli|joseph|yusufu|bible|biblia|scripture|maandiko|mstari)\b/i;

const LIFE_QUESTION_RE =
  /\b(why|how|what|should|can i|is it wrong|feel|doubt|hurt|wrong|right|advice|help|kwa nini|jinsi gani|nini|nifanye|je|naweza|umeku|nimekuwa|nina)\b/i;

export function classifyQuestion(text: string): QuestionKind {
  const trimmed = text.trim();
  if (!trimmed) return "biblical";

  if (GREETING_RE.test(trimmed)) return "greeting";
  if (looksLikeVerseRequest(trimmed)) return "verse";
  if (OFF_TOPIC_RE.test(trimmed)) return "off-topic";
  if (STORY_OR_BIBLE_RE.test(trimmed)) return "biblical";
  if (BIBLICAL_RE.test(trimmed) || SW_BIBLICAL_RE.test(trimmed)) return "biblical";
  if (LIFE_QUESTION_RE.test(trimmed)) return "biblical";

  return "biblical";
}
