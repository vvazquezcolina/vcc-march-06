'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Music, Upload, Play, Pause, X } from 'lucide-react'
import { audioEngine, type FrequencyBands } from '@/lib/audio-engine'

/**
 * Toolbar control: pick an MP3, play/pause, see a 3-band EQ flicker live.
 * The EQ bars sample from the same analyser the scene uses, so what the
 * lights are reacting to is what the user sees in the UI.
 */
export function AudioControls() {
  const [hasFile, setHasFile] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Subscribe to engine events for play/pause + load reactivity
  useEffect(() => {
    const sync = () => {
      setHasFile(audioEngine.hasFile())
      setFileName(audioEngine.fileName())
      setPlaying(audioEngine.isPlaying())
    }
    sync()
    return audioEngine.subscribe(sync)
  }, [])

  const handlePick = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      setLoadError(null)
      try {
        await audioEngine.loadFile(file)
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load')
      }
      // Allow re-picking the same file
      e.target.value = ''
    },
    [],
  )

  const handleToggle = useCallback(async () => {
    await audioEngine.togglePlay()
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">
          Audio
        </h2>
        {hasFile && (
          <EqBars />
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        onChange={handlePick}
        className="hidden"
      />

      {!hasFile ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full flex items-center justify-center gap-1.5 rounded-md border border-dashed border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/25 px-3 py-2.5 text-xs font-medium text-white/55 hover:text-white/85 transition-colors cursor-pointer"
        >
          <Upload className="h-3.5 w-3.5" strokeWidth={1.75} />
          Drop a track for FX
        </button>
      ) : (
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleToggle}
            title={playing ? 'Pause' : 'Play'}
            className={`flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-md transition-colors cursor-pointer ${
              playing
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200'
                : 'bg-white/[0.08] hover:bg-white/[0.15] text-white/70 hover:text-white'
            }`}
          >
            {playing ? (
              <Pause className="h-3.5 w-3.5" strokeWidth={2} />
            ) : (
              <Play className="h-3.5 w-3.5" strokeWidth={2} />
            )}
          </button>
          <div className="flex-1 min-w-0 flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.06]">
            <Music className="h-3 w-3 shrink-0 text-white/40" strokeWidth={1.75} />
            <span className="truncate text-[11px] text-white/65">
              {fileName ?? 'Unknown track'}
            </span>
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            title="Replace track"
            className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-md bg-white/[0.04] hover:bg-white/[0.10] text-white/40 hover:text-white/80 transition-colors cursor-pointer"
          >
            <X className="h-3 w-3" strokeWidth={2} />
          </button>
        </div>
      )}

      {loadError && (
        <div className="mt-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] text-red-300">
          {loadError}
        </div>
      )}
    </div>
  )
}

/**
 * Live EQ display. Polls the analyser via rAF (independent of the 3D
 * canvas) so the bars stay in sync with the lights even if the canvas
 * is throttled.
 */
function EqBars() {
  const [bands, setBands] = useState<FrequencyBands>({ bass: 0, mid: 0, treble: 0 })

  useEffect(() => {
    let raf = 0
    const tick = () => {
      setBands(audioEngine.bands())
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="flex items-end gap-0.5 h-3">
      {(['bass', 'mid', 'treble'] as const).map((key) => (
        <div
          key={key}
          className="w-1 rounded-sm bg-gradient-to-t from-white/20 to-emerald-300 transition-[height] duration-75"
          style={{
            height: `${Math.max(2, bands[key] * 100)}%`,
          }}
        />
      ))}
    </div>
  )
}
