import { create } from 'zustand';
import type {
  QuizAnswer,
  Artist,
  Lineup,
  StageElement,
  Venue,
  FestivalState,
} from '@/types/festival';

// ---------------------------------------------------------------------------
// Hardcoded artist database (30+ artists across 6 genres)
// ---------------------------------------------------------------------------
export const ARTISTS_DB: Artist[] = [
  // Rock
  { name: 'The Black Keys', genre: 'rock', slot: 'headliner' },
  { name: 'Arctic Monkeys', genre: 'rock', slot: 'headliner' },
  { name: 'Foo Fighters', genre: 'rock', slot: 'headliner' },
  { name: 'Royal Blood', genre: 'rock', slot: 'sub-headliner' },
  { name: 'Greta Van Fleet', genre: 'rock', slot: 'sub-headliner' },
  { name: 'Turnstile', genre: 'rock', slot: 'opener' },

  // Electronic
  { name: 'Skrillex', genre: 'electronic', slot: 'headliner' },
  { name: 'Disclosure', genre: 'electronic', slot: 'headliner' },
  { name: 'Fred Again..', genre: 'electronic', slot: 'headliner' },
  { name: 'RÜFÜS DU SOL', genre: 'electronic', slot: 'sub-headliner' },
  { name: 'Bicep', genre: 'electronic', slot: 'sub-headliner' },
  { name: 'Anyma', genre: 'electronic', slot: 'opener' },

  // Hip-Hop
  { name: 'Kendrick Lamar', genre: 'hiphop', slot: 'headliner' },
  { name: 'Tyler, the Creator', genre: 'hiphop', slot: 'headliner' },
  { name: 'JID', genre: 'hiphop', slot: 'sub-headliner' },
  { name: 'Denzel Curry', genre: 'hiphop', slot: 'sub-headliner' },
  { name: 'Joey Bada$$', genre: 'hiphop', slot: 'sub-headliner' },
  { name: 'Doechii', genre: 'hiphop', slot: 'opener' },

  // Pop
  { name: 'Dua Lipa', genre: 'pop', slot: 'headliner' },
  { name: 'The Weeknd', genre: 'pop', slot: 'headliner' },
  { name: 'Sabrina Carpenter', genre: 'pop', slot: 'sub-headliner' },
  { name: 'Chappell Roan', genre: 'pop', slot: 'sub-headliner' },
  { name: 'Tate McRae', genre: 'pop', slot: 'opener' },

  // Indie
  { name: 'Tame Impala', genre: 'indie', slot: 'headliner' },
  { name: 'Radiohead', genre: 'indie', slot: 'headliner' },
  { name: 'Boygenius', genre: 'indie', slot: 'sub-headliner' },
  { name: 'Clairo', genre: 'indie', slot: 'sub-headliner' },
  { name: 'Men I Trust', genre: 'indie', slot: 'opener' },
  { name: 'Alvvays', genre: 'indie', slot: 'opener' },

  // Latin
  { name: 'Bad Bunny', genre: 'latin', slot: 'headliner' },
  { name: 'Peso Pluma', genre: 'latin', slot: 'headliner' },
  { name: 'Rauw Alejandro', genre: 'latin', slot: 'sub-headliner' },
  { name: 'Kali Uchis', genre: 'latin', slot: 'sub-headliner' },
  { name: 'Fuerza Regida', genre: 'latin', slot: 'sub-headliner' },
  { name: 'Young Miko', genre: 'latin', slot: 'opener' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Shuffle an array in place (Fisher-Yates) and return it. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Score an artist against the quiz answers.
 * Higher score = better match for the user's preferences.
 */
function scoreArtist(artist: Artist, answers: QuizAnswer): number {
  let score = 0;

  // Genre match is the strongest signal
  if (artist.genre === answers.genre) {
    score += 10;
  }

  // Energy affinity – some genres lean higher/lower energy
  const highEnergyGenres = ['electronic', 'rock', 'hiphop', 'latin'];
  const lowEnergyGenres = ['indie', 'pop'];
  if (answers.energy === 'high' && highEnergyGenres.includes(artist.genre)) {
    score += 3;
  } else if (answers.energy === 'low' && lowEnergyGenres.includes(artist.genre)) {
    score += 3;
  } else if (answers.energy === 'medium') {
    score += 1; // neutral boost
  }

  // Vibe affinity
  const vibeGenreMap: Record<string, string[]> = {
    chill: ['indie', 'pop'],
    hype: ['electronic', 'hiphop', 'rock'],
    groovy: ['latin', 'electronic', 'pop'],
    emotional: ['indie', 'rock', 'pop'],
    wild: ['electronic', 'hiphop', 'rock', 'latin'],
  };
  if (vibeGenreMap[answers.vibe]?.includes(artist.genre)) {
    score += 4;
  }

  // Era affinity
  const eraGenreMap: Record<string, string[]> = {
    classic: ['rock', 'pop'],
    modern: ['hiphop', 'electronic', 'latin', 'indie'],
    futuristic: ['electronic', 'hiphop'],
    retro: ['rock', 'indie', 'pop'],
  };
  if (eraGenreMap[answers.era]?.includes(artist.genre)) {
    score += 2;
  }

  return score;
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------
const initialState: FestivalState = {
  quizAnswers: null,
  lineup: null,
  stageElements: [],
  selectedVenue: null,
  stageSnapshot: null,
  generatedFlyerUrl: null,
  activeTab: 0,
};

// ---------------------------------------------------------------------------
// Store actions interface
// ---------------------------------------------------------------------------
interface FestivalActions {
  setQuizAnswers: (answers: QuizAnswer) => void;
  generateLineup: () => void;
  addStageElement: (type: StageElement['type']) => void;
  removeStageElement: (id: string) => void;
  updateStageElement: (id: string, updates: Partial<StageElement>) => void;
  setVenue: (venue: Venue) => void;
  setStageSnapshot: (dataUrl: string) => void;
  setFlyerUrl: (url: string) => void;
  setActiveTab: (tab: number) => void;
  resetAll: () => void;
}

// ---------------------------------------------------------------------------
// Zustand store
// ---------------------------------------------------------------------------
export const useFestivalStore = create<FestivalState & FestivalActions>()(
  (set, get) => ({
    ...initialState,

    // -- Quiz --
    setQuizAnswers: (answers) => set({ quizAnswers: answers }),

    // -- Lineup generation --
    generateLineup: () => {
      const { quizAnswers } = get();
      if (!quizAnswers) return;

      // Score every artist, then sort descending within each slot tier
      const scored = ARTISTS_DB.map((artist) => ({
        artist,
        score: scoreArtist(artist, quizAnswers),
      }));

      const pick = (slot: Artist['slot'], count: number): Artist[] => {
        const pool = scored.filter((s) => s.artist.slot === slot);
        pool.sort((a, b) => b.score - a.score);

        // Among equally-scored artists, randomise for variety
        const grouped = new Map<number, typeof pool>();
        for (const entry of pool) {
          const group = grouped.get(entry.score) ?? [];
          group.push(entry);
          grouped.set(entry.score, group);
        }

        const sorted: typeof pool = [];
        for (const [, group] of [...grouped.entries()].sort(
          (a, b) => b[0] - a[0],
        )) {
          sorted.push(...shuffle(group));
        }

        return sorted.slice(0, count).map((s) => s.artist);
      };

      const lineup: Lineup = {
        headliners: pick('headliner', 3),
        subHeadliners: pick('sub-headliner', 5),
        openers: pick('opener', 4),
      };

      set({ lineup });
    },

    // -- Stage elements --
    addStageElement: (type) => {
      const element: StageElement = {
        id: crypto.randomUUID(),
        type,
        position: [
          (Math.random() - 0.5) * 6, // x: roughly -3 to 3
          Math.random() * 3,          // y: 0 to 3 (height)
          (Math.random() - 0.5) * 4,  // z: roughly -2 to 2
        ],
        rotation: [0, 0, 0],
      };
      set((state) => ({ stageElements: [...state.stageElements, element] }));
    },

    removeStageElement: (id) =>
      set((state) => ({
        stageElements: state.stageElements.filter((el) => el.id !== id),
      })),

    updateStageElement: (id, updates) =>
      set((state) => ({
        stageElements: state.stageElements.map((el) =>
          el.id === id ? { ...el, ...updates } : el,
        ),
      })),

    // -- Venue --
    setVenue: (venue) => set({ selectedVenue: venue }),

    // -- Snapshots & flyer --
    setStageSnapshot: (dataUrl) => set({ stageSnapshot: dataUrl }),
    setFlyerUrl: (url) => set({ generatedFlyerUrl: url }),

    // -- Navigation --
    setActiveTab: (tab) => set({ activeTab: tab }),

    // -- Reset --
    resetAll: () => set({ ...initialState }),
  }),
);
