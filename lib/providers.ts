import { ProviderId } from "./types";

const TIMEOUT_MS = 30_000;

async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fn(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

interface CallArgs {
  system?: string;
  prompt: string;
}

interface CallResult {
  text: string;
}

/** OpenAI — Chat Completions API */
async function callOpenAI({ system, prompt }: CallArgs): Promise<CallResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  if (!apiKey) throw new Error("not_configured");

  return withTimeout(async (signal) => {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
      signal,
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenAI ${res.status}: ${body.slice(0, 300)}`);
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? "";
    return { text };
  });
}

/** Anthropic — Messages API */
async function callAnthropic({ system, prompt }: CallArgs): Promise<CallResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
  if (!apiKey) throw new Error("not_configured");

  return withTimeout(async (signal) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        ...(system ? { system } : {}),
        messages: [{ role: "user", content: prompt }],
      }),
      signal,
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Anthropic ${res.status}: ${body.slice(0, 300)}`);
    }
    const data = await res.json();
    const text = (data?.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("\n");
    return { text };
  });
}

/** Google — Gemini generateContent API */
async function callGoogle({ system, prompt }: CallArgs): Promise<CallResult> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const model = process.env.GOOGLE_MODEL || "gemini-2.0-flash";
  if (!apiKey) throw new Error("not_configured");

  return withTimeout(async (signal) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(system
          ? { systemInstruction: { parts: [{ text: system }] } }
          : {}),
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
      signal,
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Google ${res.status}: ${body.slice(0, 300)}`);
    }
    const data = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.map((p: { text: string }) => p.text).join("\n") ?? "";
    return { text };
  });
}

/** Groq — OpenAI-compatible Chat Completions API, runs open models very fast */
async function callGroq({ system, prompt }: CallArgs): Promise<CallResult> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  if (!apiKey) throw new Error("not_configured");

  return withTimeout(async (signal) => {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
      signal,
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Groq ${res.status}: ${body.slice(0, 300)}`);
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? "";
    return { text };
  });
}

const CALLERS: Record<ProviderId, (args: CallArgs) => Promise<CallResult>> = {
  openai: callOpenAI,
  anthropic: callAnthropic,
  google: callGoogle,
  groq: callGroq,
};

export async function callProvider(provider: ProviderId, args: CallArgs): Promise<CallResult> {
  return CALLERS[provider](args);
}
