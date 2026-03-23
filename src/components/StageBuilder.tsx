'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { useFestivalStore } from '@/store/festival-store'
import type { StageElement } from '@/types/festival'

// ---------------------------------------------------------------------------
// Element type metadata (labels, icons for the toolbar)
// ---------------------------------------------------------------------------
const ELEMENT_TYPES: {
  type: StageElement['type']
  label: string
  icon: string
  description: string
}[] = [
  { type: 'laser', label: 'Laser Array', icon: '⚡', description: 'Green/blue laser beams' },
  { type: 'screen', label: 'LED Screen', icon: '📺', description: 'Glowing video panels' },
  { type: 'pyro', label: 'Pyro Tower', icon: '🔥', description: 'Fiery pyrotechnics' },
  { type: 'speaker', label: 'Speaker Stack', icon: '🔊', description: 'Thunderous bass' },
  { type: 'light', label: 'Lighting Rig', icon: '💡', description: 'Overhead light bars' },
  { type: 'fog', label: 'Fog Machine', icon: '🌫', description: 'Atmospheric haze' },
]

// ---------------------------------------------------------------------------
// 3D element renderers
// ---------------------------------------------------------------------------

function LaserArray({
  element,
  selected,
  onClick,
}: {
  element: StageElement
  selected: boolean
  onClick: () => void
}) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.3
    }
  })

  return (
    <group
      ref={groupRef}
      position={element.position}
      rotation={element.rotation}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      {/* Central beam */}
      <mesh>
        <cylinderGeometry args={[0.02, 0.02, 4, 8]} />
        <meshStandardMaterial
          color="#00ff88"
          emissive="#00ff88"
          emissiveIntensity={3}
          transparent
          opacity={0.8}
        />
      </mesh>
      {/* Side beams */}
      {[-0.15, 0.15].map((offset, i) => (
        <mesh key={i} position={[offset, 0, 0]} rotation={[0, 0, (i === 0 ? 0.15 : -0.15)]}>
          <cylinderGeometry args={[0.015, 0.015, 3.5, 8]} />
          <meshStandardMaterial
            color="#00aaff"
            emissive="#00aaff"
            emissiveIntensity={2.5}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
      {/* Glow point at base */}
      <pointLight color="#00ff88" intensity={2} distance={5} position={[0, -2, 0]} />
      {/* Selection highlight */}
      {selected && (
        <mesh scale={[0.6, 4.4, 0.6]}>
          <boxGeometry />
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  )
}

function LEDScreen({
  element,
  selected,
  onClick,
}: {
  element: StageElement
  selected: boolean
  onClick: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      const t = clock.getElapsedTime()
      const r = Math.sin(t * 0.8) * 0.3 + 0.5
      const g = Math.sin(t * 0.6 + 1) * 0.2 + 0.3
      const b = Math.sin(t * 0.4 + 2) * 0.3 + 0.7
      mat.emissive.setRGB(r, g, b)
    }
  })

  const width = 1.5 + Math.abs(Math.sin(element.position[0]) * 0.8)
  const height = 1.0 + Math.abs(Math.cos(element.position[2]) * 0.5)

  return (
    <group
      position={element.position}
      rotation={element.rotation}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      {/* Screen panel */}
      <mesh ref={meshRef}>
        <boxGeometry args={[width, height, 0.05]} />
        <meshStandardMaterial
          color="#ccccff"
          emissive="#8833ff"
          emissiveIntensity={2}
        />
      </mesh>
      {/* Thin frame */}
      <mesh>
        <boxGeometry args={[width + 0.08, height + 0.08, 0.03]} />
        <meshStandardMaterial color="#222222" metalness={0.9} roughness={0.2} />
      </mesh>
      <pointLight color="#aa55ff" intensity={3} distance={6} />
      {selected && (
        <mesh scale={[width + 0.2, height + 0.2, 0.3]}>
          <boxGeometry />
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  )
}

function PyroTower({
  element,
  selected,
  onClick,
}: {
  element: StageElement
  selected: boolean
  onClick: () => void
}) {
  const flameRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (flameRef.current) {
      const t = clock.getElapsedTime()
      const scale = 1 + Math.sin(t * 8) * 0.3
      flameRef.current.scale.set(scale, 1 + Math.sin(t * 6) * 0.5, scale)
      const mat = flameRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 3 + Math.sin(t * 10) * 2
    }
  })

  return (
    <group
      position={element.position}
      rotation={element.rotation}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      {/* Base column */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.6, 8]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Flame cone */}
      <mesh ref={flameRef} position={[0, 1.2, 0]}>
        <coneGeometry args={[0.25, 1.2, 12]} />
        <meshStandardMaterial
          color="#ff4400"
          emissive="#ff6600"
          emissiveIntensity={4}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Inner flame */}
      <mesh position={[0, 1.0, 0]}>
        <coneGeometry args={[0.12, 0.8, 8]} />
        <meshStandardMaterial
          color="#ffaa00"
          emissive="#ffcc00"
          emissiveIntensity={5}
          transparent
          opacity={0.7}
        />
      </mesh>
      <pointLight color="#ff4400" intensity={5} distance={8} position={[0, 1.5, 0]} />
      {selected && (
        <mesh position={[0, 0.8, 0]} scale={[0.8, 2.5, 0.8]}>
          <boxGeometry />
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  )
}

function SpeakerStack({
  element,
  selected,
  onClick,
}: {
  element: StageElement
  selected: boolean
  onClick: () => void
}) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime()
      groupRef.current.position.y = element.position[1] + Math.sin(t * 12) * 0.005
    }
  })

  return (
    <group
      ref={groupRef}
      position={element.position}
      rotation={element.rotation}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      {/* Stack of speaker boxes */}
      {[0, 0.45, 0.9, 1.35].map((yOff, i) => (
        <mesh key={i} position={[0, yOff, 0]}>
          <boxGeometry args={[0.6, 0.4, 0.4]} />
          <meshStandardMaterial
            color="#1a1a1a"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
      ))}
      {/* Speaker cones (circles on front face) */}
      {[0, 0.45, 0.9, 1.35].map((yOff, i) => (
        <mesh key={`cone-${i}`} position={[0, yOff, 0.21]}>
          <circleGeometry args={[0.12, 16]} />
          <meshStandardMaterial color="#333333" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      {selected && (
        <mesh position={[0, 0.65, 0]} scale={[0.9, 2.0, 0.7]}>
          <boxGeometry />
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  )
}

function LightingRig({
  element,
  selected,
  onClick,
}: {
  element: StageElement
  selected: boolean
  onClick: () => void
}) {
  const lightsRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (lightsRef.current) {
      const t = clock.getElapsedTime()
      lightsRef.current.children.forEach((child, i) => {
        child.rotation.x = Math.sin(t * 2 + i * 0.5) * 0.4
      })
    }
  })

  return (
    <group
      position={element.position}
      rotation={element.rotation}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      {/* Horizontal truss bar */}
      <mesh>
        <boxGeometry args={[3.5, 0.06, 0.06]} />
        <meshStandardMaterial color="#444444" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Cross bracing */}
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.03, 3.5, 0.03]} />
        <meshStandardMaterial color="#444444" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Light fixtures hanging down */}
      <group ref={lightsRef}>
        {[-1.4, -0.7, 0, 0.7, 1.4].map((xOff, i) => {
          const colors = ['#ff0044', '#00ff88', '#4488ff', '#ffaa00', '#ff00ff']
          return (
            <group key={i} position={[xOff, -0.2, 0]}>
              <mesh>
                <cylinderGeometry args={[0.06, 0.08, 0.15, 8]} />
                <meshStandardMaterial color="#222222" metalness={0.8} roughness={0.3} />
              </mesh>
              <spotLight
                color={colors[i]}
                intensity={8}
                distance={10}
                angle={0.5}
                penumbra={0.6}
                position={[0, -0.1, 0]}
                target-position={[xOff * 0.3, -5, 0]}
              />
              <pointLight color={colors[i]} intensity={1} distance={2} />
            </group>
          )
        })}
      </group>
      {selected && (
        <mesh scale={[4.0, 0.6, 0.4]}>
          <boxGeometry />
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  )
}

