'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import {
  OrbitControls,
  Text,
  Stars,
  Cloud,
  Clouds,
  Environment,
  MeshReflectorMaterial,
  TransformControls,
  Stats,
  useNormalTexture,
} from '@react-three/drei'
import * as THREE from 'three'
import {
  Zap,
  TvMinimal,
  Flame,
  Speaker as SpeakerIcon,
  Lightbulb,
  CloudFog,
  Move,
  Rotate3d,
  Maximize2,
  Trash2,
  Camera,
  Sun,
  Building2,
  Box,
  Activity,
  Layers,
  Save,
  Link2,
  Check,
  X,
  Users,
  Mic2,
  Menu,
  Waves,
  Sprout,
  Ticket,
  Mountain,
  Maximize,
  Minimize,
  type LucideIcon,
} from 'lucide-react'
import { useFestivalStore } from '@/store/festival-store'
import type { StageElement } from '@/types/festival'
import { STAGE_PRESETS } from '@/lib/stage-presets'
import { StageErrorBoundary } from './StageErrorBoundary'
import { Crowd } from './Crowd'
import { AudioControls } from './AudioControls'
import { OnboardingTour } from './OnboardingTour'
import { audioEngine } from '@/lib/audio-engine'
import {
  listSavedDesigns,
  saveDesign,
  deleteDesign,
  type SavedDesign,
} from '@/lib/saved-designs'
import { encodeFestivalToUrl } from '@/lib/festival-codec'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

// ─── ELEMENT TYPE METADATA ─────────────────────────────────────────────────
// Each element has: a Lucide icon for the toolbar, a label, a description,
// and the bounding-box dimensions used to draw the selection wireframe.
type TransformMode = 'translate' | 'rotate' | 'scale'
// Studio: max-clarity neutral lighting for building (default — no decorative
// washes, HDRI fill, lift on shadows). Indoor: cinematic concert mood with
// animated colored washes. Outdoor: sun + sky.
type SceneMode = 'studio' | 'indoor' | 'outdoor'

// Outdoor sub-scenarios — only used when sceneMode === 'outdoor'.
type OutdoorScenario = 'beach' | 'field' | 'stadium' | 'desert'

interface OutdoorScenarioMeta {
  id: OutdoorScenario
  label: string
  Icon: LucideIcon
  description: string
  groundColor: string
  groundRoughness: number
  ambientColor: string
  sunTint: string
  envPreset:
    | 'apartment'
    | 'city'
    | 'dawn'
    | 'forest'
    | 'lobby'
    | 'night'
    | 'park'
    | 'studio'
    | 'sunset'
    | 'warehouse'
  // Custom sky dome — vertical gradient from top → horizon. Replaces drei's
  // procedural Sky which had depth-test + below-horizon-clamp issues.
  skyTop: string
  skyHorizon: string
  // Cloud rendering — count and color tint per scenario
  cloudCount: number
  cloudColor: string
  // Whether to render the small CrowdArea floor patch (or let venue ground take over)
  crowdFloorOverrideColor?: string
}

const OUTDOOR_SCENARIOS: OutdoorScenarioMeta[] = [
  // Sky colors are baked per scenario. The dome shader gradients smoothly
  // from skyTop (zenith) to skyHorizon (where it meets the ground plane).
  {
    id: 'field',
    label: 'Field',
    Icon: Sprout,
    description: 'Open grass field — clear blue sky, classic festival',
    groundColor: '#3a6234',
    groundRoughness: 0.95,
    ambientColor: '#fff4d6',
    sunTint: '#fffaf0',
    envPreset: 'park',
    skyTop: '#1f6fb8',
    skyHorizon: '#a8d0ea',
    cloudCount: 5,
    cloudColor: '#ffffff',
    crowdFloorOverrideColor: '#3a6234',
  },
  {
    id: 'beach',
    label: 'Beach',
    Icon: Waves,
    description: 'Beach sunset — warm sky, sand floor',
    groundColor: '#e6cf95',
    groundRoughness: 0.8,
    ambientColor: '#ffd9a8',
    sunTint: '#ffd1a0',
    envPreset: 'sunset',
    skyTop: '#3a4a7a',
    skyHorizon: '#ff9b58',
    cloudCount: 4,
    cloudColor: '#ffd9b8',
    crowdFloorOverrideColor: '#e6cf95',
  },
  {
    id: 'stadium',
    label: 'Stadium',
    Icon: Ticket,
    description: 'Concrete bowl with tiered seating around the stage',
    groundColor: '#4a4a52',
    groundRoughness: 0.7,
    ambientColor: '#eef0f8',
    sunTint: '#ffffff',
    envPreset: 'city',
    skyTop: '#5a72a0',
    skyHorizon: '#b0bccc',
    cloudCount: 6,
    cloudColor: '#dadeea',
    crowdFloorOverrideColor: '#4a4a52',
  },
  {
    id: 'desert',
    label: 'Desert',
    Icon: Mountain,
    description: 'Sand dunes + hazy sun — Coachella / Burning Man feel',
    groundColor: '#c89762',
    groundRoughness: 0.95,
    ambientColor: '#ffc888',
    sunTint: '#ffd29a',
    envPreset: 'sunset',
    skyTop: '#9c8a5a',
    skyHorizon: '#f0d089',
    cloudCount: 2,
    cloudColor: '#ffe4c4',
    crowdFloorOverrideColor: '#c89762',
  },
]

const OUTDOOR_BY_ID = new Map(OUTDOOR_SCENARIOS.map((s) => [s.id, s]))

// Light-control defaults & ranges (kept here so the UI sliders and the
// rendering code agree on the same numbers without indirection).
const LIGHT_DEFAULTS = {
  studioBrightness: 1.0, // multiplier on studio ambient + key
  indoorBrightness: 1.8, // bumped from 1.4 — concert mode used to crush detail
  sunIntensity: 2.5,
  sunElevation: 50, // degrees above horizon, 0..90
} as const

const LIGHT_RANGES = {
  studioBrightness: { min: 0.3, max: 2.5, step: 0.05 },
  indoorBrightness: { min: 0.3, max: 3.0, step: 0.05 },
  sunIntensity: { min: 0.2, max: 5.0, step: 0.1 },
  sunElevation: { min: 5, max: 88, step: 1 },
} as const

const CROWD_DEFAULT = 250
const CROWD_RANGE = { min: 0, max: 600, step: 10 }

// ─── CAMERA PRESETS ────────────────────────────────────────────────────────
// Each preset names a "shot" — a camera position + look-at target. Click to
// transition smoothly (cubic ease-out, ~1.4s) from the current camera state.
interface CameraPreset {
  id: string
  label: string
  Icon: LucideIcon
  position: [number, number, number]
  target: [number, number, number]
}

// Camera framings. Targets aim a touch high (y=4-5 instead of y=3) so the
// upper third of the frame includes sky / overhead structure even when
// camera is at audience-eye level. Useful in outdoor mode where sky is the
// main scenic element.
const CAMERA_PRESETS: CameraPreset[] = [
  { id: 'front',  label: 'Front',  Icon: Camera, position: [0, 5, 16],     target: [0, 4, 0] },
  { id: 'hero',   label: '3/4',    Icon: Box,    position: [12, 6, 12],    target: [0, 4, 0] },
  { id: 'top',    label: 'Top',    Icon: Layers, position: [0, 22, 0.1],   target: [0, 0, 0] },
  // Audience side: standing in the crowd looking up at the stage + sky
  { id: 'crowd',  label: 'Crowd',  Icon: Users,  position: [0, 1.6, 11],   target: [0, 5, -2] },
  // Performer side: standing on the stage looking at the audience + horizon
  { id: 'stage',  label: 'Stage',  Icon: Mic2,   position: [0, 1.7, -1.2], target: [0, 3, 12] },
]

const CAMERA_TRANSITION_MS = 1400

interface ElementMeta {
  type: StageElement['type']
  label: string
  Icon: LucideIcon
  desc: string
  selectionBox: { scale: [number, number, number]; y: number }
}

const ELEMENTS: ElementMeta[] = [
  {
    type: 'laser',
    label: 'Laser Array',
    Icon: Zap,
    desc: 'Sweeping laser beams',
    selectionBox: { scale: [0.8, 6, 0.8], y: 3 },
  },
  {
    type: 'screen',
    label: 'LED Screen',
    Icon: TvMinimal,
    desc: 'Giant video panel',
    selectionBox: { scale: [3.5, 3, 0.5], y: 1.5 },
  },
  {
    type: 'pyro',
    label: 'Pyrotechnics',
    Icon: Flame,
    desc: 'Fire columns',
    selectionBox: { scale: [0.8, 4, 0.8], y: 1.5 },
  },
  {
    type: 'speaker',
    label: 'Line Array',
    Icon: SpeakerIcon,
    desc: 'Flown line-array (hangs from the truss)',
    selectionBox: { scale: [1.6, 4.5, 1.1], y: -2 },
  },
  {
    type: 'light',
    label: 'Lighting Rig',
    Icon: Lightbulb,
    desc: 'Moving head lights',
    selectionBox: { scale: [5.5, 1, 0.5], y: -0.1 },
  },
  {
    type: 'fog',
    label: 'Fog Machine',
    Icon: CloudFog,
    desc: 'Atmospheric haze',
    selectionBox: { scale: [1.2, 1, 1.2], y: 0.3 },
  },
]

