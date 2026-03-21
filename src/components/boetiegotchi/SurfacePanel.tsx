"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { SURFACE_META } from "./constants";
import type { GameProgress, GameState, SurfaceKey } from "./types";
import { truncateMessage } from "./stringUtils";

type Props = {
  openSurface: SurfaceKey | null;
  onClose: () => void;
  stats: GameState["stats"];
  progress: GameProgress;
  persistence: GameState["persistence"];
  age: number;
  onReset: () => void;
  onRebirth: () => void;
};

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function eventTypeLabel(type: string): string {
  const map: Record<string, string> = {
    feed: "Boerie",
    jol: "Jol",
    nap: "Kip",
    wash: "Freshen",
    return: "Back from away",
    rebirth: "Rebirth",
  };
  return map[type] ?? type;
}

export function SurfacePanel({
  openSurface,
  onClose,
  stats,
  progress,
  persistence,
  age,
  onReset,
  onRebirth,
}: Props) {
  const prefersReducedMotion = useReducedMotion();
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!openSurface) return;

    previouslyFocused.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;

      const nodes = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el.getClientRects().length > 0
      );
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const idx = active ? nodes.indexOf(active) : -1;

      if (e.shiftKey) {
        if (idx <= 0) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (idx === nodes.length - 1 || idx === -1 || !root.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKey, true);
    closeBtnRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", onKey, true);
    };
  }, [openSurface, onClose]);

  useEffect(() => {
    if (openSurface) return;
    const prev = previouslyFocused.current;
    if (prev && document.body.contains(prev)) {
      window.setTimeout(() => prev.focus(), 0);
    }
  }, [openSurface]);

  if (!openSurface) return null;
  const meta = SURFACE_META[openSurface];
  if (!meta) return null;

  const surfaceTitleId = `boetie-surface-title-${openSurface}`;

  return (
    <AnimatePresence>
      <motion.div
        role="presentation"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-20 flex max-h-full min-h-0 items-end justify-center bg-[#26150f]/36 p-2 sm:p-4"
      >
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={surfaceTitleId}
          initial={{ y: 18, scale: 0.98, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: 12, scale: 0.98, opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.22, ease: [0.2, 0.9, 0.2, 1] }}
          className="flex max-h-[min(72vh,100%)] w-full max-w-full min-h-0 flex-col rounded-[1.6rem] border-[4px] border-[#5a2618] bg-[#fff7df] shadow-[0_25px_60px_rgba(0,0,0,0.22)]"
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#7b2418]/12 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4">
            <div className="min-w-0">
              <p className="inline-flex max-w-full rounded-full border border-[#7b2418]/15 bg-[#fff1cf] px-2.5 py-1 font-ui text-[9px] font-bold uppercase tracking-[0.14em] text-[#7b2418] sm:px-3 sm:text-[10px] sm:tracking-[0.18em]">
                <span className="line-clamp-2 break-words">{meta.chip}</span>
              </p>
              <p
                id={surfaceTitleId}
                className="mt-2 break-words font-brand text-lg leading-tight text-[#8d2419] sm:mt-3 sm:text-xl md:text-2xl"
              >
                {meta.title}
              </p>
              <p className="mt-2 break-words font-ui text-xs font-bold leading-snug text-[#5b2b16]/78 sm:text-sm">
                {meta.subtitle}
              </p>
            </div>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full border border-[#7b2418]/18 bg-white px-2.5 py-1.5 font-ui text-[10px] font-bold uppercase tracking-[0.14em] text-[#7b2418] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7b2418] sm:px-3 sm:text-[11px] sm:tracking-[0.16em]"
            >
              Close
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-3 sm:px-5 sm:py-5">
            {openSurface === "mood" ? (
              <div className="space-y-3">
                <p className="font-ui text-[11px] font-bold uppercase tracking-[0.14em] text-[#7b2418]/60 sm:text-xs sm:tracking-[0.16em]">
                  He remembers the feeling, even when you forget the moment.
                </p>
                {progress.moodHistory.length ? (
                  progress.moodHistory.map((entry, index) => (
                    <div
                      key={`${entry.ts}-${index}`}
                      className={`rounded-[1rem] border border-[#7b2418]/10 bg-[#fffdf6] px-3 py-3 sm:px-4 ${prefersReducedMotion ? "" : "transition-transform duration-200 hover:-translate-y-0.5"}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="min-w-0 flex-1 break-words font-ui text-sm font-bold text-[#2b3523]">
                          {entry.mood}
                        </p>
                        <p className="shrink-0 font-ui text-[10px] font-bold uppercase tracking-[0.16em] text-[#7b2418]/60">
                          Day {entry.age}
                        </p>
                      </div>
                      <p className="mt-1 font-ui text-xs font-bold text-[#5b2b16]/76">Face: {entry.face}</p>
                    </div>
                  ))
                ) : (
                  <p className="font-ui text-sm font-bold text-[#5b2b16]/76">
                    Nothing in the log yet — he&apos;s still auditioning moods.
                  </p>
                )}

                <div className="pt-2">
                  <p className="font-ui text-[11px] font-bold uppercase tracking-[0.14em] text-[#7b2418]/60 sm:text-xs sm:tracking-[0.16em]">
                    Recent moments
                  </p>
                  {persistence.eventHistory.length ? (
                    <ul className="mt-2 space-y-2">
                      {persistence.eventHistory.map((entry, index) => (
                        <li
                          key={`${entry.ts}-${index}`}
                          className="rounded-[1rem] border border-[#7b2418]/8 bg-[#fffdf6]/90 px-3 py-2.5 font-ui text-xs font-bold leading-snug text-[#5b2b16]/85"
                        >
                          <span className="text-[#7b2418]">{eventTypeLabel(entry.type)}</span>
                          <span className="mx-1.5 text-[#7b2418]/35">·</span>
                          <span className="break-words">{truncateMessage(entry.label, 120)}</span>
                          <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#7b2418]/55">
                            Mood: {entry.mood}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 font-ui text-sm font-bold text-[#5b2b16]/76">
                      No scribbles yet — boeries and drama will land here soon.
                    </p>
                  )}
                </div>
              </div>
            ) : null}

            {openSurface === "stats" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    title: "Chow",
                    value: Math.round(stats.chow),
                    text: "The boerie tank. Low means drama; spamming boeries makes him sulky and smug — pace it, china.",
                  },
                  {
                    title: "Jol",
                    value: Math.round(stats.joy),
                    text: "His vibe meter. Jol lifts it fast, but it ain’t free — tired jol turns the room into a circus.",
                  },
                  {
                    title: "Naps",
                    value: Math.round(stats.naps),
                    text: "How awake he is. When it drops, he flips floppy and irrational — like a phone on 1%.",
                  },
                  {
                    title: "Fresh",
                    value: Math.round(stats.hygiene),
                    text: "How public-safe he is. Freshen helps; over-polishing makes him feel like a wine glass.",
                  },
                  {
                    title: "Chaos",
                    value: Math.round(stats.chaos),
                    text: "Nonsense potential. A little chaos is charm; too much is goblin mode with a licence.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className={`rounded-[1rem] border border-[#7b2418]/10 bg-[#fffdf6] px-3 py-3 sm:px-4 ${prefersReducedMotion ? "" : "transition-transform duration-200 hover:-translate-y-0.5"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-ui text-sm font-bold text-[#2b3523]">{item.title}</p>
                      <p className="shrink-0 font-ui text-sm font-bold tabular-nums text-[#7b2418]">{item.value}%</p>
                    </div>
                    <p className="mt-2 break-words font-ui text-xs font-bold leading-relaxed text-[#5b2b16]/78">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {openSurface === "care" ? (
              <div className="space-y-3">
                {[
                  "Keep Chow above 56, Naps above 58, Fresh above 58, Jol above 56, and Chaos at or below 44 to stay in the sweet spot.",
                  "Don’t spam Boeries. He loves them, but too many in a row makes him miserable — same energy as a third helping at Christmas.",
                  "Jol hits different when he’s rested. Tired jol spirals fast — ask anyone who’s jolled on empty batteries.",
                  "Kip knocks chaos down, but it’s not a substitute for food. Hungry naps are a vibe, not a meal plan.",
                  "Freshen is maintenance, not punishment. Over-cleaning makes him grumpy — like a cat in a bath.",
                  `Age milestones ticked: ${progress.milestones.length ? progress.milestones.join(", ") : "none yet — keep him alive with style"}.`,
                  `At Day ${age}, best balanced streak is ${progress.bestBalancedStreak} and his dominant trait reads ${progress.dominantTrait}.`,
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`rounded-[1rem] border border-[#7b2418]/10 bg-[#fffdf6] px-3 py-3 font-ui text-xs font-bold leading-relaxed text-[#5b2b16]/78 sm:px-4 ${prefersReducedMotion ? "" : "transition-transform duration-200 hover:-translate-y-0.5"}`}
                  >
                    {item}
                  </div>
                ))}
              </div>
            ) : null}

            {openSurface === "reset" ? (
              <div className="space-y-4">
                <div className="rounded-[1rem] border border-[#7b2418]/10 bg-[#fffdf6] px-3 py-3 sm:px-4">
                  <p className="font-ui text-sm font-bold text-[#2b3523]">Hard reset</p>
                  <p className="mt-2 break-words font-ui text-xs font-bold leading-relaxed text-[#5b2b16]/78">
                    Nuclear option: stats, streaks, moods, event log, and “last time you came back” summaries — all gone.
                    Use when you need a clean slate and zero sentiment.
                  </p>
                  <button
                    type="button"
                    onClick={onReset}
                    className="mt-3 rounded-full border border-[#7b2418] bg-[#8f281b] px-4 py-2 font-ui text-[11px] font-bold uppercase tracking-[0.16em] text-[#fff7df] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fff7df]"
                  >
                    Reset boetie
                  </button>
                </div>
                <div className="rounded-[1rem] border border-[#4d7a3d]/14 bg-[#fffdf6] px-3 py-3 sm:px-4">
                  <p className="font-ui text-sm font-bold text-[#2b3523]">Rebirth</p>
                  <p className="mt-2 break-words font-ui text-xs font-bold leading-relaxed text-[#5b2b16]/78">
                    Same legend, new run: titles, best streak, and milestone memories stay. Daily stats and
                    recent mood noise reset — like a fresh haircut, but emotionally.
                  </p>
                  <button
                    type="button"
                    onClick={onRebirth}
                    className="mt-3 rounded-full border border-[#4d7a3d] bg-[#4d7a3d] px-4 py-2 font-ui text-[11px] font-bold uppercase tracking-[0.16em] text-[#fff7df] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fff7df]"
                  >
                    Rebirth boetie
                  </button>
                </div>
                {persistence.lastReturnSummary ? (
                  <div className="rounded-[1rem] border border-[#7b2418]/10 bg-[#fffdf6] px-3 py-3 font-ui text-xs font-bold leading-relaxed text-[#5b2b16]/78 sm:px-4">
                    <span className="font-semibold text-[#2b3523]">Last “you were away” report: </span>
                    <span className="break-words">{truncateMessage(persistence.lastReturnSummary, 600)}</span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
