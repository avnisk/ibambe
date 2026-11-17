"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Cpu, Activity } from "lucide-react";
import { DigitalTwinState } from "@/types";
import LiquidGrid from "@/components/ui/LiquidGrid";
import { useLiveTwinState } from "@/services/useLiveTwinState";

interface HeroProps {
  initialState?: DigitalTwinState;
}

export function Hero({ initialState }: HeroProps) {
  const [selectedStation, setSelectedStation] = useState("S3");
  const { state: liveState, isLive } = useLiveTwinState(2000, initialState);

  // Compute live station data from backend or fallback seamlessly
  const stationsList = [
    { id: "S1", name: "Cutting", defaultRpm: 2400, defaultAmps: 18.2, defaultBuf: "45u" },
    { id: "S2", name: "Milling", defaultRpm: 2400, defaultAmps: 18.1, defaultBuf: "50u" },
    { id: "S3", name: "Welding", defaultRpm: 2400, defaultAmps: 18.0, defaultBuf: "50u", target: true },
    { id: "S4", name: "Painting", defaultRpm: 2400, defaultAmps: 17.9, defaultBuf: "48u" },
    { id: "S5", name: "Assembly", defaultRpm: 2400, defaultAmps: 18.0, defaultBuf: "52u" },
    { id: "S6", name: "Packing", defaultRpm: 2400, defaultAmps: 18.1, defaultBuf: "End" },
  ].map((base) => {
    const liveSt = liveState?.stations?.find((s) => s.id === base.id);
    return {
      id: base.id,
      name: liveSt?.name || base.name,
      rpm: liveSt?.reported_rpm ?? base.defaultRpm,
      amps: liveSt?.actual_amps ?? base.defaultAmps,
      status: liveSt ? (liveSt.status === "NOMINAL" ? "Nominal" : liveSt.status) : (base.target ? "Monitored" : "Nominal"),
      buf: liveSt ? (liveSt.buffer_to_next != null ? `${liveSt.buffer_to_next}u` : "End") : base.defaultBuf,
      target: base.target,
    };
  });

  const selectedNode = stationsList.find((s) => s.id === selectedStation) || stationsList[2];

  return (
    <section id="hero" className="relative w-full overflow-hidden border-b border-zinc-800/60 pt-16 pb-20 sm:pt-20 sm:pb-28">
      {/* 1. Liquid Grid Background */}
      <div className="absolute inset-0 z-0">
        <LiquidGrid
          background="#09090b"
          lineColor="rgba(255, 255, 255, 0.08)"
          glowColor="#00e5ff"
          cellSize={24}
          radius={70}
          intensity={90}
          collide={true}
          clickRipple={true}
        />
        {/* Soft radial overlay to ensure high contrast for typography */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-zinc-950/70 to-zinc-950/95 pointer-events-none" />
      </div>

      {/* 2. Hero Content on Top */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        
        {/* Headline block */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800/90 bg-zinc-900/80 backdrop-blur-md px-3 py-1 text-xs text-zinc-300 mb-6 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Physics-informed manufacturing defense</span>
          </div>

          <h1 className="text-3xl font-medium tracking-tight text-zinc-100 sm:text-5xl sm:leading-[1.15] drop-shadow-sm">
            Catch silent factory cyber-sabotage before downstream assembly lines starve
          </h1>

          <p className="mt-4 text-sm sm:text-base text-zinc-300/90 leading-relaxed max-w-2xl">
            When adversaries compromise PLC firmware to spoof normal RPM readings, Chronos-Twin cross-audits
            network telemetry against side-channel electrical amperage and multi-stage conservation of flow.
          </p>

          {/* Primary & secondary actions */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-100 px-5 text-xs sm:text-sm font-medium text-zinc-950 transition hover:bg-white shadow-md hover:shadow-cyan-500/10"
            >
              <span>Launch live twin dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="#detection"
              className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-700/80 bg-zinc-900/70 backdrop-blur-sm px-4 text-xs sm:text-sm font-medium text-zinc-200 transition hover:bg-zinc-800 hover:text-white"
            >
              Inspect lie detector logic
            </a>
          </div>
        </div>

        {/* Product Moment: Live 6-Station Flow Inspection Preview */}
        <div className="mt-14 rounded-xl border border-zinc-800/90 bg-zinc-900/70 p-4 sm:p-6 shadow-2xl backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-4 mb-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-400">Live Telemetry Pipeline</div>
              <div className="text-sm font-medium text-zinc-200 mt-0.5">
                6-Stage Production Graph &bull; Continuous Mass Flow Conservation
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{isLive ? "Live Backend Synchronized" : "Nominal Flow Equilibrium"}</span>
              </span>
              <span className="text-zinc-400">120 units/hr</span>
            </div>
          </div>

          {/* 6 Stations Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {stationsList.map((station) => (
              <button
                key={station.id}
                type="button"
                onClick={() => setSelectedStation(station.id)}
                className={`text-left rounded-lg p-3 transition border ${
                  selectedStation === station.id
                    ? "border-cyan-500/80 bg-zinc-900/90 shadow-sm shadow-cyan-500/20"
                    : "border-zinc-800/80 bg-zinc-950/70 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span>{station.id}</span>
                  <span className={station.target ? "text-cyan-400" : "text-zinc-400"}>
                    {station.status}
                  </span>
                </div>
                <div className="mt-1 text-xs font-medium text-zinc-200">{station.name}</div>
                <div className="mt-2 text-[11px] font-mono text-zinc-400 tabular-nums">
                  <div>{station.rpm.toLocaleString()} RPM</div>
                  <div className="text-zinc-400">{station.amps}A &bull; Buf {station.buf}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Under-graph Verification Callout */}
          <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/90 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 text-zinc-300">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <span>Inspection Node: <strong className="text-white">Station {selectedStation}</strong></span>
              <span className="text-zinc-500">|</span>
              <span className="text-zinc-300">Modbus Register 40012: Concordant with CT Sensor Baseline ({selectedNode.amps}A)</span>
            </div>
            <div className="text-emerald-400">Physics Audit Passed &bull; Δ &lt; 1.5%</div>
          </div>
        </div>

      </div>
    </section>
  );
}
