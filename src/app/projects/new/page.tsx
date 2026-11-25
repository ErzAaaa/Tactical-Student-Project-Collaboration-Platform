"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { dataClient } from "@/lib/data";
import { useDemo } from "@/components/DemoContext";
import { useToast } from "@/components/ui/Toast";
import {
  Button,
  Card,
  Input,
  Textarea,
} from "@/components/ui/primitives";

interface RoleDraft {
  name: string;
  skillsText: string;
  slots: number;
}

function defaultTomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
}

function minTomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

export default function NewProjectPage() {
  const router = useRouter();
  const { bumpDataVersion } = useDemo();
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [applyDeadline, setApplyDeadline] = useState(defaultTomorrowDate);
  const [hoursPerWeek, setHoursPerWeek] = useState(8);
  const [weeks, setWeeks] = useState(3);
  const [roles, setRoles] = useState<RoleDraft[]>([
    { name: "UI/UX", skillsText: "UI/UX, Figma, Prototyping", slots: 1 },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const addRole = () => {
    if (roles.length >= 5) return;
    setRoles([...roles, { name: "", skillsText: "", slots: 1 }]);
  };

  const removeRole = (index: number) => {
    if (roles.length <= 1) return;
    setRoles(roles.filter((_, i) => i !== index));
  };

  const updateRole = (index: number, patch: Partial<RoleDraft>) => {
    setRoles(roles.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Project title is required.";
    else if (title.trim().length > 80)
      next.title = "Title must be 80 characters or fewer.";

    if (!description.trim()) next.description = "Description is required.";
    else if (description.trim().length > 1000)
      next.description = "Description must be 1000 characters or fewer.";

    if (!applyDeadline || applyDeadline < minTomorrowDate()) {
      next.applyDeadline = "Deadline must be at least tomorrow.";
    }

    if (hoursPerWeek < 1 || hoursPerWeek > 40) {
      next.hoursPerWeek = "Enter between 1 and 40 hours/week.";
    }
    if (weeks < 1 || weeks > 52) {
      next.weeks = "Enter between 1 and 52 weeks.";
    }

    if (roles.length < 1) {
      next.roles = "At least 1 role is required.";
    }

    roles.forEach((r, i) => {
      if (!r.name.trim()) {
        next[`role_name_${i}`] = "Role name is required.";
      }
      const skills = r.skillsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (skills.length === 0) {
        next[`role_skills_${i}`] = "Add at least 1 skill tag (comma-separated).";
      }
      if (r.slots < 1 || r.slots > 5) {
        next[`role_slots_${i}`] = "Slots must be between 1 and 5.";
      }
    });

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const created = await dataClient.createProject({
        title: title.trim(),
        description: description.trim(),
        applyDeadline: new Date(`${applyDeadline}T23:59:59.000Z`).toISOString(),
        hoursPerWeek,
        weeks,
        roles: roles.map((r) => ({
          name: r.name.trim(),
          skills: r.skillsText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          slots: r.slots,
        })),
      });
      bumpDataVersion();
      showToast("Project posted successfully.", "success");
      router.push(`/projects/${created.id}`);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to create project.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to projects
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Post a Project
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Define clear roles, required skills, and expected weekly commitment.
        </p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        <Card className="space-y-4 p-6">
          <Input
            label="Project title"
            placeholder="e.g., Campus Hackathon Sustainability App"
            maxLength={80}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
            hint="Maximum 80 characters"
          />

          <Textarea
            label="Description"
            placeholder="Describe the goal, deliverable, and team cadence..."
            rows={4}
            maxLength={1000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={errors.description}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Application deadline"
              type="date"
              min={minTomorrowDate()}
              value={applyDeadline}
              onChange={(e) => setApplyDeadline(e.target.value)}
              error={errors.applyDeadline}
            />
            <Input
              label="Hours per week"
              type="number"
              min={1}
              max={40}
              value={hoursPerWeek}
              onChange={(e) => setHoursPerWeek(Number(e.target.value))}
              error={errors.hoursPerWeek}
            />
            <Input
              label="Duration (weeks)"
              type="number"
              min={1}
              max={52}
              value={weeks}
              onChange={(e) => setWeeks(Number(e.target.value))}
              error={errors.weeks}
            />
          </div>
        </Card>

        {/* Roles Section */}
        <Card className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Open roles (1–5)
              </h2>
              <p className="text-xs text-slate-600">
                Specify the skills and number of slots for each role.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addRole}
              disabled={roles.length >= 5}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add role
            </Button>
          </div>

          {errors.roles ? (
            <p className="text-xs font-medium text-rose-700">{errors.roles}</p>
          ) : null}

          <div className="space-y-4">
            {roles.map((role, index) => (
              <div
                key={index}
                className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Role {index + 1}
                  </span>
                  {roles.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRole(index)}
                    >
                      <Trash2 className="h-4 w-4 text-rose-600" />
                      Remove role
                    </Button>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Input
                    label="Role name"
                    placeholder="e.g., Frontend"
                    value={role.name}
                    onChange={(e) =>
                      updateRole(index, { name: e.target.value })
                    }
                    error={errors[`role_name_${index}`]}
                  />
                  <Input
                    label="Skills (comma-separated)"
                    placeholder="React, TypeScript, Tailwind"
                    value={role.skillsText}
                    onChange={(e) =>
                      updateRole(index, { skillsText: e.target.value })
                    }
                    error={errors[`role_skills_${index}`]}
                  />
                  <Input
                    label="Slots (1–5)"
                    type="number"
                    min={1}
                    max={5}
                    value={role.slots}
                    onChange={(e) =>
                      updateRole(index, { slots: Number(e.target.value) })
                    }
                    error={errors[`role_slots_${index}`]}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/projects">
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Publishing..." : "Publish project"}
          </Button>
        </div>
      </form>
    </div>
  );
}
