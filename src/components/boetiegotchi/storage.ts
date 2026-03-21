import {
  defaultCounters,
  defaultGameState,
  defaultPersistence,
  defaultProgress,
  defaultStats,
  LEGACY_STORAGE_KEYS,
  STORAGE_KEY,
  STORAGE_VERSION,
} from "./constants";
import { clamp } from "./gameEngine";
import type { GameState, GameStats, StatKey, StorageEnvelope } from "./types";

const STAT_KEYS: StatKey[] = ["chow", "joy", "naps", "hygiene", "chaos"];

function clampNumber(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/** Coerce corrupted or partial saves into safe in-range stats. */
function normalizeStats(raw: Partial<GameStats> | undefined): GameStats {
  const merged = { ...defaultStats, ...(raw ?? {}) };
  const out: GameStats = { ...defaultStats };
  for (const k of STAT_KEYS) {
    const v = merged[k];
    out[k] = typeof v === "number" && Number.isFinite(v) ? clamp(v, 0, 100) : defaultStats[k];
  }
  return out;
}

function normalizeGameState(raw: Partial<GameState> | undefined): GameState {
  const stats = normalizeStats(raw?.stats);
  const counters = { ...defaultCounters, ...(raw?.counters ?? {}) };
  const progress = {
    ...defaultProgress,
    ...(raw?.progress ?? {}),
    moodHistory: Array.isArray(raw?.progress?.moodHistory) ? raw.progress.moodHistory : defaultProgress.moodHistory,
    milestones: Array.isArray(raw?.progress?.milestones) ? raw.progress.milestones : defaultProgress.milestones,
    titles: Array.isArray(raw?.progress?.titles) ? raw.progress.titles : defaultProgress.titles,
  };
  const persistence = {
    ...defaultPersistence,
    ...(raw?.persistence ?? {}),
    eventHistory: Array.isArray(raw?.persistence?.eventHistory)
      ? raw.persistence.eventHistory
      : defaultPersistence.eventHistory,
  };

  return {
    stats,
    counters,
    progress,
    persistence,
    age: clamp(clampNumber(raw?.age, 27), 1, 999_999),
    lastSeen: clampNumber(raw?.lastSeen, Date.now()),
    lastAction:
      typeof raw?.lastAction === "string" ? raw.lastAction : defaultGameState.lastAction,
  };
}

function migrateGameState(parsed: unknown): GameState {
  if (!parsed || typeof parsed !== "object") {
    return getFallbackGameState();
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.version === STORAGE_VERSION && obj.state && typeof obj.state === "object") {
    return normalizeGameState(obj.state as Partial<GameState>);
  }

  if ("version" in obj && "state" in obj && obj.state && typeof obj.state === "object") {
    return normalizeGameState(obj.state as Partial<GameState>);
  }

  return normalizeGameState(parsed as Partial<GameState>);
}

export function getFallbackGameState(): GameState {
  return {
    ...defaultGameState,
    lastSeen: Date.now(),
  };
}

function readStorageEnvelope(): { key: string; parsed: unknown } | null {
  if (typeof window === "undefined") return null;

  const candidates = [STORAGE_KEY, ...LEGACY_STORAGE_KEYS];
  for (const key of candidates) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed: unknown = JSON.parse(raw);
      return { key, parsed };
    } catch {
      continue;
    }
  }
  return null;
}

export function loadGameState(): GameState {
  const fallback = getFallbackGameState();
  if (typeof window === "undefined") return fallback;

  const envelope = readStorageEnvelope();
  if (!envelope) return fallback;

  try {
    return migrateGameState(envelope.parsed);
  } catch {
    return fallback;
  }
}

export function persistGameState(state: GameState): void {
  if (typeof window === "undefined") return;
  try {
    const payload: StorageEnvelope = { version: STORAGE_VERSION, state };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // quota / private mode
  }
}

export function clearGameState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    LEGACY_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // ignore
  }
}
