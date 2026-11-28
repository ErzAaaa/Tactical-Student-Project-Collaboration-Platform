"use client";

import React from "react";
import {
  Award,
  CheckCircle2,
  Clock,
  FileText,
  Lock,
  ShieldCheck,
  Sparkles,
  Star,
  TimerOff,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import type {
  ApplicationStatus,
  MatchBand,
  PoWLevel,
  ProjectStatus,
} from "@/lib/types";
import { cn } from "./primitives";

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const map: Record<
    ProjectStatus,
    { label: string; icon: React.ReactNode; classes: string }
  > = {
    open: {
      label: "Open",
      icon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />,
      classes: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    filled: {
      label: "Filled",
      icon: <Lock className="h-3.5 w-3.5" aria-hidden="true" />,
      classes: "bg-slate-100 text-slate-800 border-slate-300",
    },
    closed: {
      label: "Closed",
      icon: <XCircle className="h-3.5 w-3.5" aria-hidden="true" />,
      classes: "bg-slate-100 text-slate-700 border-slate-300",
    },
  };
  const cfg = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        cfg.classes
      )}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

export function ApplicationStatusBadge({
  status,
}: {
  status: ApplicationStatus;
}) {
  const map: Record<
    ApplicationStatus,
    { label: string; icon: React.ReactNode; classes: string; simulated?: boolean }
  > = {
    pending: {
      label: "Pending",
      icon: <Clock className="h-3.5 w-3.5" aria-hidden="true" />,
      classes: "bg-amber-50 text-amber-900 border-amber-200",
    },
    shortlisted: {
      label: "Shortlisted",
      icon: <Star className="h-3.5 w-3.5" aria-hidden="true" />,
      classes: "bg-blue-50 text-blue-800 border-blue-200",
    },
    accepted: {
      label: "Accepted",
      icon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />,
      classes: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    declined: {
      label: "Declined",
      icon: <XCircle className="h-3.5 w-3.5" aria-hidden="true" />,
      classes: "bg-rose-50 text-rose-800 border-rose-200",
    },
    withdrawn: {
      label: "Withdrawn",
      icon: <XCircle className="h-3.5 w-3.5" aria-hidden="true" />,
      classes: "bg-slate-100 text-slate-700 border-slate-300",
    },
    expired: {
      label: "Auto-closed (no decision)",
      icon: <TimerOff className="h-3.5 w-3.5" aria-hidden="true" />,
      classes: "bg-slate-100 text-slate-700 border-slate-300",
      simulated: true,
    },
  };
  const cfg = map[status];
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
          cfg.classes
        )}
      >
        {cfg.icon}
        {cfg.label}
      </span>
      {cfg.simulated ? (
        <span className="inline-flex items-center rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
          Simulated
        </span>
      ) : null}
    </span>
  );
}

export function PoWLevelBadge({ level }: { level: PoWLevel }) {
  const map: Record<
    PoWLevel,
    { label: string; icon: React.ReactNode; classes: string }
  > = {
    verified: {
      label: "Verified",
      icon: <ShieldCheck className="h-3 w-3" aria-hidden="true" />,
      classes: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    platform_earned: {
      label: "Completed on platform",
      icon: <Award className="h-3 w-3" aria-hidden="true" />,
      classes: "bg-blue-50 text-blue-800 border-blue-200",
    },
    self_declared: {
      label: "Self-declared",
      icon: <FileText className="h-3 w-3" aria-hidden="true" />,
      classes: "bg-slate-100 text-slate-700 border-slate-300",
    },
  };
  const cfg = map[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium",
        cfg.classes
      )}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

export function MatchBandBadge({ band }: { band: MatchBand }) {
  const map: Record<
    MatchBand,
    { label: string; icon: React.ReactNode; classes: string }
  > = {
    strong: {
      label: "Strong fit",
      icon: <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />,
      classes: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    partial: {
      label: "Partial fit",
      icon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />,
      classes: "bg-amber-50 text-amber-900 border-amber-200",
    },
    limited: {
      label: "Limited fit",
      icon: <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />,
      classes: "bg-slate-100 text-slate-700 border-slate-300",
    },
  };
  const cfg = map[band];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        cfg.classes
      )}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}
