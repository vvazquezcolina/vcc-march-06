'use client'

import { useCallback, useEffect, useState } from 'react'
import { Sparkles, ArrowRight, ArrowLeft, X } from 'lucide-react'

const STORAGE_KEY = 'mainstage-builder.onboarded.v1'

interface Step {
  title: string
  body: string
  emoji: string
}

const STEPS: Step[] = [
  {
    emoji: '🎛️',
    title: 'Pick a stage preset',
    body: 'Festival, Club, Acoustic or Arena — each one drops a curated layout you can customize from there. The toolbar lives on the left (tap the menu icon on phones).',
  },
  {
    emoji: '🪄',
    title: 'Click an element, drag the gizmo',
    body: 'Tap any laser, screen, speaker or pyro on stage to select it. A 3D gizmo appears — drag the colored arrows to move, switch to Rotate or Scale in the side panel.',
  },
  {
    emoji: '🎵',
    title: 'Drop an MP3 for live FX',
    body: 'Upload a track in the Audio section and the colored washes, lasers and pyro all react to the bass / mids / treble in real time. Try a camera preset for a cinematic shot, then export a framed PNG.',
  },
]

/**
 * First-visit guided tour. Three steps, dismissible, persists the
 * "onboarded" flag in localStorage so the user only sees it once per
 * machine. Lazy initial state so the read happens on the client without an
 * extra render cycle.
 */
export function OnboardingTour() {
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      return window.localStorage.getItem(STORAGE_KEY) !== 'true'
    } catch {
      return true
    }
  })
  const [step, setStep] = useState(0)

  const dismiss = useCallback(() => {
    setOpen(false)
    try {
      window.localStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      // ignore — non-fatal
    }
  }, [])

  // Allow Esc to dismiss
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, dismiss])

  if (!open) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="absolute bottom-12 left-1/2 -translate-x-1/2 z-40 w-[min(420px,calc(100%-32px))] rounded-2xl border border-white/10 bg-zinc-950/90 p-4 shadow-2xl shadow-black/60 backdrop-blur-md"
    >
      <button
        onClick={dismiss}
        aria-label="Dismiss tour"
        className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-md text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors"
      >
        <X className="h-3.5 w-3.5" strokeWidth={2} />
      </button>

      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xl">{current.emoji}</span>
        <h3
          id="onboarding-title"
          className="text-sm font-semibold text-white tracking-wide"
        >
          {current.title}
        </h3>
      </div>

      <p className="text-[12.5px] leading-relaxed text-white/65 mb-3 pr-4">
        {current.body}
      </p>

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i === step
                  ? 'bg-white'
                  : i < step
                    ? 'bg-white/60'
                    : 'bg-white/15'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              aria-label="Previous step"
              className="flex items-center gap-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1.5 text-[11px] text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3 w-3" strokeWidth={2} />
              Back
            </button>
          )}
          {!isLast ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-1 rounded-md bg-white/[0.10] hover:bg-white/[0.18] px-3 py-1.5 text-[11px] font-medium text-white transition-colors"
            >
              Next
              <ArrowRight className="h-3 w-3" strokeWidth={2} />
            </button>
          ) : (
            <button
              onClick={dismiss}
              className="flex items-center gap-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 px-3 py-1.5 text-[11px] font-medium text-emerald-200 transition-colors"
            >
              <Sparkles className="h-3 w-3" strokeWidth={2} />
              Got it
            </button>
          )}
        </div>
      </div>

      {step === 0 && (
        <button
          onClick={dismiss}
          className="mt-2 text-[10px] text-white/30 hover:text-white/55 transition-colors"
        >
          Skip tour
        </button>
      )}
    </div>
  )
}
