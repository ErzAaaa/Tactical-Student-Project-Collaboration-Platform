"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { dataClient } from "@/lib/data";
import type { MyApplicationItem } from "@/lib/types";
import { useDemo } from "@/components/DemoContext";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
} from "@/components/ui/primitives";
import { ApplicationStatusBadge } from "@/components/ui/StatusBadge";

export default function MyApplicationsPage() {
  const { currentUser, dataVersion } = useDemo();
  const [items, setItems] = useState<MyApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMyApps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await dataClient.listMyApplications();
      setItems(list);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load applications."
      );
    } finally {
      setLoading(false);
    }
  }, [dataVersion]);

  useEffect(() => {
    void loadMyApps();
  }, [loadMyApps]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          My Applications
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Track decisions and courteous feedback for{" "}
          <span className="font-medium text-slate-800">
            {currentUser?.name ?? "your account"}
          </span>
          .
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i} className="space-y-2 p-5">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => void loadMyApps()} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No applications yet"
          description="Browse open student projects and apply to a role to track your status here."
          action={
            <Link href="/projects">
              <Button size="sm">Browse projects</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="space-y-3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/projects/${item.project.id}`}
                    className="text-base font-semibold text-slate-900 hover:text-blue-700"
                  >
                    {item.project.title}
                  </Link>
                  <p className="text-xs text-slate-600">
                    Role: <span className="font-medium">{item.role.name}</span> ·
                    Creator: {item.project.creator.name} · Applied{" "}
                    {new Date(item.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <ApplicationStatusBadge status={item.status} />
              </div>

              <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                <span className="font-medium text-slate-900">Your pitch:</span>{" "}
                {item.pitch}
              </p>

              {item.status === "declined" && item.declineTemplate ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-950">
                  <p className="font-semibold">Courteous feedback from creator:</p>
                  <p className="mt-1">{item.declineTemplate}</p>
                  {item.declineNote ? (
                    <p className="mt-1 italic">“{item.declineNote}”</p>
                  ) : null}
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
