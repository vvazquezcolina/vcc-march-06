export interface VibeTheme {
  name: string
  gradient: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  glowColor: string
  textGlow: string
  borderColor: string
  emoji: string
  tagline: string
  bgPattern: 'stars' | 'grid' | 'dots' | 'waves'
}

const vibeThemes: Record<string, VibeTheme> = {
  "Desert Oasis": {
    name: "Desert Oasis",
    gradient: "linear-gradient(135deg, #1a0a00 0%, #3d1c00 30%, #2d1b69 70%, #0a0015 100%)",
    primaryColor: "#f5a623",
    secondaryColor: "#e2725b",
    accentColor: "#ffd700",
    glowColor: "rgba(245, 166, 35, 0.5)",
    textGlow: "0 0 10px rgba(245, 166, 35, 0.8), 0 0 20px rgba(245, 166, 35, 0.4)",
    borderColor: "rgba(245, 166, 35, 0.3)",
    emoji: "🏜️",
    tagline: "Where the desert meets the drop",
    bgPattern: "stars",
  },
  "Urban Jungle": {
    name: "Urban Jungle",
    gradient: "linear-gradient(135deg, #0a001a 0%, #1a0030 30%, #2d004d 60%, #0a0015 100%)",
    primaryColor: "#00e5ff",
    secondaryColor: "#7c4dff",
    accentColor: "#ff4081",
    glowColor: "rgba(124, 77, 255, 0.5)",
    textGlow: "0 0 10px rgba(124, 77, 255, 0.8), 0 0 20px rgba(124, 77, 255, 0.4)",
    borderColor: "rgba(124, 77, 255, 0.3)",
    emoji: "🌃",
    tagline: "The city never sleeps",
    bgPattern: "grid",
  },
  "Forest Wonderland": {
    name: "Forest Wonderland",
    gradient: "linear-gradient(135deg, #001a0a 0%, #003320 30%, #004d40 60%, #001a15 100%)",
    primaryColor: "#00e676",
    secondaryColor: "#1de9b6",
    accentColor: "#69f0ae",
    glowColor: "rgba(0, 230, 118, 0.5)",
    textGlow: "0 0 10px rgba(0, 230, 118, 0.8), 0 0 20px rgba(0, 230, 118, 0.4)",
    borderColor: "rgba(0, 230, 118, 0.3)",
    emoji: "🌲",
    tagline: "Lost in the music, found in nature",
    bgPattern: "dots",
  },
  "Beach Paradise": {
    name: "Beach Paradise",
    gradient: "linear-gradient(135deg, #1a0a00 0%, #002040 30%, #004060 60%, #001030 100%)",
    primaryColor: "#ff6f00",
    secondaryColor: "#00b0ff",
    accentColor: "#40c4ff",
    glowColor: "rgba(0, 176, 255, 0.5)",
    textGlow: "0 0 10px rgba(0, 176, 255, 0.8), 0 0 20px rgba(0, 176, 255, 0.4)",
    borderColor: "rgba(0, 176, 255, 0.3)",
    emoji: "🏖️",
    tagline: "Waves, bass, and endless summer",
    bgPattern: "waves",
  },
}

const DEFAULT_VIBE = "Urban Jungle"

export function getVibeTheme(vibe: string): VibeTheme {
  return vibeThemes[vibe] ?? vibeThemes[DEFAULT_VIBE]
}

export function getAllVibes(): string[] {
  return Object.keys(vibeThemes)
}
