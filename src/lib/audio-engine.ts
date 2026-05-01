/**
 * Audio engine for the stage builder.
 *
 * Lifecycle:
 *  - Lazily creates an AudioContext + AnalyserNode the first time loadFile()
 *    runs, so we don't fight browser autoplay policy on page load.
 *  - One persistent <audio> element; loadFile() replaces its src so we can
 *    swap tracks without rebuilding the analyser graph.
 *  - bands() is called from R3F's useFrame on every animated component that
 *    wants to react. Returns 0..1 normalized values for bass / mid / treble.
 *
 * Why a singleton: the analyser is bound to a specific <audio> + audio
 * graph. Multiple instances would either fight or duplicate the playback.
 */

const FFT_SIZE = 1024
const SMOOTHING = 0.7

// Bin slices, derived for fftSize=1024 @ ~44.1kHz (bin width ≈ 43Hz):
//   bass:   20-250Hz   → bins 0..5
//   mid:    250-2000Hz → bins 6..46
//   treble: 2000-8000Hz → bins 47..185
const BASS_BINS = [0, 6] as const
const MID_BINS = [6, 47] as const
const TREBLE_BINS = [47, 186] as const

export interface FrequencyBands {
  bass: number
  mid: number
  treble: number
}

class AudioEngine {
  private ctx: AudioContext | null = null
  private el: HTMLAudioElement | null = null
  private analyser: AnalyserNode | null = null
  // Uint8Array<ArrayBuffer> (not the default ArrayBufferLike) — the DOM
  // types in TS 5.6+ are stricter about which buffer flavour the analyser
  // accepts. An explicit ArrayBuffer-backed view satisfies the overload.
  private freq: Uint8Array<ArrayBuffer> | null = null
  private currentName: string | null = null
  private listeners = new Set<() => void>()

  hasFile(): boolean {
    return !!(this.el?.src)
  }

  fileName(): string | null {
    return this.currentName
  }

  isPlaying(): boolean {
    return !!(this.el && !this.el.paused && this.el.currentTime > 0)
  }

  duration(): number {
    return this.el?.duration ?? 0
  }

  currentTime(): number {
    return this.el?.currentTime ?? 0
  }

  async loadFile(file: File): Promise<void> {
    if (typeof window === 'undefined') return
    this.ensureGraph()
    if (!this.el) return
    if (this.el.src) URL.revokeObjectURL(this.el.src)
    this.el.src = URL.createObjectURL(file)
    this.currentName = file.name
    await new Promise<void>((resolve, reject) => {
      const onReady = () => {
        cleanup()
        resolve()
      }
      const onError = () => {
        cleanup()
        reject(new Error('Failed to load audio'))
      }
      const cleanup = () => {
        this.el?.removeEventListener('canplay', onReady)
        this.el?.removeEventListener('error', onError)
      }
      this.el!.addEventListener('canplay', onReady, { once: true })
      this.el!.addEventListener('error', onError, { once: true })
      this.el!.load()
    })
    this.notify()
  }

  async play(): Promise<void> {
    if (!this.el) return
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume()
    }
    try {
      await this.el.play()
      this.notify()
    } catch (err) {
      console.warn('[audio-engine] play() rejected:', err)
    }
  }

  pause(): void {
    this.el?.pause()
    this.notify()
  }

  togglePlay(): Promise<void> {
    return this.isPlaying() ? Promise.resolve(this.pause()) : this.play()
  }

  /**
   * Per-frame sampler. Call from useFrame on any component that wants to
   * react. Cheap (one Uint8Array fill + summation).
   */
  bands(): FrequencyBands {
    if (!this.analyser || !this.freq) {
      return { bass: 0, mid: 0, treble: 0 }
    }
    this.analyser.getByteFrequencyData(this.freq)
    const f = this.freq
    return {
      bass: averageBins(f, BASS_BINS[0], BASS_BINS[1]),
      mid: averageBins(f, MID_BINS[0], MID_BINS[1]),
      treble: averageBins(f, TREBLE_BINS[0], TREBLE_BINS[1]),
    }
  }

  /** Subscribe to state changes (load / play / pause). */
  subscribe(fn: () => void): () => void {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn()
      } catch (err) {
        console.error('[audio-engine] listener threw:', err)
      }
    })
  }

  private ensureGraph() {
    if (this.ctx) return
    const Ctx =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!Ctx) {
      console.warn('[audio-engine] AudioContext is not available')
      return
    }
    this.ctx = new Ctx()
    this.el = new Audio()
    this.el.crossOrigin = 'anonymous'
    this.el.addEventListener('ended', () => this.notify())
    const src = this.ctx.createMediaElementSource(this.el)
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = FFT_SIZE
    this.analyser.smoothingTimeConstant = SMOOTHING
    this.freq = new Uint8Array(
      new ArrayBuffer(this.analyser.frequencyBinCount),
    )
    src.connect(this.analyser)
    this.analyser.connect(this.ctx.destination)
  }
}

function averageBins(data: Uint8Array, start: number, end: number): number {
  let sum = 0
  for (let i = start; i < end; i++) sum += data[i] ?? 0
  return Math.min(1, sum / ((end - start) * 255))
}

// Module-level singleton
export const audioEngine = new AudioEngine()
