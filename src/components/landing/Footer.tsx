import React from "react";
import Link from "next/link";
import { Activity } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-800/80 bg-zinc-950 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2 text-zinc-400 text-xs">
          <Activity className="h-4 w-4 text-zinc-500" />
          <span>Chronos-Twin &bull; Physics-Informed Cyber-Physical Manufacturing Digital Twin</span>
        </div>

        <div className="flex items-center gap-6 text-xs text-zinc-400">
          <Link href="/dashboard/digital_twin_dashboard.html" className="hover:text-zinc-200 transition">
            Live command center
          </Link>
          <a
            href="https://github.com/avnisk/ibambe"
            target="_blank"
            rel="noreferrer"
            className="hover:text-zinc-200 transition"
          >
            GitHub
          </a>
          <span className="text-zinc-600">Built for industrial OT resilience</span>
        </div>
      </div>
    </footer>
  );
}
