export interface QuizAnswer {
  genre: string;
  energy: string;
  crowdSize: string;
  era: string;
  vibe: string;
}

export interface Artist {
  name: string;
  genre: string;
  slot: 'headliner' | 'sub-headliner' | 'opener';
}

export interface Lineup {
  headliners: Artist[];
  subHeadliners: Artist[];
  openers: Artist[];
}

export interface StageElement {
  id: string;
  type: 'laser' | 'screen' | 'pyro' | 'speaker' | 'light' | 'fog';
  position: [number, number, number];
  rotation: [number, number, number];
}

export interface Venue {
  name: string;
  lat: number;
  lng: number;
  description: string;
  imageUrl: string;
}

export interface FestivalState {
  quizAnswers: QuizAnswer | null;
  lineup: Lineup | null;
  stageElements: StageElement[];
  selectedVenue: Venue | null;
  stageSnapshot: string | null;
  generatedFlyerUrl: string | null;
  activeTab: number;
  customNotes: { quiz: string; stage: string; venue: string; flyer: string };
}
