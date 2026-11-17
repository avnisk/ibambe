"use client";

import React from "react";
import Link from "next/link";
import { Activity, ShieldCheck, Terminal } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 text-zinc-100 hover:text-white transition">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-200">
            <Activity className="h-4 w-4" />
          </div>
          <span className="font-medium text-sm tracking-tight">Chronos-Twin</span>
          <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 border border-zinc-800">
            v2.0
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs text-zinc-400 font-medium">
          <a href="#hero" className="hover:text-zinc-200 transition">
            Overview
          </a>
          <a href="#detection" className="hover:text-zinc-200 transition">
            Side-channel audit
          </a>
          <a href="#features" className="hover:text-zinc-200 transition">
            Architecture
          </a>
          <a
            href="https://github.com/avnisk/ibambe"
            target="_blank"
            rel="noreferrer"
            className="hover:text-zinc-200 transition flex items-center gap-1.5"
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Repository</span>
          </a>
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/digital_twin_dashboard.html"
            className="inline-flex h-8 items-center justify-center rounded-md bg-zinc-100 px-3 text-xs font-medium text-zinc-950 transition hover:bg-white active:bg-zinc-200 shadow-sm"
          >
            Open command center
          </Link>
        </div>
      </div>
    </header>
  );
}