const ELEMENTS_BY_TYPE = new Map(ELEMENTS.map((e) => [e.type, e]))

// ─── ANIMATED HELPERS ──────────────────────────────────────────────────────
function GlowRing({
  radius,
  color,
  y = 0,
  speed = 1,
}: {
  radius: number
  color: string
  y?: number
  speed?: number
}) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshStandardMaterial
      // Bass kicks the rings up to +4 emissive when audio is playing
      const bass = audioEngine.bands().bass
      mat.emissiveIntensity =
        1.5 + Math.sin(clock.getElapsedTime() * speed) * 0.8 + bass * 4
    }
  })
  return (
    <mesh ref={ref} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.03, 8, 64]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
    </mesh>
  )
}

// ─── MAINSTAGE STRUCTURE ───────────────────────────────────────────────────
function Mainstage({ crowdFloorColor = '#1a1a22' }: { crowdFloorColor?: string }) {
  // drei's normal-map library — gives us a real PBR surface without shipping
  // texture files. Index 3 is a fine-grain noise that reads as polished
  // concrete under stage lights.
  const [normalMap] = useNormalTexture(3, {
    repeat: [4, 4],
    anisotropy: 8,
  })

  return (
    <group>
      {/* Stage floor — reflective concrete with a real normal map. Lifted
          base color so the floor reads as a surface even under low light;
          the mirror reflectivity still reads clearly. */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 10]} />
        <MeshReflectorMaterial
          mirror={0.3}
          blur={[300, 100]}
          resolution={1024}
          mixBlur={1.2}
          mixStrength={0.6}
          color="#22222e"
          metalness={0.45}
          roughness={0.6}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.4, 0.4)}
        />
      </mesh>

      {/* Front LED strip */}
      <mesh position={[0, 0.06, 5.01]}>
        <boxGeometry args={[16, 0.12, 0.08]} />
        <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={4} />
      </mesh>

      {/* Side LED strips */}
      {[-8.01, 8.01].map((x, i) => (
        <mesh key={i} position={[x, 0.06, 0]}>
          <boxGeometry args={[0.08, 0.12, 10]} />
          <meshStandardMaterial color="#00ccff" emissive="#00ccff" emissiveIntensity={3} />
        </mesh>
      ))}

      {/* BACK WALL — curved arch */}
      <group position={[0, 0, -4.8]}>
        {Array.from({ length: 11 }, (_, i) => {
          const angle = ((i - 5) / 5) * 0.5
          const x = Math.sin(angle) * 8
          const z = -Math.cos(angle) * 8 + 8
          return (
            <mesh key={i} position={[x, 3.5, z]} rotation={[0, angle, 0]}>
              <boxGeometry args={[1.7, 7, 0.15]} />
              <meshStandardMaterial color="#1a1a26" metalness={0.6} roughness={0.4} />
            </mesh>
          )
        })}

        {[-3, -1.5, 0, 1.5, 3].map((x, i) => {
          const colors = ['#ff0066', '#7c3aed', '#00ccff', '#7c3aed', '#ff0066']
          return (
            <mesh key={`strip-${i}`} position={[x, 3.5, 0.15]}>
              <boxGeometry args={[0.06, 6.5, 0.06]} />
              <meshStandardMaterial color={colors[i]} emissive={colors[i]} emissiveIntensity={3} />
            </mesh>
          )
        })}

        {[1, 3, 5, 6.5].map((y, i) => {
          const colors = ['#ff0066', '#7c3aed', '#00ccff', '#ff00ff']
          return (
            <mesh key={`hstrip-${i}`} position={[0, y, 0.15]}>
              <boxGeometry args={[9, 0.04, 0.04]} />
              <meshStandardMaterial color={colors[i]} emissive={colors[i]} emissiveIntensity={2.5} />
            </mesh>
          )
        })}
      </group>

      {/* OVERHEAD TRUSS */}
      <group>
        {[-3, 0, 3].map((z) => (
          <group key={`truss-h-${z}`}>
            <mesh position={[0, 8, z]}>
              <boxGeometry args={[16, 0.12, 0.12]} />
              <meshStandardMaterial color="#4a4a58" metalness={0.9} roughness={0.15} />
            </mesh>
            <mesh position={[0, 8, z]}>
              <boxGeometry args={[16, 0.06, 0.06]} />
              <meshStandardMaterial color="#22222e" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        ))}

        {[-7.5, 7.5].map((x) =>
          [-3, 3].map((z) => (
            <mesh key={`pillar-${x}-${z}`} position={[x, 4, z]}>
              <boxGeometry args={[0.15, 8, 0.15]} />
              <meshStandardMaterial color="#4a4a58" metalness={0.9} roughness={0.15} />
            </mesh>
          )),
        )}

        {[-7.5, 7.5].map((x) => (
          <mesh key={`side-${x}`} position={[x, 8, 0]}>
            <boxGeometry args={[0.12, 0.12, 6.5]} />
            <meshStandardMaterial color="#4a4a58" metalness={0.9} roughness={0.15} />
          </mesh>
        ))}
      </group>

      {/* DJ BOOTH */}
      <group position={[0, 0, -2]}>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[3, 1.2, 1.2]} />
          <meshStandardMaterial color="#1d1d28" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.6, 0.61]}>
          <boxGeometry args={[2.9, 1.1, 0.02]} />
          <meshStandardMaterial color="#7c3aed" emissive="#7c3aed" emissiveIntensity={1.5} />
        </mesh>
      </group>

      {/* FLOOR GLOW RINGS */}
      <GlowRing radius={2.5} color="#7c3aed" y={0.02} speed={0.8} />
      <GlowRing radius={4.5} color="#ec4899" y={0.02} speed={1.2} />
      <GlowRing radius={6.5} color="#00ccff" y={0.02} speed={0.5} />

      {/* CROWD AREA */}
      <mesh position={[0, -0.05, 9]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 8]} />
        <meshStandardMaterial color={crowdFloorColor} />
      </mesh>
      <mesh position={[0, 0.4, 5.3]}>
        <boxGeometry args={[14, 0.8, 0.1]} />
        <meshStandardMaterial color="#3a3a48" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  )
}

// ─── ELEMENT INNER MESHES ──────────────────────────────────────────────────
// Each "Inner" component renders the 3D content at the local origin.
// Positioning + click handling + selection box live on the outer wrapper, so
// TransformControls has a clean group to attach to without fighting per-frame
// animations on the same matrix.

function LaserInner() {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (ref.current) {
      // Mid frequencies modulate sweep speed (1.5× → up to ~5×)
      const mid = audioEngine.bands().mid
      const speed = 1.5 + mid * 3.5
      ref.current.rotation.y = Math.sin(clock.getElapsedTime() * speed) * 0.6
    }
  })
  return (
    <group ref={ref}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.3, 8]} />
        <meshStandardMaterial color="#2c2c3a" metalness={0.8} roughness={0.3} />
      </mesh>
      {[-0.2, 0, 0.2].map((x, i) => {
        const colors = ['#00ff88', '#00ffcc', '#00ff88']
        return (
          <mesh key={i} position={[x, 3, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 5.5, 6]} />
            <meshStandardMaterial
              color={colors[i]}
              emissive={colors[i]}
              emissiveIntensity={5}
              transparent
              opacity={0.9}
            />
          </mesh>
        )
      })}
      <pointLight color="#00ff88" intensity={8} distance={12} position={[0, 3, 0]} />
    </group>
  )
}

function LEDScreenInner() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshStandardMaterial
      const t = clock.getElapsedTime()
      mat.emissive.setHSL((t * 0.1) % 1, 0.8, 0.4)
    }
  })
  return (
    <group>
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[3.2, 2.2, 0.12]} />
        <meshStandardMaterial color="#22222e" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh ref={ref} position={[0, 1.6, 0.07]}>
        <boxGeometry args={[3, 2, 0.02]} />
        <meshStandardMaterial color="#ffffff" emissive="#7c3aed" emissiveIntensity={3} />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.5, 6]} />
        <meshStandardMaterial color="#4a4a58" metalness={0.9} roughness={0.2} />
      </mesh>
      <pointLight color="#aa55ff" intensity={6} distance={10} position={[0, 1.6, 1]} />
    </group>
  )
}

