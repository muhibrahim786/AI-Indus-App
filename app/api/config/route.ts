import { NextResponse } from "next/server";
import { MODELS, isProviderConfigured, pickJudgeProvider } from "@/lib/models";
import { DEMO_MODE } from "@/lib/demo";

export async function GET() {
  const models = MODELS.map((m) => ({
    ...m,
    configured: isProviderConfigured(m.provider),
  }));
  return NextResponse.json({
    models,
    demoMode: DEMO_MODE,
    judgeAvailable: Boolean(pickJudgeProvider()) || DEMO_MODE,
  });
}
