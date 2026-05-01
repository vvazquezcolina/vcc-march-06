'use client'

import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Instanced-mesh crowd. One draw call regardless of density. Each instance
 * is a low-poly capsule (silhouette of a person seen from the stage), placed
 * in a fan in front of the stage and bobbing slightly to a per-instance
 * phase offset so the crowd doesn't pulse in lockstep.
 *
 * The crowd is unit-scale: world coordinates assume +Z = audience side,
 * z=5 = stage edge, x ∈ [-7, 7] = stage width.
 */

interface CrowdMember {
  x: number
  y: number // base Y (capsule center)
  z: number
  rotY: number
  phase: number // animation phase offset
  scale: number // small variance so heights vary
}

const FRONT_ROW_Z = 5.6
const DEPTH = 9
const FRONT_HALF_WIDTH = 5
const DEPTH_FAN_FACTOR = 0.65

function generateCrowd(count: number): CrowdMember[] {
  const members: CrowdMember[] = []
  for (let i = 0; i < count; i++) {
    const z = FRONT_ROW_Z + Math.random() * DEPTH
    // Fan widens with depth — feels like a real audience footprint
    const widthAtDepth = FRONT_HALF_WIDTH + (z - FRONT_ROW_Z) * DEPTH_FAN_FACTOR
    const x = (Math.random() - 0.5) * widthAtDepth * 2
    // Capsule center sits at half its body length above floor
    const scale = 0.85 + Math.random() * 0.25
    const y = 0.6 * scale
    // Face stage (origin)
    const rotY = Math.atan2(-x, -(z - 0))
    members.push({
      x,
      y,
      z,
      rotY,
      phase: Math.random() * Math.PI * 2,
      scale,
    })
  }
  return members
}

interface Props {
  density: number
}

export function Crowd({ density }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  // Re-generate the crowd footprint when density changes. Stable seed-free
  // randomness is fine — re-rolling looks like a different crowd, not a bug.
  const members = useMemo(
    () => generateCrowd(Math.max(0, Math.floor(density))),
    [density],
  )

  // A reusable Object3D scratch so we don't allocate matrices each frame.
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh) return
    const t = clock.getElapsedTime()
    for (let i = 0; i < members.length; i++) {
      const m = members[i]
      const bob = Math.sin(t * 2.4 + m.phase) * 0.06
      const sway = Math.sin(t * 1.1 + m.phase * 0.7) * 0.03
      dummy.position.set(m.x + sway, m.y + bob, m.z)
      dummy.rotation.set(0, m.rotY, 0)
      dummy.scale.setScalar(m.scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    // Also frustum-update so culling works after motion
    mesh.computeBoundingSphere?.()
  })

  if (members.length === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, members.length]}
      castShadow
      receiveShadow
      // Re-key so Three rebuilds the buffer when count changes
      key={members.length}
    >
      <capsuleGeometry args={[0.16, 0.85, 4, 8]} />
      <meshStandardMaterial
        color="#0d0d18"
        roughness={0.85}
        metalness={0.05}
      />
    </instancedMesh>
  )
}
