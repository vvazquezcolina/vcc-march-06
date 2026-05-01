'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import {
  OrbitControls,
  Text,
  Stars,
  Sky,
  MeshReflectorMaterial,
  TransformControls,
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
  type LucideIcon,
} from 'lucide-react'
import { useFestivalStore } from '@/store/festival-store'
import type { StageElement } from '@/types/festival'

// ─── ELEMENT TYPE METADATA ─────────────────────────────────────────────────
// Each element has: a Lucide icon for the toolbar, a label, a description,
// and the bounding-box dimensions used to draw the selection wireframe.
type TransformMode = 'translate' | 'rotate' | 'scale'
type SceneMode = 'indoor' | 'outdoor'

// Light-control defaults & ranges (kept here so the UI sliders and the
// rendering code agree on the same numbers without indirection).
const LIGHT_DEFAULTS = {
  indoorBrightness: 1.4, // multiplier on ambient + key
  sunIntensity: 2.5,
  sunElevation: 50, // degrees above horizon, 0..90
} as const

const LIGHT_RANGES = {
  indoorBrightness: { min: 0.3, max: 3.0, step: 0.05 },
  sunIntensity: { min: 0.2, max: 5.0, step: 0.1 },
  sunElevation: { min: 5, max: 88, step: 1 },
} as const

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
    label: 'Speaker Stack',
    Icon: SpeakerIcon,
    desc: 'Wall of sound',
    selectionBox: { scale: [1.6, 3.5, 1.1], y: 1.4 },
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
      mat.emissiveIntensity =
        1.5 + Math.sin(clock.getElapsedTime() * speed) * 0.8
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
function Mainstage() {
  return (
    <group>
      {/* Stage floor (reflective) */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 10]} />
        <MeshReflectorMaterial
          mirror={0.4}
          blur={[300, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={0.6}
          color="#111118"
          metalness={0.8}
          roughness={0.4}
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
              <meshStandardMaterial color="#080812" metalness={0.6} roughness={0.4} />
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
              <meshStandardMaterial color="#333340" metalness={0.9} roughness={0.15} />
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
              <meshStandardMaterial color="#333340" metalness={0.9} roughness={0.15} />
            </mesh>
          )),
        )}

        {[-7.5, 7.5].map((x) => (
          <mesh key={`side-${x}`} position={[x, 8, 0]}>
            <boxGeometry args={[0.12, 0.12, 6.5]} />
            <meshStandardMaterial color="#333340" metalness={0.9} roughness={0.15} />
          </mesh>
        ))}
      </group>

      {/* DJ BOOTH */}
      <group position={[0, 0, -2]}>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[3, 1.2, 1.2]} />
          <meshStandardMaterial color="#0a0a14" metalness={0.5} roughness={0.4} />
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
        <meshStandardMaterial color="#050508" />
      </mesh>
      <mesh position={[0, 0.4, 5.3]}>
        <boxGeometry args={[14, 0.8, 0.1]} />
        <meshStandardMaterial color="#222230" metalness={0.7} roughness={0.3} />
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
      ref.current.rotation.y = Math.sin(clock.getElapsedTime() * 1.5) * 0.6
    }
  })
  return (
    <group ref={ref}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.3, 8]} />
        <meshStandardMaterial color="#1a1a2a" metalness={0.8} roughness={0.3} />
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
        <meshStandardMaterial color="#111118" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh ref={ref} position={[0, 1.6, 0.07]}>
        <boxGeometry args={[3, 2, 0.02]} />
        <meshStandardMaterial color="#ffffff" emissive="#7c3aed" emissiveIntensity={3} />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.5, 6]} />
        <meshStandardMaterial color="#333340" metalness={0.9} roughness={0.2} />
      </mesh>
      <pointLight color="#aa55ff" intensity={6} distance={10} position={[0, 1.6, 1]} />
    </group>
  )
}

