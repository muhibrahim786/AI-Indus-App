export type ProviderId = "openai" | "anthropic" | "google" | "groq";

export interface ModelDef {
  id: string; // unique id used in the UI, e.g. "openai-gpt"
  provider: ProviderId;
  label: string; // display name, e.g. "GPT"
  description: string; // one-liner shown under the chip
  accent: string; // tailwind color class fragment used for this model's tag
}

export interface ModelResult {
  id: string;
  label: string;
  provider: ProviderId;
  output: string;
  latencyMs: number;
  wordCount: number;
  error?: string;
  configured: boolean;
  demo?: boolean;
}

export interface CompareRequestBody {
  prompt: string;
  modelIds: string[];
}

export interface VerdictRequestBody {
  prompt: string;
  results: { id: string; label: string; output: string; error?: string }[];
}

export interface VerdictRanking {
  id: string;
  label: string;
  score: number; // 0-10
  strength: string;
  weakness: string;
}

export interface VerdictResponse {
  summary: string;
  rankings: VerdictRanking[];
  recommended: string; // id of recommended model
  recommendedReason: string;
  judge: string; // which model/provider produced the verdict
  demo?: boolean;
}
