"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Shield,
  Users,
} from "lucide-react";
import { dataClient } from "@/lib/data";
import type { ProjectWithCreator, Role } from "@/lib/types";
import { useDemo } from "@/components/DemoContext";
import { signInWithGitHub } from "@/lib/auth-actions";
import { ApplyModal } from "@/components/ApplyModal";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Skeleton,
} from "@/components/ui/primitives";
import { ProjectStatusBadge } from "@/components/ui/StatusBadge";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const { currentUser, dataVersion, bumpDataVersion } = useDemo();

  const [project, setProject] = useState<ProjectWithCreator | null>(null);
  const [appliedRoleIds, setAppliedRoleIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [proj, myApps] = await Promise.all([
        dataClient.getProject(projectId),
        dataClient.listMyApplications(),
      ]);
      setProject(proj);
      setAppliedRoleIds(new Set(myApps.map((a) => a.roleId)));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load project details."
      );
    } finally {
      setLoading(false);
    }
  }, [projectId, dataVersion]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Card className="space-y-4 p-6">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-20 w-full" />
        </Card>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => void loadDetail()} />;
  }

  if (!project) {
    return (
      <EmptyState
        title="Project not found"
        description="This project may have been removed or the demo data was reset."
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

  const isCreator = currentUser?.id === project.creatorId;
  const creatorRel = project.creator.reliability;
  const reliabilityText =
    creatorRel.commitmentsCount < 2 || creatorRel.score === null
      ? "No track record yet"
      : `${creatorRel.score}% (${creatorRel.commitmentsCount} commitments)`;

  return (
    <div className="space-y-6">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to projects
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Project Info & Roles */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-4 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {project.title}
              </h1>
              <ProjectStatusBadge status={project.status} />
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-400" aria-hidden="true" />
                {project.hoursPerWeek} hrs/week for {project.weeks} weeks
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" aria-hidden="true" />
                Apply by{" "}
                {new Date(project.applyDeadline).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>

            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {project.description}
            </p>
          </Card>

          {/* Open Roles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Roles needed
              </h2>
              {isCreator ? (
                <Link href={`/projects/${project.id}/applicants`}>
                  <Button size="sm">
                    <Users className="h-4 w-4" aria-hidden="true" />
                    View applicants
                  </Button>
                </Link>
              ) : null}
            </div>

            <div className="space-y-3">
              {project.roles.map((role) => {
                const isFull = role.filled >= role.slots;
                const isClosed = project.status !== "open";
                const alreadyApplied = appliedRoleIds.has(role.id);

                let disabledReason: string | null = null;
                if (isClosed) {
                  disabledReason = `Project is ${project.status}`;
                } else if (isFull) {
                  disabledReason = "Role is full";
                }

                return (
                  <Card
                    key={role.id}
                    className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900">
                          {role.name}
                        </h3>
                        <span className="text-xs font-medium text-slate-600">
                          {role.filled}/{role.slots} filled
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {role.skills.map((skill) => (
                          <Chip key={skill} variant="neutral">
                            {skill}
                          </Chip>
                        ))}
                      </div>
                      {disabledReason && !isCreator ? (
                        <p className="text-xs font-medium text-slate-500">
                          Unavailable: {disabledReason}
                        </p>
                      ) : null}
                    </div>

                    <div className="shrink-0">
                      {isCreator ? (
                        <Link href={`/projects/${project.id}/applicants`}>
                          <Button variant="secondary" size="sm">
                            View applicants
                          </Button>
                        </Link>
                      ) : alreadyApplied ? (
                        <Button variant="secondary" size="sm" disabled>
                          <Check className="h-4 w-4" aria-hidden="true" />
                          Applied
                        </Button>
                      ) : !currentUser && dataClient.mode === "supabase" ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => void signInWithGitHub()}
                        >
                          Sign in to apply
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={Boolean(disabledReason)}
                          onClick={() => setSelectedRole(role)}
                        >
                          Apply
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Creator Card */}
        <div className="space-y-4">
          <Card className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                Project creator
              </h2>
              <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                Simulated metrics
              </span>
            </div>

            <div>
              <p className="text-base font-semibold text-slate-900">
                {project.creator.name}
              </p>
              <p className="text-xs text-slate-600">
                {project.creator.faculty}
              </p>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <Shield className="h-3.5 w-3.5 text-slate-400" />
                  Reliability
                </span>
                <span className="font-medium text-slate-900">
                  {reliabilityText}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600">Response rate</span>
                <span className="font-medium text-slate-900">
                  {project.creator.responseRate}%
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {currentUser ? (
        <ApplyModal
          open={Boolean(selectedRole)}
          onClose={() => setSelectedRole(null)}
          role={selectedRole}
          projectTitle={project.title}
          applicant={currentUser}
          onApplied={(app) => {
            setAppliedRoleIds((prev) => new Set([...prev, app.roleId]));
            bumpDataVersion();
          }}
        />
      ) : null}
    </div>
  );
}
