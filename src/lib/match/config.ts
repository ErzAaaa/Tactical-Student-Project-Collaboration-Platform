import type { MatchBand, PoWLevel } from "../types";

/**
 * Configurable weights and thresholds for deterministic skill-fit scoring.
 * Kept in a single config file per PRD 13.6 so thresholds can be tuned without code changes.
 */
export const MATCH_CONFIG = {
  evidenceWeights: {
    verified: 1.0,
    platform_earned: 1.0,
    self_declared: 0.6,
  } satisfies Record<PoWLevel, number>,

  bandThresholds: {
    strong: 0.75,
    partial: 0.4,
  },

  llm: {
    timeoutMs: 8000,
    maxRetries: 1,
    temperature: 0.2,
    maxExplanationChars: 280,
  },
} as const;

export function scoreToBand(coverage: number): MatchBand {
  if (coverage >= MATCH_CONFIG.bandThresholds.strong) return "strong";
  if (coverage >= MATCH_CONFIG.bandThresholds.partial) return "partial";
  return "limited";
}
