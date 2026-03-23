"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useFestivalStore } from "@/store/festival-store";
import { drawFestivalPoster } from "@/lib/poster-designs";
import { generateFestivalName, getVibeTagline } from "@/lib/festival-names";

export default function FlyerGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lineup = useFestivalStore((s) => s.lineup);
  const selectedVenue = useFestivalStore((s) => s.selectedVenue);
  const stageSnapshot = useFestivalStore((s) => s.stageSnapshot);
  const quizAnswers = useFestivalStore((s) => s.quizAnswers);
  const generatedFlyerUrl = useFestivalStore((s) => s.generatedFlyerUrl);
  const setFlyerUrl = useFestivalStore((s) => s.setFlyerUrl);
  const customNotes = useFestivalStore((s) => s.customNotes);
  const setCustomNote = useFestivalStore((s) => s.setCustomNote);

  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [festName, setFestName] = useState("");

  const vibe = quizAnswers?.vibe ?? "Urban Jungle";

  // Generate festival name on mount
  useEffect(() => {
    setFestName(generateFestivalName(vibe));
  }, [vibe]);

  const drawPoster = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !lineup) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 1200;

    drawFestivalPoster(ctx, canvas, {
      vibe,
      festivalName: festName || generateFestivalName(vibe),
      headliners: lineup.headliners.map((a) => a.name),
      subHeadliners: lineup.subHeadliners.map((a) => a.name),
      openers: lineup.openers.map((a) => a.name),
      venueName: selectedVenue?.name ?? "TBD",
      venueDescription: selectedVenue?.description ?? "",
      stageSnapshot,
      customNote: customNotes.flyer,
    });

    setFlyerUrl(canvas.toDataURL("image/png"));
  }, [lineup, selectedVenue, stageSnapshot, vibe, festName, customNotes.flyer, setFlyerUrl]);

  // Redraw when data changes
  useEffect(() => {
    if (lineup) {
      // Small delay for stageSnapshot image loading
      const timeout = setTimeout(drawPoster, 100);
      return () => clearTimeout(timeout);
    }
  }, [lineup, selectedVenue, stageSnapshot, festName, customNotes.flyer, drawPoster]);

  const handleGenerateAI = async () => {
    if (!lineup) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-flyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineup,
          venueName: selectedVenue?.name ?? "TBD",
          venueDescription: selectedVenue?.description ?? "",
          vibe,
          stageSnapshot: stageSnapshot ?? "",
          customNote: customNotes.flyer,
        }),
      });
      const data = await res.json();
      if (data.success && data.festivalName) {
        setFestName(data.festivalName);
      }
    } catch {
      // Ignore - canvas poster is the fallback
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${(festName || "festival").replace(/\s+/g, "-").toLowerCase()}-poster.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleShare = () => {
    const headlinerNames = lineup?.headliners.map((a) => a.name).join(" / ") ?? "";
    const text = `Check out my festival: ${festName}\n\nHEADLINERS: ${headlinerNames}\n${selectedVenue ? `📍 ${selectedVenue.name}` : ""}\n\nBuilt with Festival Mainstage Builder`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRegenName = () => {
    setFestName(generateFestivalName(vibe));
  };

  if (!lineup) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-white/30">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-3xl mb-4">
          🎨
        </div>
        <p className="text-base">Complete the previous steps first</p>
        <p className="text-xs text-white/15 mt-1">
          Lineup → Stage → Venue → Poster
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left: Controls */}
      <div className="lg:w-72 shrink-0 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white/90 mb-1">Festival Poster</h2>
          <p className="text-xs text-white/30">{getVibeTagline(vibe)}</p>
        </div>

        {/* Festival name */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1.5">
            Festival Name
          </label>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={festName}
              onChange={(e) => setFestName(e.target.value)}
              className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-purple-500/40 transition-colors"
            />
            <button
              onClick={handleRegenName}
              className="px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/40 hover:text-white hover:bg-white/[0.08] transition-all text-xs cursor-pointer"
              title="Generate new name"
            >
              ↻
            </button>
          </div>
        </div>

        {/* Custom note */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1.5">
            Custom Text
          </label>
          <textarea
            rows={2}
            placeholder="Add text to your poster..."
            value={customNotes.flyer}
            onChange={(e) => setCustomNote("flyer", e.target.value)}
            className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-purple-500/40 transition-colors"
          />
        </div>

        {/* Lineup summary */}
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-2">
            Lineup
          </h3>
          <div className="space-y-1.5">
            {lineup.headliners.map((a) => (
              <div key={a.name} className="text-sm font-semibold text-white/80">{a.name}</div>
            ))}
            <div className="h-px bg-white/[0.06] my-1" />
            <div className="text-xs text-white/40">
              {lineup.subHeadliners.map((a) => a.name).join(" · ")}
            </div>
            <div className="text-[11px] text-white/25">
              {lineup.openers.map((a) => a.name).join(" · ")}
            </div>
          </div>
          {selectedVenue && (
            <>
              <div className="h-px bg-white/[0.06] my-2" />
              <div className="text-xs text-white/40">📍 {selectedVenue.name}</div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleGenerateAI}
            disabled={generating}
            className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-40 cursor-pointer"
          >
            {generating ? "Generating..." : "✨ Regenerate with AI"}
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex-1 px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] text-sm transition-all cursor-pointer"
            >
              Download
            </button>
            <button
              onClick={handleShare}
              className="flex-1 px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] text-sm transition-all cursor-pointer"
            >
              {copied ? "Copied!" : "Share"}
            </button>
          </div>
        </div>

        <div className="flex gap-2 text-[10px] text-white/15">
          <span>Lineup {lineup ? "✓" : "—"}</span>
          <span>Stage {stageSnapshot ? "✓" : "opt"}</span>
          <span>Venue {selectedVenue ? "✓" : "opt"}</span>
        </div>
      </div>

      {/* Right: Poster preview */}
      <div className="flex-1 flex items-start justify-center">
        <div className="rounded-xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/50 bg-black">
          <canvas
            ref={canvasRef}
            className="max-w-full h-auto"
            style={{ maxHeight: "75vh" }}
          />
        </div>
      </div>
    </div>
  );
}