function PyroInner() {
  const flameRefs = useRef<THREE.Mesh[]>([])
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    // Treble drives the flame surge — sharp transients sound like ignition
    const treble = audioEngine.bands().treble
    const surge = 1 + treble * 2 // up to 3× scale on a hit
    flameRefs.current.forEach((mesh, i) => {
      if (mesh) {
        const s = (1 + Math.sin(t * 10 + i * 2) * 0.4) * surge
        mesh.scale.set(s, (1 + Math.sin(t * 8 + i) * 0.6) * surge, s)
        const mat = mesh.material as THREE.MeshStandardMaterial
        mat.emissiveIntensity = 4 + Math.sin(t * 12 + i * 3) * 3 + treble * 6
      }
    })
  })
  return (
    <group>
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 1.5, 8]} />
        <meshStandardMaterial color="#3c3c48" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.1, 8]} />
        <meshStandardMaterial color="#444" metalness={0.8} roughness={0.3} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) flameRefs.current[i] = el
          }}
          position={[0, 2.2 + i * 0.4, 0]}
        >
          <coneGeometry args={[0.2 - i * 0.05, 1.2 - i * 0.2, 8]} />
          <meshStandardMaterial
            color={i === 0 ? '#ff4400' : i === 1 ? '#ff8800' : '#ffcc00'}
            emissive={i === 0 ? '#ff2200' : i === 1 ? '#ff6600' : '#ffaa00'}
            emissiveIntensity={5}
            transparent
            opacity={0.9 - i * 0.15}
          />
        </mesh>
      ))}
      <pointLight color="#ff4400" intensity={15} distance={15} position={[0, 2.5, 0]} />
    </group>
  )
}

function SpeakerStackInner() {
  // Modern festival rigging: line array hanging from the truss, not a
  // floor stack. Anchor sits at y=0 (the wrapper group's origin); the
  // boxes hang downward in a slight curve (each lower cabinet tilts a few
  // degrees more outward, like a real flown line array).
  const animRef = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (animRef.current) {
      // tiny vertical sway as if the rig swings
      animRef.current.position.y = Math.sin(clock.getElapsedTime() * 1.5) * 0.01
    }
  })
  // 7 boxes, top box near anchor, descending
  const cabinets = [0, 1, 2, 3, 4, 5, 6]
  return (
    <group ref={animRef}>
      {/* Rigging strap from anchor up to truss */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.2, 6]} />
        <meshStandardMaterial color="#222" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Top mounting bar */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[1.4, 0.1, 0.85]} />
        <meshStandardMaterial color="#3a3a44" metalness={0.85} roughness={0.25} />
      </mesh>
      {cabinets.map((i) => {
        // Each cabinet hangs ~0.55m below the previous, with a small splay
        // that increases for lower cabinets — a real line-array curve.
        const y = -0.4 - i * 0.55
        const tilt = -i * 0.04 // backward tilt (radians)
        return (
          <group key={i} position={[0, y, 0]} rotation={[tilt, 0, 0]}>
            <mesh>
              <boxGeometry args={[1.2, 0.5, 0.7]} />
              <meshStandardMaterial color="#1f1f28" metalness={0.6} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.36]}>
              <circleGeometry args={[0.18, 16]} />
              <meshStandardMaterial color="#2a2a34" metalness={0.4} roughness={0.6} />
            </mesh>
            <mesh position={[0, 0, 0.36]}>
              <torusGeometry args={[0.18, 0.02, 8, 16]} />
              <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function LightingRigInner() {
  const fixturesRef = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (fixturesRef.current) {
      fixturesRef.current.children.forEach((child, i) => {
        child.rotation.x =
          Math.sin(clock.getElapsedTime() * 2 + i * 1.2) * 0.5
        child.rotation.z =
          Math.cos(clock.getElapsedTime() * 1.5 + i * 0.8) * 0.3
      })
    }
  })

  const colors = ['#ff0066', '#00ff88', '#4488ff', '#ffaa00', '#ff00ff', '#00ffcc']

  return (
    <group>
      <mesh>
        <boxGeometry args={[5, 0.1, 0.1]} />
        <meshStandardMaterial color="#5a5a68" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[5, 0.06, 0.06]} />
        <meshStandardMaterial color="#4a4a58" metalness={0.9} roughness={0.2} />
      </mesh>
      <group ref={fixturesRef}>
        {colors.map((color, i) => (
          <group key={i} position={[(i - 2.5) * 0.9, -0.3, 0]}>
            <mesh>
              <cylinderGeometry args={[0.08, 0.12, 0.2, 8]} />
              <meshStandardMaterial color="#3a3a44" metalness={0.8} roughness={0.3} />
            </mesh>
            <spotLight color={color} intensity={20} distance={15} angle={0.4} penumbra={0.7} position={[0, -0.15, 0]} />
            <mesh position={[0, -0.12, 0]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={4} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

function FogInner() {
  const cloudsRef = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (cloudsRef.current) {
      const t = clock.getElapsedTime()
      cloudsRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh
        const s = 1 + Math.sin(t * 0.8 + i * 2) * 0.4
        mesh.scale.set(s * (1 + i * 0.5), s * 0.4, s * (1 + i * 0.5))
        mesh.position.y = 0.2 + i * 0.15 + Math.sin(t * 0.5 + i) * 0.1
        const mat = mesh.material as THREE.MeshStandardMaterial
        mat.opacity =
          0.12 - i * 0.02 + Math.sin(t * 0.6 + i * 1.5) * 0.04
      })
    }
  })

  return (
    <group>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.5, 0.25, 0.3]} />
        <meshStandardMaterial color="#3c3c48" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.3, 0.18, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.04, 0.06, 0.15, 8]} />
        <meshStandardMaterial color="#444" metalness={0.8} roughness={0.2} />
      </mesh>
      <group ref={cloudsRef}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0, 0.3 + i * 0.15, 0]}>
            <sphereGeometry args={[0.6, 12, 12]} />
            <meshStandardMaterial
              color="#8899bb"
              emissive="#556688"
              emissiveIntensity={0.3}
              transparent
              opacity={0.12}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function ElementInner({ type }: { type: StageElement['type'] }) {
  switch (type) {
    case 'laser':
      return <LaserInner />
    case 'screen':
      return <LEDScreenInner />
    case 'pyro':
      return <PyroInner />
    case 'speaker':
      return <SpeakerStackInner />
    case 'light':
      return <LightingRigInner />
    case 'fog':
      return <FogInner />
    default:
      return null
  }
}

// ─── SELECTION WIREFRAME ───────────────────────────────────────────────────
function SelectionBox({
  scale,
  y = 0,
}: {
  scale: [number, number, number]
  y?: number
}) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.25 + Math.sin(clock.getElapsedTime() * 4) * 0.15
    }
  })
  return (
    <mesh ref={ref} position={[0, y, 0]} scale={scale}>
      <boxGeometry />
      <meshBasicMaterial color="#00ffcc" wireframe transparent opacity={0.3} />
    </mesh>
  )
}

// ─── LINEUP TEXT (floats above the stage) ──────────────────────────────────
function LineupText() {
  const lineup = useFestivalStore((s) => s.lineup)
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = 9.5 + Math.sin(clock.getElapsedTime() * 0.4) * 0.15
    }
  })
  if (!lineup) return null
  return (
    <group ref={ref} position={[0, 9.5, -2]}>
      {lineup.headliners.slice(0, 3).map((a, i) => (
        <Text
          key={a.name}
          position={[0, -i * 0.8, 0]}
          fontSize={0.6}
          color="#ffffff"
          anchorX="center"
          outlineWidth={0.03}
          outlineColor="#7c3aed"
          font={undefined}
        >
          {a.name.toUpperCase()}
        </Text>
      ))}
      <Text
        position={[0, -2.8, 0]}
        fontSize={0.25}
        color="#ec4899"
        anchorX="center"
        font={undefined}
      >
        {lineup.subHeadliners.map((a) => a.name).join('  ·  ')}
      </Text>
    </group>
  )
}

