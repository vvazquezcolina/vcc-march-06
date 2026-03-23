"use client";

import { useState } from "react";
import { useFestivalStore } from "@/store/festival-store";

interface StepConfig {
  title: string;
  key: "genre" | "energy" | "crowdSize" | "era" | "vibe";
  options: { label: string; value: string }[];
}

const steps: StepConfig[] = [
  {
    title: "Genre",
    key: "genre",
    options: [
      { label: "Rock", value: "Rock" },
      { label: "Electronic / EDM", value: "Electronic/EDM" },
      { label: "Hip-Hop", value: "Hip-Hop" },
      { label: "Pop", value: "Pop" },
      { label: "Indie", value: "Indie" },
      { label: "Latin", value: "Latin" },
    ],
  },
  {
    title: "Energy",
    key: "energy",
    options: [
      { label: "Chill & Groovy", value: "Chill & Groovy" },
      { label: "Balanced", value: "Balanced" },
      { label: "High Energy Chaos", value: "High Energy Chaos" },
    ],
  },
  {
    title: "Crowd Size",
    key: "crowdSize",
    options: [
      { label: "Intimate (500)", value: "Intimate (500)" },
      { label: "Medium (5,000)", value: "Medium (5000)" },
      { label: "Massive (50,000+)", value: "Massive (50000+)" },
    ],
  },
  {
    title: "Headliner Era",
    key: "era",
    options: [
      { label: "Classic Legends", value: "Classic Legends" },
      { label: "Current Hitmakers", value: "Current Hitmakers" },
      { label: "Rising Stars", value: "Rising Stars" },
    ],
  },
  {
    title: "Vibe",
    key: "vibe",
    options: [
      { label: "Desert Oasis", value: "Desert Oasis" },
      { label: "Urban Jungle", value: "Urban Jungle" },
      { label: "Forest Wonderland", value: "Forest Wonderland" },
      { label: "Beach Paradise", value: "Beach Paradise" },
    ],
  },
];

export default function QuizForm() {
  const store = useFestivalStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    genre: "",
    energy: "",
    crowdSize: "",
    era: "",
    vibe: "",
  });
  const [newArtist, setNewArtist] = useState<Record<string, string>>({
    headliners: "",
    subHeadliners: "",
    openers: "",
  });

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const selected = answers[step.key];

  function handleNext() {
    if (!selected) return;
    if (isLast) {
      store.setQuizAnswers(answers);
      store.generateLineup();
      return;
    }
    setCurrentStep((s) => s + 1);
  }

  // ── Lineup editing view ──
  if (store.lineup) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white/90">Your Lineup</h2>
          <p className="text-xs text-white/30 mt-0.5">
            Edit names, add or remove artists, then continue
          </p>
        </div>

        {(
          [
            { key: "headliners" as const, label: "Headliners" },
            { key: "subHeadliners" as const, label: "Sub-Headliners" },
            { key: "openers" as const, label: "Openers" },
          ] as const
        ).map(({ key, label }) => (
          <div key={key} className="mb-5">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-2">
              {label}
            </h3>
            <div className="space-y-1.5">
              {store.lineup![key].map((artist, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={artist.name}
                    onChange={(e) =>
                      store.updateArtistName(key, idx, e.target.value)
                    }
                    className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-sm text-white outline-none focus:border-white/[0.1] transition-colors"
                  />
                  <button
                    onClick={() => store.removeArtist(key, idx)}
                    className="px-2 py-1.5 rounded-md text-xs text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="text"
                placeholder={`Add ${label.toLowerCase().slice(0, -1)}...`}
                value={newArtist[key] ?? ""}
                onChange={(e) =>
                  setNewArtist((p) => ({ ...p, [key]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (newArtist[key] ?? "").trim()) {
                    store.addArtist(
                      key,
                      newArtist[key].trim(),
                      answers.genre || "mixed"
                    );
                    setNewArtist((p) => ({ ...p, [key]: "" }));
                  }
                }}
                className="flex-1 rounded-lg border border-dashed border-white/[0.08] bg-transparent px-3 py-1.5 text-xs text-white placeholder-white/15 outline-none focus:border-white/[0.08] transition-colors"
              />
              <button
                onClick={() => {
                  if ((newArtist[key] ?? "").trim()) {
                    store.addArtist(
                      key,
                      newArtist[key].trim(),
                      answers.genre || "mixed"
                    );
                    setNewArtist((p) => ({ ...p, [key]: "" }));
                  }
                }}
                className="px-2.5 py-1.5 rounded-md text-xs text-white/30 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>
        ))}

        <div className="mt-4">
          <label className="block text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-1.5">
            Notes
          </label>
          <textarea
            rows={2}
            placeholder="E.g. I want a surprise guest, late-night DJ set..."
            value={store.customNotes.quiz}
            onChange={(e) => store.setCustomNote("quiz", e.target.value)}
            className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs text-white placeholder-white/15 outline-none focus:border-white/[0.1] transition-colors"
          />
        </div>

        <button
          onClick={() => store.setActiveTab(1)}
          className="mt-5 w-full py-2.5 rounded-lg bg-white/[0.08] text-sm font-medium text-white hover:bg-white/[0.12] transition-colors cursor-pointer"
        >
          Continue to Stage Builder
        </button>
      </div>
    );
  }

  // ── Quiz view ──
  return (
    <div className="max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-3 mb-8">
        {steps.map((_, i) => (
          <div key={i} className="flex-1 flex items-center gap-2">
            <div
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i < currentStep
                  ? "bg-zinc-500/60"
                  : i === currentStep
                  ? "bg-white/30"
                  : "bg-white/[0.06]"
              }`}
            />
          </div>
        ))}
        <span className="text-[10px] text-white/20 font-mono shrink-0">
          {currentStep + 1}/{steps.length}
        </span>
      </div>

      {/* Question */}
      <div className="mb-6" key={currentStep}>
        <div className="tab-content-enter">
          <h2 className="text-xl font-semibold text-white/90 mb-1">
            {step.title}
          </h2>
          <p className="text-xs text-white/30 mb-5">
            {currentStep === 0 && "Pick the sound that moves your soul"}
            {currentStep === 1 && "How hard do you want to go?"}
            {currentStep === 2 && "How big is your dream festival?"}
            {currentStep === 3 && "Who belongs on top of the poster?"}
            {currentStep === 4 && "Where does the magic happen?"}
          </p>

          <div className="space-y-1.5">
            {step.options.map((option) => {
              const isSelected = selected === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() =>
                    setAnswers((prev) => ({ ...prev, [step.key]: option.value }))
                  }
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? "border-white/[0.1] bg-white/[0.04] text-white"
                      : "border-white/[0.06] bg-white/[0.02] text-white/50 hover:bg-white/[0.04] hover:text-white/70 hover:border-white/[0.1]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{option.label}</span>
                    <div
                      className={`w-4 h-4 rounded-full border-2 transition-colors flex items-center justify-center ${
                        isSelected
                          ? "border-zinc-400 bg-zinc-400"
                          : "border-white/20"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => currentStep > 0 && setCurrentStep((s) => s - 1)}
          disabled={currentStep === 0}
          className={`px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
            currentStep === 0
              ? "text-white/10 cursor-not-allowed"
              : "text-white/40 hover:text-white hover:bg-white/[0.06]"
          }`}
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!selected}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            selected
              ? "bg-white/[0.08] text-white hover:bg-white/[0.12]"
              : "bg-white/[0.04] text-white/15 cursor-not-allowed"
          }`}
        >
          {isLast ? "Generate Lineup" : "Next"}
        </button>
      </div>
    </div>
  );
}
