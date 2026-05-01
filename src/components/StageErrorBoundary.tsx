'use client'

import React from 'react'

interface State {
  hasError: boolean
  message: string
}

/**
 * Catches WebGL / Three.js / canvas errors so the rest of the page keeps
 * working when an old browser or low-memory device can't initialize the 3D
 * engine. Surfaces a fallback with a reload button instead of a blank page.
 */
export class StageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(err: unknown): State {
    return {
      hasError: true,
      message: err instanceof Error ? err.message : 'Unknown error',
    }
  }

  componentDidCatch(err: unknown) {
    // Plain console.error keeps this dependency-free; in real production
    // you'd pipe this into Sentry / Datadog / your error tracker.
    console.error('[StageBuilder] Canvas crashed:', err)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-[550px] flex-col items-center justify-center gap-3 rounded-xl bg-black/60 p-8 text-center text-white/70">
          <span className="text-4xl">⚠️</span>
          <div className="text-base font-semibold text-white/90">
            The 3D engine couldn&apos;t start
          </div>
          <p className="max-w-sm text-xs text-white/50 leading-relaxed">
            Your browser or device may not support WebGL 2, or it ran out of
            memory. Try a desktop browser, or reload to retry.
          </p>
          <p className="mt-1 max-w-sm font-mono text-[10px] text-white/35 break-all">
            {this.state.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="mt-3 rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
