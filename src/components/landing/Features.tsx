"use client";

import React from "react";
import { Shield, Zap, GitBranch, TerminalSquare, AlertCircle, ArrowUpRight } from "lucide-react";

export function Features() {
  return (
    <section id="features" className="py-16 sm:py-24 border-b border-zinc-800/60 bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="max-w-2xl">
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500">
            Defense Mechanisms
          </h2>
          <p className="mt-2 text-2xl sm:text-3xl font-medium tracking-tight text-zinc-100">
            Four layers of physics-informed industrial verification
          </p>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Eliminating blind spots where PLC software falsification conceals machine degradation or deliberate cyber-physical sabotage.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Feature 1: Lie Detector */}
          <div id="detection" className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col justify-between hover:border-zinc-700 transition">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-cyan-400">
                  <Zap className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-mono text-zinc-500">Physics Audit</span>
              </div>
              
              <h3 className="mt-4 text-base font-medium text-zinc-100">
                Side-Channel "Power-to-Packet" Lie Detector
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                When an attacker modifies PLC firmware to report normal 2,400 RPM over Modbus TCP port 502, physical CT current clamps measure true electrical draw. A drop to 4.2A immediately flags register spoofing.
              </p>
            </div>

            <div className="mt-6 rounded-lg border border-zinc-800/80 bg-zinc-950 p-3 font-mono text-xs">
              <div className="flex justify-between text-zinc-400 pb-1.5 border-b border-zinc-800/60">
                <span>PLC Software Claim</span>
                <span className="text-zinc-200">2,400 RPM (99.8% Uptime)</span>
              </div>
              <div className="flex justify-between text-zinc-400 pt-1.5">
                <span>CT Clamp Truth</span>
                <span className="text-rose-400">4.2 Amps (Idle Sabotage)</span>
              </div>
            </div>
          </div>

          {/* Feature 2: Cross-Node Flow */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col justify-between hover:border-zinc-700 transition">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-emerald-400">
                  <GitBranch className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-mono text-zinc-500">Differential Flow</span>
              </div>
              
              <h3 className="mt-4 text-base font-medium text-zinc-100">
                Cross-Node Conservation of Mass Balance
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Treats interconnected factory stages as a directed acyclic graph. If Level 2 produces 120 units/hr but Level 3 processes 18 units/hr, upstream buffers pile up while downstream buffers drain toward starvation.
              </p>
            </div>

            <div className="mt-6 rounded-lg border border-zinc-800/80 bg-zinc-950 p-3 font-mono text-xs">
              <div className="flex justify-between text-zinc-400 pb-1.5 border-b border-zinc-800/60">
                <span>Upstream Buffer (S2 &rarr; S3)</span>
                <span className="text-amber-400">Congesting (98% capacity)</span>
              </div>
              <div className="flex justify-between text-zinc-400 pt-1.5">
                <span>Downstream Starvation</span>
                <span className="text-rose-400">Projected in 02m 15s</span>
              </div>
            </div>
          </div>

          {/* Feature 3: Active Deception Honeypot */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col justify-between hover:border-zinc-700 transition">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-purple-400">
                  <Shield className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-mono text-zinc-500">Active Defense</span>
              </div>
              
              <h3 className="mt-4 text-base font-medium text-zinc-100">
                Autonomous Deception Honeypot PLC
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Instead of simply raising an alert, operators can shadow-isolate the attacker&apos;s IP into a virtualized Modbus tarpit at 10.99.0.42. Synthetic telemetry feeds fake healthy metrics back to the adversary while line traffic reroutes.
              </p>
            </div>

            <div className="mt-6 rounded-lg border border-zinc-800/80 bg-zinc-950 p-3 font-mono text-xs text-zinc-400 flex items-center justify-between">
              <span>Quarantine Target: IP 192.168.1.103</span>
              <span className="text-purple-400">Tarpit Sinkhole Active</span>
            </div>
          </div>

          {/* Feature 4: Time-to-Starvation Math */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col justify-between hover:border-zinc-700 transition">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-300">
                  <TerminalSquare className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-mono text-zinc-500">Deterministic ML</span>
              </div>
              
              <h3 className="mt-4 text-base font-medium text-zinc-100">
                Zero-Fluff Explainable Ripple Analytics
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                No fragile black-box neural networks. Deterministic graph dependency physics and buffer drainage equations generate dollar-per-hour loss projections and actionable forensic briefs immediately consumable by operators.
              </p>
            </div>

            <div className="mt-6 rounded-lg border border-zinc-800/80 bg-zinc-950 p-3 font-mono text-xs text-zinc-400 flex items-center justify-between">
              <span>Projected Idle Ripple Loss</span>
              <span className="text-zinc-200 tabular-nums">$14,250 / hr</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
