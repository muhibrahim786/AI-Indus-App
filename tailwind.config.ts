import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        riverNight: "#0B1220",
        riverDeep: "#111A2C",
        riverSurface: "#16233A",
        riverLine: "#233252",
        tide: "#34D8C4",
        tideDim: "#1F8F82",
        silt: "#E8AE4D",
        coral: "#F0654F",
        ink: "#EAF0F7",
        inkMuted: "#8FA0BC",
        orchid: "#B98CE8",
        skyline: "#5FB6E8",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-serif", "serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        grain: "radial-gradient(circle at 1px 1px, rgba(234,240,247,0.045) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};
export default config;
