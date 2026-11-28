"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { dataClient } from "@/lib/data";
import type { MyApplicationItem } from "@/lib/types";
import { useDemo } from "@/components/DemoContext";
import { useToast } from "@/components/ui/Toast";
import { Dialog } from "@/components/ui/Dialog";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
  Textarea,
} from "@/components/ui/primitives";
import { ApplicationStatusBadge } from "@/components/ui/StatusBadge";

export default function MyApplicationsPage() {
  const { currentUser, dataVersion, bumpDataVersion } = useDemo();
  const { showToast } = useToast();
  const [items, setItems] = useState<MyApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [withdrawTarget, setWithdrawTarget] =
    useState<MyApplicationItem | null>(null);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

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

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawTarget || !dataClient.withdrawApplication) return;
    setWithdrawing(true);
    try {
      await dataClient.withdrawApplication({
        id: withdrawTarget.id,
        reason: withdrawReason.trim() || undefined,
      });
      showToast("Application withdrawn.", "info");
      setWithdrawTarget(null);
      setWithdrawReason("");
      bumpDataVersion();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to withdraw application.",
        "error"
      );
    } finally {
      setWithdrawing(false);
    }
  };

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
          {items.map((item) => {
            const canWithdraw =
              (item.status === "pending" || item.status === "shortlisted") &&
              Boolean(dataClient.withdrawApplication);

            return (
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
                      Role: <span className="font-medium">{item.role.name}</span>{" "}
                      · Creator: {item.project.creator.name} · Applied{" "}
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
                    <p className="font-semibold">
                      Courteous feedback from creator:
                    </p>
                    <p className="mt-1">{item.declineTemplate}</p>
                    {item.declineNote ? (
                      <p className="mt-1 italic">“{item.declineNote}”</p>
                    ) : null}
                  </div>
                ) : null}

                {canWithdraw ? (
                  <div className="flex justify-end pt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setWithdrawTarget(item);
                        setWithdrawReason("");
                      }}
                    >
                      Withdraw application
                    </Button>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={Boolean(withdrawTarget)}
        onClose={() => setWithdrawTarget(null)}
        title="Withdraw application"
        description={
          withdrawTarget
            ? `Withdraw your application for ${withdrawTarget.project.title}?`
            : undefined
        }
      >
        <form onSubmit={(e) => void handleWithdraw(e)} className="space-y-4">
          <Textarea
            label="Reason for withdrawing (optional)"
            placeholder="Let the creator know if your schedule changed..."
            rows={3}
            maxLength={200}
            value={withdrawReason}
            onChange={(e) => setWithdrawReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setWithdrawTarget(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={withdrawing}>
              {withdrawing ? "Withdrawing..." : "Confirm withdraw"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
