import { NextResponse } from "next/server";
import { MATCH_CONFIG } from "@/lib/match/config";
import { computeRulesMatchInsight } from "@/lib/match/engine";
import type { PoWItem } from "@/lib/types";

interface MatchRequestBody {
  applicationId: string;
  roleSkills: string[];
  powItems: Pick<PoWItem, "id" | "level" | "title" | "summary" | "skills">[];
  pitch?: string;
}

interface LlmMatchResponse {
  skills?: Array<{ skill: string; evidenceIds: string[] }>;
  explanation?: string;
  caveats?: string;
}

async function callLlmWithRetry(
  body: MatchRequestBody
): Promise<{ parsed: LlmMatchResponse; model: string } | null> {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) return null;

  const baseUrl = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.LLM_MODEL || "gpt-4o-mini";

  // PII-free prompt payload per PRD 13.3 & 13.7 (no name, faculty, photo, URLs, or reliability)
  const sanitizedInput = {
    roleSkills: body.roleSkills,
    evidenceItems: body.powItems.map((item) => ({
      evidenceId: item.id,
      level: item.level,
      title: item.title,
      summary: item.summary,
      skills: item.skills,
    })),
    pitch: (body.pitch ?? "").slice(0, 300),
  };

  const systemPrompt = [
    "You are a technical skill-matching assistant for student project teams.",
    "Rules:",
    "1. Use ONLY the provided evidenceItems and pitch. Never infer from names, faculties, or writing style.",
    "2. Map free-text phrases to the exact roleSkills vocabulary and cite valid evidenceId strings.",
    "3. Write a concise 1-3 sentence explanation in English (max 280 chars). Note clearly if evidence is missing or only self_declared.",
    "4. NEVER recommend accepting or declining the applicant.",
    '5. Output strict JSON only: {"skills":[{"skill":"...","evidenceIds":["..."]}],"explanation":"...","caveats":"..."}',
  ].join("\n");

  for (let attempt = 0; attempt <= MATCH_CONFIG.llm.maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      MATCH_CONFIG.llm.timeoutMs
    );

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: MATCH_CONFIG.llm.temperature,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify(sanitizedInput) },
          ],
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);
      if (!response.ok) continue;

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content;
      if (!content) continue;

      const parsed = JSON.parse(content) as LlmMatchResponse;
      return { parsed, model };
    } catch {
      clearTimeout(timer);
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MatchRequestBody;
    if (!body.applicationId || !Array.isArray(body.roleSkills)) {
      return NextResponse.json(
        { error: "Invalid match request payload" },
        { status: 400 }
      );
    }

    const powItems = Array.isArray(body.powItems) ? body.powItems : [];
    const llmResult =
      powItems.length > 0 ? await callLlmWithRetry(body) : null;

    const baseInsight = computeRulesMatchInsight({
      applicationId: body.applicationId,
      roleSkills: body.roleSkills,
      powItems,
      llmMappedSkills: llmResult?.parsed.skills,
    });

    if (llmResult) {
      const validIds = new Set(powItems.map((p) => p.id));
      const hasValidCitation =
        !llmResult.parsed.skills ||
        llmResult.parsed.skills.every((s) =>
          s.evidenceIds.every((id) => validIds.has(id))
        );

      const explanation =
        hasValidCitation &&
        typeof llmResult.parsed.explanation === "string" &&
        llmResult.parsed.explanation.trim().length > 0
          ? llmResult.parsed.explanation
              .trim()
              .slice(0, MATCH_CONFIG.llm.maxExplanationChars)
          : baseInsight.explanation;

      return NextResponse.json({
        ...baseInsight,
        explanation,
        source: "rules+llm",
        model: llmResult.model,
        status: "ok",
      });
    }

    return NextResponse.json({
      ...baseInsight,
      source: "rules",
      model: null,
      status: process.env.LLM_API_KEY ? "ai_unavailable" : "ok",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to compute match insight" },
      { status: 500 }
    );
  }
}
