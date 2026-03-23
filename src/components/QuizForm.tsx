"use client";

import { useState } from "react";
import { useFestivalStore } from "@/store/festival-store";
import type { Lineup } from "@/types/festival";

interface StepConfig {
  title: string;
  subtitle: string;
  key: "genre" | "energy" | "crowdSize" | "era" | "vibe";
  options: { label: string; value: string; icon: string }[];
}

const steps: StepConfig[] = [
  {
    title: "What's Your Genre?",
    subtitle: "Pick the sound that moves your soul",
    key: "genre",
    options: [
      { label: "Rock", value: "Rock", icon: "\uD83C\uDFB8" },
      { label: "Electronic / EDM", value: "Electronic/EDM", icon: "\uD83C\uDFDB" },
      { label: "Hip-Hop", value: "Hip-Hop", icon: "\uD83C\uDFA4" },
      { label: "Pop", value: "Pop", icon: "\u2B50" },
      { label: "Indie", value: "Indie", icon: "\uD83C\uDF3B" },
      { label: "Latin", value: "Latin", icon: "\uD83D\uDD25" },
    ],
  },
  {
    title: "Energy Level",
    subtitle: "How hard do you want to go?",
    key: "energy",
    options: [
      { label: "Chill & Groovy", value: "Chill & Groovy", icon: "\uD83C\uDF19" },
      { label: "Balanced", value: "Balanced", icon: "\u2696\uFE0F" },
      { label: "High Energy Chaos", value: "High Energy Chaos", icon: "\u26A1" },
    ],
  },
  {
    title: "Crowd Size",
    subtitle: "How big is your dream stage?",
    key: "crowdSize",
    options: [
      { label: "Intimate (500)", value: "Intimate (500)", icon: "\uD83E\uDEAB" },
      { label: "Medium (5,000)", value: "Medium (5000)", icon: "\uD83C\uDFAA" },
      { label: "Massive (50,000+)", value: "Massive (50000+)", icon: "\uD83C\uDFDF\uFE0F" },
    ],
  },
  {
    title: "Headliner Era",
    subtitle: "Who belongs on top of the poster?",
    key: "era",
    options: [
      { label: "Classic Legends", value: "Classic Legends", icon: "\uD83D\uDC51" },
      { label: "Current Hitmakers", value: "Current Hitmakers", icon: "\uD83D\uDCBF" },
      { label: "Rising Stars", value: "Rising Stars", icon: "\uD83D\uDE80" },
    ],
  },
  {
    title: "Festival Vibe",
    subtitle: "Where does the magic happen?",
    key: "vibe",
    options: [
      { label: "Desert Oasis", value: "Desert Oasis", icon: "\uD83C\uDFDC\uFE0F" },
      { label: "Urban Jungle", value: "Urban Jungle", icon: "\uD83C\uDFD9\uFE0F" },
      { label: "Forest Wonderland", value: "Forest Wonderland", icon: "\uD83C\uDF32" },
      { label: "Beach Paradise", value: "Beach Paradise", icon: "\uD83C\uDFD6\uFE0F" },
    ],
  },
];

