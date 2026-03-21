import type { GameProgress, GameState, GameStats, StatKey } from "./types";

export const STORAGE_VERSION = 6;

/** Namespaced key for this app (prototype used `boetiegotchi-save`) */
export const STORAGE_KEY = "bum-room-boetiegotchi";

export const LEGACY_STORAGE_KEYS = [
  "boetiegotchi-save",
  "boetiegotchi-save-v5",
  "boetiegotchi-save-v4",
  "boetiegotchi-save-v3",
  "boetiegotchi-save-v2",
  "boetiegotchi-save-v1",
] as const;

/**
 * Per-hour decay (core stats down, chaos up). Tuned so:
 * ~5 min away: barely a tick; ~30 min: a noticeable dip; ~8h: clearly “you were gone”;
 * ~24h: rough but recoverable with a few actions—not instant total ruin from one day.
 */
export const DECAY_PER_HOUR: Record<StatKey, number> = {
  chow: 2.5,
  joy: 1.7,
  naps: 2.1,
  hygiene: 1.85,
  chaos: 1.05,
};

export const MAX_MOOD_HISTORY = 8;
export const MAX_EVENT_HISTORY = 10;

/** Slightly closer to the “sweet spot” so first sessions feel fair; still needs care to stay there. */
export const defaultStats: GameStats = {
  chow: 78,
  joy: 82,
  naps: 72,
  hygiene: 74,
  chaos: 52,
};

export const defaultCounters = {
  feedSpam: 0,
  jolChain: 0,
  napChain: 0,
  washChain: 0,
};

export const defaultProgress: GameProgress = {
  balancedStreak: 0,
  bestBalancedStreak: 0,
  milestones: [],
  moodHistory: [],
  titles: [],
  dominantTrait: "Loose unit",
  lastDominantMood: "Lekker but skelm",
};

export const defaultPersistence: GameState["persistence"] = {
  eventHistory: [],
  neglectSummary: null,
  lastReturnSummary: null,
};

export const defaultGameState: Omit<GameState, "lastSeen"> = {
  stats: defaultStats,
  counters: defaultCounters,
  progress: defaultProgress,
  persistence: defaultPersistence,
  age: 27,
  lastAction: "He’s holding the fort — hit a button when you’re ready, china.",
};

/** One-liner previews when hovering care actions (before the real line resolves). */
export const HOVER_PREVIEW_LINES: Record<"feed" | "jol" | "nap" | "wash", string> = {
  feed: "Aweh… are those Boeries for me, or are you just teasing?",
  jol: "Wait wait wait… are we joling now? Say less.",
  nap: "Yoh. A tactical kip sounds downright elite.",
  wash: "Freshen up? Finally, some standards around here.",
};

export const AGE_MILESTONES = [10, 28, 60, 120, 220] as const;

export const TITLE_DEFS: {
  key: string;
  label: string;
  test: (stats: GameStats, progress: GameProgress) => boolean;
}[] = [
  {
    key: "lekker-legend",
    label: "Lekker Legend",
    test: (_stats, progress) => progress.bestBalancedStreak >= 5,
  },
  {
    key: "chaos-goblin",
    label: "Chaos Goblin",
    test: (_stats, progress) =>
      progress.moodHistory.filter((m) => m.face === "chaos").length >= 5,
  },
  {
    key: "nap-champion",
    label: "Nap Champion",
    test: (_stats, progress) =>
      progress.moodHistory.filter((m) => m.face === "sleepy").length >= 5,
  },
  {
    key: "fresh-prince",
    label: "Fresh Prince of Ferndale",
    test: (stats) => stats.hygiene >= 88 && stats.chaos <= 42,
  },
  {
    key: "survivor",
    label: "Certified Survivor",
    test: (_stats, progress) =>
      progress.moodHistory.filter((m) => m.face === "hungry" || m.face === "dirty").length >= 7,
  },
];

export const actionDefs = [
  { id: "feed" as const, label: "Boeries", subtitle: "Feed" },
  { id: "jol" as const, label: "Jol", subtitle: "Play" },
  { id: "nap" as const, label: "Kip", subtitle: "Rest" },
  { id: "wash" as const, label: "Freshen", subtitle: "Clean" },
];

export const statMeta: { key: StatKey; label: string }[] = [
  { key: "chow", label: "Chow" },
  { key: "joy", label: "Jol" },
  { key: "naps", label: "Naps" },
  { key: "hygiene", label: "Fresh" },
  { key: "chaos", label: "Chaos" },
];

export const SURFACE_META: Record<
  string,
  { title: string; subtitle: string; chip: string }
> = {
  mood: {
    title: "Mood log",
    subtitle: "Where the feelings go when they’ve nowhere polite left to go.",
    chip: "Recent feelings",
  },
  stats: {
    title: "Stats guide",
    subtitle: "The five meters that keep this oke from full goblin.",
    chip: "Know your boetie",
  },
  care: {
    title: "Care guide",
    subtitle: "Sweet spot, spam traps, and how not to kip yourself into trouble.",
    chip: "Pocket wisdom",
  },
  reset: {
    title: "Reset & rebirth",
    subtitle: "Hard wipe vs. fresh coat of paint — pick your drama.",
    chip: "Rituals",
  },
};
