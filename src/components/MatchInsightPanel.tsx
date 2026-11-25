"use client";

import React, { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  Sparkles,
} from "lucide-react";
import type { MatchInsight, PoWItem } from "@/lib/types";
import { MatchBandBadge, PoWLevelBadge } from "./ui/StatusBadge";
import { Chip, Skeleton } from "./ui/primitives";

interface MatchInsightPanelProps {
  insight: MatchInsight | null;
  loading?: boolean;
  powSnapshot: PoWItem[];
}

export function MatchInsightPanel({
  insight,
  loading = false,
  powSnapshot,
}: MatchInsightPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <Sparkles className="h-3.5 w-3.5 animate-pulse text-blue-600" />
          Analyzing…
        </div>
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
      </div>
    );
  }

  if (!insight) {
    return null;
  }

  const totalSkills = insight.evidenced.length + insight.missing.length;
  const verifiedCount = insight.evidenced.filter(
    (e) => e.level === "verified" || e.level === "platform_earned"
  ).length;

  const referencedIds = new Set(
    insight.evidenced.flatMap((e) => e.evidenceIds)
  );
  const evidenceItems = powSnapshot.filter((p) => referencedIds.has(p.id));

  const isLlmLive = insight.source === "rules+llm" && !insight.precomputed;
  const panelTitle = isLlmLive ? "Match Insight" : "Skill match";

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3.5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-700">
            {panelTitle}
          </span>
          <MatchBandBadge band={insight.band} />
          {insight.precomputed ? (
            <span className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
              Precomputed
            </span>
          ) : null}
        </div>
        <span className="text-xs font-medium text-slate-700">
          {insight.evidenced.length} of {totalSkills} skills evidenced ·{" "}
          {verifiedCount} verified
        </span>
      </div>

      {/* Skill chips */}
      <div className="flex flex-wrap gap-1.5">
        {insight.evidenced.map((ev) => (
          <Chip key={ev.skill} variant="accent">
            <Check className="h-3 w-3" aria-hidden="true" />
            <span>{ev.skill}</span>
            <span className="text-[10px] opacity-80">
              (
              {ev.level === "verified"
                ? "Verified"
                : ev.level === "platform_earned"
                  ? "Platform"
                  : "Self-declared"}
              )
            </span>
          </Chip>
        ))}
        {insight.missing.map((m) => (
          <Chip key={m} variant="outline">
            {m} (no evidence)
          </Chip>
        ))}
      </div>

      {/* Why this match / state */}
      {powSnapshot.length === 0 ? (
        <p className="text-xs text-slate-600">
          <span className="font-medium text-slate-800">No evidence yet:</span>{" "}
          Applicant did not attach Proof-of-Work links in this snapshot.
        </p>
      ) : insight.status === "ai_unavailable" ? (
        <div className="space-y-1 text-xs">
          <span className="inline-block rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-900">
            AI summary unavailable
          </span>
          {insight.explanation ? (
            <p className="text-slate-700">{insight.explanation}</p>
          ) : null}
        </div>
      ) : insight.explanation ? (
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-slate-800">Why this match:</span>
            {insight.source === "rules+llm" ? (
              <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-800">
                AI-assisted · may be wrong
              </span>
            ) : (
              <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                Rules-based
              </span>
            )}
          </div>
          <p className="text-slate-700">{insight.explanation}</p>
        </div>
      ) : null}

      {/* Expandable Evidence Used + Permanent Disclaimer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 pt-2 text-[11px] text-slate-600">
        {evidenceItems.length > 0 ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline"
          >
            Evidence used ({evidenceItems.length})
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        ) : (
          <span />
        )}

        <span className="inline-flex items-center gap-1 text-slate-500">
          <Info className="h-3 w-3" aria-hidden="true" />
          Decision support only. You decide.
        </span>
      </div>

      {expanded && evidenceItems.length > 0 ? (
        <ul className="space-y-1.5 pt-1">
          {evidenceItems.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
            >
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline"
              >
                {item.title}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
              <PoWLevelBadge level={item.level} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
