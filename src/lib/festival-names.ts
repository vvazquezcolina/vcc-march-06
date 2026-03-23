const FESTIVAL_NAMES: Record<string, string[]> = {
  "Desert Oasis": [
    "MIRAGE FESTIVAL",
    "SANDSTORM",
    "OASIS NIGHTS",
    "DUNE FEST",
    "SOLAR FLARE",
    "DESERT BLOOM FEST",
    "CACTUS MOON",
    "SCORCHED EARTH FEST",
  ],
  "Urban Jungle": [
    "NEON DISTRICT",
    "CONCRETE JUNGLE FEST",
    "MIDNIGHT CITY",
    "GRID FESTIVAL",
    "ELECTRIC AVENUE",
    "BASSLINE BLOCK PARTY",
    "CHROME FEST",
    "STATIC FEST",
  ],
  "Forest Wonderland": [
    "ENCHANTED FEST",
    "DEEP WOODS",
    "MOSSY GROVE",
    "FIREFLY FESTIVAL",
    "ANCIENT FOREST FEST",
    "EMERALD DREAM",
    "MUSHROOM KINGDOM",
    "CANOPY FEST",
  ],
  "Beach Paradise": [
    "TIDAL FEST",
    "CORAL REEF FESTIVAL",
    "SUNSET SHORE",
    "WAVE RIDER FEST",
    "OCEAN DRIVE",
    "SALTWATER SESSIONS",
    "GOLDEN COAST FEST",
    "SEA BREEZE",
  ],
};

const VIBE_TAGLINES: Record<string, string> = {
  "Desert Oasis": "Where the desert meets the drop",
  "Urban Jungle": "The city never sleeps",
  "Forest Wonderland": "Lost in the music, found in nature",
  "Beach Paradise": "Waves, bass, and endless summer",
};

const VIBE_EMOJIS: Record<string, string> = {
  "Desert Oasis": "\u{1F3DC}\uFE0F",
  "Urban Jungle": "\u{1F303}",
  "Forest Wonderland": "\u{1F332}",
  "Beach Paradise": "\u{1F3D6}\uFE0F",
};

export function generateFestivalName(vibe: string, customNote?: string): string {
  const names = FESTIVAL_NAMES[vibe];
  if (!names || names.length === 0) {
    return "UNKNOWN FEST";
  }

  const randomIndex = Math.floor(Math.random() * names.length);
  const name = names[randomIndex];

  if (customNote) {
    return `${name}: ${customNote}`;
  }

  return name;
}

export function getVibeTagline(vibe: string): string {
  return VIBE_TAGLINES[vibe] ?? "Feel the music, live the moment";
}

export function getVibeEmoji(vibe: string): string {
  return VIBE_EMOJIS[vibe] ?? "\u{1F3B6}";
}
