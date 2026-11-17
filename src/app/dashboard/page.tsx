import React from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ShieldAlert } from "lucide-react";
import Simulation from "@/components/ui/Simulation";

export const metadata = {
  title: "VoltGuard // Cyber-Physical Production Line Twin Dashboard",
  description: "Live operational telemetry, Modbus side-channel verification, and active deception honeypot control panel.",
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col selection:bg-zinc-800 selection:text-white">
      {/* Top Header Navigation Bar */}
      <header className="flex h-13 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-4 backdrop-blur sm:px-6 z-40">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Overview</span>
          </Link>

          <span className="hidden sm:inline-block h-4 w-px bg-zinc-800" />

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-cyan-400 tracking-wider">
              VOLTGUARD COCKPIT
            </span>
            <span className="rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 text-[10px] font-mono">
              3D Live Twin
            </span>
          </div>
        </div>

        {/* Status Indicators & External Link */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/30 px-2.5 py-0.5 text-[11px] font-mono text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>OPC-UA Synchronized</span>
          </div>

          <a
            href="/digital_twin_manufacturing_workstation_simulator.html"
            target="_blank"
            rel="noopener noreferrer"
            title="Open standalone 3D simulator in full screen"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
          >
            <span>Full Window</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </header>

      {/* Render the 3D VoltGuard Simulation Component */}
      <main className="flex-1 p-3 sm:p-5 flex flex-col max-w-[1700px] w-full mx-auto">
        <Simulation />
      </main>
    </div>
  );
}
