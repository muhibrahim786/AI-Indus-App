"use client";

import { accentClasses } from "@/lib/accent";
import { ModelDef } from "@/lib/types";

interface ModelChipProps {
  model: ModelDef & { configured: boolean };
  selected: boolean;
  onToggle: () => void;
}

export default function ModelChip({ model, selected, onToggle }: ModelChipProps) {
  const accent = accentClasses[model.accent];

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={[
        "group flex items-center gap-2 rounded-full border px-4 py-2 font-body text-sm transition-all",
        selected
          ? `${accent.border} ${accent.bg} ${accent.text}`
          : "border-riverLine text-inkMuted hover:border-inkMuted/60 hover:text-ink",
      ].join(" ")}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full transition-opacity",
          accent.dot,
          selected ? "opacity-100" : "opacity-30",
        ].join(" ")}
      />
      <span className="font-medium">{model.label}</span>
      <span className="text-xs opacity-60">{model.description}</span>
      {!model.configured && (
        <span className="ml-1 rounded-full bg-riverLine px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-inkMuted">
          no key
        </span>
      )}
    </button>
  );
}
