import { expandTopic } from "./expander";
import { buildContent } from "./builder";
import { STYLE_PROFILES, TONE_PROFILES, LENGTH_CONFIG } from "./styles";
import type { ScryvoxInput, ScryvoxOutput } from "./builder";
import type { WritingStyle, WritingTone, ContentLength, AudienceType } from "./styles";

export type { ScryvoxInput, ScryvoxOutput, WritingStyle, WritingTone, ContentLength, AudienceType };

export function generate(input: ScryvoxInput): ScryvoxOutput {
  const expansion = expandTopic(input.topic, input.variation);
  return buildContent(input, expansion);
}

export function getStyleOptions() {
  return Object.entries(STYLE_PROFILES).map(([key, profile]) => ({
    value: key as WritingStyle,
    label: profile.name,
    description: profile.description,
  }));
}

export function getToneOptions() {
  return Object.entries(TONE_PROFILES).map(([key, profile]) => ({
    value: key as WritingTone,
    label: profile.name,
    description: profile.description,
  }));
}

export function getLengthOptions() {
  return Object.entries(LENGTH_CONFIG).map(([key, config]) => ({
    value: key as ContentLength,
    label: config.label,
    targetWords: config.targetWords,
  }));
}
