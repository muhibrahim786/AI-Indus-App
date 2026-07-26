"use client";

import { useState } from "react";
import { accentClasses } from "@/lib/accent";
import { ModelDef, ModelResult } from "@/lib/types";

interface ResultCardProps {
  model: ModelDef;
  result?: ModelResult;
  loading: boolean;
  highlighted?: boolean;
}

const ERROR_MESSAGES: Record<string, string> = {
  not_configured: "No API key configured for this model on the server.",
};

export default function ResultCard({ model, result, loading, highlighted }: ResultCardProps) {
  const [copied, setCopied] = useState(false);
  const accent = accentClasses[model.accent];

  const handleCopy = async () => {
    if (!result?.output) return;
    await navigator.clipboard.writeText(result.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={[
        "animate-rise flex min-h-[220px] flex-col rounded-2xl border bg-riverDeep/70 p-4 transition-shadow",
        highlighted ? `${accent.border} shadow-[0_0_0_1px] ${accent.ring}` : "border-riverLine",
      ].join(" ")}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${accent.dot}`} />
          <span className="font-body text-sm font-medium text-ink">{model.label}</span>
          {result?.demo && (
            <span className="rounded-full bg-riverLine px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-inkMuted">
              demo
            </span>
          )}
        </div>
        {result && !result.error && (
          <div className="flex items-center gap-2 text-[11px] text-inkMuted">
            <span>{result.wordCount}w</span>
            <span>·</span>
            <span>{(result.latencyMs / 1000).toFixed(1)}s</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="space-y-2">
            <div className="h-3 w-5/6 animate-pulse rounded bg-riverLine" />
            <div className="h-3 w-full animate-pulse rounded bg-riverLine" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-riverLine" />
          </div>
        )}

        {!loading && result?.error && (
          <p className="font-mono text-sm text-coral/90">
            {ERROR_MESSAGES[result.error] ?? result.error}
          </p>
        )}

        {!loading && result && !result.error && (
          <p className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-ink/90">
            {result.output}
          </p>
        )}

        {!loading && !result && (
          <p className="font-mono text-sm text-inkMuted">Waiting for a prompt…</p>
        )}
      </div>

      {result && !result.error && result.output && (
        <button
          onClick={handleCopy}
          className="mt-3 self-start font-body text-xs text-inkMuted transition-colors hover:text-tide"
        >
          {copied ? "Copied" : "Copy response"}
        </button>
      )}
    </div>
  );
}
