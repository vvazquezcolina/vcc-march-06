"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"

interface StepTransitionProps {
  children: React.ReactNode
  activeKey: number
}

export default function StepTransition({ children, activeKey }: StepTransitionProps) {
  const [currentKey, setCurrentKey] = useState(activeKey)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [exitActive, setExitActive] = useState(false)
  const [enterActive, setEnterActive] = useState(false)
  const prevChildrenRef = useRef<React.ReactNode>(children)
  const containerRef = useRef<HTMLDivElement>(null)

  // Snapshot children whenever we are idle so we always have the latest to show on exit
  if (!isTransitioning) {
    prevChildrenRef.current = children
  }

  useEffect(() => {
    if (activeKey === currentKey) return

    // Begin transition: show both panels, outgoing starts visible, incoming starts offscreen
    setIsTransitioning(true)
    setExitActive(false)
    setEnterActive(false)

    // Use a double-rAF to ensure the initial (pre-transition) styles are painted
    // before we flip to the animated state, so the CSS transition actually fires.
    const frameId = requestAnimationFrame(() => {
      const frameId2 = requestAnimationFrame(() => {
        setExitActive(true)
        setEnterActive(true)

        // After the 300ms transition completes, clean up
        const timer = setTimeout(() => {
          setCurrentKey(activeKey)
          setIsTransitioning(false)
          setExitActive(false)
          setEnterActive(false)
        }, 300)

        // Store timer for cleanup
        ;(containerRef.current as any)?.__transitionTimer &&
          clearTimeout((containerRef.current as any).__transitionTimer)
        if (containerRef.current) {
          ;(containerRef.current as any).__transitionTimer = timer
        }
      })
      ;(containerRef.current as any)?.__raf2 &&
        cancelAnimationFrame((containerRef.current as any).__raf2)
      if (containerRef.current) {
        ;(containerRef.current as any).__raf2 = frameId2
      }
    })

    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [activeKey, currentKey])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (containerRef.current) {
        clearTimeout((containerRef.current as any)?.__transitionTimer)
        cancelAnimationFrame((containerRef.current as any)?.__raf2)
      }
    }
  }, [])

  if (!isTransitioning) {
    // Idle state: just render children normally
    return <div ref={containerRef}>{children}</div>
  }

  // During transition: show both outgoing and incoming content
  return (
    <div ref={containerRef} style={{ position: "relative", overflow: "hidden" }}>
      {/* Exiting content: starts fully visible, fades + slides left */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          opacity: exitActive ? 0 : 1,
          transform: exitActive ? "translateX(-20px)" : "translateX(0)",
          transition: "opacity 300ms ease-out, transform 300ms ease-out",
          pointerEvents: "none",
        }}
      >
        {prevChildrenRef.current}
      </div>

      {/* Entering content: starts offscreen right, fades + slides into place */}
      <div
        style={{
          opacity: enterActive ? 1 : 0,
          transform: enterActive ? "translateX(0)" : "translateX(20px)",
          transition: "opacity 300ms ease-out, transform 300ms ease-out",
        }}
      >
        {children}
      </div>
    </div>
  )
}
