'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Stars, MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { useFestivalStore } from '@/store/festival-store'
import type { StageElement } from '@/types/festival'

const ELEMENT_TYPES: {
  type: StageElement['type']
  label: string
  icon: string
  desc: string
}[] = [
  { type: 'laser', label: 'Laser Array', icon: '⚡', desc: 'Sweeping laser beams' },
  { type: 'screen', label: 'LED Screen', icon: '📺', desc: 'Giant video panel' },
  { type: 'pyro', label: 'Pyrotechnics', icon: '🔥', desc: 'Fire columns' },
  { type: 'speaker', label: 'Speaker Stack', icon: '🔊', desc: 'Wall of sound' },
  { type: 'light', label: 'Lighting Rig', icon: '💡', desc: 'Moving head lights' },
  { type: 'fog', label: 'Fog Machine', icon: '🌫', desc: 'Atmospheric haze' },
]

// ─── Reusable animated glow ring ───────────────────────────────────────────
function GlowRing({ radius, color, y = 0, speed = 1 }: { radius: number; color: string; y?: number; speed?: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 1.5 + Math.sin(clock.getElapsedTime() * speed) * 0.8
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
      {/* ── Stage floor (reflective) ── */}
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

      {/* ── Front LED strip ── */}
      <mesh position={[0, 0.06, 5.01]}>
        <boxGeometry args={[16, 0.12, 0.08]} />
        <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={4} />
      </mesh>

      {/* ── Side LED strips ── */}
      {[-8.01, 8.01].map((x, i) => (
        <mesh key={i} position={[x, 0.06, 0]}>
          <boxGeometry args={[0.08, 0.12, 10]} />
          <meshStandardMaterial color="#00ccff" emissive="#00ccff" emissiveIntensity={3} />
        </mesh>
      ))}

      {/* ── BACK WALL - curved arch structure ── */}
      <group position={[0, 0, -4.8]}>
        {/* Main curved back wall - multiple panels angled to create curve */}
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

        {/* Decorative LED strips on back wall */}
        {[-3, -1.5, 0, 1.5, 3].map((x, i) => {
          const colors = ['#ff0066', '#7c3aed', '#00ccff', '#7c3aed', '#ff0066']
          return (
            <mesh key={`strip-${i}`} position={[x, 3.5, 0.15]}>
              <boxGeometry args={[0.06, 6.5, 0.06]} />
              <meshStandardMaterial color={colors[i]} emissive={colors[i]} emissiveIntensity={3} />
            </mesh>
          )
        })}

        {/* Horizontal LED accents */}
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

      {/* ── OVERHEAD TRUSS ── */}
      <group>
        {/* Main horizontal truss bars */}
        {[-3, 0, 3].map((z) => (
          <group key={`truss-h-${z}`}>
            <mesh position={[0, 8, z]}>
              <boxGeometry args={[16, 0.12, 0.12]} />
              <meshStandardMaterial color="#333340" metalness={0.9} roughness={0.15} />
            </mesh>
            {/* Cross bracing */}
            <mesh position={[0, 8, z]} rotation={[0, 0, 0]}>
              <boxGeometry args={[16, 0.06, 0.06]} />
              <meshStandardMaterial color="#22222e" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        ))}

        {/* Vertical truss pillars at corners */}
        {[-7.5, 7.5].map((x) =>
          [-3, 3].map((z) => (
            <mesh key={`pillar-${x}-${z}`} position={[x, 4, z]}>
              <boxGeometry args={[0.15, 8, 0.15]} />
              <meshStandardMaterial color="#333340" metalness={0.9} roughness={0.15} />
            </mesh>
          ))
        )}

        {/* Side truss connecting bars */}
        {[-7.5, 7.5].map((x) => (
          <mesh key={`side-${x}`} position={[x, 8, 0]}>
            <boxGeometry args={[0.12, 0.12, 6.5]} />
            <meshStandardMaterial color="#333340" metalness={0.9} roughness={0.15} />
          </mesh>
        ))}
      </group>

      {/* ── DJ BOOTH ── */}
      <group position={[0, 0, -2]}>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[3, 1.2, 1.2]} />
          <meshStandardMaterial color="#0a0a14" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Front LED on DJ booth */}
        <mesh position={[0, 0.6, 0.61]}>
          <boxGeometry args={[2.9, 1.1, 0.02]} />
          <meshStandardMaterial color="#7c3aed" emissive="#7c3aed" emissiveIntensity={1.5} />
        </mesh>
      </group>

      {/* ── FLOOR GLOW RINGS ── */}
      <GlowRing radius={2.5} color="#7c3aed" y={0.02} speed={0.8} />
      <GlowRing radius={4.5} color="#ec4899" y={0.02} speed={1.2} />
      <GlowRing radius={6.5} color="#00ccff" y={0.02} speed={0.5} />

      {/* ── CROWD AREA ── */}
      <mesh position={[0, -0.05, 9]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 8]} />
        <meshStandardMaterial color="#050508" />
      </mesh>
      {/* Crowd barrier */}
      <mesh position={[0, 0.4, 5.3]}>
        <boxGeometry args={[14, 0.8, 0.1]} />
        <meshStandardMaterial color="#222230" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  )
}

