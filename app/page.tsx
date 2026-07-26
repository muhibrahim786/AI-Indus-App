"use client";

import { useEffect, useMemo, useState } from "react";
import ModelChip from "@/components/ModelChip";
import ResultCard from "@/components/ResultCard";
import VerdictPanel from "@/components/VerdictPanel";
import HistoryPanel from "@/components/HistoryPanel";
import Confluence from "@/components/Confluence";
import { MODELS } from "@/lib/models";
import { ModelDef, ModelResult, VerdictResponse } from "@/lib/types";

export interface HistoryEntry {
  id: string;
  prompt: string;
  modelIds: string[];
  timestamp: number;
  results: ModelResult[];
  verdict?: VerdictResponse;
}

interface ConfigModel extends ModelDef {
  configured: boolean;
}

const HISTORY_KEY = "ai-indus-history";
const EXAMPLE_PROMPTS = [
  "Explain how vaccines work to a curious 12-year-old.",
  "Write a 4-line poem about waiting for a bus in the rain.",
  "Give me 3 tips to reduce a food delivery app's cart abandonment.",
  "What's the difference between weather and climate, in 2 sentences?",
];

export default function Home() {
  const [configModels, setConfigModels] = useState<ConfigModel[]>(
    MODELS.map((m) => ({ ...m, configured: true }))
  );
  const [demoMode, setDemoMode] = useState(false);
  const [judgeAvailable, setJudgeAvailable] = useState(true);
  const [configLoaded, setConfigLoaded] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(MODELS.map((m) => m.id));

  const [results, setResults] = useState<ModelResult[] | undefined>();
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [compareError, setCompareError] = useState<string | undefined>();

  const [verdict, setVerdict] = useState<VerdictResponse | undefined>();
  const [verdictLoading, setVerdictLoading] = useState(false);
  const [verdictError, setVerdictError] = useState<string | undefined>();

  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        setConfigModels(data.models);
        setDemoMode(data.demoMode);
        setJudgeAvailable(data.judgeAvailable);
        const configured = data.models
          .filter((m: ConfigModel) => m.configured)
          .map((m: ConfigModel) => m.id);
        setSelectedIds(configured.length > 0 ? configured : data.models.map((m: ConfigModel) => m.id));
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));

    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      /* ignore corrupt local storage */
    }
  }, []);

  const toggleModel = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const persistHistory = (entry: HistoryEntry) => {
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, 20);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        /* storage full or unavailable — fail silently */
      }
      return next;
    });
  };

  const runCompare = async () => {
    if (!prompt.trim() || selectedIds.length === 0 || loadingCompare) return;
    setCompareError(undefined);
    setVerdict(undefined);
    setVerdictError(undefined);
    setLoadingCompare(true);
    setResults(undefined);

    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, modelIds: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setResults(data.results);

      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        prompt,
        modelIds: selectedIds,
        timestamp: Date.now(),
        results: data.results,
      };
      persistHistory(entry);
    } catch (err) {
      setCompareError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoadingCompare(false);
    }
  };

  const runVerdict = async () => {
    if (!results || verdictLoading) return;
    setVerdictError(undefined);
    setVerdictLoading(true);
    try {
      const res = await fetch("/api/verdict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          results: results.map((r) => ({
            id: r.id,
            label: r.label,
            output: r.output,
            error: r.error,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setVerdict(data);

      setHistory((prev) => {
        const next = prev.map((h) =>
          h.prompt === prompt && h.modelIds.join() === selectedIds.join() && !h.verdict
            ? { ...h, verdict: data }
            : h
        );
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    } catch (err) {
      setVerdictError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setVerdictLoading(false);
    }
  };

  const loadEntry = (entry: HistoryEntry) => {
    setPrompt(entry.prompt);
    setSelectedIds(entry.modelIds);
    setResults(entry.results);
    setVerdict(entry.verdict);
    setCompareError(undefined);
    setVerdictError(undefined);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  const selectedModels = useMemo(
    () => MODELS.filter((m) => selectedIds.includes(m.id)),
    [selectedIds]
  );

  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-14 sm:px-8">
      {/* Hero */}
      <header className="mb-12">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-tide">
          one prompt · many currents
        </p>
        <h1 className="mt-3 font-display text-5xl italic tracking-tight text-ink sm:text-6xl">
          AI Indus
        </h1>
        <p className="mt-4 max-w-xl font-body text-sm leading-relaxed text-inkMuted sm:text-base">
          Send one prompt down every model at once. Watch where the answers split,
          where they agree, and let a judge model settle which one actually
          earned your trust.
        </p>
        {demoMode && (
          <p className="mt-3 inline-block rounded-full border border-silt/40 bg-silt/10 px-3 py-1 font-mono text-[11px] text-silt">
            demo mode is on — unconfigured models return sample text
          </p>
        )}
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
        {/* Main column */}
        <div>
          {/* Prompt form */}
          <div className="rounded-2xl border border-riverLine bg-riverDeep/70 p-5">
            <label htmlFor="prompt" className="sr-only">
              Your prompt
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask anything — explain a concept, draft a message, debug a snippet…"
              rows={4}
              className="w-full resize-none rounded-xl border border-riverLine bg-riverSurface/60 p-4 font-body text-sm text-ink placeholder:text-inkMuted focus:border-tide/50"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setPrompt(ex)}
                  className="rounded-full border border-riverLine px-3 py-1 font-body text-[11px] text-inkMuted transition-colors hover:border-tide/40 hover:text-tide"
                >
                  {ex.length > 40 ? ex.slice(0, 40) + "…" : ex}
                </button>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {configModels.map((model) => (
                <ModelChip
                  key={model.id}
                  model={model}
                  selected={selectedIds.includes(model.id)}
                  onToggle={() => toggleModel(model.id)}
                />
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <p className="font-mono text-[11px] text-inkMuted">
                {selectedIds.length} model{selectedIds.length === 1 ? "" : "s"} selected
              </p>
              <button
                onClick={runCompare}
                disabled={!prompt.trim() || selectedIds.length === 0 || loadingCompare}
                className="rounded-full bg-tide px-6 py-2.5 font-body text-sm font-medium text-riverNight transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loadingCompare ? "Comparing…" : "Compare"}
              </button>
            </div>

            {compareError && (
              <p className="mt-3 font-mono text-xs text-coral/90">{compareError}</p>
            )}
          </div>

          {/* Results */}
          {(loadingCompare || results) && (
            <>
              <Confluence count={selectedModels.length} direction="out" className="my-2" />
              <div className="grid gap-4 sm:grid-cols-2">
                {selectedModels.map((model) => (
                  <ResultCard
                    key={model.id}
                    model={model}
                    result={results?.find((r) => r.id === model.id)}
                    loading={loadingCompare}
                  />
                ))}
              </div>
            </>
          )}

          {/* Verdict */}
          {results && results.length > 0 && (
            <>
              <Confluence count={selectedModels.length} direction="in" className="my-2" />
              <VerdictPanel
                verdict={verdict}
                loading={verdictLoading}
                error={verdictError}
                onRequest={runVerdict}
                disabled={!judgeAvailable}
              />
              {!judgeAvailable && !verdict && (
                <p className="mt-2 font-mono text-[11px] text-inkMuted">
                  No judge model configured on the server yet — add one provider API key to enable verdicts.
                </p>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:pt-1">
          <div className="sticky top-8 rounded-2xl border border-riverLine bg-riverDeep/50 p-4">
            <HistoryPanel entries={history} onSelect={loadEntry} onClear={clearHistory} />
          </div>
        </aside>
      </div>

      <footer className="mt-20 border-t border-riverLine pt-6 font-mono text-[11px] text-inkMuted">
        AI Indus — built as an individual project. Add your own API keys to bring more currents in.
      </footer>
    </main>
  );
}
