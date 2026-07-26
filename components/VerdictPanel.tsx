"use client";

import { accentClasses } from "@/lib/accent";
import { MODELS } from "@/lib/models";
import { VerdictResponse } from "@/lib/types";

interface VerdictPanelProps {
  verdict?: VerdictResponse;
  loading: boolean;
  error?: string;
  onRequest: () => void;
  disabled: boolean;
}

const PROVIDER_LABEL: Record<string, string> = {
  openai: "GPT",
  anthropic: "Claude",
  google: "Gemini",
  groq: "Llama (Groq)",
  demo: "Demo judge",
};

export default function VerdictPanel({ verdict, loading, error, onRequest, disabled }: VerdictPanelProps) {
  const sorted = verdict
    ? [...verdict.rankings].sort((a, b) => b.score - a.score)
    : [];

  return (
    <div className="animate-rise rounded-2xl border border-riverLine bg-riverDeep/70 p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl italic text-ink">The Verdict</h2>
          <p className="mt-1 font-body text-xs text-inkMuted">
            One model reads every answer above and has to pick a winner.
          </p>
        </div>
        {!verdict && (
          <button
            onClick={onRequest}
            disabled={disabled || loading}
            className="rounded-full bg-tide px-5 py-2 font-body text-sm font-medium text-riverNight transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Judging…" : "Get AI verdict"}
          </button>
        )}
        {verdict && (
          <span className="font-mono text-[11px] text-inkMuted">
            judged by {PROVIDER_LABEL[verdict.judge] ?? verdict.judge}
            {verdict.demo ? " (demo)" : ""}
          </span>
        )}
      </div>

      {loading && (
        <div className="space-y-2">
          <div className="h-3 w-3/4 animate-pulse rounded bg-riverLine" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-riverLine" />
        </div>
      )}

      {!loading && error && <p className="font-mono text-sm text-coral/90">{error}</p>}

      {!loading && verdict && (
        <div className="space-y-5">
          <p className="font-body text-sm leading-relaxed text-ink/90">{verdict.summary}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            {sorted.map((r) => {
              const model = MODELS.find((m) => m.id === r.id);
              const accent = model ? accentClasses[model.accent] : accentClasses.tide;
              const isWinner = r.id === verdict.recommended;
              return (
                <div
                  key={r.id}
                  className={[
                    "rounded-xl border p-4",
                    isWinner ? `${accent.border} ${accent.bg}` : "border-riverLine",
                  ].join(" ")}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2 font-body text-sm font-medium text-ink">
                      <span className={`h-1.5 w-1.5 rounded-full ${accent.dot}`} />
                      {r.label}
                      {isWinner && (
                        <span className="rounded-full bg-silt/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-silt">
                          winner
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-sm text-inkMuted">{r.score}/10</span>
                  </div>
                  <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-riverLine">
                    <div
                      className={`h-full rounded-full ${accent.dot}`}
                      style={{ width: `${Math.max(r.score, 0) * 10}%` }}
                    />
                  </div>
                  <p className="font-body text-xs text-ink/80">
                    <span className="text-tide">+</span> {r.strength}
                  </p>
                  <p className="mt-1 font-body text-xs text-ink/60">
                    <span className="text-coral">–</span> {r.weakness}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-silt/30 bg-silt/5 p-4">
            <p className="font-body text-xs uppercase tracking-wide text-silt">Recommended</p>
            <p className="mt-1 font-body text-sm text-ink/90">{verdict.recommendedReason}</p>
          </div>
        </div>
      )}
    </div>
  );
}
