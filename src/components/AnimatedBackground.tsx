"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  radius: number;
  color: string;
  opacity: number;
  baseOpacity: number;
  speedX: number;
  speedY: number;
  pulseSpeed: number;
  pulsePhase: number;
  pulses: boolean;
}

const FESTIVAL_COLORS = [
  "255, 255, 255",  // white
  "212, 212, 216",  // zinc-300
  "161, 161, 170",  // zinc-400
  "113, 113, 122",  // zinc-500
];

const PARTICLE_COUNT_MIN = 40;
const PARTICLE_COUNT_MAX = 60;

function createParticle(canvasWidth: number, canvasHeight: number): Particle {
  const baseOpacity = 0.1 + Math.random() * 0.2; // 0.1 - 0.3
  return {
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    radius: 1 + Math.random() * 2, // 1-3px
    color: FESTIVAL_COLORS[Math.floor(Math.random() * FESTIVAL_COLORS.length)],
    opacity: baseOpacity,
    baseOpacity,
    speedX: (Math.random() - 0.5) * 0.3, // gentle horizontal drift
    speedY: -(0.15 + Math.random() * 0.35), // drift upward
    pulseSpeed: 0.005 + Math.random() * 0.015,
    pulsePhase: Math.random() * Math.PI * 2,
    pulses: Math.random() > 0.5, // ~half of particles pulse
  };
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const initParticles = () => {
      const count =
        PARTICLE_COUNT_MIN +
        Math.floor(Math.random() * (PARTICLE_COUNT_MAX - PARTICLE_COUNT_MIN + 1));
      particles = Array.from({ length: count }, () =>
        createParticle(canvas.width, canvas.height)
      );
    };

    resize();
    initParticles();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        // Update position
        p.x += p.speedX;
        p.y += p.speedY;

        // Pulse breathing effect
        if (p.pulses) {
          p.pulsePhase += p.pulseSpeed;
          p.opacity =
            p.baseOpacity *
            (0.6 + 0.4 * Math.sin(p.pulsePhase));
        }

        // Wrap around when particle drifts off screen
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) {
          p.x = canvas.width + 10;
        } else if (p.x > canvas.width + 10) {
          p.x = -10;
        }

        // Draw glowing circle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
        ctx.shadowColor = `rgba(${p.color}, ${p.opacity * 0.5})`;
        ctx.shadowBlur = 4;
        ctx.fill();
      }

      // Reset shadow so it doesn't bleed into future draws
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);

    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        background: "transparent",
      }}
    />
  );
}
