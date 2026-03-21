export type StatKey = "chow" | "joy" | "naps" | "hygiene" | "chaos";

export type FaceState = "hungry" | "sleepy" | "dirty" | "chaos" | "happy" | "normal";

export type GameStats = Record<StatKey, number>;

export type GameCounters = {
  feedSpam: number;
  jolChain: number;
  napChain: number;
  washChain: number;
};

export type MoodHistoryEntry = {
  mood: string;
  face: FaceState;
  age: number;
  ts: number;
};

export type EventHistoryEntry = {
  type: string;
  label: string;
  mood: string;
  ts: number;
};

export type NeglectSummary = {
  hoursAway: number;
  beforeMood: string;
  returnMood: string;
  summaryText: string;
  ts: number;
};

export type GameProgress = {
  balancedStreak: number;
  bestBalancedStreak: number;
  milestones: number[];
  moodHistory: MoodHistoryEntry[];
  titles: string[];
  dominantTrait: string;
  lastDominantMood: string;
};

export type GamePersistence = {
  eventHistory: EventHistoryEntry[];
  neglectSummary: NeglectSummary | null;
  lastReturnSummary: string | null;
};

export type GameState = {
  stats: GameStats;
  counters: GameCounters;
  progress: GameProgress;
  persistence: GamePersistence;
  age: number;
  lastSeen: number;
  lastAction: string;
};

export type StorageEnvelope = {
  version: number;
  state: GameState;
};

export type SurfaceKey = "mood" | "stats" | "care" | "reset";

export type DerivedState = {
  mood: string;
  line: string;
  face: FaceState;
};
