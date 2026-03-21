import { AGE_MILESTONES, DECAY_PER_HOUR, MAX_EVENT_HISTORY, MAX_MOOD_HISTORY, TITLE_DEFS } from "./constants";
import type {
  DerivedState,
  FaceState,
  GameCounters,
  GameProgress,
  GameState,
  GameStats,
  NeglectSummary,
  StatKey,
} from "./types";

export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

/** Achievable with intent; chaos cap slightly forgiving so one jol doesn’t instantly kill a streak forever. */
export function getBalancedState(stats: GameStats): boolean {
  return (
    stats.chow >= 56 &&
    stats.joy >= 56 &&
    stats.naps >= 58 &&
    stats.hygiene >= 58 &&
    stats.chaos <= 44
  );
}

export function pushLimited<T>(items: T[] | undefined, entry: T, limit: number): T[] {
  return [entry, ...(items ?? [])].slice(0, limit);
}

export function applyActionDelta(baseStats: GameStats, delta: Partial<Record<StatKey, number>>): GameStats {
  const next = { ...baseStats };
  (Object.entries(delta) as [StatKey, number][]).forEach(([key, value]) => {
    next[key] = clamp((next[key] ?? 0) + value);
  });
  return next;
}

export function getRecoveryFlags(stats: GameStats) {
  return {
    recoveredFromHungry: stats.chow >= 56,
    recoveredFromSleepy: stats.naps >= 58,
    recoveredFromDirty: stats.hygiene >= 58,
    recoveredFromChaos: stats.chaos <= 42,
    balanced:
      stats.chow >= 50 &&
      stats.joy >= 50 &&
      stats.naps >= 50 &&
      stats.hygiene >= 50 &&
      stats.chaos <= 58,
  };
}

export function getDominantTrait(
  history: { face: FaceState }[],
  titles: string[]
): string {
  const counts = history.reduce<Record<string, number>>((acc, item) => {
    acc[item.face] = (acc[item.face] ?? 0) + 1;
    return acc;
  }, {});

  if (titles.includes("lekker-legend")) return "Balanced menace";
  if ((counts.chaos ?? 0) >= 4) return "Certified goblin";
  if ((counts.sleepy ?? 0) >= 4) return "Professional napper";
  if ((counts.dirty ?? 0) >= 4) return "Suspiciously dusty";
  if ((counts.happy ?? 0) >= 4) return "Pocket darling";
  return "Loose unit";
}

export function buildNeglectSummary(
  hoursAway: number,
  beforeStats: GameStats,
  afterStats: GameStats,
  nextState: DerivedState
): NeglectSummary | null {
  /* Short absences: no guilt trip. Longer ones: mention real shifts only. */
  if (hoursAway < 2) return null;
  const parts: string[] = [];
  const drop = 10;
  const chaosRise = 10;
  if (afterStats.chow < beforeStats.chow - drop) parts.push("the boerie tank ran a bit low");
  if (afterStats.naps < beforeStats.naps - drop) parts.push("his nap reserves dipped");
  if (afterStats.hygiene < beforeStats.hygiene - drop) parts.push("freshness took a knock");
  if (afterStats.chaos > beforeStats.chaos + chaosRise) parts.push("the chaos meter crept up");

  const summaryText = parts.length
    ? `You were gone a good while: ${parts.join("; ")}. He’s landed in a ${nextState.mood.toLowerCase()} mood — nothing a few boeries and a bit of sense can’t patch.`
    : `You were gone a while, but the oke mostly held the line. He’s in a ${nextState.mood.toLowerCase()} mood now — go on, give him something to work with.`;

  return {
    hoursAway: Number(hoursAway.toFixed(1)),
    beforeMood: getState(beforeStats).mood,
    returnMood: nextState.mood,
    summaryText,
    ts: Date.now(),
  };
}

export function addEventHistory(
  history: GameState["persistence"]["eventHistory"],
  entry: Omit<GameState["persistence"]["eventHistory"][number], "ts">
) {
  return pushLimited(history, { ...entry, ts: Date.now() }, MAX_EVENT_HISTORY);
}

