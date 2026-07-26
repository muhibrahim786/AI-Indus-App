import { ProviderId } from "./types";

export const DEMO_MODE = process.env.DEMO_MODE === "true";

const DEMO_TEXT: Record<ProviderId, string> = {
  openai:
    "Photosynthesis is the process plants use to turn sunlight into chemical energy. " +
    "Chlorophyll in the leaves absorbs light, which powers a reaction that combines " +
    "carbon dioxide and water into glucose, releasing oxygen as a byproduct. In short: " +
    "light in, sugar and oxygen out.",
  anthropic:
    "Plants photosynthesize by capturing light energy in chloroplasts, primarily through " +
    "the pigment chlorophyll. That energy drives two linked stages — the light reactions, " +
    "which split water and release oxygen, and the Calvin cycle, which fixes CO2 into " +
    "glucose. The glucose fuels the plant's growth.",
  google:
    "Photosynthesis converts light energy into stored chemical energy. Inside the " +
    "chloroplast, sunlight excites electrons in chlorophyll, triggering a chain of " +
    "reactions that pull carbon dioxide from the air and hydrogen from water to build " +
    "glucose, with oxygen released as a side effect.",
  groq:
    "Simple version: leaves catch sunlight, mix it with CO2 from the air and water from " +
    "the roots, and turn it into sugar the plant eats — oxygen comes out as the leftover. " +
    "That's photosynthesis.",
};

export function demoResponseFor(provider: ProviderId): string {
  return DEMO_TEXT[provider];
}
