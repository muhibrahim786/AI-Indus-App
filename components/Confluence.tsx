"use client";

interface ConfluenceProps {
  count: number;
  direction: "out" | "in";
  className?: string;
}

/**
 * The app's signature motif: one prompt forks into N model streams ("out"),
 * and later those streams reconverge into a single verdict ("in"). Purely
 * decorative, but it's the visual argument for why the app exists.
 */
export default function Confluence({ count, direction, className = "" }: ConfluenceProps) {
  const n = Math.max(count, 1);
  const spread = Math.min(80, 14 * n);
  const startX = 50 - spread / 2;
  const step = n > 1 ? spread / (n - 1) : 0;
  const points = Array.from({ length: n }, (_, i) => startX + step * i);

  const paths = points.map((x, i) => {
    const midX = (50 + x) / 2;
    return direction === "out"
      ? `M 50 0 Q ${midX} 22 ${x} 44`
      : `M ${x} 0 Q ${midX} 22 50 44`;
  });

  return (
    <svg
      viewBox="0 0 100 44"
      preserveAspectRatio="none"
      className={`w-full h-10 ${className}`}
      aria-hidden="true"
    >
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="#34D8C4"
          strokeWidth="0.5"
          strokeOpacity={0.35 + (0.3 * i) / Math.max(points.length - 1, 1)}
          className="flow-path"
        />
      ))}
      <circle
        cx="50"
        cy={direction === "out" ? 0 : 44}
        r="1.1"
        fill="#34D8C4"
      />
    </svg>
  );
}
