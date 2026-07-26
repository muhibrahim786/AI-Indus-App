import { NextResponse } from "next/server";
import { getModel, isProviderConfigured } from "@/lib/models";
import { callProvider } from "@/lib/providers";
import { DEMO_MODE, demoResponseFor } from "@/lib/demo";
import { CompareRequestBody, ModelResult } from "@/lib/types";

const MAX_PROMPT_LENGTH = 6000;

export async function POST(req: Request) {
  let body: CompareRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = (body.prompt || "").trim();
  const modelIds = Array.isArray(body.modelIds) ? body.modelIds : [];

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return NextResponse.json(
      { error: `Prompt is too long (max ${MAX_PROMPT_LENGTH} characters)` },
      { status: 400 }
    );
  }
  if (modelIds.length === 0) {
    return NextResponse.json({ error: "Select at least one model" }, { status: 400 });
  }

  const results: ModelResult[] = await Promise.all(
    modelIds.map(async (id): Promise<ModelResult> => {
      const model = getModel(id);
      if (!model) {
        return {
          id,
          label: id,
          provider: "openai",
          output: "",
          latencyMs: 0,
          wordCount: 0,
          error: "Unknown model id",
          configured: false,
        };
      }

      const configured = isProviderConfigured(model.provider);
      const start = Date.now();

      if (!configured) {
        if (DEMO_MODE) {
          return {
            id: model.id,
            label: model.label,
            provider: model.provider,
            output: demoResponseFor(model.provider),
            latencyMs: 400 + Math.round(Math.random() * 600),
            wordCount: demoResponseFor(model.provider).split(/\s+/).length,
            configured: false,
            demo: true,
          };
        }
        return {
          id: model.id,
          label: model.label,
          provider: model.provider,
          output: "",
          latencyMs: 0,
          wordCount: 0,
          error: "not_configured",
          configured: false,
        };
      }

      try {
        const { text } = await callProvider(model.provider, { prompt });
        return {
          id: model.id,
          label: model.label,
          provider: model.provider,
          output: text,
          latencyMs: Date.now() - start,
          wordCount: text.trim() ? text.trim().split(/\s+/).length : 0,
          configured: true,
        };
      } catch (err) {
        return {
          id: model.id,
          label: model.label,
          provider: model.provider,
          output: "",
          latencyMs: Date.now() - start,
          wordCount: 0,
          error: err instanceof Error ? err.message : "Unknown error",
          configured: true,
        };
      }
    })
  );

  return NextResponse.json({ results });
}