// ─── ELEMENT RENDERERS ─────────────────────────────────────────────────────

function LaserArray({ element, selected, onClick }: { element: StageElement; selected: boolean; onClick: () => void }) {
  const groupRef = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 1.5) * 0.6
    }
  })

  return (
    <group ref={groupRef} position={element.position} onClick={(e) => { e.stopPropagation(); onClick() }}>
      {/* Base unit */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.3, 8]} />
        <meshStandardMaterial color="#1a1a2a" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Main beam */}
      {[-0.2, 0, 0.2].map((x, i) => {
        const colors = ['#00ff88', '#00ffcc', '#00ff88']
        return (
          <mesh key={i} position={[x, 3, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 5.5, 6]} />
            <meshStandardMaterial color={colors[i]} emissive={colors[i]} emissiveIntensity={5} transparent opacity={0.9} />
          </mesh>
        )
      })}
      <pointLight color="#00ff88" intensity={8} distance={12} position={[0, 3, 0]} />
      {selected && <SelectionBox scale={[0.8, 6, 0.8]} y={3} />}
    </group>
  )
}

function LEDScreen({ element, selected, onClick }: { element: StageElement; selected: boolean; onClick: () => void }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshStandardMaterial
      const t = clock.getElapsedTime()
      mat.emissive.setHSL((t * 0.1) % 1, 0.8, 0.4)
    }
  })

  return (
    <group position={element.position} onClick={(e) => { e.stopPropagation(); onClick() }}>
      {/* Frame */}
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[3.2, 2.2, 0.12]} />
        <meshStandardMaterial color="#111118" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Screen surface */}
      <mesh ref={ref} position={[0, 1.6, 0.07]}>
        <boxGeometry args={[3, 2, 0.02]} />
        <meshStandardMaterial color="#ffffff" emissive="#7c3aed" emissiveIntensity={3} />
      </mesh>
      {/* Support pole */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.5, 6]} />
        <meshStandardMaterial color="#333340" metalness={0.9} roughness={0.2} />
      </mesh>
      <pointLight color="#aa55ff" intensity={6} distance={10} position={[0, 1.6, 1]} />
      {selected && <SelectionBox scale={[3.5, 3, 0.5]} y={1.5} />}
    </group>
  )
}

function PyroTower({ element, selected, onClick }: { element: StageElement; selected: boolean; onClick: () => void }) {
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
    <group position={element.position} onClick={(e) => { e.stopPropagation(); onClick() }}>
      {/* Metal base column */}
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 1.5, 8]} />
        <meshStandardMaterial color="#2a2a35" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Flame nozzle */}
      <mesh position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.1, 8]} />
        <meshStandardMaterial color="#444" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Flames - multiple layers */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(el) => { if (el) flameRefs.current[i] = el }} position={[0, 2.2 + i * 0.4, 0]}>
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
      {selected && <SelectionBox scale={[0.8, 4, 0.8]} y={1.5} />}
    </group>
  )
}

