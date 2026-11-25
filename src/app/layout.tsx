import type { Metadata } from "next";
import "./globals.css";
import { DemoProvider } from "@/components/DemoContext";
import { ToastProvider } from "@/components/ui/Toast";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "TeamForge — Tactical Student Project Collaboration (Demo)",
  description:
    "Core flow prototype for structured student project collaboration: project posting, role-based applications with Proof-of-Work snapshots, and creator decisions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <DemoProvider>
            <AppShell>{children}</AppShell>
          </DemoProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
