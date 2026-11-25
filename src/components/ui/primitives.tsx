"use client";

import React from "react";
import { AlertCircle, Inbox, RefreshCw } from "lucide-react";

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  const variants = {
    primary: "bg-blue-700 text-white hover:bg-blue-800",
    secondary:
      "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
    danger: "bg-rose-700 text-white hover:bg-rose-800",
    ghost: "text-slate-700 hover:bg-slate-100",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-xs",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Chip({
  children,
  variant = "neutral",
  className,
}: {
  children: React.ReactNode;
  variant?: "neutral" | "accent" | "outline";
  className?: string;
}) {
  const styles = {
    neutral: "bg-slate-100 text-slate-800 border border-slate-200",
    accent: "bg-blue-50 text-blue-800 border border-blue-200",
    outline: "bg-white text-slate-600 border border-dashed border-slate-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Input({
  label,
  id,
  error,
  hint,
  className,
  ...props
}: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-slate-800"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={cn(
          "w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400",
          error ? "border-rose-500" : "border-slate-300",
          className
        )}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error ? (
        <p className="text-xs font-medium text-rose-700">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  showCounter?: boolean;
}

export function Textarea({
  label,
  id,
  error,
  hint,
  maxLength,
  value,
  showCounter = true,
  className,
  ...props
}: TextareaProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
  const currentLength = typeof value === "string" ? value.length : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-800"
        >
          {label}
        </label>
        {showCounter && maxLength ? (
          <span
            className={cn(
              "text-xs tabular-nums",
              currentLength > maxLength ? "text-rose-700 font-medium" : "text-slate-500"
            )}
          >
            {currentLength}/{maxLength}
          </span>
        ) : null}
      </div>
      <textarea
        id={inputId}
        maxLength={maxLength}
        value={value}
        className={cn(
          "w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400",
          error ? "border-rose-500" : "border-slate-300",
          className
        )}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error ? (
        <p className="text-xs font-medium text-rose-700">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}

export function Select({
  label,
  id,
  error,
  className,
  children,
  ...props
}: SelectProps) {
  const selectId = id || label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={selectId}
        className="block text-sm font-medium text-slate-800"
      >
        {label}
      </label>
      <select
        id={selectId}
        className={cn(
          "w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900",
          error ? "border-rose-500" : "border-slate-300",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p className="text-xs font-medium text-rose-700">{error}</p>
      ) : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-slate-200/80", className)}
      aria-hidden="true"
    />
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
      <div className="rounded-full bg-slate-100 p-3 text-slate-500">
        <Inbox className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description ? (
          <p className="max-w-md text-sm text-slate-600">{description}</p>
        ) : null}
      </div>
      {action ? <div className="pt-2">{action}</div> : null}
    </Card>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 border-rose-200 bg-rose-50/50 p-8 text-center">
      <AlertCircle className="h-6 w-6 text-rose-700" aria-hidden="true" />
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-900">
          Something went wrong
        </h3>
        <p className="text-sm text-slate-700">{message}</p>
      </div>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Retry
        </Button>
      ) : null}
    </Card>
  );
}
