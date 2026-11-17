import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";
import Simulation from "@/components/ui/Simulation";
import { getDigitalTwinState } from "@/services/api";

export default async function Home() {
  const initialState = await getDigitalTwinState();

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-between selection:bg-zinc-800 selection:text-white">
      <Navbar />
      <main className="flex-1">
        <Hero initialState={initialState} />

        {/* 3D Automated Workstation Simulation Section */}
        <section id="simulation" className="border-b border-zinc-850 bg-zinc-950/80 py-16 sm:py-20 px-4 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3 py-1 text-xs font-mono text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>Continuous 3D Physics Simulation</span>
              </div>
              <h2 className="mt-3 text-2xl sm:text-3xl font-medium tracking-tight text-zinc-100">
                VoltGuard Interactive Automated Production Cell Workstation
              </h2>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                Real-time 6-station manufacturing flow with 3D camera orbits, material transformation stages, work order MES scheduling, and live telemetry tags.
              </p>
            </div>

            <Simulation />
          </div>
        </section>

        <Features />
      </main>
      <Footer />
    </div>
  );
}

