"use client";

import { startTransition, useEffect, useState } from "react";
import { defaultCounters, defaultStats } from "./constants";
import {
  addEventHistory,
  applyDecay,
  buildNeglectSummary,
  evolveProgress,
  getState,
  resolveAction,
} from "./gameEngine";
import { clearGameState, getFallbackGameState, loadGameState, persistGameState } from "./storage";
import type { GameState } from "./types";

export function useBoetieGame() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [game, setGame] = useState<GameState>(() => getFallbackGameState());

  useEffect(() => {
    const loaded = loadGameState();
    const now = Date.now();
    const elapsed = now - loaded.lastSeen;
    const hoursAway = elapsed / (1000 * 60 * 60);
    const decayed = applyDecay(loaded.stats, elapsed);
    const nextState = getState(decayed);
    const neglectSummary = buildNeglectSummary(hoursAway, loaded.stats, decayed, nextState);

    setGame({
      ...loaded,
      stats: decayed,
      lastSeen: now,
      lastAction: neglectSummary?.summaryText ?? loaded.lastAction,
      persistence: neglectSummary
        ? {
            ...loaded.persistence,
            neglectSummary,
            lastReturnSummary: neglectSummary.summaryText,
            eventHistory: addEventHistory(loaded.persistence.eventHistory, {
              type: "return",
              label: neglectSummary.summaryText,
              mood: nextState.mood,
            }),
          }
        : loaded.persistence,
    });
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    persistGameState(game);
  }, [game, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    const interval = window.setInterval(() => {
      startTransition(() => {
        setGame((current) => ({
          ...current,
          stats: applyDecay(current.stats, 1000 * 60),
          lastSeen: Date.now(),
        }));
      });
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [isHydrated]);

  const applyAction = (action: { id: "feed" | "jol" | "nap" | "wash" }) => {
    startTransition(() => {
      setGame((current) => {
        const resolved = resolveAction(action.id, current.stats, current.counters);
        const nextAge = current.age + 1;
        const nextState = getState(resolved.nextStats);
        const nextProgress = evolveProgress(current.progress, resolved.nextStats, nextState, nextAge);
        return {
          ...current,
          stats: resolved.nextStats,
          counters: resolved.nextCounters,
          progress: nextProgress,
          persistence: {
            ...current.persistence,
            eventHistory: addEventHistory(current.persistence.eventHistory, {
              type: action.id,
              label: resolved.line,
              mood: nextState.mood,
            }),
          },
          age: nextAge,
          lastSeen: Date.now(),
          lastAction: resolved.line,
        };
      });
    });
  };

  const softSetLastAction = (line: string) => {
    setGame((current) => ({ ...current, lastAction: line }));
  };

  const hardReset = () => {
    clearGameState();
    setGame({ ...getFallbackGameState(), age: 1, lastAction: "New little oke. Fresh start." });
  };

  const rebirth = () => {
    setGame((current) => ({
      ...current,
      stats: defaultStats,
      counters: defaultCounters,
      progress: {
        ...current.progress,
        balancedStreak: 0,
        moodHistory: [],
        lastDominantMood: "Reborn and suspiciously optimistic",
      },
      persistence: {
        ...current.persistence,
        neglectSummary: null,
        eventHistory: addEventHistory(current.persistence.eventHistory, {
          type: "rebirth",
          label: "Boetie was reborn with his legend intact.",
          mood: "Reborn",
        }),
      },
      age: 1,
      lastSeen: Date.now(),
      lastAction: "Reborn. Same spirit, cleaner slate.",
    }));
  };

  return {
    isHydrated,
    game,
    applyAction,
    softSetLastAction,
    hardReset,
    rebirth,
  };
}