// ─── VENUE GROUND ──────────────────────────────────────────────────────────
// Wide ground plane that wraps the stage in outdoor mode. Sits slightly
// below the existing crowd-area floor so they don't z-fight, and the
// crowd-area is recolored to match (passed via Mainstage prop) so the
// terrain reads continuous.
function VenueGround({ scenario }: { scenario: OutdoorScenarioMeta }) {
  return (
    <>
      <mesh
        position={[0, -0.08, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <circleGeometry args={[80, 64]} />
        <meshStandardMaterial
          color={scenario.groundColor}
          roughness={scenario.groundRoughness}
          metalness={0.05}
        />
      </mesh>
      {scenario.id === 'stadium' && <StadiumSeating />}
      {scenario.id === 'beach' && <BeachDecor />}
      {scenario.id === 'desert' && <DesertDunes />}
    </>
  )
}

// Concentric tiered risers wrapping the audience area. ~270° around so
// the back of the stage stays open. Reads as "stadium bowl" without
// modeling individual seats.
function StadiumSeating() {
  const tiers = 9
  return (
    <group position={[0, 0, 4]}>
      {Array.from({ length: tiers }).map((_, i) => {
        const r = 18 + i * 1.4
        const h = 0.6 + i * 0.7
        return (
          <mesh
            key={i}
            position={[0, h, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            {/* Half ring — open toward the stage so the audience faces in */}
            <ringGeometry
              args={[r, r + 1.3, 48, 1, Math.PI * 0.18, Math.PI * 1.64]}
            />
            <meshStandardMaterial
              color={i % 2 === 0 ? '#52525c' : '#48484f'}
              roughness={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
        )
      })}
    </group>
  )
}

// A few minimal beach props at the venue edges — implied palm
// silhouettes. Cheap (basic geometries, no textures).
function BeachDecor() {
  // useState lazy initializer keeps the React-rules-of-purity rule happy:
  // Math.random() runs exactly once on first mount, the layout is then
  // stable for the lifetime of the component.
  const [palms] = useState(() =>
    Array.from({ length: 8 }, (_, i) => {
      const angle = (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.3
      const radius = 22 + Math.random() * 6
      return {
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        height: 4 + Math.random() * 2,
        tilt: (Math.random() - 0.5) * 0.15,
      }
    }),
  )
  return (
    <group>
      {palms.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]} rotation={[0, 0, p.tilt]}>
          {/* Trunk */}
          <mesh position={[0, p.height / 2, 0]}>
            <cylinderGeometry args={[0.1, 0.18, p.height, 8]} />
            <meshStandardMaterial color="#5a3f25" roughness={0.95} />
          </mesh>
          {/* Crown — rough disc of "leaves" */}
          <mesh position={[0, p.height + 0.3, 0]}>
            <sphereGeometry args={[1.2, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2.5]} />
            <meshStandardMaterial color="#4a6b32" roughness={0.95} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// A few rolling dunes scattered in the distance. Flat-bottom hemispheres
// give the silhouette without heavy geometry.
function DesertDunes() {
  const [dunes] = useState(() =>
    Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2
      const radius = 28 + Math.random() * 14
      return {
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        scale: 4 + Math.random() * 5,
        rotY: Math.random() * Math.PI,
      }
    }),
  )
  return (
    <group>
      {dunes.map((d, i) => (
        <mesh
          key={i}
          position={[d.x, -0.5, d.z]}
          rotation={[0, d.rotY, 0]}
          scale={[d.scale, d.scale * 0.4, d.scale]}
          receiveShadow
        >
          <sphereGeometry args={[1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#b8895a" roughness={0.95} />
        </mesh>
      ))}
    </group>
  )
}

// ─── CUSTOM SKY DOME ───────────────────────────────────────────────────────
// drei's <Sky> kept rendering as flat white in production despite chasing
// depth-test, frustum-culling, and distance-prop fixes. Wrote a dedicated
// inverted sphere with our own shader: vertical gradient + bright sun disc.
// Always-visible, full control over colors, predictable across drivers.
const SKY_VERTEX_SHADER = /* glsl */ `
  varying vec3 vWorldDir;
  void main() {
    // Treat the sphere position as a direction from origin (since we render
    // with side=BackSide, we see the inside of the sphere; the position is
    // effectively the direction the camera is looking at that fragment).
    vWorldDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const SKY_FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vWorldDir;
  uniform vec3 topColor;
  uniform vec3 horizonColor;
  uniform vec3 sunDir;
  uniform vec3 sunColor;
  uniform float sunSize;
  uniform float sunSoftness;

  void main() {
    // Smooth vertical gradient — top vs horizon, with soft transition.
    float h = clamp(vWorldDir.y, -0.2, 1.0);
    vec3 sky = mix(horizonColor, topColor, smoothstep(0.0, 0.55, h));

    // Sun disc (bright halo around sun direction)
    float d = max(dot(vWorldDir, sunDir), 0.0);
    float sun = smoothstep(1.0 - sunSize - sunSoftness, 1.0 - sunSize * 0.5, d);
    float core = smoothstep(1.0 - sunSize * 0.4, 1.0, d);
    sky = mix(sky, sunColor, sun * 0.7);
    sky = mix(sky, sunColor + vec3(0.4), core);

    gl_FragColor = vec4(sky, 1.0);
  }
`

function CustomSkyDome({
  topColor,
  horizonColor,
  sunDir,
  sunColor,
}: {
  topColor: string
  horizonColor: string
  sunDir: [number, number, number]
  sunColor: string
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  // useState lazy init keeps the uniforms object stable across renders
  // without tripping React's read-ref-during-render lint.
  const [uniforms] = useState(() => ({
    topColor: { value: new THREE.Color(topColor) },
    horizonColor: { value: new THREE.Color(horizonColor) },
    sunDir: {
      value: new THREE.Vector3(...sunDir).normalize(),
    },
    sunColor: { value: new THREE.Color(sunColor) },
    sunSize: { value: 0.04 },
    sunSoftness: { value: 0.08 },
  }))

  // Live-update uniform values when scenario / sun position changes
  useEffect(() => {
    uniforms.topColor.value.set(topColor)
    uniforms.horizonColor.value.set(horizonColor)
    uniforms.sunColor.value.set(sunColor)
    uniforms.sunDir.value.set(sunDir[0], sunDir[1], sunDir[2]).normalize()
  }, [topColor, horizonColor, sunColor, sunDir, uniforms])

  // Disable frustum culling so the dome is never accidentally culled.
  useEffect(() => {
    if (meshRef.current) meshRef.current.frustumCulled = false
  }, [])

  return (
    <mesh ref={meshRef} scale={400} renderOrder={-2}>
      <sphereGeometry args={[1, 32, 16]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        depthTest={false}
        uniforms={uniforms}
        vertexShader={SKY_VERTEX_SHADER}
        fragmentShader={SKY_FRAGMENT_SHADER}
      />
    </mesh>
  )
}

// ─── SCENE CLOUDS ──────────────────────────────────────────────────────────
// drei <Clouds> gives volumetric-style billboard clouds. We place a few
// instances above the stage at varying heights and drift them with a slow
// useFrame translate so the sky has motion.
function SceneClouds({ count, color }: { count: number; color: string }) {
  const groupRef = useRef<THREE.Group>(null)
  const [seeds] = useState<number[]>(() =>
    Array.from({ length: count }, () => Math.random() * 1000),
  )

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    // Slow lateral drift so clouds visibly move without distracting
    const t = clock.getElapsedTime() * 0.6
    groupRef.current.children.forEach((child, i) => {
      child.position.x = ((seeds[i] ?? 0) + t * (1 + (i % 3) * 0.3)) % 80 - 40
    })
  })

  return (
    <Clouds
      ref={groupRef}
      material={THREE.MeshLambertMaterial}
      // Render lower than the Sky shader, higher than ground geometry.
      // Don't write to depth so the procedural sky still reads behind
      // any cloud edges.
      limit={count}
    >
      {seeds.map((seed, i) => (
        <Cloud
          key={i}
          seed={seed}
          bounds={[14, 3, 14]}
          volume={6 + (i % 3) * 2}
          color={color}
          opacity={0.65}
          fade={120}
          growth={4}
          speed={0.15}
          segments={28}
          position={[
            (i - count / 2) * 14,
            18 + (i % 2) * 4,
            -25 + (i % 3) * 12,
          ]}
        />
      ))}
    </Clouds>
  )
}

// ─── STAGE LIGHTING ────────────────────────────────────────────────────────
// Three modes:
//  - studio:  HDRI environment + bright neutral key + soft fills, NO colored
//             washes, no fog, no stars. Built for clarity while constructing
//             the stage. Default — first impression should be "I can see
//             everything I'm building."
//  - indoor:  cinematic concert mood with animated colored washes + uplights.
//             Use for hero shots / exports. Brightness slider lifts the whole
//             rig including the white front key.
//  - outdoor: drei <Sky> dome + directional sun (intensity + elevation).
//             Colored washes drop to 35% so the sun reads as the dominant
//             source.
function StageLighting({
  mode,
  studioBrightness,
  indoorBrightness,
  sunIntensity,
  sunElevation,
  outdoorScenario,
}: {
  mode: SceneMode
  studioBrightness: number
  indoorBrightness: number
  sunIntensity: number
  sunElevation: number
  outdoorScenario: OutdoorScenarioMeta
}) {
  const animatedRef = useRef<THREE.Group>(null)
  // Colored washes only run in non-studio modes — Studio is intentionally
  // lit-flat for inspection.
  const washMultiplier =
    mode === 'studio' ? 0 : mode === 'outdoor' ? 0.35 : indoorBrightness
  const washesActive = mode !== 'studio'

  useFrame(({ clock }) => {
    if (!washesActive) return
    if (animatedRef.current) {
      const t = clock.getElapsedTime()
      // Bass adds a punchy intensity boost so the colored washes "kick" with
      // the kick drum. Caps at +250% to avoid blowing the tone-mapper.
      const bassBoost = 1 + audioEngine.bands().bass * 2.5
      animatedRef.current.children.forEach((light, i) => {
        if (light instanceof THREE.SpotLight) {
          light.intensity =
            (15 + Math.sin(t * 2 + i * 1.5) * 8) * washMultiplier * bassBoost
        }
      })
    }
  })

  // Sun position from elevation. Sun sits along +Z (front of stage) so its
  // light hits the stage face — feels like a stage facing the audience under
  // afternoon sun. azimuth fixed at 0 to keep the slider count low.
  const elevationRad = (sunElevation * Math.PI) / 180
  const sunDistance = 60
  const sunPos: [number, number, number] = [
    0,
    Math.sin(elevationRad) * sunDistance,
    Math.cos(elevationRad) * sunDistance,
  ]

  if (mode === 'studio') {
    // Maximum-clarity build view. HDRI gives even ambient, key wash from
    // front fills the stage face, hemisphere bounces light from "above".
    // No fog, no stars — those are scenic, not informational.
    return (
      <>
        <Environment preset="city" environmentIntensity={0.6 * studioBrightness} />
        <ambientLight intensity={0.55 * studioBrightness} color="#ffffff" />
        <hemisphereLight
          args={['#dde6f3', '#2a2530', 0.7 * studioBrightness]}
        />
        {/* Neutral key wash from the audience side */}
        <spotLight
          position={[0, 14, 10]}
          angle={0.7}
          penumbra={0.85}
          intensity={28 * studioBrightness}
          color="#ffffff"
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        {/* Soft fill from above the stage */}
        <directionalLight
          position={[0, 18, -2]}
          intensity={1.0 * studioBrightness}
          color="#ffffff"
        />
        {/* Side rim fills so elements aren't black on the back */}
        <directionalLight
          position={[-12, 6, 0]}
          intensity={0.6 * studioBrightness}
          color="#fff7e8"
        />
        <directionalLight
          position={[12, 6, 0]}
          intensity={0.6 * studioBrightness}
          color="#e8f0ff"
        />
      </>
    )
  }

  if (mode === 'outdoor') {
    return (
      <>
        {/* Custom sky dome — gradient top→horizon + sun disc. Replaces
            drei's procedural Sky which kept rendering blank-white in
            production. */}
        <CustomSkyDome
          topColor={outdoorScenario.skyTop}
          horizonColor={outdoorScenario.skyHorizon}
          sunDir={sunPos}
          sunColor={outdoorScenario.sunTint}
        />
        {/* Volumetric-ish billboard clouds drifting overhead. Skipped in
            desert (clear sky reads more dramatic). */}
        {outdoorScenario.cloudCount > 0 && (
          <SceneClouds
            count={outdoorScenario.cloudCount}
            color={outdoorScenario.cloudColor}
          />
        )}
        {/* IBL via scenario-appropriate HDRI (no background — Sky owns that) */}
        <Environment
          preset={outdoorScenario.envPreset}
          environmentIntensity={0.45 * sunIntensity}
        />
        {/* Sun fill — softens shadows, adds scenario-tinted ambient */}
        <ambientLight
          intensity={0.4 * sunIntensity}
          color={outdoorScenario.ambientColor}
        />
        {/* The sun itself */}
        <directionalLight
          position={sunPos}
          intensity={sunIntensity}
          color={outdoorScenario.sunTint}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        {/* Sky bounce light from above */}
        <hemisphereLight
          args={['#bcd9ff', '#1a1418', 0.5 * sunIntensity]}
        />
        {/* Animated colored washes (reduced — sun dominates) */}
        <group ref={animatedRef}>
          <spotLight position={[-8, 10, 3]} angle={0.6} penumbra={0.9} intensity={18} color="#ff0066" />
          <spotLight position={[8, 10, 3]} angle={0.6} penumbra={0.9} intensity={18} color="#0066ff" />
          <spotLight position={[-4, 12, -3]} angle={0.5} penumbra={0.7} intensity={15} color="#7c3aed" />
          <spotLight position={[4, 12, -3]} angle={0.5} penumbra={0.7} intensity={15} color="#ec4899" />
          <spotLight position={[0, 10, -5]} angle={0.7} penumbra={0.5} intensity={12} color="#aa00ff" />
        </group>
      </>
    )
  }

  // Indoor — concert / arena look
  return (
    <>
      {/* Bright ambient so detail doesn't get lost in shadow */}
      <ambientLight intensity={0.55 * indoorBrightness} color="#4a3a6a" />
      {/* White front key wash */}
      <spotLight
        position={[0, 12, 8]}
        angle={0.6}
        penumbra={0.8}
        intensity={26 * indoorBrightness}
        color="#ffffff"
        castShadow
      />
      {/* Hemisphere fill so back of elements isn't pure black */}
      <hemisphereLight
        args={['#a48fc4', '#1a1530', 0.4 * indoorBrightness]}
      />
      {/* Animated colored washes */}
      <group ref={animatedRef}>
        <spotLight position={[-8, 10, 3]} angle={0.6} penumbra={0.9} intensity={18} color="#ff0066" />
        <spotLight position={[8, 10, 3]} angle={0.6} penumbra={0.9} intensity={18} color="#0066ff" />
        <spotLight position={[-4, 12, -3]} angle={0.5} penumbra={0.7} intensity={15} color="#7c3aed" />
        <spotLight position={[4, 12, -3]} angle={0.5} penumbra={0.7} intensity={15} color="#ec4899" />
        <spotLight position={[0, 10, -5]} angle={0.7} penumbra={0.5} intensity={12} color="#aa00ff" />
      </group>
      {/* Floor up-lights — keep original concert mood */}
      <pointLight position={[-5, 0.3, 3]} intensity={4 * indoorBrightness} color="#ff0066" distance={8} />
      <pointLight position={[5, 0.3, 3]} intensity={4 * indoorBrightness} color="#0044ff" distance={8} />
      <pointLight position={[0, 0.3, 4]} intensity={5 * indoorBrightness} color="#ff00ff" distance={6} />
      <pointLight position={[-3, 0.3, -3]} intensity={3 * indoorBrightness} color="#7c3aed" distance={6} />
      <pointLight position={[3, 0.3, -3]} intensity={3 * indoorBrightness} color="#00ccff" distance={6} />
    </>
  )
}

// ─── SCREENSHOT HELPER ─────────────────────────────────────────────────────
// Two captures live here:
//  - capture(): raw PNG of the canvas, written into the festival store for
//    the downstream flyer pipeline (no overlay so the AI flyer step gets a
//    clean input).
//  - downloadFramed(): same render, but composited with a gradient + title
//    + venue overlay, then offered as a file download in the user's browser.
function ScreenshotHelper({
  captureRef,
  downloadRef,
}: {
  captureRef: React.MutableRefObject<(() => void) | null>
  downloadRef: React.MutableRefObject<(() => void) | null>
}) {
  const { gl, scene, camera } = useThree()
  const setStageSnapshot = useFestivalStore((s) => s.setStageSnapshot)
  const lineup = useFestivalStore((s) => s.lineup)
  const venue = useFestivalStore((s) => s.selectedVenue)

  const renderRaw = useCallback(() => {
    gl.render(scene, camera)
    return gl.domElement.toDataURL('image/png')
  }, [gl, scene, camera])

  const capture = useCallback(() => {
    setStageSnapshot(renderRaw())
  }, [renderRaw, setStageSnapshot])

  const downloadFramed = useCallback(async () => {
    const raw = renderRaw()
    const img = new Image()
    img.src = raw
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to load captured image'))
    })

    const c = document.createElement('canvas')
    c.width = img.width
    c.height = img.height
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.drawImage(img, 0, 0)

    // Bottom darkening gradient for legibility
    const grad = ctx.createLinearGradient(0, c.height * 0.55, 0, c.height)
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(0.6, 'rgba(0,0,0,0.55)')
    grad.addColorStop(1, 'rgba(0,0,0,0.92)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, c.width, c.height)

    // Title — use the top headliner if available, else a placeholder
    const title = (lineup?.headliners[0]?.name ?? 'YOUR FESTIVAL').toUpperCase()
    ctx.fillStyle = '#ffffff'
    ctx.font = `900 ${Math.round(c.width * 0.058)}px -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif`
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(title, Math.round(c.width * 0.05), c.height - Math.round(c.width * 0.055))

    // Subtitle: venue + date
    const sub = [
      venue?.name,
      new Date().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    ]
      .filter(Boolean)
      .join(' · ')
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = `500 ${Math.round(c.width * 0.022)}px -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif`
    ctx.fillText(sub, Math.round(c.width * 0.05), c.height - Math.round(c.width * 0.022))

    // Brand mark (top right)
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = `600 ${Math.round(c.width * 0.014)}px -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif`
    ctx.textAlign = 'right'
    ctx.fillText(
      'MAINSTAGE BUILDER',
      c.width - Math.round(c.width * 0.025),
      Math.round(c.width * 0.035),
    )
    ctx.textAlign = 'left'

    // Trigger download
    const a = document.createElement('a')
    a.href = c.toDataURL('image/png')
    a.download = `mainstage-${Date.now()}.png`
    a.click()
  }, [renderRaw, lineup, venue])

  useEffect(() => {
    captureRef.current = capture
    downloadRef.current = downloadFramed
    return () => {
      captureRef.current = null
      downloadRef.current = null
    }
  }, [capture, downloadFramed, captureRef, downloadRef])

  return null
}

// ─── SCENE ─────────────────────────────────────────────────────────────────
function SceneContents({
  selectedId,
  onSelect,
  transformMode,
  sceneMode,
  studioBrightness,
  indoorBrightness,
  sunIntensity,
  sunElevation,
  outdoorScenarioId,
  showStats,
  crowdDensity,
  captureRef,
  downloadRef,
  cameraTriggerRef,
}: {
  selectedId: string | null
  onSelect: (id: string | null) => void
  transformMode: TransformMode
  sceneMode: SceneMode
  studioBrightness: number
  indoorBrightness: number
  sunIntensity: number
  sunElevation: number
  outdoorScenarioId: OutdoorScenario
  showStats: boolean
  crowdDensity: number
  captureRef: React.MutableRefObject<(() => void) | null>
  downloadRef: React.MutableRefObject<(() => void) | null>
  cameraTriggerRef: React.MutableRefObject<((preset: CameraPreset) => void) | null>
}) {
  const outdoorScenario =
    OUTDOOR_BY_ID.get(outdoorScenarioId) ?? OUTDOOR_SCENARIOS[0]
  const stageElements = useFestivalStore((s) => s.stageElements)
  const { camera } = useThree()
  const orbitRef = useRef<OrbitControlsImpl | null>(null)
  const transitionRef = useRef<{
    startMs: number
    fromPos: THREE.Vector3
    fromTarget: THREE.Vector3
    toPos: THREE.Vector3
    toTarget: THREE.Vector3
  } | null>(null)

  // Imperative trigger that the toolbar buttons call. We snapshot the
  // current camera + orbit target as "from" and lerp to the preset over
  // CAMERA_TRANSITION_MS with cubic ease-out.
  const triggerCamera = useCallback(
    (preset: CameraPreset) => {
      const orbit = orbitRef.current
      if (!orbit) return
      transitionRef.current = {
        startMs: Date.now(),
        fromPos: camera.position.clone(),
        fromTarget: orbit.target.clone(),
        toPos: new THREE.Vector3(...preset.position),
        toTarget: new THREE.Vector3(...preset.target),
      }
    },
    [camera],
  )

  useEffect(() => {
    cameraTriggerRef.current = triggerCamera
    return () => {
      cameraTriggerRef.current = null
    }
  }, [triggerCamera, cameraTriggerRef])

  useFrame(() => {
    const tr = transitionRef.current
    if (!tr) return
    const t = Math.min((Date.now() - tr.startMs) / CAMERA_TRANSITION_MS, 1)
    const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic
    camera.position.lerpVectors(tr.fromPos, tr.toPos, eased)
    if (orbitRef.current) {
      orbitRef.current.target.lerpVectors(tr.fromTarget, tr.toTarget, eased)
      orbitRef.current.update()
    }
    if (t >= 1) transitionRef.current = null
  })

  return (
    <>
      <OrbitControls
        ref={orbitRef}
        makeDefault
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={5}
        maxDistance={30}
        target={[0, 3, 0]}
      />
      {/* Stars are concert-mood — only indoors. Outside the sky dome takes
          over; in studio we want a clean neutral background. */}
      {sceneMode === 'indoor' && (
        <Stars radius={100} depth={60} count={5000} factor={6} saturation={0.3} fade speed={1} />
      )}
      {/* Mode-specific atmosphere:
          - studio: very light, far fog so the void doesn't read as black
          - outdoor: scenario-specific haze + tint
          - indoor: dense purple fog (concert mood) */}
      <fog
        attach="fog"
        args={
          sceneMode === 'studio'
            ? ['#1f2030', 50, 120]
            : sceneMode === 'outdoor'
              ? outdoorScenarioId === 'desert'
                ? ['#e8c598', 30, 75]
                : outdoorScenarioId === 'beach'
                  ? ['#ffd9b0', 35, 85]
                  : outdoorScenarioId === 'stadium'
                    ? ['#a8b0c0', 50, 110]
                    : ['#bcd0e3', 40, 90]
              : ['#0a0015', 25, 60]
        }
      />
      {/* Background color. In outdoor it acts as a fallback for the Sky
          shader (with depth test now fixed it should always show, but a
          scenario-tinted bg means a frustum edge or paused frame is never
          flat white). Sky shader still paints over this. */}
      <color
        attach="background"
        args={[
          sceneMode === 'studio'
            ? '#0e0f18'
            : sceneMode === 'outdoor'
              ? outdoorScenarioId === 'desert'
                ? '#d4a060'
                : outdoorScenarioId === 'beach'
                  ? '#ffb78a'
                  : outdoorScenarioId === 'stadium'
                    ? '#7a8aa6'
                    : '#5fa8dc'
              : '#020208',
        ]}
      />
      <StageLighting
        mode={sceneMode}
        studioBrightness={studioBrightness}
        indoorBrightness={indoorBrightness}
        sunIntensity={sunIntensity}
        sunElevation={sunElevation}
        outdoorScenario={outdoorScenario}
      />
      <Mainstage
        crowdFloorColor={
          sceneMode === 'outdoor'
            ? outdoorScenario.crowdFloorOverrideColor
            : undefined
        }
      />
      {sceneMode === 'outdoor' && <VenueGround scenario={outdoorScenario} />}
      <Crowd density={crowdDensity} />
      <LineupText />

      {stageElements.map((el) => (
        <DraggableElement
          key={el.id}
          element={el}
          selected={selectedId === el.id}
          transformMode={transformMode}
          onSelect={() => onSelect(selectedId === el.id ? null : el.id)}
        />
      ))}

      {/* Click-anywhere-empty deselects */}
      <mesh
        position={[0, -0.1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
        onClick={() => onSelect(null)}
      >
        <planeGeometry args={[50, 50]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      <ScreenshotHelper captureRef={captureRef} downloadRef={downloadRef} />
      {showStats && <Stats className="!left-[unset] !right-3 !top-3" />}
    </>
  )
}

// Each element owns its outer group ref AND its own TransformControls when
// selected. Keeping the ref local avoids reading refs during render in the
// parent (which React lints against).
function DraggableElement({
  element,
  selected,
  transformMode,
  onSelect,
}: {
  element: StageElement
  selected: boolean
  transformMode: TransformMode
  onSelect: () => void
}) {
  // Capture the mounted group as state, not a ref. Reading state at render
  // time is safe; reading ref.current at render time is not (React lints
  // against it because re-renders won't fire when refs change).
  const [groupNode, setGroupNode] = useState<THREE.Group | null>(null)
  const updateStageElement = useFestivalStore((s) => s.updateStageElement)
  const meta = ELEMENTS_BY_TYPE.get(element.type)

  return (
    <>
      <group
        ref={setGroupNode}
        position={element.position}
        rotation={element.rotation}
        scale={element.scale ?? 1}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
      >
        <ElementInner type={element.type} />
        {selected && meta && (
          <SelectionBox scale={meta.selectionBox.scale} y={meta.selectionBox.y} />
        )}
      </group>

      {selected && groupNode && (
        <TransformControls
          object={groupNode}
          mode={transformMode}
          size={0.85}
          onObjectChange={() => {
            updateStageElement(element.id, {
              position: [
                groupNode.position.x,
                groupNode.position.y,
                groupNode.position.z,
              ],
              rotation: [
                groupNode.rotation.x,
                groupNode.rotation.y,
                groupNode.rotation.z,
              ],
              scale: groupNode.scale.x, // uniform scale assumed
            })
          }}
        />
      )}
    </>
  )
}

// ─── SLIDER ROW (small labeled range input for the toolbar) ───────────────
function SliderRow({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (v: number) => void
}) {
  return (
    <div className="mb-2">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
          {label}
        </span>
        <span className="text-[10px] font-mono text-white/55 tabular-nums">
          {display}
        </span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        aria-valuetext={display}
        className="w-full h-1.5 appearance-none rounded-full bg-white/[0.08] cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:w-3
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-white
          [&::-webkit-slider-thumb]:shadow-md
          [&::-webkit-slider-thumb]:shadow-white/30
          [&::-webkit-slider-thumb]:cursor-grab
          [&::-webkit-slider-thumb]:active:cursor-grabbing
          [&::-moz-range-thumb]:h-3
          [&::-moz-range-thumb]:w-3
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-white
          [&::-moz-range-thumb]:border-0"
      />
    </div>
  )
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function StageBuilder() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [transformMode, setTransformMode] = useState<TransformMode>('translate')

  // Lighting controls — local state, applied live to the scene. Explicit
  // <number> annotation; otherwise the LIGHT_DEFAULTS `as const` literals
  // narrow the state type and break the slider onChange signature.
  // Default mode is 'studio' so the first impression is "I can see what
  // I'm building" rather than the cinematic-but-dim concert preset.
  const [sceneMode, setSceneMode] = useState<SceneMode>('studio')
  const [studioBrightness, setStudioBrightness] = useState<number>(LIGHT_DEFAULTS.studioBrightness)
  const [indoorBrightness, setIndoorBrightness] = useState<number>(LIGHT_DEFAULTS.indoorBrightness)
  const [sunIntensity, setSunIntensity] = useState<number>(LIGHT_DEFAULTS.sunIntensity)
  const [sunElevation, setSunElevation] = useState<number>(LIGHT_DEFAULTS.sunElevation)
  const [outdoorScenarioId, setOutdoorScenarioId] = useState<OutdoorScenario>('field')

  // Stats overlay (FPS / draw calls / mem) — off by default to keep the
  // canvas clean on first impression.
  const [showStats, setShowStats] = useState(false)

  // Crowd density. 0 means no crowd; default 250 = a healthy festival crowd.
  const [crowdDensity, setCrowdDensity] = useState<number>(CROWD_DEFAULT)

  // Mobile toolbar drawer — hidden by default below lg, slides in on demand
  const [toolbarOpen, setToolbarOpen] = useState(false)

  // Fullscreen — targets the canvas wrapper so the toolbar stays out of
  // the immersive view. Browser handles Esc to exit.
  const canvasWrapRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = useCallback(async () => {
    const el = canvasWrapRef.current
    if (!el) return
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await el.requestFullscreen()
      }
    } catch (err) {
      console.warn('[StageBuilder] fullscreen toggle failed:', err)
    }
  }, [])

  // Keyboard shortcut: F toggles fullscreen (ignored when typing in inputs)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'f' && e.key !== 'F') return
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) {
        return
      }
      e.preventDefault()
      toggleFullscreen()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleFullscreen])

  // Save/Load designs + share-link state. Lazy useState initializer reads
  // localStorage once on first render — avoids a set-state-in-effect cascade.
  const [designName, setDesignName] = useState('')
  const [savedList, setSavedList] = useState<SavedDesign[]>(() =>
    listSavedDesigns(),
  )
  const [copiedFlash, setCopiedFlash] = useState(false)
  const refreshSaved = useCallback(() => setSavedList(listSavedDesigns()), [])

  // Imperative triggers — written by the in-Canvas helpers, called by the
  // toolbar buttons. Refs (not state) because we don't need re-renders when
  // they change.
  const captureRef = useRef<(() => void) | null>(null)
  const downloadRef = useRef<(() => void) | null>(null)
  const cameraTriggerRef = useRef<((preset: CameraPreset) => void) | null>(null)

  const removeStageElement = useFestivalStore((s) => s.removeStageElement)
  const stageElements = useFestivalStore((s) => s.stageElements)
  const setStageElements = useFestivalStore((s) => s.setStageElements)
  const addStageElement = useFestivalStore((s) => s.addStageElement)
  const setActiveTab = useFestivalStore((s) => s.setActiveTab)
  const customNotes = useFestivalStore((s) => s.customNotes)
  const setCustomNote = useFestivalStore((s) => s.setCustomNote)
  const hasInitialized = useRef(false)

  // First-visit boot: load the Festival Mainstage preset so users land on a
  // pre-built scene rather than an empty floor. Skips if the URL already
  // hydrated stageElements (see page.tsx).
  useEffect(() => {
    if (!hasInitialized.current && stageElements.length === 0) {
      hasInitialized.current = true
      const festival = STAGE_PRESETS[0]
      if (festival) setStageElements(festival.elements)
    }
  }, [stageElements.length, setStageElements])

  const handleSaveDesign = useCallback(() => {
    if (stageElements.length === 0) return
    saveDesign(designName, stageElements)
    setDesignName('')
    refreshSaved()
  }, [designName, stageElements, refreshSaved])

  const handleLoadDesign = useCallback(
    (d: SavedDesign) => {
      setStageElements(d.stageElements)
      setSelectedId(null)
    },
    [setStageElements],
  )

  const handleDeleteDesign = useCallback(
    (id: string) => {
      deleteDesign(id)
      refreshSaved()
    },
    [refreshSaved],
  )

  const handleCopyShareLink = useCallback(async () => {
    const fullState = useFestivalStore.getState()
    const encoded = encodeFestivalToUrl({
      lineup: fullState.lineup,
      stageElements: fullState.stageElements.map((el) => ({
        type: el.type,
        position: el.position,
        rotation: el.rotation,
        scale: el.scale,
      })),
      selectedVenue: fullState.selectedVenue,
      customNotes: fullState.customNotes,
    })
    const url = `${window.location.origin}${window.location.pathname}?stage=${encoded}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedFlash(true)
      setTimeout(() => setCopiedFlash(false), 1800)
    } catch {
      // Some browsers refuse clipboard API outside HTTPS / user gesture.
      // Fall back to opening a prompt the user can copy from manually.
      window.prompt('Copy this share link:', url)
    }
  }, [])

  const selectedElement = stageElements.find((el) => el.id === selectedId)
  const selectedMeta = selectedElement
    ? ELEMENTS_BY_TYPE.get(selectedElement.type)
    : null

  return (
    <div className="relative w-full h-full min-h-[550px] flex rounded-xl overflow-hidden">
      {/* ── Mobile hamburger (lg-) ── */}
      <button
        onClick={() => setToolbarOpen(true)}
        aria-label="Open toolbar"
        className="lg:hidden absolute top-3 left-3 z-30 flex h-9 w-9 items-center justify-center rounded-md bg-black/55 backdrop-blur border border-white/15 text-white/80 hover:bg-black/75 transition-colors"
      >
        <Menu className="h-4 w-4" strokeWidth={1.75} />
      </button>

      {/* ── Mobile backdrop ── */}
      {toolbarOpen && (
        <div
          onClick={() => setToolbarOpen(false)}
          className="lg:hidden absolute inset-0 z-30 bg-black/60 backdrop-blur-sm"
          aria-hidden="true"
        />
      )}

      {/* ── Toolbar ── */}
      <div
        className={`
          absolute lg:relative inset-y-0 left-0 z-40 lg:z-10
          w-72 lg:w-60 shrink-0
          bg-gradient-to-b from-[#12101f] to-[#0a0812]
          border-r border-white/[0.06]
          flex flex-col p-3 gap-1.5 overflow-y-auto
          transition-transform duration-300
          ${toolbarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Mobile close — only visible below lg */}
        <button
          onClick={() => setToolbarOpen(false)}
          aria-label="Close toolbar"
          className="lg:hidden absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-md text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
        {/* ── Stage presets ── */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">
            Preset
          </h2>
          <button
            onClick={() => setShowStats((s) => !s)}
            title="Toggle FPS / draw-call overlay"
            aria-label="Toggle performance stats overlay"
            aria-pressed={showStats}
            className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-mono tracking-wider transition-colors ${
              showStats
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'text-white/30 hover:text-white/60'
            }`}
          >
            <Activity className="h-2.5 w-2.5" strokeWidth={2.25} />
            STATS
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          {STAGE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                setStageElements(preset.elements)
                setSelectedId(null)
              }}
              title={preset.description}
              className="px-2 py-1.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/15 text-[11px] font-medium text-white/70 hover:text-white text-left transition-colors cursor-pointer truncate"
            >
              {preset.name}
            </button>
          ))}
        </div>

        <div className="border-t border-white/[0.06] my-1" />

        {/* ── Camera ── */}
        <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">
          Camera
        </h2>
        <div className="grid grid-cols-5 gap-1 mb-2">
          {CAMERA_PRESETS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => {
                const preset = CAMERA_PRESETS.find((p) => p.id === id)
                if (preset) cameraTriggerRef.current?.(preset)
              }}
              title={`Move camera to ${label}`}
              className="flex flex-col items-center gap-0.5 py-1.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/15 text-[10px] font-medium text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </div>

        <div className="border-t border-white/[0.06] my-1" />

        <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">
          Add Elements
        </h2>

        {ELEMENTS.map(({ type, label, Icon, desc }) => (
          <button
            key={type}
            onClick={() => addStageElement(type)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] transition-all text-left group cursor-pointer"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/[0.04] border border-white/[0.06] text-white/70 group-hover:text-white group-hover:border-white/20 transition-colors">
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-300 group-hover:text-white truncate">
                {label}
              </div>
              <div className="text-[10px] text-gray-600 group-hover:text-gray-400 truncate">
                {desc}
              </div>
            </div>
          </button>
        ))}

        <div className="border-t border-white/[0.06] my-2" />

        {/* ── Lighting ── */}
        <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">
          Lighting
        </h2>

        <div className="grid grid-cols-3 gap-1 mb-2">
          {(
            [
              { mode: 'studio' as const,  Icon: Lightbulb, label: 'Studio' },
              { mode: 'indoor' as const,  Icon: Building2, label: 'Indoor' },
              { mode: 'outdoor' as const, Icon: Sun,       label: 'Outdoor' },
            ] as const
          ).map(({ mode, Icon, label }) => {
            const isActive = sceneMode === mode
            return (
              <button
                key={mode}
                onClick={() => setSceneMode(mode)}
                aria-label={`${label} lighting mode`}
                aria-pressed={isActive}
                title={
                  mode === 'studio'
                    ? 'Bright neutral lighting — best for building'
                    : mode === 'indoor'
                      ? 'Concert mood — animated colored washes'
                      : 'Daylight — sun + sky'
                }
                className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-md text-[10px] font-medium border transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-white/[0.12] border-white/30 text-white'
                    : 'bg-white/[0.03] border-white/[0.06] text-white/50 hover:text-white/80 hover:border-white/15'
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                {label}
              </button>
            )
          })}
        </div>

        {sceneMode === 'studio' ? (
          <SliderRow
            label="Brightness"
            value={studioBrightness}
            min={LIGHT_RANGES.studioBrightness.min}
            max={LIGHT_RANGES.studioBrightness.max}
            step={LIGHT_RANGES.studioBrightness.step}
            display={studioBrightness.toFixed(2) + '×'}
            onChange={setStudioBrightness}
          />
        ) : sceneMode === 'indoor' ? (
          <SliderRow
            label="Brightness"
            value={indoorBrightness}
            min={LIGHT_RANGES.indoorBrightness.min}
            max={LIGHT_RANGES.indoorBrightness.max}
            step={LIGHT_RANGES.indoorBrightness.step}
            display={indoorBrightness.toFixed(2) + '×'}
            onChange={setIndoorBrightness}
          />
        ) : (
          <>
            <div className="grid grid-cols-4 gap-1 mb-2">
              {OUTDOOR_SCENARIOS.map(({ id, label, Icon, description }) => {
                const isActive = outdoorScenarioId === id
                return (
                  <button
                    key={id}
                    onClick={() => setOutdoorScenarioId(id)}
                    aria-label={`${label} outdoor scenario`}
                    aria-pressed={isActive}
                    title={description}
                    className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-md text-[9px] font-medium border transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-white/[0.12] border-white/30 text-white'
                        : 'bg-white/[0.03] border-white/[0.06] text-white/50 hover:text-white/80 hover:border-white/15'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {label}
                  </button>
                )
              })}
            </div>
            <SliderRow
              label="Sun intensity"
              value={sunIntensity}
              min={LIGHT_RANGES.sunIntensity.min}
              max={LIGHT_RANGES.sunIntensity.max}
              step={LIGHT_RANGES.sunIntensity.step}
              display={sunIntensity.toFixed(1) + '×'}
              onChange={setSunIntensity}
            />
            <SliderRow
              label="Sun height"
              value={sunElevation}
              min={LIGHT_RANGES.sunElevation.min}
              max={LIGHT_RANGES.sunElevation.max}
              step={LIGHT_RANGES.sunElevation.step}
              display={Math.round(sunElevation) + '°'}
              onChange={setSunElevation}
            />
          </>
        )}

        <SliderRow
          label="Crowd"
          value={crowdDensity}
          min={CROWD_RANGE.min}
          max={CROWD_RANGE.max}
          step={CROWD_RANGE.step}
          display={crowdDensity === 0 ? 'off' : `${crowdDensity}`}
          onChange={setCrowdDensity}
        />

        <div className="border-t border-white/[0.06] my-2" />

        <AudioControls />

        <div className="border-t border-white/[0.06] my-2" />

        {selectedElement && selectedMeta && (
          <div className="rounded-lg bg-white/[0.06] border border-white/[0.06] p-3 mb-2">
            <div className="flex items-center gap-2">
              <selectedMeta.Icon className="h-3.5 w-3.5 text-white/70" strokeWidth={1.75} />
              <div>
                <div className="text-[10px] text-white/40 font-semibold uppercase tracking-widest">
                  Selected
                </div>
                <div className="text-sm text-white font-medium">
                  {selectedMeta.label}
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {(
                [
                  { mode: 'translate' as const, Icon: Move, label: 'Move' },
                  { mode: 'rotate' as const, Icon: Rotate3d, label: 'Rotate' },
                  { mode: 'scale' as const, Icon: Maximize2, label: 'Scale' },
                ] as const
              ).map(({ mode, Icon, label }) => {
                const isActive = transformMode === mode
                return (
                  <button
                    key={mode}
                    onClick={() => setTransformMode(mode)}
                    title={label}
                    aria-label={`${label} mode`}
                    aria-pressed={isActive}
                    className={`flex flex-col items-center gap-1 py-1.5 rounded-md text-[10px] font-medium border transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-white/[0.12] border-white/30 text-white'
                        : 'bg-white/[0.03] border-white/[0.06] text-white/50 hover:text-white/80 hover:border-white/15'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {label}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => {
                removeStageElement(selectedId!)
                setSelectedId(null)
              }}
              className="w-full mt-2 px-3 py-1.5 rounded-md bg-red-500/15 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Trash2 className="h-3 w-3" strokeWidth={2} />
              Remove
            </button>
          </div>
        )}

        <div className="text-[10px] text-gray-600">
          {stageElements.length} element
          {stageElements.length !== 1 ? 's' : ''} on stage
          {selectedElement ? ' · drag the gizmo to move' : ''}
        </div>

        <div className="flex-1" />

        {/* ── Save / Share ── */}
        <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">
          Save / Share
        </h2>

        <div className="flex gap-1.5 mb-1.5">
          <input
            type="text"
            placeholder="Design name…"
            value={designName}
            onChange={(e) => setDesignName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveDesign()
            }}
            className="flex-1 min-w-0 rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 text-xs text-white placeholder-white/25 outline-none transition-colors focus:border-white/30"
          />
          <button
            onClick={handleSaveDesign}
            disabled={stageElements.length === 0}
            title="Save current stage layout"
            aria-label="Save current stage layout"
            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.06] hover:border-white/15 text-white/70 hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        </div>

        {savedList.length > 0 && (
          <div className="mb-2 max-h-[120px] overflow-y-auto pr-1 space-y-0.5">
            {savedList.map((d) => (
              <div
                key={d.id}
                className="group flex items-center gap-1 rounded-md border border-white/[0.04] hover:border-white/[0.10] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <button
                  onClick={() => handleLoadDesign(d)}
                  title={`Load — ${d.stageElements.length} elements`}
                  className="flex-1 min-w-0 px-2 py-1 text-left text-[11px] text-white/60 group-hover:text-white truncate cursor-pointer"
                >
                  {d.name}
                </button>
                <button
                  onClick={() => handleDeleteDesign(d.id)}
                  title="Delete saved design"
                  aria-label={`Delete saved design: ${d.name}`}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-white/30 hover:text-red-300 hover:bg-red-500/15 transition-colors cursor-pointer"
                >
                  <X className="h-3 w-3" strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleCopyShareLink}
          className={`mb-2 flex w-full items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
            copiedFlash
              ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
              : 'border-white/[0.08] bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white'
          }`}
        >
          {copiedFlash ? (
            <>
              <Check className="h-3.5 w-3.5" strokeWidth={2.25} />
              Link copied
            </>
          ) : (
            <>
              <Link2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              Copy share link
            </>
          )}
        </button>

        <div className="border-t border-white/[0.06] my-1" />

        <div className="mb-2">
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/40">
            Stage Notes
          </label>
          <textarea
            rows={2}
            placeholder="Notes for your stage design..."
            value={customNotes.stage}
            onChange={(e) => setCustomNote('stage', e.target.value)}
            className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs text-white placeholder-white/25 outline-none transition-colors focus:border-white/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => downloadRef.current?.()}
            title="Download a framed PNG of your stage"
            className="px-2 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/15 text-white/70 hover:text-white text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Camera className="h-3.5 w-3.5" strokeWidth={1.75} />
            PNG
          </button>
          <button
            onClick={() => {
              captureRef.current?.()
              setActiveTab(2)
            }}
            className="px-2 py-2 rounded-lg bg-white/[0.12] hover:bg-white/[0.18] text-white text-xs font-semibold transition-all shadow-lg shadow-white/[0.06] cursor-pointer flex items-center justify-center gap-1.5"
          >
            Next →
          </button>
        </div>
      </div>

      {/* ── 3D Canvas (error-bounded) ── */}
      <div ref={canvasWrapRef} className="flex-1 relative bg-black">
        {/* Fullscreen toggle — top-right, like YouTube. Press F to toggle. */}
        <button
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          title={isFullscreen ? 'Exit fullscreen (F · Esc)' : 'Fullscreen (F)'}
          className="absolute top-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-md bg-black/55 backdrop-blur border border-white/15 text-white/80 hover:bg-black/85 hover:border-white/30 transition-colors"
        >
          {isFullscreen ? (
            <Minimize className="h-4 w-4" strokeWidth={1.75} />
          ) : (
            <Maximize className="h-4 w-4" strokeWidth={1.75} />
          )}
        </button>
        <StageErrorBoundary>
          <Canvas
            shadows
            gl={{
              preserveDrawingBuffer: true,
              antialias: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              // Bumped from 1.0 → 1.4 so mid-tones lift before ACES roll-off
              // crushes them. Combined with brighter ambients per mode this
              // is the difference between "I can see what I built" and "...?"
              toneMappingExposure: 1.4,
            }}
            // far=5000 so drei <Sky> (sphere radius ~4500) renders inside the
            // camera frustum. Previously far=200 clipped the sky entirely,
            // which is why the user couldn't see it in outdoor mode.
            camera={{ position: [0, 6, 14], fov: 55, near: 0.1, far: 5000 }}
          >
            <SceneContents
              selectedId={selectedId}
              onSelect={setSelectedId}
              transformMode={transformMode}
              sceneMode={sceneMode}
              studioBrightness={studioBrightness}
              indoorBrightness={indoorBrightness}
              sunIntensity={sunIntensity}
              sunElevation={sunElevation}
              outdoorScenarioId={outdoorScenarioId}
              showStats={showStats}
              crowdDensity={crowdDensity}
              captureRef={captureRef}
              downloadRef={downloadRef}
              cameraTriggerRef={cameraTriggerRef}
            />
          </Canvas>
        </StageErrorBoundary>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] text-gray-600 pointer-events-none select-none">
          Click element · Drag gizmo to {transformMode} · Scroll to zoom · Use Camera presets for shots
        </div>
        <OnboardingTour />
      </div>
    </div>
  )
}
