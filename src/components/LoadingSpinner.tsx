"use client"

import React from "react"

interface LoadingSpinnerProps {
  text?: string
  size?: "sm" | "md" | "lg"
}

const sizeConfig = {
  sm: { ring: 24, dotSize: 4, textSize: 10 },
  md: { ring: 40, dotSize: 6, textSize: 14 },
  lg: { ring: 60, dotSize: 8, textSize: 18 },
} as const

const FESTIVAL_COLORS = ["#9333ea", "#ec4899", "#f97316", "#06b6d4"]
const DOT_COUNT = 8

export default function LoadingSpinner({
  text = "Loading...",
  size = "md",
}: LoadingSpinnerProps) {
  const { ring, dotSize, textSize } = sizeConfig[size]
  const containerSize = ring * 2 + dotSize * 2

  return (
    <>
      <style>{`
        @keyframes festival-chase {
          0%, 100% { opacity: 0.25; transform: scale(0.7); }
          25% { opacity: 1; transform: scale(1.2); }
          50% { opacity: 0.6; transform: scale(1); }
        }
      `}</style>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: textSize * 0.6,
        }}
      >
        <div
          style={{
            position: "relative",
            width: containerSize,
            height: containerSize,
          }}
        >
          {Array.from({ length: DOT_COUNT }).map((_, i) => {
            const angle = (i / DOT_COUNT) * 2 * Math.PI - Math.PI / 2
            const x = ring + ring * Math.cos(angle)
            const y = ring + ring * Math.sin(angle)
            const color = FESTIVAL_COLORS[i % FESTIVAL_COLORS.length]
            const delay = (i / DOT_COUNT) * 1.2

            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: x,
                  top: y,
                  width: dotSize,
                  height: dotSize,
                  borderRadius: "50%",
                  backgroundColor: color,
                  boxShadow: `0 0 ${dotSize}px ${color}80`,
                  animation: `festival-chase 1.2s ease-in-out ${delay}s infinite`,
                }}
              />
            )
          })}
        </div>
        {text && (
          <span
            style={{
              fontSize: textSize,
              color: "#d1d5db",
              fontWeight: 500,
              letterSpacing: "0.03em",
            }}
          >
            {text}
          </span>
        )}
      </div>
    </>
  )
}
