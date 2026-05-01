/**
 * Named stage layouts. Each preset is a list of element specs that, when
 * applied, replaces the current stage with a curated arrangement.
 *
 * Positions assume the same coordinate system as the StageBuilder scene
 * (origin centered on the stage floor, +Z is toward the audience).
 */

import type { StageElement } from '@/types/festival'

type ElementSpec = Omit<StageElement, 'id'>

export interface StagePreset {
  id: string
  name: string
  description: string
  elements: ElementSpec[]
}

export const STAGE_PRESETS: StagePreset[] = [
  {
    id: 'festival',
    name: 'Festival Mainstage',
    description: 'Wide layout · big LED, stacks, lasers, pyro flanks',
    elements: [
      { type: 'screen', position: [0, 0, -3.5], rotation: [0, 0, 0] },
      { type: 'speaker', position: [-6, 0, 2], rotation: [0, 0.2, 0] },
      { type: 'speaker', position: [6, 0, 2], rotation: [0, -0.2, 0] },
      { type: 'laser', position: [-3, 0, -2.5], rotation: [0, 0, 0] },
      { type: 'laser', position: [3, 0, -2.5], rotation: [0, 0, 0] },
      { type: 'pyro', position: [-4.5, 0, 0], rotation: [0, 0, 0] },
      { type: 'pyro', position: [4.5, 0, 0], rotation: [0, 0, 0] },
      { type: 'light', position: [0, 7.5, 0], rotation: [0, 0, 0] },
      { type: 'fog', position: [-2, 0, 3], rotation: [0, 0, 0] },
      { type: 'fog', position: [2, 0, 3], rotation: [0, 0, 0] },
    ],
  },
  {
    id: 'club',
    name: 'Club Setup',
    description: 'Tight layout · DJ-focused, lasers + fog, no pyro',
    elements: [
      { type: 'screen', position: [0, 0, -3.5], rotation: [0, 0, 0] },
      { type: 'speaker', position: [-3.5, 0, 1.5], rotation: [0, 0.3, 0] },
      { type: 'speaker', position: [3.5, 0, 1.5], rotation: [0, -0.3, 0] },
      { type: 'laser', position: [-2, 0, -2], rotation: [0, 0, 0] },
      { type: 'laser', position: [2, 0, -2], rotation: [0, 0, 0] },
      { type: 'laser', position: [0, 0, -3], rotation: [0, 0, 0] },
      { type: 'fog', position: [-1.5, 0, 2.5], rotation: [0, 0, 0] },
      { type: 'fog', position: [1.5, 0, 2.5], rotation: [0, 0, 0] },
      { type: 'light', position: [0, 7.5, -1], rotation: [0, 0, 0] },
    ],
  },
  {
    id: 'acoustic',
    name: 'Acoustic Setup',
    description: 'Minimal · single rig, soft lights, no FX',
    elements: [
      { type: 'speaker', position: [-2.5, 0, 1.5], rotation: [0, 0.4, 0] },
      { type: 'speaker', position: [2.5, 0, 1.5], rotation: [0, -0.4, 0] },
      { type: 'light', position: [0, 7.5, 1], rotation: [0, 0, 0] },
      { type: 'fog', position: [0, 0, 2], rotation: [0, 0, 0] },
    ],
  },
  {
    id: 'arena',
    name: 'Arena Tour',
    description: 'Symmetric flanks · tall stacks, dual lasers, dual pyro',
    elements: [
      { type: 'screen', position: [-4, 0, -3.5], rotation: [0, 0.25, 0] },
      { type: 'screen', position: [4, 0, -3.5], rotation: [0, -0.25, 0] },
      { type: 'speaker', position: [-7, 0, 1], rotation: [0, 0.2, 0] },
      { type: 'speaker', position: [7, 0, 1], rotation: [0, -0.2, 0] },
      { type: 'laser', position: [-5, 0, -1], rotation: [0, 0, 0] },
      { type: 'laser', position: [5, 0, -1], rotation: [0, 0, 0] },
      { type: 'pyro', position: [-2, 0, -1.5], rotation: [0, 0, 0] },
      { type: 'pyro', position: [2, 0, -1.5], rotation: [0, 0, 0] },
      { type: 'light', position: [0, 7.5, -2], rotation: [0, 0, 0] },
      { type: 'light', position: [0, 7.5, 2], rotation: [0, 0, 0] },
      { type: 'fog', position: [0, 0, 3], rotation: [0, 0, 0] },
    ],
  },
]

export const STAGE_PRESETS_BY_ID = new Map(STAGE_PRESETS.map((p) => [p.id, p]))
