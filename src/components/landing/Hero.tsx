"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, AlertTriangle, ShieldAlert, Cpu } from "lucide-react";
import { DigitalTwinState } from "@/types";

interface HeroProps {
  initialState?: DigitalTwinState;
}

export function Hero({ initialState }: HeroProps) {
  const [selectedStation, setSelectedStation] = useState("S3");

  return (
    <section id="hero" className="relative pt-12 pb-16 sm:pt-16 sm:pb-24 border-b border-zinc-800/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        
        {/* Headline block */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-400 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Physics-informed manufacturing defense</span>
          </div>

          <h1 className="text-3xl font-medium tracking-tight text-zinc-100 sm:text-5xl sm:leading-[1.15]">
            Catch silent factory cyber-sabotage before downstream assembly lines starve
          </h1>

          <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl">
            When adversaries compromise PLC firmware to spoof normal RPM readings, Chronos-Twin cross-audits
            network telemetry against side-channel electrical amperage and multi-stage conservation of flow.
          </p>

          {/* Primary & secondary actions */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/dashboard/digital_twin_dashboard.html"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-100 px-5 text-xs sm:text-sm font-medium text-zinc-950 transition hover:bg-white"
            >
              <span>Launch live twin dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="#detection"
              className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900/40 px-4 text-xs sm:text-sm font-medium text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
            >
              Inspect lie detector logic
            </a>
          </div>
        </div>

        {/* Product Moment: Live 6-Station Flow Inspection Preview */}
        <div className="mt-14 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-4 mb-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-500">Live Telemetry Pipeline</div>
              <div className="text-sm font-medium text-zinc-200 mt-0.5">
                6-Stage Production Graph &bull; Continuous Mass Flow Conservation
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Nominal Flow Equilibrium</span>
              </span>
              <span className="text-zinc-500">120 units/hr</span>
            </div>
          </div>

          {/* 6 Stations Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { id: "S1", name: "Cutting", rpm: 2400, amps: 18.2, status: "Nominal", buf: "45u" },
              { id: "S2", name: "Milling", rpm: 2400, amps: 18.1, status: "Nominal", buf: "50u" },
              { id: "S3", name: "Welding", rpm: 2400, amps: 18.0, status: "Monitored", buf: "50u", target: true },
              { id: "S4", name: "Painting", rpm: 2400, amps: 17.9, status: "Nominal", buf: "48u" },
              { id: "S5", name: "Assembly", rpm: 2400, amps: 18.0, status: "Nominal", buf: "52u" },
              { id: "S6", name: "Packing", rpm: 2400, amps: 18.1, status: "Nominal", buf: "End" },
            ].map((station) => (
              <button
                key={station.id}
                type="button"
                onClick={() => setSelectedStation(station.id)}
                className={`text-left rounded-lg p-3 transition border ${
                  selectedStation === station.id
                    ? "border-cyan-500/80 bg-zinc-900 shadow-sm"
                    : "border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                  <span>{station.id}</span>
                  <span className={station.target ? "text-cyan-400" : "text-zinc-400"}>
                    {station.status}
                  </span>
                </div>
                <div className="mt-1 text-xs font-medium text-zinc-200">{station.name}</div>
                <div className="mt-2 text-[11px] font-mono text-zinc-400 tabular-nums">
                  <div>{station.rpm.toLocaleString()} RPM</div>
                  <div className="text-zinc-500">{station.amps}A &bull; Buf {station.buf}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Under-graph Verification Callout */}
          <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/80 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 text-zinc-300">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <span>Inspection Node: <strong className="text-white">Station {selectedStation}</strong></span>
              <span className="text-zinc-500">|</span>
              <span className="text-zinc-400">Modbus Register 40012: Concordant with CT Sensor Baseline (18.0A)</span>
            </div>
            <div className="text-emerald-400">Physics Audit Passed &bull; Δ &lt; 1.5%</div>
          </div>
        </div>

      </div>
    </section>
  );
}
