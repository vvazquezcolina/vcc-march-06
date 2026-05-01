/**
 * Encode / decode the shareable subset of festival state to and from a
 * URL-safe base64 string, so anyone can paste a link and see the same
 * lineup + stage + venue.
 *
 * Excludes snapshots (`stageSnapshot`, `generatedFlyerUrl`) — those are
 * large data URLs that would explode the URL length, and they're derived
 * from the rest of the state anyway.
 */

import type {
  Lineup,
  StageElement,
  Venue,
  FestivalState,
} from '@/types/festival'

// What we serialize. Stripping IDs from stage elements keeps payloads small
// and avoids collision when the recipient adds elements of their own.
export interface ShareableFestival {
  lineup: Lineup | null
  stageElements: Omit<StageElement, 'id'>[]
  selectedVenue: Venue | null
  customNotes: FestivalState['customNotes']
}

export function encodeFestivalToUrl(state: ShareableFestival): string {
  const json = JSON.stringify(state)
  // utf8 → base64 → url-safe (drop padding, swap +/ for -_)
  const base64 =
    typeof window === 'undefined'
      ? Buffer.from(json, 'utf8').toString('base64')
      : btoa(unescape(encodeURIComponent(json)))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeFestivalFromUrl(
  encoded: string,
): ShareableFestival | null {
  if (!encoded) return null
  try {
    const padded =
      encoded.replace(/-/g, '+').replace(/_/g, '/') +
      '='.repeat((4 - (encoded.length % 4)) % 4)
    const json =
      typeof window === 'undefined'
        ? Buffer.from(padded, 'base64').toString('utf8')
        : decodeURIComponent(escape(atob(padded)))
    const parsed = JSON.parse(json)
    // Light shape validation — never trust deserialized JSON from a URL.
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Array.isArray(parsed.stageElements)
    ) {
      return null
    }
    return parsed as ShareableFestival
  } catch {
    return null
  }
}
