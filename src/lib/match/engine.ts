import type { EvidencedSkill, MatchInsight, PoWItem, PoWLevel } from "../types";
import { MATCH_CONFIG, scoreToBand } from "./config";

const LEVEL_PRIORITY: Record<PoWLevel, number> = {
  verified: 3,
  platform_earned: 2,
  self_declared: 1,
};

/**
 * Minimal, PII-free input sent to matching engine (PRD 13.3 & 13.6).
 * Never includes applicant name, faculty, photo, personal URLs, or Reliability Score.
 */
export interface MatchRuleInput {
  applicationId: string;
  roleSkills: string[];
  powItems: Pick<PoWItem, "id" | "level" | "title" | "summary" | "skills">[];
  llmMappedSkills?: Array<{ skill: string; evidenceIds: string[] }>;
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

export function computeRulesMatchInsight(input: MatchRuleInput): MatchInsight {
  const now = new Date().toISOString();
  const validEvidenceMap = new Map(input.powItems.map((item) => [item.id, item]));

  if (input.powItems.length === 0) {
    return {
      applicationId: input.applicationId,
      band: "limited",
      evidenced: [],
      missing: [...input.roleSkills],
      explanation: "No Proof-of-Work items were attached to this application snapshot.",
      source: "rules",
      model: null,
      status: "ok",
      generatedAt: now,
    };
  }

  const evidenced: EvidencedSkill[] = [];
  const missing: string[] = [];
  let totalScore = 0;

  for (const roleSkill of input.roleSkills) {
    const normalizedRoleSkill = normalizeToken(roleSkill);
    const matchingItems: PoWItem[] = [];

    // 1. Direct deterministic match on PoWItem.skills or title/summary tokens
    for (const item of input.powItems) {
      const hasDirectSkill = item.skills.some(
        (s) =>
          normalizeToken(s) === normalizedRoleSkill ||
          normalizeToken(s).includes(normalizedRoleSkill) ||
          normalizedRoleSkill.includes(normalizeToken(s))
      );
      if (hasDirectSkill) {
        matchingItems.push(item as PoWItem);
      }
    }

    // 2. Optional validated LLM normalization mappings (only valid evidenceIds accepted)
    if (input.llmMappedSkills) {
      for (const mapped of input.llmMappedSkills) {
        if (normalizeToken(mapped.skill) === normalizedRoleSkill) {
          for (const eid of mapped.evidenceIds) {
            const item = validEvidenceMap.get(eid);
            if (item && !matchingItems.some((m) => m.id === item.id)) {
              matchingItems.push(item as PoWItem);
            }
          }
        }
      }
    }

    if (matchingItems.length === 0) {
      missing.push(roleSkill);
      continue;
    }

    // Highest weight & level among matching evidence items
    let bestWeight = 0;
    let bestLevel: PoWLevel = "self_declared";
    for (const item of matchingItems) {
      const w = MATCH_CONFIG.evidenceWeights[item.level];
      if (
        w > bestWeight ||
        (w === bestWeight && LEVEL_PRIORITY[item.level] > LEVEL_PRIORITY[bestLevel])
      ) {
        bestWeight = w;
        bestLevel = item.level;
      }
    }

    totalScore += bestWeight;
    evidenced.push({
      skill: roleSkill,
      level: bestLevel,
      evidenceIds: matchingItems.map((m) => m.id),
    });
  }

  const coverage =
    input.roleSkills.length > 0 ? totalScore / input.roleSkills.length : 0;
  const band = scoreToBand(coverage);

  const verifiedCount = evidenced.filter(
    (e) => e.level === "verified" || e.level === "platform_earned"
  ).length;
  const selfDeclaredOnly = evidenced.length > 0 && verifiedCount === 0;

  let explanation = `${evidenced.length} of ${input.roleSkills.length} required role skills are evidenced in the snapshot`;
  if (verifiedCount > 0) {
    explanation += ` (${verifiedCount} verified).`;
  } else if (selfDeclaredOnly) {
    explanation += ` (all self-declared; review linked artifacts).`;
  } else {
    explanation += `.`;
  }

  if (missing.length > 0) {
    explanation += ` Missing evidence for: ${missing.slice(0, 3).join(", ")}.`;
  }

  return {
    applicationId: input.applicationId,
    band,
    evidenced,
    missing,
    explanation: explanation.slice(0, MATCH_CONFIG.llm.maxExplanationChars),
    source: "rules",
    model: null,
    status: "ok",
    generatedAt: now,
  };
}