export function evolveProgress(
  progress: GameProgress,
  stats: GameStats,
  state: DerivedState,
  age: number
): GameProgress {
  const isBalanced = getBalancedState(stats);
  const balancedStreak = isBalanced ? (progress.balancedStreak || 0) + 1 : 0;
  const bestBalancedStreak = Math.max(progress.bestBalancedStreak || 0, balancedStreak);
  const moodHistory = pushLimited(
    progress.moodHistory || [],
    { mood: state.mood, face: state.face, age, ts: Date.now() },
    MAX_MOOD_HISTORY
  );

  const milestones = [...(progress.milestones || [])];
  AGE_MILESTONES.forEach((milestone) => {
    if (age >= milestone && !milestones.includes(milestone)) milestones.push(milestone);
  });

  const existingTitles = progress.titles || [];
  const unlocked = TITLE_DEFS.filter(
    (title) =>
      !existingTitles.includes(title.key) &&
      title.test(stats, { ...progress, bestBalancedStreak, moodHistory })
  ).map((title) => title.key);
  const titles = [...existingTitles, ...unlocked];
  const dominantTrait = getDominantTrait(moodHistory, titles);

  return {
    balancedStreak,
    bestBalancedStreak,
    milestones,
    moodHistory,
    titles,
    dominantTrait,
    lastDominantMood: state.mood,
  };
}

export function resolveAction(
  actionId: "feed" | "jol" | "nap" | "wash",
  stats: GameStats,
  counters: GameCounters
): { nextStats: GameStats; nextCounters: GameCounters; line: string } {
  const nextCounters: GameCounters = {
    feedSpam: actionId === "feed" ? counters.feedSpam + 1 : 0,
    jolChain: actionId === "jol" ? counters.jolChain + 1 : 0,
    napChain: actionId === "nap" ? counters.napChain + 1 : 0,
    washChain: actionId === "wash" ? counters.washChain + 1 : 0,
  };

  let delta: Partial<Record<StatKey, number>> = {};
  let line = "";

  if (actionId === "feed") {
    /* Boeries: main chow fix. Spam (3rd feed in a row without another action) or already stuffed = rough trade. */
    if (stats.chow >= 86 || counters.feedSpam >= 2) {
      delta = { chow: +4, joy: -5, hygiene: -5, naps: -4, chaos: +4 };
      line = "Easy tiger. Too many boeries in a row—now he’s sulking with a full belly.";
    } else if (stats.chow <= 36) {
      delta = { chow: +26, joy: +6, chaos: -3, naps: +2 };
      line = "Those boeries saved the day, bru.";
    } else {
      delta = { chow: +15, joy: +3, hygiene: -2, chaos: +2 };
      line = "Shot, bru. That boerie hit the spot.";
    }
  }

  if (actionId === "jol") {
    /* Jol: joy up, costs naps and adds chaos; tired jol or chain-spam hurts more. */
    if (stats.naps <= 28) {
      delta = { joy: +6, naps: -8, hygiene: -3, chaos: +9, chow: -4 };
      line = "He tried to jol on empty batteries. It got weird quickly.";
    } else if (counters.jolChain >= 2) {
      delta = { joy: +8, naps: -12, hygiene: -4, chaos: +8, chow: -5 };
      line = "Third jol’s the charm—and the chaos. Maybe pace it, china.";
    } else {
      delta = { joy: +14, chow: -5, naps: -8, hygiene: -2, chaos: +6 };
      line = "Now we’re cooking with gas, china.";
    }
  }

  if (actionId === "nap") {
    /* Kip: naps + chaos down; doesn’t fix chow—hungry nap adds a sliver of rest only. */
    if (stats.chow <= 28) {
      delta = { naps: +12, chow: +5, joy: -2, chaos: -4 };
      line = "He kipped hungry—a bit of rest, but you still owe him boeries.";
    } else if (counters.napChain >= 2) {
      delta = { naps: +8, joy: -4, chaos: -4, chow: -4 };
      line = "That’s not recovery anymore. That’s avoidance.";
    } else {
      delta = { naps: +22, joy: +2, chaos: -10, chow: -4 };
      line = "Just a tactical lie-down, hey.";
    }
  }

  if (actionId === "wash") {
    if (stats.hygiene >= 88 || counters.washChain >= 2) {
      delta = { hygiene: +5, joy: -6, chaos: -2 };
      line = "Alright, enough now. He’s clean, not a wine glass.";
    } else if (stats.hygiene <= 32) {
      delta = { hygiene: +26, joy: +1, chaos: -8 };
      line = "Lekker. Smelling less criminal already.";
    } else {
      delta = { hygiene: +16, joy: -2, chaos: -4 };
      line = "Freshened up. Slightly offended, but fresh.";
    }
  }

  const nextStats = applyActionDelta(stats, delta);
  const recovery = getRecoveryFlags(nextStats);

  if (recovery.recoveredFromHungry && stats.chow < 30 && actionId === "feed")
    line = "Back in the game. Boeries for the win—the oke has rejoined society.";
  if (recovery.recoveredFromSleepy && stats.naps < 30 && actionId === "nap")
    line = "Recovered. The lights are back on upstairs.";
  if (recovery.recoveredFromDirty && stats.hygiene < 32 && actionId === "wash")
    line = "Recovered. He’s gone from feral to public-safe.";
  if (recovery.recoveredFromChaos && stats.chaos > 84 && (actionId === "nap" || actionId === "wash"))
    line = "Recovered. The goblin has been contained for now.";
  if (recovery.balanced && !getRecoveryFlags(stats).balanced)
    line = "Balanced. Boetie is back in the pocket sweet spot.";

  return { nextStats, nextCounters, line };
}

