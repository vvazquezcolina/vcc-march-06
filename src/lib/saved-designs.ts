/**
 * Named-design persistence backed by localStorage.
 *
 * Each saved design captures the stage layout (no IDs, since they're
 * regenerated on load) plus a name and a timestamp. We deliberately don't
 * persist lighting or camera state — those are session preview controls.
 */

import type { StageElement } from '@/types/festival'

const STORAGE_KEY = 'mainstage-builder.saved-designs.v1'
const MAX_DESIGNS = 20

export interface SavedDesign {
  id: string
  name: string
  createdAt: number
  stageElements: Omit<StageElement, 'id'>[]
}

function safeRead(): SavedDesign[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as SavedDesign[]) : []
  } catch {
    return []
  }
}

function safeWrite(designs: SavedDesign[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(designs))
  } catch (err) {
    // Quota exceeded or storage disabled — surface to console; UI shouldn't
    // crash, the user just won't be able to save.
    console.warn('[saved-designs] write failed:', err)
  }
}

export function listSavedDesigns(): SavedDesign[] {
  return safeRead().sort((a, b) => b.createdAt - a.createdAt)
}

export function saveDesign(
  name: string,
  stageElements: StageElement[],
): SavedDesign {
  const trimmed = name.trim() || 'Untitled design'
  const existing = safeRead()
  const stripped: Omit<StageElement, 'id'>[] = stageElements.map((el) => ({
    type: el.type,
    position: el.position,
    rotation: el.rotation,
    scale: el.scale,
  }))

  // De-duplicate by name — replace the existing entry if names match.
  const filtered = existing.filter(
    (d) => d.name.toLowerCase() !== trimmed.toLowerCase(),
  )
  const next: SavedDesign = {
    id: crypto.randomUUID(),
    name: trimmed,
    createdAt: Date.now(),
    stageElements: stripped,
  }
  const all = [next, ...filtered].slice(0, MAX_DESIGNS)
  safeWrite(all)
  return next
}

export function deleteDesign(id: string) {
  const filtered = safeRead().filter((d) => d.id !== id)
  safeWrite(filtered)
}
