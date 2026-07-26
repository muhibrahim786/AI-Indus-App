"use client";

import { HistoryEntry } from "@/app/page";

interface HistoryPanelProps {
  entries: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onClear: () => void;
}

export default function HistoryPanel({ entries, onSelect, onClear }: HistoryPanelProps) {
  if (entries.length === 0) {
    return (
      <p className="font-body text-xs text-inkMuted">
        Your past comparisons will show up here — stored only in this browser.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-body text-xs uppercase tracking-wide text-inkMuted">Recent</p>
        <button onClick={onClear} className="font-body text-xs text-inkMuted hover:text-coral">
          Clear
        </button>
      </div>
      <ul className="space-y-2">
        {entries.map((entry) => (
          <li key={entry.id}>
            <button
              onClick={() => onSelect(entry)}
              className="w-full rounded-lg border border-riverLine px-3 py-2 text-left transition-colors hover:border-tide/50 hover:bg-riverSurface"
            >
              <p className="line-clamp-2 font-body text-xs text-ink/90">{entry.prompt}</p>
              <p className="mt-1 font-mono text-[10px] text-inkMuted">
                {new Date(entry.timestamp).toLocaleString()} · {entry.modelIds.length} models
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
