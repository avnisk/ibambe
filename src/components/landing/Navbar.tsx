"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Activity, Terminal, Menu, X } from "lucide-react";

const navLinks = [
  { label: "Overview", href: "#hero" },
  { label: "Side-channel audit", href: "#detection" },
  { label: "Architecture", href: "#features" },
] as const;

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-6">
        {/* Brand — fixed width, never shrinks */}
        <Link
          href="/"
          className="mr-auto flex shrink-0 items-center gap-2 text-zinc-100 hover:text-white transition"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900">
            <Activity className="h-4 w-4 text-zinc-200" />
          </div>
          <span className="text-sm font-medium tracking-tight">VoltGuard</span>
          <span className="hidden sm:inline rounded bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-cyan-400">
            v4.0
          </span>
        </Link>

        {/* Desktop nav — centered, hidden below md */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-zinc-400">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap py-1 hover:text-zinc-100 transition"
            >
              {link.label}
            </a>
          ))}
          <a
            href="https://github.com/avnisk/ibambe"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 whitespace-nowrap py-1 hover:text-zinc-100 transition"
          >
            <Terminal className="h-3.5 w-3.5" />
            Repository
          </a>
        </nav>

        {/* Right actions — never shrinks */}
        <div className="ml-auto flex shrink-0 items-center gap-4">
          <Link
            href="/login"
            className="hidden sm:inline-flex text-xs font-medium text-zinc-400 hover:text-zinc-100 transition whitespace-nowrap"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex h-8 items-center justify-center rounded-md bg-zinc-100 px-3.5 text-xs font-medium text-zinc-950 shadow-sm transition hover:bg-white active:bg-zinc-200 whitespace-nowrap"
          >
            Command center
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="inline-flex lg:hidden h-8 w-8 items-center justify-center rounded-md border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <nav className="border-t border-zinc-800/60 bg-zinc-950/95 px-4 pb-4 pt-3 lg:hidden">
          <div className="flex flex-col gap-3 text-sm font-medium text-zinc-400">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="hover:text-zinc-100 transition"
              >
                {link.label}
              </a>
            ))}
            <a
              href="https://github.com/avnisk/ibambe"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-zinc-100 transition"
            >
              <Terminal className="h-3.5 w-3.5" />
              Repository
            </a>
            <div className="mt-2 flex flex-col gap-2 border-t border-zinc-800/60 pt-3">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 transition"
              >
                Sign in
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-9 items-center justify-center rounded-md bg-zinc-100 px-4 text-sm font-medium text-zinc-950 shadow-sm transition hover:bg-white active:bg-zinc-200"
              >
                Command center
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