function SpeakerStack({ element, selected, onClick }: { element: StageElement; selected: boolean; onClick: () => void }) {
  const groupRef = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.y = element.position[1] + Math.sin(clock.getElapsedTime() * 15) * 0.008
    }
  })

  return (
    <group ref={groupRef} position={element.position} onClick={(e) => { e.stopPropagation(); onClick() }}>
      {/* 6-unit speaker wall */}
      {[0, 0.55, 1.1, 1.65, 2.2, 2.75].map((y, i) => (
        <group key={i} position={[0, y, 0]}>
          <mesh>
            <boxGeometry args={[1.2, 0.5, 0.7]} />
            <meshStandardMaterial color="#0f0f14" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Speaker cone */}
          <mesh position={[0, 0, 0.36]}>
            <circleGeometry args={[0.18, 16]} />
            <meshStandardMaterial color="#1a1a24" metalness={0.4} roughness={0.6} />
          </mesh>
          {/* Speaker ring */}
          <mesh position={[0, 0, 0.36]}>
            <torusGeometry args={[0.18, 0.02, 8, 16]} />
            <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}
      {selected && <SelectionBox scale={[1.6, 3.5, 1.1]} y={1.4} />}
    </group>
  )
}

function LightingRig({ element, selected, onClick }: { element: StageElement; selected: boolean; onClick: () => void }) {
  const fixturesRef = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (fixturesRef.current) {
      fixturesRef.current.children.forEach((child, i) => {
        child.rotation.x = Math.sin(clock.getElapsedTime() * 2 + i * 1.2) * 0.5
        child.rotation.z = Math.cos(clock.getElapsedTime() * 1.5 + i * 0.8) * 0.3
      })
    }
  })

  const colors = ['#ff0066', '#00ff88', '#4488ff', '#ffaa00', '#ff00ff', '#00ffcc']

  return (
    <group position={element.position} onClick={(e) => { e.stopPropagation(); onClick() }}>
      {/* Main truss bar */}
      <mesh>
        <boxGeometry args={[5, 0.1, 0.1]} />
        <meshStandardMaterial color="#444450" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Secondary bar */}
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[5, 0.06, 0.06]} />
        <meshStandardMaterial color="#333340" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Light fixtures */}
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
      {selected && <SelectionBox scale={[5.5, 1, 0.5]} y={-0.1} />}
    </group>
  )
}

function FogMachine({ element, selected, onClick }: { element: StageElement; selected: boolean; onClick: () => void }) {
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
        mat.opacity = 0.12 - i * 0.02 + Math.sin(t * 0.6 + i * 1.5) * 0.04
      })
    }
  })

  return (
    <group position={element.position} onClick={(e) => { e.stopPropagation(); onClick() }}>
      {/* Machine housing */}
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.5, 0.25, 0.3]} />
        <meshStandardMaterial color="#2a2a35" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Nozzle */}
      <mesh position={[0.3, 0.18, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.04, 0.06, 0.15, 8]} />
        <meshStandardMaterial color="#444" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Fog clouds - layered spheres */}
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
      {selected && <SelectionBox scale={[1.2, 1, 1.2]} y={0.3} />}
    </group>
  )
}