export default function QuizForm() {
  const store = useFestivalStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isAnimating, setIsAnimating] = useState(false);
  const [answers, setAnswers] = useState({
    genre: "",
    energy: "",
    crowdSize: "",
    era: "",
    vibe: "",
  });

  const step = steps[currentStep];
  const totalSteps = steps.length;
  const isLastStep = currentStep === totalSteps - 1;
  const canProceed = answers[step.key] !== "";

  function selectOption(value: string) {
    setAnswers((prev) => ({ ...prev, [step.key]: value }));
  }

  function animateTransition(dir: "forward" | "backward", cb: () => void) {
    setDirection(dir);
    setIsAnimating(true);
    setTimeout(() => {
      cb();
      setIsAnimating(false);
    }, 300);
  }

  const [newArtistName, setNewArtistName] = useState<Record<string, string>>({
    headliners: '',
    subHeadliners: '',
    openers: '',
  });

  function handleNext() {
    if (!canProceed) return;
    if (isLastStep) {
      store.setQuizAnswers(answers);
      store.generateLineup();
      return;
    }
    animateTransition("forward", () => setCurrentStep((s) => s + 1));
  }

  function handleBack() {
    if (currentStep === 0) return;
    animateTransition("backward", () => setCurrentStep((s) => s - 1));
  }

  const progressPercent = ((currentStep + 1) / totalSteps) * 100;

  // Build animation classes
  const slideClass = isAnimating
    ? direction === "forward"
      ? "opacity-0 translate-x-8"
      : "opacity-0 -translate-x-8"
    : "opacity-100 translate-x-0";

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 p-4">
      {/* Decorative blurs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-pink-600/20 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-600/10 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
            Build Your Mainstage
          </h1>
          <p className="mt-2 text-sm text-purple-300/70">
            Answer 5 questions to generate your dream festival lineup
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-purple-300/80">
            <span>Step {currentStep + 1} of {totalSteps}</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10 backdrop-blur">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-purple-900/30 backdrop-blur-xl sm:p-8">
          {/* Step content with animation */}
          <div
            className={`transition-all duration-300 ease-in-out ${slideClass}`}
          >
            {/* Step title */}
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                {step.title}
              </h2>
              <p className="mt-1 text-sm text-purple-300/60">{step.subtitle}</p>
            </div>

            {/* Option cards */}
            <div
              className={`grid gap-3 ${
                step.options.length <= 3
                  ? "grid-cols-1 sm:grid-cols-3"
                  : "grid-cols-2 sm:grid-cols-3"
              }`}
            >
              {step.options.map((option) => {
                const isSelected = answers[step.key] === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => selectOption(option.value)}
                    className={`group relative flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 text-center transition-all duration-200
                      ${
                        isSelected
                          ? "border-pink-500 bg-pink-500/15 shadow-lg shadow-pink-500/25"
                          : "border-white/10 bg-white/5 hover:border-purple-400/50 hover:bg-white/10"
                      }
                    `}
                  >
                    {/* Glow ring on selected */}
                    {isSelected && (
                      <span className="absolute inset-0 rounded-xl ring-1 ring-pink-400/50 animate-pulse" />
                    )}
                    <span className="text-3xl transition-transform duration-200 group-hover:scale-110">
                      {option.icon}
                    </span>
                    <span
                      className={`text-sm font-semibold leading-tight ${
                        isSelected ? "text-pink-200" : "text-white/80"
                      }`}
                    >
                      {option.label}
                    </span>
                    {/* Radio dot */}
                    <span
                      className={`mt-1 inline-block h-3 w-3 rounded-full border-2 transition-colors ${
                        isSelected
                          ? "border-pink-400 bg-pink-400"
                          : "border-white/30 bg-transparent"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                currentStep === 0
                  ? "cursor-not-allowed text-white/20"
                  : "text-purple-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              &larr; Back
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed}
              className={`rounded-lg px-6 py-2.5 text-sm font-bold transition-all duration-200 ${
                canProceed
                  ? "bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 text-white shadow-lg shadow-pink-600/30 hover:shadow-pink-600/50 hover:brightness-110 active:scale-95"
                  : "cursor-not-allowed bg-white/10 text-white/30"
              }`}
            >
              {isLastStep ? "Generate Lineup \u2728" : "Next \u2192"}
            </button>
          </div>
        </div>

        {/* Step dots */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`inline-block h-2 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? "w-6 bg-pink-500"
                  : i < currentStep
                  ? "w-2 bg-purple-400"
                  : "w-2 bg-white/20"
              }`}
            />
          ))}
        </div>

        {/* ── Editable Lineup (shown after quiz generates lineup) ── */}
        {store.lineup && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-purple-900/30 backdrop-blur-xl sm:p-8">
            <h2 className="mb-1 text-center text-2xl font-bold text-white">
              Your Lineup
            </h2>
            <p className="mb-6 text-center text-sm text-purple-300/60">
              Edit artist names, add or remove artists, then confirm
            </p>

            {(
              [
                { key: 'headliners' as const, label: 'Headliners' },
                { key: 'subHeadliners' as const, label: 'Sub-Headliners' },
                { key: 'openers' as const, label: 'Openers' },
              ] as const
            ).map(({ key, label }) => (
              <div key={key} className="mb-5">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-purple-400">
                  {label}
                </h3>
                <div className="space-y-2">
                  {store.lineup![key].map((artist, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={artist.name}
                        onChange={(e) =>
                          store.updateArtistName(key, idx, e.target.value)
                        }
                        className="flex-1 rounded-lg border border-purple-500/30 bg-white/5 px-3 py-1.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-pink-500/60 focus:bg-white/10"
                      />
                      <button
                        type="button"
                        onClick={() => store.removeArtist(key, idx)}
                        className="shrink-0 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/25"
                        title="Remove artist"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add artist */}
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Add ${label.toLowerCase().slice(0, -1)}...`}
                    value={newArtistName[key] ?? ''}
                    onChange={(e) =>
                      setNewArtistName((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (newArtistName[key] ?? '').trim()) {
                        store.addArtist(key, newArtistName[key].trim(), answers.genre || 'mixed');
                        setNewArtistName((prev) => ({ ...prev, [key]: '' }));
                      }
                    }}
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder-white/20 outline-none transition-colors focus:border-purple-400/50"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if ((newArtistName[key] ?? '').trim()) {
                        store.addArtist(key, newArtistName[key].trim(), answers.genre || 'mixed');
                        setNewArtistName((prev) => ({ ...prev, [key]: '' }));
                      }
                    }}
                    className="shrink-0 rounded-md border border-purple-500/30 bg-purple-500/15 px-3 py-1.5 text-xs font-semibold text-purple-300 transition-colors hover:bg-purple-500/30"
                  >
                    + Add
                  </button>
                </div>
              </div>
            ))}

            {/* Notes textarea */}
            <div className="mt-4">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-purple-400">
                Notes for your lineup
              </label>
              <textarea
                rows={2}
                placeholder="E.g. I want a surprise guest, late-night DJ set..."
                value={store.customNotes.quiz}
                onChange={(e) => store.setCustomNote('quiz', e.target.value)}
                className="w-full resize-none rounded-lg border border-purple-500/30 bg-purple-900/20 px-3 py-2 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-pink-500/60"
              />
            </div>

            {/* Confirm button */}
            <button
              type="button"
              onClick={() => store.setActiveTab(1)}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-pink-600/30 transition-all duration-200 hover:shadow-pink-600/50 hover:brightness-110 active:scale-[0.98]"
            >
              Confirm Lineup &amp; Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
