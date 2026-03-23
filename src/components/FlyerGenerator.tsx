"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useFestivalStore } from "@/store/festival-store";

// ---------------------------------------------------------------------------
// Vibe-to-festival-name mapping (mirrors API but lets us preview instantly)
// ---------------------------------------------------------------------------
const VIBE_NAMES: Record<string, string> = {
  "Desert Oasis": "DESERT OASIS FEST 2026",
  "Urban Jungle": "NEON CITY FESTIVAL 2026",
  "Forest Wonderland": "ENCHANTED FOREST FEST 2026",
  "Beach Paradise": "TIDAL WAVE FEST 2026",
};

// Vibe-specific accent colours used for the poster gradient & accents
const VIBE_COLORS: Record<string, { primary: string; secondary: string; accent: string }> = {
  "Desert Oasis": { primary: "#e2725b", secondary: "#f5a623", accent: "#ffd700" },
  "Urban Jungle": { primary: "#00e5ff", secondary: "#7c4dff", accent: "#ff4081" },
  "Forest Wonderland": { primary: "#00e676", secondary: "#1de9b6", accent: "#69f0ae" },
  "Beach Paradise": { primary: "#00b0ff", secondary: "#40c4ff", accent: "#ff6f00" },
};

const CANVAS_W = 800;
const CANVAS_H = 1200;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function FlyerGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const store = useFestivalStore();

  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [festivalName, setFestivalName] = useState<string | null>(null);

  const lineup = store.lineup;
  const venue = store.selectedVenue;
  const vibe = store.quizAnswers?.vibe ?? "Desert Oasis";
  const stageSnapshot = store.stageSnapshot;

  // Resolve display name
  const displayName = festivalName ?? VIBE_NAMES[vibe] ?? "MAINSTAGE FESTIVAL 2026";
  const colors = VIBE_COLORS[vibe] ?? VIBE_COLORS["Desert Oasis"];

  // -----------------------------------------------------------------------
  // Draw poster on canvas
  // -----------------------------------------------------------------------
  const drawPoster = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const w = CANVAS_W;
      const h = CANVAS_H;

      // -- Background gradient -------------------------------------------
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, "#0d001a");
      bgGrad.addColorStop(0.35, "#1a0033");
      bgGrad.addColorStop(0.65, "#0d001a");
      bgGrad.addColorStop(1, "#000000");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // -- Decorative radial glow ----------------------------------------
      const glow = ctx.createRadialGradient(w / 2, h * 0.22, 10, w / 2, h * 0.22, w * 0.6);
      glow.addColorStop(0, colors.primary + "30");
      glow.addColorStop(0.5, colors.secondary + "15");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Secondary glow lower
      const glow2 = ctx.createRadialGradient(w / 2, h * 0.65, 10, w / 2, h * 0.65, w * 0.5);
      glow2.addColorStop(0, colors.secondary + "20");
      glow2.addColorStop(1, "transparent");
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, w, h);

      // -- Star particles ------------------------------------------------
      ctx.save();
      for (let i = 0; i < 80; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h * 0.5;
        const r = Math.random() * 1.5 + 0.3;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.5 + 0.15})`;
        ctx.fill();
      }
      ctx.restore();

      // -- Top decorative line -------------------------------------------
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(60, 50);
      ctx.lineTo(w - 60, 50);
      ctx.stroke();

      // Double line
      ctx.strokeStyle = colors.accent + "60";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(80, 56);
      ctx.lineTo(w - 80, 56);
      ctx.stroke();

      // -- "PRESENTS" subtitle -------------------------------------------
      ctx.textAlign = "center";
      ctx.fillStyle = colors.accent;
      ctx.font = "600 14px 'Inter', 'Helvetica Neue', sans-serif";
      ctx.letterSpacing = "8px";
      ctx.fillText("MAINSTAGE BUILDER PRESENTS", w / 2, 90);
      ctx.letterSpacing = "0px";

      // -- Festival name -------------------------------------------------
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 52px 'Inter', 'Helvetica Neue', sans-serif";

      // Word-wrap the festival name if needed
      const nameWords = displayName.split(" ");
      let nameLine1 = "";
      let nameLine2 = "";
      const maxNameWidth = w - 120;

      for (const word of nameWords) {
        const test = nameLine1 ? nameLine1 + " " + word : word;
        if (ctx.measureText(test).width > maxNameWidth && nameLine1) {
          nameLine2 += (nameLine2 ? " " : "") + word;
        } else {
          nameLine1 = test;
        }
      }

      let nameY = 150;
      // Gradient text effect for the title
      const titleGrad = ctx.createLinearGradient(0, nameY - 40, 0, nameY + (nameLine2 ? 60 : 10));
      titleGrad.addColorStop(0, "#ffffff");
      titleGrad.addColorStop(0.5, colors.accent);
      titleGrad.addColorStop(1, colors.primary);
      ctx.fillStyle = titleGrad;

      ctx.fillText(nameLine1, w / 2, nameY);
      if (nameLine2) {
        nameY += 58;
        ctx.fillText(nameLine2, w / 2, nameY);
      }

      // -- Date ----------------------------------------------------------
      nameY += 40;
      ctx.fillStyle = colors.secondary;
      ctx.font = "700 20px 'Inter', 'Helvetica Neue', sans-serif";
      ctx.letterSpacing = "6px";
      ctx.fillText("SUMMER 2026", w / 2, nameY);
      ctx.letterSpacing = "0px";

      // -- Separator line ------------------------------------------------
      nameY += 20;
      const sepGrad = ctx.createLinearGradient(100, 0, w - 100, 0);
      sepGrad.addColorStop(0, "transparent");
      sepGrad.addColorStop(0.3, colors.primary + "80");
      sepGrad.addColorStop(0.5, colors.accent);
      sepGrad.addColorStop(0.7, colors.primary + "80");
      sepGrad.addColorStop(1, "transparent");
      ctx.strokeStyle = sepGrad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(100, nameY);
      ctx.lineTo(w - 100, nameY);
      ctx.stroke();

      // -- Headliners ----------------------------------------------------
      let y = nameY + 55;
      const headliners = lineup?.headliners ?? [];
      ctx.font = "900 56px 'Inter', 'Helvetica Neue', sans-serif";

      for (const artist of headliners) {
        // Outer glow behind text
        ctx.save();
        ctx.shadowColor = colors.primary;
        ctx.shadowBlur = 30;
        ctx.fillStyle = "#ffffff";
        ctx.fillText(artist.name.toUpperCase(), w / 2, y);
        ctx.restore();

        // Crisp text on top
        ctx.fillStyle = "#ffffff";
        ctx.fillText(artist.name.toUpperCase(), w / 2, y);
        y += 70;
      }

      // -- Sub-headliner divider -----------------------------------------
      y += 10;
      ctx.strokeStyle = colors.accent + "40";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(150, y);
      ctx.lineTo(w - 150, y);
      ctx.stroke();
      ctx.setLineDash([]);
      y += 30;

      // -- Sub-headliners ------------------------------------------------
      const subHeadliners = lineup?.subHeadliners ?? [];
      ctx.font = "700 32px 'Inter', 'Helvetica Neue', sans-serif";
      ctx.fillStyle = colors.accent;

      for (const artist of subHeadliners) {
        ctx.fillText(artist.name.toUpperCase(), w / 2, y);
        y += 44;
      }

      // -- Opener divider ------------------------------------------------
      y += 10;
      ctx.strokeStyle = colors.secondary + "30";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(180, y);
      ctx.lineTo(w - 180, y);
      ctx.stroke();
      ctx.setLineDash([]);
      y += 25;

      // -- Openers (arranged in rows) ------------------------------------
      const openers = lineup?.openers ?? [];
      ctx.font = "600 20px 'Inter', 'Helvetica Neue', sans-serif";
      ctx.fillStyle = colors.secondary + "cc";

      // Render openers in groups of 2-3 per line with dot separators
      const openerNames = openers.map((a) => a.name.toUpperCase());
      const openerLine = openerNames.join("  \u00B7  ");
      const lineWidth = ctx.measureText(openerLine).width;

      if (lineWidth < w - 120) {
        ctx.fillText(openerLine, w / 2, y);
        y += 30;
      } else {
        // split into two lines
        const mid = Math.ceil(openerNames.length / 2);
        ctx.fillText(openerNames.slice(0, mid).join("  \u00B7  "), w / 2, y);
        y += 30;
        ctx.fillText(openerNames.slice(mid).join("  \u00B7  "), w / 2, y);
        y += 30;
      }

      // -- Stage snapshot (if available) ---------------------------------
      if (stageSnapshot) {
        // We draw a small framed thumbnail of the stage design
        const thumbW = 280;
        const thumbH = 160;
        const thumbX = (w - thumbW) / 2;
        const thumbY = y + 10;

        // Frame
        ctx.strokeStyle = colors.primary + "60";
        ctx.lineWidth = 2;
        ctx.strokeRect(thumbX - 2, thumbY - 2, thumbW + 4, thumbH + 4);

        // Label
        ctx.font = "600 11px 'Inter', 'Helvetica Neue', sans-serif";
        ctx.fillStyle = colors.accent + "80";
        ctx.letterSpacing = "4px";
        ctx.fillText("YOUR STAGE DESIGN", w / 2, thumbY - 8);
        ctx.letterSpacing = "0px";

        // Draw the snapshot image
        const img = new Image();
        img.src = stageSnapshot;
        try {
          ctx.drawImage(img, thumbX, thumbY, thumbW, thumbH);
        } catch {
          // Image might not be loaded; fill placeholder
          ctx.fillStyle = "#1a0033";
          ctx.fillRect(thumbX, thumbY, thumbW, thumbH);
          ctx.fillStyle = colors.primary + "40";
          ctx.font = "600 14px 'Inter', sans-serif";
          ctx.fillText("Stage Preview", w / 2, thumbY + thumbH / 2 + 5);
        }

        y = thumbY + thumbH + 20;
      }

      // -- Bottom section: venue -----------------------------------------
      const bottomY = Math.max(y + 30, h - 150);

      // Bottom decorative line
      const btmGrad = ctx.createLinearGradient(60, 0, w - 60, 0);
      btmGrad.addColorStop(0, "transparent");
      btmGrad.addColorStop(0.5, colors.primary + "60");
      btmGrad.addColorStop(1, "transparent");
      ctx.strokeStyle = btmGrad;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(60, bottomY);
      ctx.lineTo(w - 60, bottomY);
      ctx.stroke();

      // Venue name
      const venueName = venue?.name ?? "YOUR FESTIVAL VENUE";
      ctx.font = "700 22px 'Inter', 'Helvetica Neue', sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(venueName.toUpperCase(), w / 2, bottomY + 35);

      // Venue description
      if (venue?.description) {
        ctx.font = "400 14px 'Inter', 'Helvetica Neue', sans-serif";
        ctx.fillStyle = colors.secondary + "99";
        const desc =
          venue.description.length > 60
            ? venue.description.slice(0, 57) + "..."
            : venue.description;
        ctx.fillText(desc, w / 2, bottomY + 58);
      }

      // -- Watermark -----------------------------------------------------
      ctx.font = "600 11px 'Inter', 'Helvetica Neue', sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.letterSpacing = "3px";
      ctx.fillText("MAINSTAGE BUILDER", w / 2, h - 30);
      ctx.letterSpacing = "0px";

      // -- Bottom border -------------------------------------------------
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(60, h - 16);
      ctx.lineTo(w - 60, h - 16);
      ctx.stroke();

      // -- Corner accents ------------------------------------------------
      const cornerLen = 20;
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 2;

      // Top-left
      ctx.beginPath();
      ctx.moveTo(30, 30 + cornerLen);
      ctx.lineTo(30, 30);
      ctx.lineTo(30 + cornerLen, 30);
      ctx.stroke();

      // Top-right
      ctx.beginPath();
      ctx.moveTo(w - 30 - cornerLen, 30);
      ctx.lineTo(w - 30, 30);
      ctx.lineTo(w - 30, 30 + cornerLen);
      ctx.stroke();

      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(30, h - 30 - cornerLen);
      ctx.lineTo(30, h - 30);
      ctx.lineTo(30 + cornerLen, h - 30);
      ctx.stroke();

      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(w - 30 - cornerLen, h - 30);
      ctx.lineTo(w - 30, h - 30);
      ctx.lineTo(w - 30, h - 30 - cornerLen);
      ctx.stroke();
    },
    [lineup, venue, vibe, stageSnapshot, displayName, colors],
  );

  // -----------------------------------------------------------------------
  // Redraw when data changes
  // -----------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawPoster(ctx);
  }, [drawPoster]);

  // -----------------------------------------------------------------------
  // Generate with AI (calls the API route)
  // -----------------------------------------------------------------------
  async function handleGenerate() {
    if (!lineup) return;
    setGenerating(true);

    try {
      const res = await fetch("/api/generate-flyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineup,
          venueName: venue?.name ?? "Festival Grounds",
          vibe,
          stageSnapshot: stageSnapshot ?? null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setFestivalName(data.festivalName);

        if (data.aiGenerated && data.imageUrl) {
          store.setFlyerUrl(data.imageUrl);
        }

        // Redraw canvas with returned festival name
        setTimeout(() => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          drawPoster(ctx);
        }, 50);
      }
    } catch (err) {
      console.error("Failed to generate flyer:", err);
    } finally {
      setGenerating(false);
    }
  }

  // -----------------------------------------------------------------------
  // Download poster as PNG
  // -----------------------------------------------------------------------
  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `${displayName.replace(/\s+/g, "-").toLowerCase()}-poster.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  // -----------------------------------------------------------------------
  // Share (copy to clipboard)
  // -----------------------------------------------------------------------
  async function handleShare() {
    const headliners =
      lineup?.headliners.map((a) => a.name).join(", ") ?? "TBA";
    const venueName = venue?.name ?? "TBA";

    const message = [
      `Check out my custom festival lineup!`,
      ``,
      `${displayName}`,
      `Headliners: ${headliners}`,
      `Venue: ${venueName}`,
      ``,
      `Built with Mainstage Builder`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback: prompt
      window.prompt("Copy this:", message);
    }
  }

  // -----------------------------------------------------------------------
  // No lineup yet – show placeholder
  // -----------------------------------------------------------------------
  if (!lineup) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
            <svg
              className="h-10 w-10 text-purple-400/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white/80">
            No lineup yet
          </h3>
          <p className="mt-1 text-sm text-purple-300/50">
            Complete the quiz to generate your festival lineup, then come back
            to create your poster.
          </p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
          Festival Poster
        </h2>
        <p className="mt-2 text-sm text-purple-300/60">
          Preview, generate, and share your custom festival flyer
        </p>
      </div>

      <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-center">
        {/* Canvas poster preview */}
        <div className="relative">
          {/* Glow behind canvas */}
          <div
            className="pointer-events-none absolute -inset-4 rounded-2xl opacity-40 blur-2xl"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}40, ${colors.secondary}30)`,
            }}
          />
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="relative z-10 w-full max-w-[400px] rounded-xl border border-white/10 shadow-2xl shadow-purple-900/40"
            style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
          />
        </div>

        {/* Action panel */}
        <div className="flex w-full max-w-sm flex-col gap-4 lg:pt-8">
          {/* Generate with AI */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className={`group relative w-full overflow-hidden rounded-xl px-6 py-4 text-left transition-all duration-200
              ${
                generating
                  ? "cursor-wait bg-white/5"
                  : "bg-gradient-to-r from-purple-600/80 via-pink-600/80 to-amber-600/80 hover:brightness-110 active:scale-[0.98]"
              }
            `}
          >
            <div className="relative z-10 flex items-center gap-3">
              {generating ? (
                <svg
                  className="h-6 w-6 animate-spin text-purple-300"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
                  />
                </svg>
              )}
              <div>
                <span className="block text-sm font-bold text-white">
                  {generating ? "Generating..." : "Generate with AI"}
                </span>
                <span className="block text-xs text-white/60">
                  Get a unique festival name and refresh the poster
                </span>
              </div>
            </div>
          </button>

          {/* Download */}
          <button
            type="button"
            onClick={handleDownload}
            className="group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-left transition-all duration-200 hover:border-purple-400/40 hover:bg-white/10 active:scale-[0.98]"
          >
            <svg
              className="h-6 w-6 text-purple-400 transition-transform group-hover:-translate-y-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            <div>
              <span className="block text-sm font-bold text-white">
                Download Poster
              </span>
              <span className="block text-xs text-white/50">
                Save as high-res PNG (800 x 1200)
              </span>
            </div>
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className="group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-left transition-all duration-200 hover:border-pink-400/40 hover:bg-white/10 active:scale-[0.98]"
          >
            <svg
              className="h-6 w-6 text-pink-400 transition-transform group-hover:scale-110"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
              />
            </svg>
            <div>
              <span className="block text-sm font-bold text-white">
                {copied ? "Copied!" : "Share Lineup"}
              </span>
              <span className="block text-xs text-white/50">
                Copy your lineup details to clipboard
              </span>
            </div>
          </button>

          {/* AI-generated image (if available) */}
          {store.generatedFlyerUrl && (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
                AI-Generated Version
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={store.generatedFlyerUrl}
                alt="AI-generated festival poster"
                className="w-full rounded-lg"
              />
              <a
                href={store.generatedFlyerUrl}
                download="ai-festival-poster.png"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs font-medium text-pink-400 underline underline-offset-2 hover:text-pink-300"
              >
                Download AI version
              </a>
            </div>
          )}

          {/* Lineup summary card */}
          <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-5">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-purple-400">
              Lineup Summary
            </h4>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Headliners
                </p>
                {lineup.headliners.map((a) => (
                  <p key={a.name} className="text-sm font-semibold text-white">
                    {a.name}
                  </p>
                ))}
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Sub-Headliners
                </p>
                {lineup.subHeadliners.map((a) => (
                  <p
                    key={a.name}
                    className="text-sm font-medium text-white/70"
                  >
                    {a.name}
                  </p>
                ))}
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Openers
                </p>
                {lineup.openers.map((a) => (
                  <p key={a.name} className="text-sm text-white/50">
                    {a.name}
                  </p>
                ))}
              </div>
            </div>

            {venue && (
              <div className="mt-3 border-t border-white/10 pt-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Venue
                </p>
                <p className="text-sm font-semibold text-white">{venue.name}</p>
                {venue.description && (
                  <p className="text-xs text-white/40">{venue.description}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
