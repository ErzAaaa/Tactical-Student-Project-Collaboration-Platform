"use client";

import React, { useEffect, useState } from "react";
import { DECLINE_TEMPLATES, type DeclineTemplate } from "@/lib/types";
import { Dialog } from "./ui/Dialog";
import { Button, Select, Textarea } from "./ui/primitives";

interface DeclineDialogProps {
  open: boolean;
  onClose: () => void;
  applicantName: string;
  roleName: string;
  onConfirm: (template: DeclineTemplate, note?: string) => Promise<void>;
}

export function DeclineDialog({
  open,
  onClose,
  applicantName,
  roleName,
  onConfirm,
}: DeclineDialogProps) {
  const [template, setTemplate] = useState<DeclineTemplate | "">("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTemplate("");
      setNote("");
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template) {
      setError("Please select a courteous reason template.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(template, note.trim() || undefined);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send decline."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const previewText = template
    ? `Hi ${applicantName}, thank you for applying for ${roleName}. ${template}.${
        note.trim() ? ` Note from creator: "${note.trim()}"` : ""
      } Wishing you the best on your next project!`
    : "Select a reason template above to preview the message.";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Decline ${applicantName}`}
      description={`Send a courteous, structured decision for the ${roleName} role.`}
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <Select
          label="Reason template (required)"
          value={template}
          onChange={(e) => {
            setTemplate(e.target.value as DeclineTemplate | "");
            if (error) setError(null);
          }}
          error={error ?? undefined}
        >
          <option value="">-- Choose a reason --</option>
          {DECLINE_TEMPLATES.map((tpl) => (
            <option key={tpl} value={tpl}>
              {tpl}
            </option>
          ))}
        </Select>

        <Textarea
          label="Optional note"
          placeholder="Add a brief, constructive note if helpful..."
          rows={3}
          maxLength={200}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-slate-700">
            Message preview sent by system
          </p>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
            {previewText}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            disabled={!template || submitting}
          >
            {submitting ? "Sending..." : "Send courteous decline"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
