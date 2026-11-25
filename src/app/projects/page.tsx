"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Clock, Plus, Search, Users } from "lucide-react";
import { dataClient } from "@/lib/data";
import type { ProjectStatus, ProjectWithCreator } from "@/lib/types";
import { useDemo } from "@/components/DemoContext";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Skeleton,
} from "@/components/ui/primitives";
import { ProjectStatusBadge } from "@/components/ui/StatusBadge";

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function ProjectsPage() {
  const { dataVersion } = useDemo();
  const [projects, setProjects] = useState<ProjectWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [skillOrRole, setSkillOrRole] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "all">("open");

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await dataClient.listProjects({
        query,
        skillOrRole,
        status,
      });
      setProjects(list);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load projects."
      );
    } finally {
      setLoading(false);
    }
  }, [query, skillOrRole, status, dataVersion]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Student Projects
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Browse open tactical projects by role, skill, and weekly commitment.
          </p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Post project
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label
              htmlFor="search-title"
              className="block text-xs font-medium text-slate-700"
            >
              Search title
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="search-title"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., Hackathon, Lab, Tracker..."
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="filter-role-skill"
              className="block text-xs font-medium text-slate-700"
            >
              Role or skill
            </label>
            <input
              id="filter-role-skill"
              type="text"
              value={skillOrRole}
              onChange={(e) => setSkillOrRole(e.target.value)}
              placeholder="e.g., UI/UX, React, Figma..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="filter-status"
              className="block text-xs font-medium text-slate-700"
            >
              Status
            </label>
            <select
              id="filter-status"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as ProjectStatus | "all")
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="open">Open</option>
              <option value="filled">Filled</option>
              <option value="closed">Closed</option>
              <option value="all">All statuses</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Content states */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="space-y-3 p-5">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-4 w-full" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => void loadProjects()} />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects match your filters"
          description="Try clearing the search query or switching the status filter."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setQuery("");
                setSkillOrRole("");
                setStatus("open");
              }}
            >
              Reset filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {projects.map((project) => {
            const totalSlots = project.roles.reduce(
              (acc, r) => acc + r.slots,
              0
            );
            const filledSlots = project.roles.reduce(
              (acc, r) => acc + r.filled,
              0
            );
            const remainingSlots = Math.max(0, totalSlots - filledSlots);

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group block focus:outline-none"
              >
                <Card className="flex h-full flex-col justify-between gap-4 p-5 transition-colors group-hover:border-blue-400">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-base font-semibold text-slate-900 group-hover:text-blue-700">
                        {project.title}
                      </h2>
                      <ProjectStatusBadge status={project.status} />
                    </div>

                    <p className="text-xs text-slate-600">
                      Posted by{" "}
                      <span className="font-medium text-slate-800">
                        {project.creator.name}
                      </span>{" "}
                      · {project.creator.faculty}
                    </p>

                    {/* Open roles chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {project.roles.map((role) => (
                        <Chip key={role.id} variant="accent">
                          {role.name} ({role.slots - role.filled} left)
                        </Chip>
                      ))}
                    </div>
                  </div>

                  {/* Metadata footer */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                      {remainingSlots} of {totalSlots} slots open
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                      {project.hoursPerWeek} hrs/wk × {project.weeks} wks
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                      Apply by {formatShortDate(project.applyDeadline)}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
