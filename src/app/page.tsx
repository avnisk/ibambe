import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";
import { getDigitalTwinState } from "@/lib/api";

export default async function Home() {
  const initialState = await getDigitalTwinState();

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-between selection:bg-zinc-800 selection:text-white">
      <Navbar />
      <main className="flex-1">
        <Hero initialState={initialState} />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
