"use client";

import dynamic from "next/dynamic";
import QuizForm from "@/components/QuizForm";
import VenueFinder from "@/components/VenueFinder";
import FlyerGenerator from "@/components/FlyerGenerator";
import { useFestivalStore } from "@/store/festival-store";

const StageBuilder = dynamic(() => import("@/components/StageBuilder"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-purple-400 animate-pulse text-lg">
        Loading Stage Builder...
      </div>
    </div>
  ),
});

const tabs = [
  { label: "\uD83C\uDFB5 Lineup Quiz", id: 0 },
  { label: "\uD83C\uDFB8 Stage Builder", id: 1 },
  { label: "\uD83D\uDCCD Find Venue", id: 2 },
  { label: "\uD83C\uDFA8 Generate Flyer", id: 3 },
];

export default function Home() {
  const activeTab = useFestivalStore((s) => s.activeTab);
  const setActiveTab = useFestivalStore((s) => s.setActiveTab);
  const lineup = useFestivalStore((s) => s.lineup);
  const stageElements = useFestivalStore((s) => s.stageElements);
  const selectedVenue = useFestivalStore((s) => s.selectedVenue);
  const flyerUrl = useFestivalStore((s) => s.generatedFlyerUrl);

  const completionSteps = [
    { label: "Lineup generated", done: lineup !== null },
    { label: "Stage designed", done: stageElements.length > 0 },
    { label: "Venue selected", done: selectedVenue !== null },
    { label: "Flyer generated", done: flyerUrl !== null },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="pt-10 pb-6 px-4 text-center">
        <h1
          className="text-5xl sm:text-6xl font-extrabold tracking-tight glow-text"
          style={{
            background:
              "linear-gradient(90deg, var(--festival-purple), var(--festival-pink), var(--festival-orange))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          FESTIVAL MAINSTAGE BUILDER
        </h1>
        <p className="mt-3 text-lg text-purple-300/70 tracking-wide">
          Design Your Dream Festival Experience
        </p>
      </header>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 px-4 pb-4">
        {completionSteps.map((step, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs sm:text-sm">
            <span
              className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                step.done
                  ? "bg-green-500 text-white"
                  : "border border-purple-500/40 text-purple-500/40"
              }`}
            >
              {step.done ? "\u2713" : i + 1}
            </span>
            <span
              className={
                step.done ? "text-green-400" : "text-purple-400/40"
              }
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <nav className="flex justify-center gap-2 sm:gap-3 px-4 pb-6">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-2.5 rounded-full text-sm sm:text-base font-semibold
                transition-all duration-300 cursor-pointer
                ${
                  isActive
                    ? "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white tab-active"
                    : "bg-white/5 text-purple-300/60 hover:bg-white/10 hover:text-purple-200 border border-purple-500/20"
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Tab Content */}
      <main className="flex-1 px-4 pb-10 max-w-6xl w-full mx-auto">
        <div className="rounded-2xl border border-purple-500/20 bg-white/[0.03] backdrop-blur-sm p-6 min-h-[500px]">
          {activeTab === 0 && <QuizForm />}
          {activeTab === 1 && <StageBuilder />}
          {activeTab === 2 && <VenueFinder />}
          {activeTab === 3 && <FlyerGenerator />}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-purple-400/30 text-xs tracking-widest uppercase">
        Festival Mainstage Builder &mdash; Build. Design. Experience.
      </footer>
    </div>
  );
}