function FogMachine({
  element,
  selected,
  onClick,
}: {
  element: StageElement
  selected: boolean
  onClick: () => void
}) {
  const fogRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (fogRef.current) {
      const t = clock.getElapsedTime()
      const scale = 1 + Math.sin(t * 1.5) * 0.3
      fogRef.current.scale.set(scale * 2, scale * 0.5, scale * 2)
      const mat = fogRef.current.material as THREE.MeshStandardMaterial
      mat.opacity = 0.15 + Math.sin(t * 0.8) * 0.1
    }
  })

  return (
    <group
      position={element.position}
      rotation={element.rotation}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      {/* Machine body */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.15, 0.18, 0.2, 12]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Nozzle */}
      <mesh position={[0.15, 0.15, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.05, 0.12, 8]} />
        <meshStandardMaterial color="#444444" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Fog cloud */}
      <mesh ref={fogRef} position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial
          color="#aabbcc"
          emissive="#667788"
          emissiveIntensity={0.5}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      {selected && (
        <mesh position={[0, 0.2, 0]} scale={[0.7, 0.6, 0.7]}>
          <boxGeometry />
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Element dispatcher
// ---------------------------------------------------------------------------
function StageElementMesh({
  element,
  selected,
  onClick,
}: {
  element: StageElement
  selected: boolean
  onClick: () => void
}) {
  switch (element.type) {
    case 'laser':
      return <LaserArray element={element} selected={selected} onClick={onClick} />
    case 'screen':
      return <LEDScreen element={element} selected={selected} onClick={onClick} />
    case 'pyro':
      return <PyroTower element={element} selected={selected} onClick={onClick} />
    case 'speaker':
      return <SpeakerStack element={element} selected={selected} onClick={onClick} />
    case 'light':
      return <LightingRig element={element} selected={selected} onClick={onClick} />
    case 'fog':
      return <FogMachine element={element} selected={selected} onClick={onClick} />
    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// Stage floor
// ---------------------------------------------------------------------------
function StageFloor() {
  return (
    <group>
      {/* Main stage platform */}
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <boxGeometry args={[10, 0.3, 6]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Front edge accent strip */}
      <mesh position={[0, -0.01, 3.01]}>
        <boxGeometry args={[10.05, 0.06, 0.05]} />
        <meshStandardMaterial
          color="#ff00ff"
          emissive="#ff00ff"
          emissiveIntensity={2}
        />
      </mesh>
      {/* Side edge strips */}
      {[-5.01, 5.01].map((x, i) => (
        <mesh key={i} position={[x, -0.01, 0]}>
          <boxGeometry args={[0.05, 0.06, 6.05]} />
          <meshStandardMaterial
            color="#00ccff"
            emissive="#00ccff"
            emissiveIntensity={1.5}
          />
        </mesh>
      ))}
      {/* Back wall / truss structure suggestion */}
      <mesh position={[0, 2.5, -2.9]} receiveShadow>
        <boxGeometry args={[10, 5, 0.1]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.4} roughness={0.8} />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Lineup text floating above stage
// ---------------------------------------------------------------------------
function LineupText() {
  const lineup = useFestivalStore((s) => s.lineup)
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.y = 6 + Math.sin(clock.getElapsedTime() * 0.5) * 0.15
    }
  })

  if (!lineup) return null

  const headlinerNames = lineup.headliners.map((a) => a.name).join('  /  ')
  const subNames = lineup.subHeadliners.map((a) => a.name).join('  /  ')
  const openerNames = lineup.openers.map((a) => a.name).join('  /  ')

  return (
    <group ref={groupRef} position={[0, 6, 0]}>
      <Text
        fontSize={0.45}
        color="#ffcc00"
        anchorX="center"
        anchorY="middle"
        position={[0, 0.8, 0]}
        maxWidth={9}
        font={undefined}
      >
        {headlinerNames}
      </Text>
      <Text
        fontSize={0.28}
        color="#cc88ff"
        anchorX="center"
        anchorY="middle"
        position={[0, 0, 0]}
        maxWidth={9}
        font={undefined}
      >
        {subNames}
      </Text>
      <Text
        fontSize={0.2}
        color="#88ccff"
        anchorX="center"
        anchorY="middle"
        position={[0, -0.6, 0]}
        maxWidth={9}
        font={undefined}
      >
        {openerNames}
      </Text>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Scene lighting
// ---------------------------------------------------------------------------
function StageLighting() {
  return (
    <>
      <ambientLight intensity={0.15} color="#222244" />
      {/* Key front spotlight */}
      <spotLight
        position={[0, 8, 6]}
        angle={0.4}
        penumbra={0.7}
        intensity={15}
        color="#ffffff"
        castShadow
      />
      {/* Side color washes */}
      <spotLight
        position={[-6, 6, 2]}
        angle={0.5}
        penumbra={0.8}
        intensity={10}
        color="#ff0066"
      />
      <spotLight
        position={[6, 6, 2]}
        angle={0.5}
        penumbra={0.8}
        intensity={10}
        color="#0066ff"
      />
      {/* Back rim light */}
      <spotLight
        position={[0, 7, -4]}
        angle={0.6}
        penumbra={0.5}
        intensity={8}
        color="#aa00ff"
      />
      {/* Floor up-lights */}
      <pointLight position={[-3, 0.2, 2]} intensity={2} color="#ff4400" distance={5} />
      <pointLight position={[3, 0.2, 2]} intensity={2} color="#0044ff" distance={5} />
      <pointLight position={[0, 0.2, 2.5]} intensity={2} color="#ff00ff" distance={4} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Screenshot helper (inside Canvas context)
// ---------------------------------------------------------------------------
function ScreenshotHelper({
  triggerRef,
}: {
  triggerRef: React.MutableRefObject<(() => void) | null>
}) {
  const { gl, scene, camera } = useThree()
  const setStageSnapshot = useFestivalStore((s) => s.setStageSnapshot)

  triggerRef.current = useCallback(() => {
    gl.render(scene, camera)
    const dataUrl = gl.domElement.toDataURL('image/png')
    setStageSnapshot(dataUrl)
  }, [gl, scene, camera, setStageSnapshot])

  return null
}

// ---------------------------------------------------------------------------
// Main scene contents
// ---------------------------------------------------------------------------
function SceneContents({
  selectedId,
  onSelect,
  screenshotRef,
}: {
  selectedId: string | null
  onSelect: (id: string | null) => void
  screenshotRef: React.MutableRefObject<(() => void) | null>
}) {
  const stageElements = useFestivalStore((s) => s.stageElements)

  return (
    <>
      {/* Camera controls */}
      <OrbitControls
        makeDefault
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={4}
        maxDistance={22}
        target={[0, 1.5, 0]}
      />

      {/* Background stars */}
      <Stars radius={80} depth={60} count={3000} factor={5} saturation={0.3} fade speed={1.5} />

      {/* Lighting */}
      <StageLighting />

      {/* Stage platform */}
      <StageFloor />

      {/* Lineup text */}
      <LineupText />

      {/* Stage elements */}
      {stageElements.map((el) => (
        <StageElementMesh
          key={el.id}
          element={el}
          selected={selectedId === el.id}
          onClick={() => onSelect(selectedId === el.id ? null : el.id)}
        />
      ))}

      {/* Deselect when clicking empty space */}
      <mesh
        position={[0, -0.5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
        onClick={() => onSelect(null)}
      >
        <planeGeometry args={[50, 50]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Screenshot helper */}
      <ScreenshotHelper triggerRef={screenshotRef} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Main StageBuilder component
// ---------------------------------------------------------------------------
export default function StageBuilder() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const screenshotRef = useRef<(() => void) | null>(null)

  const addStageElement = useFestivalStore((s) => s.addStageElement)
  const removeStageElement = useFestivalStore((s) => s.removeStageElement)
  const stageElements = useFestivalStore((s) => s.stageElements)

  const handleAdd = (type: StageElement['type']) => {
    addStageElement(type)
  }

  const handleRemove = () => {
    if (selectedId) {
      removeStageElement(selectedId)
      setSelectedId(null)
    }
  }

  const handleCapture = () => {
    if (screenshotRef.current) {
      screenshotRef.current()
    }
  }

  const selectedElement = stageElements.find((el) => el.id === selectedId)

  return (
    <div className="relative w-full h-full min-h-[600px] flex bg-black">
      {/* ------- Left toolbar ------- */}
      <div className="w-56 shrink-0 bg-gradient-to-b from-gray-900 via-gray-950 to-black border-r border-gray-800 flex flex-col p-3 gap-2 overflow-y-auto z-10">
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-1">
          Stage Elements
        </h2>

        {ELEMENT_TYPES.map(({ type, label, icon, description }) => (
          <button
            key={type}
            onClick={() => handleAdd(type)}
            className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-gray-800/60 hover:bg-gray-700/80 border border-gray-700/50 hover:border-purple-500/50 transition-all text-left group"
          >
            <span className="text-lg mt-0.5">{icon}</span>
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-200 group-hover:text-white">
                {label}
              </div>
              <div className="text-[11px] text-gray-500 group-hover:text-gray-400 leading-tight">
                {description}
              </div>
            </div>
          </button>
        ))}

        {/* Divider */}
        <div className="border-t border-gray-800 my-2" />

        {/* Selected info */}
        {selectedElement && (
          <div className="rounded-lg bg-purple-900/30 border border-purple-700/40 p-3">
            <div className="text-xs text-purple-300 font-medium uppercase tracking-wider mb-1">
              Selected
            </div>
            <div className="text-sm text-white font-medium mb-2">
              {ELEMENT_TYPES.find((t) => t.type === selectedElement.type)?.label}
            </div>
            <button
              onClick={handleRemove}
              className="w-full px-3 py-1.5 rounded-md bg-red-600/80 hover:bg-red-500 text-white text-sm font-medium transition-colors"
            >
              Remove Element
            </button>
          </div>
        )}

        {/* Element count */}
        <div className="text-xs text-gray-600 mt-1">
          {stageElements.length} element{stageElements.length !== 1 ? 's' : ''} on stage
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Capture button */}
        <button
          onClick={handleCapture}
          className="w-full px-3 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-semibold transition-all shadow-lg shadow-purple-900/40"
        >
          Capture Stage
        </button>
      </div>

      {/* ------- 3D Canvas ------- */}
      <div className="flex-1 relative">
        <Canvas
          shadows
          gl={{ preserveDrawingBuffer: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
          camera={{ position: [0, 5, 10], fov: 55, near: 0.1, far: 200 }}
          style={{ background: 'linear-gradient(to bottom, #050510, #0a0a1a, #000000)' }}
        >
          <SceneContents
            selectedId={selectedId}
            onSelect={setSelectedId}
            screenshotRef={screenshotRef}
          />
        </Canvas>

        {/* Overlay instructions */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-500 pointer-events-none select-none">
          Click + drag to orbit &middot; Scroll to zoom &middot; Click an element to select
        </div>
      </div>
    </div>
  )
}
