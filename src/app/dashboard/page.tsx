import React from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Activity, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Chronos-Twin Live Dashboard | Multi-Level Cyber-Physical Digital Twin",
  description: "Live operational telemetry, Modbus side-channel verification, and cyber deception control panel.",
};

export default function DashboardPage() {
  return (
    <div className="flex h-screen w-screen flex-col bg-zinc-950 text-zinc-100 overflow-hidden selection:bg-zinc-800 selection:text-white">
      {/* Top Header Navigation Bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-4 backdrop-blur sm:px-6">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Overview</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2">
            <span className="h-3.5 w-px bg-zinc-800" />
            <span className="font-mono text-xs font-semibold text-zinc-200 tracking-tight">
              CHRONOS-TWIN
            </span>
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
              v1.0.0
            </span>
          </div>
        </div>

        {/* Status Indicators & External Link */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/30 px-2.5 py-0.5 text-[11px] font-mono text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Telemetry Active</span>
          </div>

          <a
            href="/dashboard/digital_twin_dashboard.html"
            target="_blank"
            rel="noopener noreferrer"
            title="Open raw dashboard in new tab"
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
          >
            <span>Full Window</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </header>

      {/* Embedded Digital Twin Cockpit */}
      <main className="relative flex-1 w-full bg-zinc-950 overflow-hidden">
        <iframe
          src="/dashboard/digital_twin_dashboard.html"
          title="Chronos-Twin Live Dashboard"
          className="h-full w-full border-0 bg-zinc-950"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      </main>
    </div>
  );
}
