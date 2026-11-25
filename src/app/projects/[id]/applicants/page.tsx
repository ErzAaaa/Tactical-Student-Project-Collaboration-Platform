"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpDown,
  Check,
  Clock,
  ExternalLink,
  Lock,
  Shield,
  Star,
  X,
} from "lucide-react";
import { dataClient } from "@/lib/data";
import type {
  ApplicationStatus,
  ApplicationWithApplicant,
  DeclineTemplate,
  MatchBand,
  MatchInsight,
  ProjectWithCreator,
} from "@/lib/types";
import { useDemo } from "@/components/DemoContext";
import { useToast } from "@/components/ui/Toast";
import { DeclineDialog } from "@/components/DeclineDialog";
import { MatchInsightPanel } from "@/components/MatchInsightPanel";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
} from "@/components/ui/primitives";
import {
  ApplicationStatusBadge,
  PoWLevelBadge,
} from "@/components/ui/StatusBadge";

const BAND_RANK: Record<MatchBand, number> = {
  strong: 3,
  partial: 2,
  limited: 1,
};

function getDaysUntilDue(decisionDueAt: string): number {
  const diffMs = new Date(decisionDueAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export default function ApplicantsDecisionPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const { currentUser, dataVersion, bumpDataVersion } = useDemo();
  const { showToast } = useToast();

  const [project, setProject] = useState<ProjectWithCreator | null>(null);
  const [applications, setApplications] = useState<ApplicationWithApplicant[]>(
    []
  );
  const [insights, setInsights] = useState<Record<string, MatchInsight | null>>(
    {}
  );
  const [loadingInsights, setLoadingInsights] = useState(false);

  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">(
    "all"
  );
  const [sortByFit, setSortByFit] = useState(false);
  const [declineTarget, setDeclineTarget] =
    useState<ApplicationWithApplicant | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setForbidden(false);
    setError(null);
    try {
      const proj = await dataClient.getProject(projectId);
      setProject(proj);
      if (!proj) {
        setLoading(false);
        return;
      }

      const apps = await dataClient.listApplications(projectId);
      setApplications(apps);

      setLoadingInsights(true);
      const insightEntries = await Promise.all(
        apps.map(async (app) => {
          const ins = await dataClient.getMatchInsight(app.id);
          return [app.id, ins] as const;
        })
      );
      setInsights(Object.fromEntries(insightEntries));
      setLoadingInsights(false);
    } catch (err) {
      if (err instanceof Error && err.message === "FORBIDDEN") {
        setForbidden(true);
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to load applicants."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, dataVersion]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleAction = async (
    app: ApplicationWithApplicant,
    action: "shortlist" | "accept" | "decline",
    template?: DeclineTemplate,
    note?: string
  ) => {
    const previousApps = applications;
    const optimisticStatus: ApplicationStatus =
      action === "shortlist"
        ? "shortlisted"
        : action === "accept"
          ? "accepted"
          : "declined";

    // Optimistic update (PRD 5.5)
    setApplications((prev) =>
      prev.map((item) =>
        item.id === app.id
          ? {
              ...item,
              status: optimisticStatus,
              declineTemplate: template ?? item.declineTemplate,
              declineNote: note ?? item.declineNote,
              decidedAt:
                action === "shortlist" ? item.decidedAt : new Date().toISOString(),
            }
          : item
      )
    );

    try {
      await dataClient.updateApplication({
        id: app.id,
        action,
        template,
        note,
      });
      bumpDataVersion();
      const label =
        action === "shortlist"
          ? `${app.applicant.name} shortlisted.`
          : action === "accept"
            ? `${app.applicant.name} accepted for ${app.role.name}.`
            : `Courteous decline sent to ${app.applicant.name}.`;
      showToast(label, "success");
    } catch (err) {
      // Rollback on failure
      setApplications(previousApps);
      showToast(
        err instanceof Error ? err.message : "Action failed. Reverted.",
        "error"
      );
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-2/3" />
        <Card className="space-y-3 p-6">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </Card>
      </div>
    );
  }

  if (forbidden) {
    return (
      <Card className="mx-auto max-w-lg space-y-4 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-700">
          <Lock className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold text-slate-900">
          Creator access only
        </h1>
        <p className="text-sm text-slate-600">
          Only the project creator ({project?.creator.name ?? "owner"}) can
          review applicants and make decisions. Switch to the Creator account in
          the top bar if you are testing the creator flow.
        </p>
        <div className="flex justify-center gap-2 pt-2">
          <Link href={`/projects/${projectId}`}>
            <Button variant="secondary" size="sm">
              Back to project detail
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => void loadData()} />;
  }

  if (!project) {
    return (
      <EmptyState
        title="Project not found"
        action={
          <Link href="/projects">
            <Button variant="secondary" size="sm">
              Back to projects
            </Button>
          </Link>
        }
      />
    );
  }

  const filteredApps = applications.filter((app) =>
    statusFilter === "all" ? true : app.status === statusFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to project detail
        </Link>
        {currentUser ? (
          <span className="text-xs text-slate-500">
            Signed in as <strong className="text-slate-800">{currentUser.name}</strong>
          </span>
        ) : null}
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Creator Decision Workspace
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {project.title}
          </h1>
        </div>

        {/* Controls: Status filter + P1 Sort by fit */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label
              htmlFor="applicant-status-filter"
              className="text-xs font-medium text-slate-700"
            >
              Status
            </label>
            <select
              id="applicant-status-filter"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as ApplicationStatus | "all")
              }
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
            </select>
          </div>

          <Button
            variant={sortByFit ? "primary" : "secondary"}
            size="sm"
            onClick={() => setSortByFit((v) => !v)}
            aria-pressed={sortByFit}
          >
            <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
            {sortByFit ? "Sort by fit: On" : "Sort by fit"}
          </Button>
        </div>
      </div>

      {sortByFit ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-medium text-blue-900">
          Sorted by skill fit. Review every applicant.
        </div>
      ) : null}

      {/* Grouped by Role */}
      {project.roles.map((role) => {
        const roleApps = filteredApps
          .filter((a) => a.roleId === role.id)
          .sort((a, b) => {
            if (sortByFit) {
              const rankA = insights[a.id]
                ? BAND_RANK[insights[a.id]!.band]
                : 0;
              const rankB = insights[b.id]
                ? BAND_RANK[insights[b.id]!.band]
                : 0;
              if (rankB !== rankA) return rankB - rankA;
            }
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          });

        return (
          <section key={role.id} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <h2 className="text-lg font-semibold text-slate-900">
                {role.name}{" "}
                <span className="text-sm font-normal text-slate-600">
                  ({role.filled}/{role.slots} slots filled · {roleApps.length}{" "}
                  shown)
                </span>
              </h2>
            </div>

            {roleApps.length === 0 ? (
              <EmptyState
                title={`No applicants for ${role.name}`}
                description="Try changing the status filter above or check back later."
              />
            ) : (
              <div className="space-y-4">
                {roleApps.map((app) => {
                  const isFinal =
                    app.status === "accepted" ||
                    app.status === "declined" ||
                    app.status === "expired";
                  const daysDue = getDaysUntilDue(app.decisionDueAt);
                  const rel = app.applicant.reliability;
                  const relLabel =
                    rel.commitmentsCount < 2 || rel.score === null
                      ? "No track record yet"
                      : `${rel.score}% (${rel.commitmentsCount} commitments)`;

                  return (
                    <Card key={app.id} className="space-y-4 p-5">
                      {/* Top row */}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-slate-900">
                              {app.applicant.name}
                            </h3>
                            <ApplicationStatusBadge status={app.status} />
                          </div>
                          <p className="text-xs text-slate-600">
                            {app.applicant.faculty}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <Shield className="h-3.5 w-3.5 text-slate-400" />
                            Reliability: <strong>{relLabel}</strong>
                          </span>
                          <span>
                            Applied{" "}
                            {new Date(app.createdAt).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" }
                            )}
                          </span>
                          {!isFinal ? (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 font-medium text-amber-900">
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              Auto-closes in {daysDue} days
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Pitch */}
                      <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-800">
                        {app.pitch}
                      </div>

                      {/* Proof-of-Work Snapshot */}
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Proof-of-Work snapshot
                        </p>
                        {app.powSnapshot.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">
                            No Proof-of-Work links provided.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {app.powSnapshot.map((item) => (
                              <a
                                key={item.id}
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs hover:border-blue-400"
                              >
                                <span className="font-medium text-blue-700">
                                  {item.title}
                                </span>
                                <ExternalLink
                                  className="h-3 w-3 text-slate-400"
                                  aria-hidden="true"
                                />
                                <PoWLevelBadge level={item.level} />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Match Insight Panel (PRD 13.5) */}
                      <MatchInsightPanel
                        insight={insights[app.id] ?? null}
                        loading={loadingInsights}
                        powSnapshot={app.powSnapshot}
                      />

                      {/* Decline reason summary if declined */}
                      {app.status === "declined" && app.declineTemplate ? (
                        <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-950">
                          <span className="font-semibold">Decline sent:</span>{" "}
                          {app.declineTemplate}
                          {app.declineNote ? ` — "${app.declineNote}"` : ""}
                        </div>
                      ) : null}

                      {/* Actions */}
                      {!isFinal ? (
                        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
                          {app.status === "pending" ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                void handleAction(app, "shortlist")
                              }
                            >
                              <Star className="h-4 w-4" aria-hidden="true" />
                              Shortlist
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            disabled={role.filled >= role.slots}
                            onClick={() => void handleAction(app, "accept")}
                          >
                            <Check className="h-4 w-4" aria-hidden="true" />
                            Accept
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setDeclineTarget(app)}
                          >
                            <X className="h-4 w-4" aria-hidden="true" />
                            Decline
                          </Button>
                        </div>
                      ) : null}
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      <DeclineDialog
        open={Boolean(declineTarget)}
        onClose={() => setDeclineTarget(null)}
        applicantName={declineTarget?.applicant.name ?? ""}
        roleName={declineTarget?.role.name ?? ""}
        onConfirm={async (template, note) => {
          if (!declineTarget) return;
          await handleAction(declineTarget, "decline", template, note);
        }}
      />
    </div>
  );
}
