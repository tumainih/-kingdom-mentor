export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface ScripturePassage {
  ref: string;
  text: string;
}

export const STARTER_PROMPTS = [
  "I'm struggling with forgiveness toward someone who hurt me deeply.",
  "Should I take this new job offer?",
  "Correct me — help me see if I'm wrong in how I'm handling this conflict.",
  "Pray with me about my anxiety about the future.",
  "Help me reflect on my day and where I honored or failed God.",
] as const;