export function applyDecay(stats: GameStats, elapsedMs: number): GameStats {
  const hours = elapsedMs / (1000 * 60 * 60);
  if (hours <= 0) return stats;
  return {
    chow: clamp(stats.chow - DECAY_PER_HOUR.chow * hours),
    joy: clamp(stats.joy - DECAY_PER_HOUR.joy * hours),
    naps: clamp(stats.naps - DECAY_PER_HOUR.naps * hours),
    hygiene: clamp(stats.hygiene - DECAY_PER_HOUR.hygiene * hours),
    chaos: clamp(stats.chaos + DECAY_PER_HOUR.chaos * hours),
  };
}

export function getState(stats: GameStats): DerivedState {
  const lowCore = Math.min(stats.chow, stats.joy, stats.naps, stats.hygiene);
  const balanced =
    stats.chow >= 50 &&
    stats.joy >= 50 &&
    stats.naps >= 50 &&
    stats.hygiene >= 50 &&
    stats.chaos <= 58;

  /* Order: crises first (chow/naps/hygiene), then chaos, then happy/normal. */
  if (stats.chow < 18)
    return { mood: "Emergency boerie situation", line: "Bru. Boeries. Now. This is not a drill.", face: "hungry" };
  if (stats.chow < 28)
    return { mood: "Starving like load shedding hit lunch", line: "Eish bru, where’s my boeries?", face: "hungry" };
  if (stats.naps < 18) return { mood: "Flatlined", line: "I’m awake in theory only.", face: "sleepy" };
  if (stats.naps < 28) return { mood: "Finished", line: "Five more mins. Don’t be dramatic.", face: "sleepy" };
  if (stats.hygiene < 18)
    return { mood: "Weaponised stench", line: "Yoh. Even I can smell myself now.", face: "dirty" };
  if (stats.hygiene < 30) return { mood: "Proper feral", line: "Nee man. Freshen first, vibes later.", face: "dirty" };
  if (stats.chaos > 92) return { mood: "Unsupervised and thriving", line: "No plan. No brakes. Only vibes.", face: "chaos" };
  if (stats.chaos > 86 && stats.joy > 58)
    return { mood: "Full goblin mode", line: "Today we choose nonsense, my china.", face: "chaos" };
  if (balanced && stats.joy > 72)
    return { mood: "Absolutely lekker", line: "Sharp-sharp. Life is cooking.", face: "happy" };
  if (lowCore < 40)
    return { mood: "Holding it together, sort of", line: "I’ve had better days, my bru.", face: "normal" };
  return { mood: "Lekker but skelm", line: "I’m fine. Probably.", face: "normal" };
}