// ─── SELECTION BOX ─────────────────────────────────────────────────────────
function SelectionBox({ scale, y = 0 }: { scale: [number, number, number]; y?: number }) {
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

// ─── ELEMENT DISPATCHER ────────────────────────────────────────────────────
function StageElementMesh({ element, selected, onClick }: { element: StageElement; selected: boolean; onClick: () => void }) {
  switch (element.type) {
    case 'laser': return <LaserArray element={element} selected={selected} onClick={onClick} />
    case 'screen': return <LEDScreen element={element} selected={selected} onClick={onClick} />
    case 'pyro': return <PyroTower element={element} selected={selected} onClick={onClick} />
    case 'speaker': return <SpeakerStack element={element} selected={selected} onClick={onClick} />
    case 'light': return <LightingRig element={element} selected={selected} onClick={onClick} />
    case 'fog': return <FogMachine element={element} selected={selected} onClick={onClick} />
    default: return null
  }
}

// ─── LINEUP TEXT ───────────────────────────────────────────────────────────
function LineupText() {
  const lineup = useFestivalStore((s) => s.lineup)
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = 9.5 + Math.sin(clock.getElapsedTime() * 0.4) * 0.15
  })
  if (!lineup) return null
  return (
    <group ref={ref} position={[0, 9.5, -2]}>
      {lineup.headliners.slice(0, 3).map((a, i) => (
        <Text key={a.name} position={[0, -i * 0.8, 0]} fontSize={0.6} color="#ffffff" anchorX="center"
          outlineWidth={0.03} outlineColor="#7c3aed" font={undefined}>
          {a.name.toUpperCase()}
        </Text>
      ))}
      <Text position={[0, -2.8, 0]} fontSize={0.25} color="#ec4899" anchorX="center" font={undefined}>
        {lineup.subHeadliners.map(a => a.name).join('  ·  ')}
      </Text>
    </group>
  )
}

// ─── STAGE LIGHTING ────────────────────────────────────────────────────────
function StageLighting() {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime()
      ref.current.children.forEach((light, i) => {
        if (light instanceof THREE.SpotLight) {
          light.intensity = 15 + Math.sin(t * 2 + i * 1.5) * 8
        }
      })
    }
  })

  return (
    <>
      <ambientLight intensity={0.08} color="#1a1030" />
      {/* Key front wash */}
      <spotLight position={[0, 12, 8]} angle={0.5} penumbra={0.8} intensity={20} color="#ffffff" castShadow />
      {/* Animated colored washes */}
      <group ref={ref}>
        <spotLight position={[-8, 10, 3]} angle={0.6} penumbra={0.9} intensity={18} color="#ff0066" />
        <spotLight position={[8, 10, 3]} angle={0.6} penumbra={0.9} intensity={18} color="#0066ff" />
        <spotLight position={[-4, 12, -3]} angle={0.5} penumbra={0.7} intensity={15} color="#7c3aed" />
        <spotLight position={[4, 12, -3]} angle={0.5} penumbra={0.7} intensity={15} color="#ec4899" />
        <spotLight position={[0, 10, -5]} angle={0.7} penumbra={0.5} intensity={12} color="#aa00ff" />
      </group>
      {/* Floor up-lights */}
      <pointLight position={[-5, 0.3, 3]} intensity={4} color="#ff0066" distance={8} />
      <pointLight position={[5, 0.3, 3]} intensity={4} color="#0044ff" distance={8} />
      <pointLight position={[0, 0.3, 4]} intensity={5} color="#ff00ff" distance={6} />
      <pointLight position={[-3, 0.3, -3]} intensity={3} color="#7c3aed" distance={6} />
      <pointLight position={[3, 0.3, -3]} intensity={3} color="#00ccff" distance={6} />
    </>
  )
}

// ─── SCREENSHOT HELPER ─────────────────────────────────────────────────────
function ScreenshotHelper({ triggerRef }: { triggerRef: React.MutableRefObject<(() => void) | null> }) {
  const { gl, scene, camera } = useThree()
  const setStageSnapshot = useFestivalStore((s) => s.setStageSnapshot)
  triggerRef.current = useCallback(() => {
    gl.render(scene, camera)
    setStageSnapshot(gl.domElement.toDataURL('image/png'))
  }, [gl, scene, camera, setStageSnapshot])
  return null
}

