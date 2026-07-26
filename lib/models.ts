import { ModelDef, ProviderId } from "./types";

/**
 * The starter lineup. Keep this list short on purpose (per the brief: "less LLMs
 * for now, broader later"). To add a model later: add a provider call in
 * providers.ts (if it's a new provider) and one entry here — nothing else
 * in the app needs to change, the UI reads this list dynamically.
 */
export const MODELS: ModelDef[] = [
  {
    id: "openai-gpt",
    provider: "openai",
    label: "GPT",
    description: "OpenAI",
    accent: "tide",
  },
  {
    id: "anthropic-claude",
    provider: "anthropic",
    label: "Claude",
    description: "Anthropic",
    accent: "silt",
  },
  {
    id: "google-gemini",
    provider: "google",
    label: "Gemini",
    description: "Google",
    accent: "orchid",
  },
  {
    id: "groq-llama",
    provider: "groq",
    label: "Llama (Groq)",
    description: "Meta, served by Groq",
    accent: "skyline",
  },
];

export function getModel(id: string): ModelDef | undefined {
  return MODELS.find((m) => m.id === id);
}

const ENV_KEY_NAMES: Record<ProviderId, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  google: "GOOGLE_API_KEY",
  groq: "GROQ_API_KEY",
};

export function envKeyNameFor(provider: ProviderId): string {
  return ENV_KEY_NAMES[provider];
}

export function isProviderConfigured(provider: ProviderId): boolean {
  return Boolean(process.env[ENV_KEY_NAMES[provider]]);
}

/** Priority order used to pick which configured provider acts as the judge. */
const JUDGE_PRIORITY: ProviderId[] = ["groq", "google", "anthropic", "openai"];

export function pickJudgeProvider(): ProviderId | null {
  const forced = process.env.JUDGE_PROVIDER as ProviderId | undefined;
  if (forced && isProviderConfigured(forced)) return forced;
  for (const p of JUDGE_PRIORITY) {
    if (isProviderConfigured(p)) return p;
  }
  return null;
}
