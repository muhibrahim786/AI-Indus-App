import { NextResponse } from "next/server";
import { pickJudgeProvider } from "@/lib/models";
import { callProvider } from "@/lib/providers";
import { buildJudgeSystemPrompt, buildJudgeUserPrompt } from "@/lib/judgePrompt";
import { DEMO_MODE } from "@/lib/demo";
import { VerdictRequestBody, VerdictResponse } from "@/lib/types";

function extractJson(raw: string): unknown {
  const cleaned = raw.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Judge did not return JSON");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function demoVerdict(results: VerdictRequestBody["results"]): VerdictResponse {
  const usable = results.filter((r) => !r.error && r.output);
  const winner = usable[0] ?? results[0];
  return {
    summary:
      "Demo verdict — the judge model isn't configured yet, so this is a placeholder showing the shape of a real verdict. Add a provider API key and unset DEMO_MODE to get a real comparison.",
    rankings: results.map((r, i) => ({
      id: r.id,
      label: r.label,
      score: r.error ? 0 : 7 - i,
      strength: r.error ? "—" : "Reads clearly and stays on topic.",
      weakness: r.error ? r.error : "Not evaluated in demo mode.",
    })),
    recommended: winner?.id ?? "",
    recommendedReason: "Demo mode picks the first non-error response. Configure a judge model for a real, text-grounded recommendation.",
    judge: "demo",
    demo: true,
  };
}

export async function POST(req: Request) {
  let body: VerdictRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = (body.prompt || "").trim();
  const results = Array.isArray(body.results) ? body.results : [];

  if (!prompt || results.length === 0) {
    return NextResponse.json({ error: "prompt and results are required" }, { status: 400 });
  }

  const judgeProvider = pickJudgeProvider();

  if (!judgeProvider) {
    if (DEMO_MODE) {
      return NextResponse.json(demoVerdict(results));
    }
    return NextResponse.json(
      { error: "No judge model is configured. Add at least one provider API key." },
      { status: 503 }
    );
  }

  const modelIds = results.map((r) => r.id);
  const system = buildJudgeSystemPrompt(modelIds);
  const userPrompt = buildJudgeUserPrompt(prompt, results);

  try {
    const { text } = await callProvider(judgeProvider, { system, prompt: userPrompt });
    const parsed = extractJson(text) as Omit<VerdictResponse, "judge">;

    if (!parsed.rankings || !Array.isArray(parsed.rankings)) {
      throw new Error("Judge response missing rankings");
    }

    const verdict: VerdictResponse = {
      ...parsed,
      judge: judgeProvider,
    };
    return NextResponse.json(verdict);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          "The judge model returned something we couldn't parse. Try again — this can happen occasionally with free-tier models.",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }
}
