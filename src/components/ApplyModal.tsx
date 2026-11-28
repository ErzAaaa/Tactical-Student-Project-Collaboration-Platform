"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Info, Sparkles } from "lucide-react";
import { dataClient } from "@/lib/data";
import type { Application, Profile, Role } from "@/lib/types";
import { Dialog } from "./ui/Dialog";
import { PoWLevelBadge } from "./ui/StatusBadge";
import { Button, Chip, Input, Textarea } from "./ui/primitives";
import { useToast } from "./ui/Toast";

interface ApplyModalProps {
  open: boolean;
  onClose: () => void;
  role: Role | null;
  projectTitle: string;
  applicant: Profile;
  onApplied: (application: Application) => void;
}

export function ApplyModal({
  open,
  onClose,
  role,
  projectTitle,
  applicant,
  onApplied,
}: ApplyModalProps) {
  const { showToast } = useToast();
  const [pitch, setPitch] = useState("");
  const [githubRepoLink, setGithubRepoLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<Application | null>(null);

  useEffect(() => {
    if (open) {
      setPitch("");
      setGithubRepoLink(applicant.powItems[0]?.url ?? "");
      setError(null);
      setSubmitting(false);
      setSubmittedApp(null);
    }
  }, [open, role?.id, applicant.powItems]);

  if (!role) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = pitch.trim();
    if (!trimmed) {
      setError("Please write a short pitch before submitting.");
      return;
    }
    if (trimmed.length > 300) {
      setError("Pitch must be 300 characters or fewer.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const app = await dataClient.createApplication({
        roleId: role.id,
        pitch: trimmed,
        githubRepoLink: githubRepoLink.trim() || null,
      });
      setSubmittedApp(app);
      onApplied(app);
      showToast(`Applied for ${role.name}.`, "success");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit application."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedApp) {
    const decisionDate = new Date(submittedApp.decisionDueAt).toLocaleDateString(
      "en-US",
      { month: "short", day: "numeric", year: "numeric" }
    );
    return (
      <Dialog
        open={open}
        onClose={onClose}
        title="Application submitted"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <div className="space-y-1 text-sm text-emerald-950">
              <p className="font-medium">
                Application sent. You will get a decision or a notice by{" "}
                {decisionDate}.
              </p>
              <p className="text-xs text-emerald-800">
                Your profile snapshot was saved as of today for{" "}
                <span className="font-medium">{role.name}</span> on{" "}
                <span className="font-medium">{projectTitle}</span>.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Apply for ${role.name}`}
      description={projectTitle}
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
        <Textarea
          label="Short pitch"
          placeholder="Briefly explain what you have built or can contribute to this role..."
          rows={4}
          maxLength={300}
          value={pitch}
          onChange={(e) => {
            setPitch(e.target.value);
            if (error) setError(null);
          }}
          error={error ?? undefined}
          required
        />

        {dataClient.mode === "supabase" ? (
          <Input
            label="GitHub repository link (optional)"
            type="url"
            placeholder="https://github.com/username/project"
            value={githubRepoLink}
            onChange={(e) => setGithubRepoLink(e.target.value)}
            hint="Attached as proof-of-work for the project creator"
          />
        ) : null}

        {/* Profile Snapshot Preview */}
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
              Your profile snapshot
            </h3>
            <span className="text-[11px] text-slate-500">
              Captured at apply time
            </span>
          </div>

          <div className="text-sm">
            <p className="font-medium text-slate-900">{applicant.name}</p>
            <p className="text-xs text-slate-600">{applicant.faculty}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-700">
              Proof-of-Work items ({applicant.powItems.length})
            </p>
            {applicant.powItems.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                No Proof-of-Work links attached yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {applicant.powItems.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-md border border-slate-200 bg-white p-2.5 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
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
                    </div>
                    <p className="mt-1 text-slate-600">{item.summary}</p>
                    {item.skills.length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {item.skills.map((s) => (
                          <Chip key={s} variant="neutral">
                            {s}
                          </Chip>
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="flex items-start gap-1.5 text-[11px] text-slate-600">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
            The creator will see this exact snapshot as of your application date.
          </p>
        </div>

        {/* Required AI Notice (PRD 13.5) */}
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-950">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
          <span>
            The creator will see an AI-assisted fit summary based on your profile
            snapshot.
          </span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit application"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
