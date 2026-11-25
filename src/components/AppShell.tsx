"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, FileCheck2, FolderPlus, RotateCcw, Users } from "lucide-react";
import { useDemo } from "./DemoContext";
import { useToast } from "./ui/Toast";
import { Button, cn } from "./ui/primitives";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, demoUsers, switchUser, resetDemo } = useDemo();
  const { showToast } = useToast();

  const handleReset = async () => {
    await resetDemo();
    showToast("Demo data reset to initial seed.", "info");
  };

  const navItems = [
    { href: "/projects", label: "Projects", icon: Compass },
    { href: "/projects/new", label: "Post project", icon: FolderPlus },
    { href: "/my-applications", label: "My applications", icon: FileCheck2 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Permanent Honesty Ribbon (PRD Section 7) */}
      <div className="bg-slate-900 px-4 py-1.5 text-center text-xs font-medium text-slate-100">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
          Demo build · synthetic data · Reliability scores & auto-close timers are simulated
        </span>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link
              href="/projects"
              className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-sm font-bold text-white">
                T
              </span>
              <span>TeamForge</span>
            </Link>

            <nav className="flex items-center gap-1" aria-label="Main navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/projects"
                    ? pathname === "/projects" ||
                      (pathname.startsWith("/projects/") &&
                        pathname !== "/projects/new")
                    : pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-blue-50 text-blue-800"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Demo User Switcher & Reset */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              Demo mode
            </span>

            {demoUsers.length > 0 && currentUser ? (
              <label className="sr-only" htmlFor="demo-user-select">
                Switch demo account
              </label>
            ) : null}
            {demoUsers.length > 0 && currentUser ? (
              <select
                id="demo-user-select"
                value={currentUser.id}
                onChange={(e) => void switchUser(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800"
                aria-label="Switch demo account"
              >
                {demoUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.demoRoleLabel}
                  </option>
                ))}
              </select>
            ) : null}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleReset()}
              title="Reset localStorage to initial demo seed"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Reset demo data</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