// ─── SCENE ─────────────────────────────────────────────────────────────────
function SceneContents({ selectedId, onSelect, screenshotRef }: {
  selectedId: string | null
  onSelect: (id: string | null) => void
  screenshotRef: React.MutableRefObject<(() => void) | null>
}) {
  const stageElements = useFestivalStore((s) => s.stageElements)
  return (
    <>
      <OrbitControls makeDefault minPolarAngle={0.1} maxPolarAngle={Math.PI / 2.1} minDistance={5} maxDistance={30} target={[0, 3, 0]} />
      <Stars radius={100} depth={60} count={5000} factor={6} saturation={0.3} fade speed={1} />
      <fog attach="fog" args={['#0a0015', 25, 60]} />
      <StageLighting />
      <Mainstage />
      <LineupText />
      {stageElements.map((el) => (
        <StageElementMesh key={el.id} element={el} selected={selectedId === el.id}
          onClick={() => onSelect(selectedId === el.id ? null : el.id)} />
      ))}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}
        onClick={() => onSelect(null)}>
        <planeGeometry args={[50, 50]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <ScreenshotHelper triggerRef={screenshotRef} />
    </>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────
export default function StageBuilder() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
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

  return (
    <div className="relative w-full h-full min-h-[550px] flex rounded-xl overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="w-52 shrink-0 bg-gradient-to-b from-[#12101f] to-[#0a0812] border-r border-purple-900/30 flex flex-col p-3 gap-1.5 overflow-y-auto z-10">
        <h2 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">Add Elements</h2>

        {ELEMENT_TYPES.map(({ type, label, icon, desc }) => (
          <button key={type} onClick={() => addStageElement(type)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-purple-500/15 border border-white/[0.06] hover:border-purple-500/30 transition-all text-left group cursor-pointer">
            <span className="text-lg">{icon}</span>
            <div>
              <div className="text-sm font-medium text-gray-300 group-hover:text-white">{label}</div>
              <div className="text-[10px] text-gray-600 group-hover:text-gray-400">{desc}</div>
            </div>
          </button>
        ))}

        <div className="border-t border-white/[0.06] my-2" />

        {selectedElement && (
          <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-3 mb-2">
            <div className="text-[10px] text-purple-400 font-semibold uppercase tracking-widest">Selected</div>
            <div className="text-sm text-white font-medium mt-1">
              {ELEMENT_TYPES.find((t) => t.type === selectedElement.type)?.label}
            </div>
            <button onClick={() => { removeStageElement(selectedId!); setSelectedId(null) }}
              className="w-full mt-2 px-3 py-1.5 rounded-md bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 text-red-300 text-xs font-medium transition-colors cursor-pointer">
              Remove
            </button>
          </div>
        )}

        <div className="text-[10px] text-gray-600">{stageElements.length} element{stageElements.length !== 1 ? 's' : ''} on stage</div>

        <div className="flex-1" />

        <div className="mb-2">
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-purple-400">
            Stage Notes
          </label>
          <textarea
            rows={3}
            placeholder="Notes for your stage design..."
            value={customNotes.stage}
            onChange={(e) => setCustomNote('stage', e.target.value)}
            className="w-full resize-none rounded-lg border border-purple-500/30 bg-purple-900/20 px-2.5 py-1.5 text-xs text-white placeholder-white/25 outline-none transition-colors focus:border-pink-500/60"
          />
        </div>

        <button onClick={() => { screenshotRef.current?.(); setActiveTab(2) }}
          className="w-full px-3 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-semibold transition-all shadow-lg shadow-purple-900/40 cursor-pointer">
          Capture Stage →
        </button>
      </div>

      {/* ── 3D Canvas ── */}
      <div className="flex-1 relative bg-black">
        <Canvas shadows gl={{ preserveDrawingBuffer: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1 }}
          camera={{ position: [0, 6, 14], fov: 55, near: 0.1, far: 200 }}>
          <SceneContents selectedId={selectedId} onSelect={setSelectedId} screenshotRef={screenshotRef} />
        </Canvas>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] text-gray-600 pointer-events-none select-none">
          Drag to orbit · Scroll to zoom · Click elements to select
        </div>
      </div>
    </div>
  )
}
