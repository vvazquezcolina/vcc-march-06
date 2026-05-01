"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import QuizForm from "@/components/QuizForm";
import VenueFinder from "@/components/VenueFinder";
import FlyerGenerator from "@/components/FlyerGenerator";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useFestivalStore } from "@/store/festival-store";
import { decodeFestivalFromUrl } from "@/lib/festival-codec";

const StageBuilder = dynamic(() => import("@/components/StageBuilder"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[500px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-white/10 border-t-zinc-500 rounded-full animate-spin" />
        <span className="text-sm text-white/30">Initializing 3D engine...</span>
      </div>
    </div>
  ),
});

const STEPS = [
  { id: 0, label: "Lineup", shortLabel: "01", desc: "Build your lineup" },
  { id: 1, label: "Stage", shortLabel: "02", desc: "Design the mainstage" },
  { id: 2, label: "Venue", shortLabel: "03", desc: "Pick a location" },
  { id: 3, label: "Poster", shortLabel: "04", desc: "Generate your flyer" },
];

export default function Home() {
  const activeTab = useFestivalStore((s) => s.activeTab);
  const setActiveTab = useFestivalStore((s) => s.setActiveTab);
  const lineup = useFestivalStore((s) => s.lineup);
  const stageElements = useFestivalStore((s) => s.stageElements);
  const selectedVenue = useFestivalStore((s) => s.selectedVenue);
  const flyerUrl = useFestivalStore((s) => s.generatedFlyerUrl);
  const [mounted, setMounted] = useState(false);

  // SSR-safe mount flag. The setState-in-effect is the canonical way to
  // delay rendering until hydration finishes; React 19's strictness flags
  // it but the tradeoff is acceptable here.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  // Hydrate the store from a `?stage=…` share link, exactly once on first
  // mount. Strips the param afterward so a manual refresh gives the user a
  // clean session instead of replaying the encoded state forever.
  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("stage");
    if (!encoded) return;
    const data = decodeFestivalFromUrl(encoded);
    if (!data) return;
    const store = useFestivalStore.getState();
    if (data.lineup) useFestivalStore.setState({ lineup: data.lineup });
    if (data.selectedVenue)
      useFestivalStore.setState({ selectedVenue: data.selectedVenue });
    if (data.customNotes)
      useFestivalStore.setState({ customNotes: data.customNotes });
    if (Array.isArray(data.stageElements) && data.stageElements.length > 0) {
      store.setStageElements(data.stageElements);
    }
    window.history.replaceState({}, "", window.location.pathname);
  }, [mounted]);

  const done = [
    lineup !== null,
    stageElements.length > 0,
    selectedVenue !== null,
    flyerUrl !== null,
  ];

  if (!mounted) return null;

  return (
    <>
      <AnimatedBackground />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* ─── Top Bar ─── */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-500 to-zinc-400 flex items-center justify-center text-sm font-black">
              M
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-wide text-white/90">
                Mainstage Builder
              </h1>
              <p className="text-[10px] text-white/25 tracking-wider uppercase">
                Festival Creator
              </p>
            </div>
          </div>

          {/* Progress dots */}
          <div className="hidden sm:flex items-center gap-1.5">
            {done.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div
                  className={`w-2 h-2 rounded-full transition-all duration-500 ${
                    d
                      ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]"
                      : i === activeTab
                      ? "bg-white/40 shadow-[0_0_6px_rgba(255,255,255,0.3)]"
                      : "bg-white/10"
                  }`}
                />
                {i < 3 && (
                  <div className={`w-6 h-px ${d ? "bg-green-400/30" : "bg-white/[0.06]"}`} />
                )}
              </div>
            ))}
          </div>

          <div className="text-[10px] text-white/20 tracking-widest uppercase">
            {done.filter(Boolean).length}/4 complete
          </div>
        </header>

        {/* ─── Navigation ─── */}
        <nav className="px-6 py-3 border-b border-white/[0.04]">
          <div className="max-w-5xl mx-auto flex gap-1">
            {STEPS.map((step, i) => {
              const isActive = activeTab === step.id;
              const isDone = done[i];
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveTab(step.id)}
                  className={`
                    relative flex-1 px-4 py-2.5 rounded-lg text-left transition-all duration-200 cursor-pointer
                    ${isActive
                      ? "bg-white/[0.06] border border-white/[0.08]"
                      : "hover:bg-white/[0.03] border border-transparent"
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`text-[10px] font-mono ${isActive ? "text-white/40" : "text-white/20"}`}>
                        {step.shortLabel}
                      </span>
                      <span className={`ml-2 text-sm font-medium ${isActive ? "text-white" : "text-white/40"}`}>
                        {step.label}
                      </span>
                    </div>
                    {isDone && (
                      <span className="text-green-400 text-xs">&#10003;</span>
                    )}
                  </div>
                  <p className={`text-[11px] mt-0.5 ${isActive ? "text-white/30" : "text-white/10"}`}>
                    {step.desc}
                  </p>
                  {isActive && (
                    <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-white/20 via-white/15 to-transparent" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* ─── Content ─── */}
        <main className="flex-1 px-6 py-6">
          <div className="max-w-5xl mx-auto" key={activeTab}>
            <div className="tab-content-enter">
              {activeTab === 0 && <QuizForm />}
              {activeTab === 1 && <StageBuilder />}
              {activeTab === 2 && <VenueFinder />}
              {activeTab === 3 && <FlyerGenerator />}
            </div>
          </div>
        </main>

        {/* ─── Footer ─── */}
        <footer className="px-6 py-3 border-t border-white/[0.04] flex items-center justify-between">
          <span className="text-[10px] text-white/15 tracking-wider">
            Forms &middot; WebGL &middot; Google Maps &middot; Nano Banana 2
          </span>
          <span className="text-[10px] text-white/10">
            Festival Mainstage Builder
          </span>
        </footer>
      </div>
    </>
  );
}