function PyroInner() {
  const flameRefs = useRef<THREE.Mesh[]>([])
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    flameRefs.current.forEach((mesh, i) => {
      if (mesh) {
        const s = 1 + Math.sin(t * 10 + i * 2) * 0.4
        mesh.scale.set(s, 1 + Math.sin(t * 8 + i) * 0.6, s)
        const mat = mesh.material as THREE.MeshStandardMaterial
        mat.emissiveIntensity = 4 + Math.sin(t * 12 + i * 3) * 3
      }
    })
  })
  return (
    <group>
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 1.5, 8]} />
        <meshStandardMaterial color="#2a2a35" metalness={0.9} roughness={0.2} />
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
  // Animation on inner group only — outer group is the TransformControls
  // target and must not be moved per frame, otherwise drag fights animation.
  const animRef = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (animRef.current) {
      animRef.current.position.y = Math.sin(clock.getElapsedTime() * 15) * 0.008
    }
  })
  return (
    <group ref={animRef}>
      {[0, 0.55, 1.1, 1.65, 2.2, 2.75].map((y, i) => (
        <group key={i} position={[0, y, 0]}>
          <mesh>
            <boxGeometry args={[1.2, 0.5, 0.7]} />
            <meshStandardMaterial color="#0f0f14" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.36]}>
            <circleGeometry args={[0.18, 16]} />
            <meshStandardMaterial color="#1a1a24" metalness={0.4} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0, 0.36]}>
            <torusGeometry args={[0.18, 0.02, 8, 16]} />
            <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}
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
        <meshStandardMaterial color="#444450" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[5, 0.06, 0.06]} />
        <meshStandardMaterial color="#333340" metalness={0.9} roughness={0.2} />
      </mesh>
      <group ref={fixturesRef}>
        {colors.map((color, i) => (
          <group key={i} position={[(i - 2.5) * 0.9, -0.3, 0]}>
            <mesh>
              <cylinderGeometry args={[0.08, 0.12, 0.2, 8]} />
              <meshStandardMaterial color="#222230" metalness={0.8} roughness={0.3} />
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
        <meshStandardMaterial color="#2a2a35" metalness={0.7} roughness={0.3} />
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

// ─── STAGE LIGHTING ────────────────────────────────────────────────────────
// Two modes:
//  - indoor:  bright ambient + white front key + the existing animated
//             colored washes (full intensity). Concert/arena look. Brightness
//             slider scales ambient + key + colored washes uniformly.
//  - outdoor: drei <Sky> dome + directional sun (intensity & elevation
//             controllable). Colored washes stay but at 35% intensity so the
//             sun reads as the dominant light source.
function StageLighting({
  mode,
  indoorBrightness,
  sunIntensity,
  sunElevation,
}: {
  mode: SceneMode
  indoorBrightness: number
  sunIntensity: number
  sunElevation: number
}) {
  const animatedRef = useRef<THREE.Group>(null)
  // The colored washes flicker; keep them animated in both modes but scale
  // their base intensity by the active mode multiplier.
  const washMultiplier = mode === 'outdoor' ? 0.35 : indoorBrightness

  useFrame(({ clock }) => {
    if (animatedRef.current) {
      const t = clock.getElapsedTime()
      animatedRef.current.children.forEach((light, i) => {
        if (light instanceof THREE.SpotLight) {
          light.intensity =
            (15 + Math.sin(t * 2 + i * 1.5) * 8) * washMultiplier
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

  if (mode === 'outdoor') {
    return (
      <>
        <Sky
          sunPosition={sunPos}
          turbidity={6}
          rayleigh={2}
          mieCoefficient={0.005}
          mieDirectionalG={0.8}
        />
        {/* Sun fill — softens shadows, adds warm ambient */}
        <ambientLight intensity={0.4 * sunIntensity} color="#fff4d6" />
        {/* The sun itself */}
        <directionalLight
          position={sunPos}
          intensity={sunIntensity}
          color="#fffaf0"
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
      <ambientLight intensity={0.35 * indoorBrightness} color="#3a2a55" />
      {/* White front key wash */}
      <spotLight
        position={[0, 12, 8]}
        angle={0.5}
        penumbra={0.8}
        intensity={20 * indoorBrightness}
        color="#ffffff"
        castShadow
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
function ScreenshotHelper({
  triggerRef,
}: {
  triggerRef: React.MutableRefObject<(() => void) | null>
}) {
  const { gl, scene, camera } = useThree()
  const setStageSnapshot = useFestivalStore((s) => s.setStageSnapshot)
  const trigger = useCallback(() => {
    gl.render(scene, camera)
    setStageSnapshot(gl.domElement.toDataURL('image/png'))
  }, [gl, scene, camera, setStageSnapshot])
  // Mutating refs belongs in effects, not in the render body.
  useEffect(() => {
    triggerRef.current = trigger
    return () => {
      triggerRef.current = null
    }
  }, [trigger, triggerRef])
  return null
}

// ─── SCENE ─────────────────────────────────────────────────────────────────
function SceneContents({
  selectedId,
  onSelect,
  transformMode,
  sceneMode,
  indoorBrightness,
  sunIntensity,
  sunElevation,
  screenshotRef,
}: {
  selectedId: string | null
  onSelect: (id: string | null) => void
  transformMode: TransformMode
  sceneMode: SceneMode
  indoorBrightness: number
  sunIntensity: number
  sunElevation: number
  screenshotRef: React.MutableRefObject<(() => void) | null>
}) {
  const stageElements = useFestivalStore((s) => s.stageElements)

  return (
    <>
      <OrbitControls
        makeDefault
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={5}
        maxDistance={30}
        target={[0, 3, 0]}
      />
      {/* Stars are concert-mood — only indoors. Outside the sky dome takes over. */}
      {sceneMode === 'indoor' && (
        <Stars radius={100} depth={60} count={5000} factor={6} saturation={0.3} fade speed={1} />
      )}
      {/* Lighter, less saturated fog outdoors so daylight reads clean. */}
      <fog
        attach="fog"
        args={
          sceneMode === 'outdoor'
            ? ['#bcd0e3', 40, 90]
            : ['#0a0015', 25, 60]
        }
      />
      <StageLighting
        mode={sceneMode}
        indoorBrightness={indoorBrightness}
        sunIntensity={sunIntensity}
        sunElevation={sunElevation}
      />
      <Mainstage />
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

      <ScreenshotHelper triggerRef={screenshotRef} />
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
  const [sceneMode, setSceneMode] = useState<SceneMode>('indoor')
  const [indoorBrightness, setIndoorBrightness] = useState<number>(LIGHT_DEFAULTS.indoorBrightness)
  const [sunIntensity, setSunIntensity] = useState<number>(LIGHT_DEFAULTS.sunIntensity)
  const [sunElevation, setSunElevation] = useState<number>(LIGHT_DEFAULTS.sunElevation)

  const screenshotRef = useRef<(() => void) | null>(null)

  const addStageElement = useFestivalStore((s) => s.addStageElement)
  const removeStageElement = useFestivalStore((s) => s.removeStageElement)
  const stageElements = useFestivalStore((s) => s.stageElements)
  const setActiveTab = useFestivalStore((s) => s.setActiveTab)
  const customNotes = useFestivalStore((s) => s.customNotes)
  const setCustomNote = useFestivalStore((s) => s.setCustomNote)
  const hasInitialized = useRef(false)

  // Auto-populate with starter elements on first visit
  useEffect(() => {
    if (!hasInitialized.current && stageElements.length === 0) {
      hasInitialized.current = true
      addStageElement('screen')
      addStageElement('laser')
      addStageElement('laser')
      addStageElement('pyro')
      addStageElement('pyro')
      addStageElement('speaker')
      addStageElement('speaker')
      addStageElement('light')
      addStageElement('fog')
    }
  }, [addStageElement, stageElements.length])

  const selectedElement = stageElements.find((el) => el.id === selectedId)
  const selectedMeta = selectedElement
    ? ELEMENTS_BY_TYPE.get(selectedElement.type)
    : null

  return (
    <div className="relative w-full h-full min-h-[550px] flex rounded-xl overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="w-56 shrink-0 bg-gradient-to-b from-[#12101f] to-[#0a0812] border-r border-white/[0.06] flex flex-col p-3 gap-1.5 overflow-y-auto z-10">
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

        <div className="grid grid-cols-2 gap-1.5 mb-2">
          {(
            [
              { mode: 'indoor' as const, Icon: Building2, label: 'Indoor' },
              { mode: 'outdoor' as const, Icon: Sun, label: 'Outdoor' },
            ] as const
          ).map(({ mode, Icon, label }) => {
            const isActive = sceneMode === mode
            return (
              <button
                key={mode}
                onClick={() => setSceneMode(mode)}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
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

        {sceneMode === 'indoor' ? (
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

        <div className="mb-2">
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/40">
            Stage Notes
          </label>
          <textarea
            rows={3}
            placeholder="Notes for your stage design..."
            value={customNotes.stage}
            onChange={(e) => setCustomNote('stage', e.target.value)}
            className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs text-white placeholder-white/25 outline-none transition-colors focus:border-white/30"
          />
        </div>

        <button
          onClick={() => {
            screenshotRef.current?.()
            setActiveTab(2)
          }}
          className="w-full px-3 py-2.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-white text-sm font-semibold transition-all shadow-lg shadow-white/[0.06] cursor-pointer flex items-center justify-center gap-2"
        >
          <Camera className="h-4 w-4" strokeWidth={1.75} />
          Capture Stage
        </button>
      </div>

      {/* ── 3D Canvas ── */}
      <div className="flex-1 relative bg-black">
        <Canvas
          shadows
          gl={{
            preserveDrawingBuffer: true,
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1,
          }}
          camera={{ position: [0, 6, 14], fov: 55, near: 0.1, far: 200 }}
        >
          <SceneContents
            selectedId={selectedId}
            onSelect={setSelectedId}
            transformMode={transformMode}
            sceneMode={sceneMode}
            indoorBrightness={indoorBrightness}
            sunIntensity={sunIntensity}
            sunElevation={sunElevation}
            screenshotRef={screenshotRef}
          />
        </Canvas>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] text-gray-600 pointer-events-none select-none">
          Click element · Drag gizmo to {transformMode} · Scroll to zoom
        </div>
      </div>
    </div>
  )
}
