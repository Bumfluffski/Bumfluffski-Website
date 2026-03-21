"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { BoetieFace } from "./BoetieFace";
import {
  actionDefs,
  defaultStats,
  HOVER_PREVIEW_LINES,
  statMeta,
  SURFACE_META,
  TITLE_DEFS,
} from "./constants";
import { DeviceScreen } from "./DeviceScreen";
import { DeviceShell } from "./DeviceShell";
import { ActionIcon, StatIcon } from "./icons";
import { SurfacePanel } from "./SurfacePanel";
import type { SurfaceKey } from "./types";
import { useBoetieGame } from "./useBoetieGame";
import { clamp, getState } from "./gameEngine";
import { truncateMessage } from "./stringUtils";

const HYDRATING_MOOD = "Warming up…";
const HYDRATING_QUOTE = "Digging your save out of the digital couch cushions, china.";
const PLACEHOLDER_TRAIT = "Loose unit";

function HeaderBlock() {
  return (
    <section className="z-10 flex min-h-0 min-w-0 flex-col justify-center lg:max-w-[min(100%,28rem)] xl:max-w-[min(100%,30rem)]">
      <div className="w-full max-w-[28rem] xl:max-w-[30rem]">
        <div className="flex w-full justify-center lg:justify-start">
          <p
            className="max-w-full break-words font-brand text-center text-[clamp(1.35rem,4.2vw,2.85rem)] leading-[0.92] tracking-[0.01em] text-[#8d2419] drop-shadow-[0_3px_0_rgba(255,255,255,0.2)] lg:text-left"
            aria-hidden="true"
          >
            BOETIEGOTCHI
          </p>
        </div>
        <h1 className="mt-2 max-w-[26rem] font-ui text-[clamp(0.9rem,1.8vw,1.35rem)] font-bold leading-[1.2] text-stone-900 lg:mt-2.5">
          A pocket-sized Bumfluffski... boerie-powered, chaos-prone, and weirdly loyal.
        </h1>
        <p className="mt-2.5 max-w-[26rem] font-ui text-[clamp(0.8rem,1.15vw,0.98rem)] leading-[1.5] text-stone-800/92">
          Feed him. Let him jol. Keep him clean enough for public viewing. Leave him too long and he'll develop
          opinions. We don't want that.
        </p>
      </div>
    </section>
  );
}

export default function Boetiegotchi() {
  const prefersReducedMotion = useReducedMotion();
  const petStageRef = useRef<HTMLDivElement | null>(null);
  const actionGridRef = useRef<HTMLDivElement | null>(null);
  const pointerRafRef = useRef<number | null>(null);

  const { isHydrated, game, applyAction, softSetLastAction, hardReset, rebirth } = useBoetieGame();
  const [hoverAction, setHoverAction] = useState<string | null>(null);
  const [cursorTarget, setCursorTarget] = useState({ x: 0, y: 0 });
  const [openSurface, setOpenSurface] = useState<SurfaceKey | null>(null);

  const displayStats = isHydrated ? game.stats : defaultStats;
  const state = useMemo(() => getState(displayStats), [displayStats]);
  const moodLabel = !isHydrated ? HYDRATING_MOOD : state.mood;
  const quoteLine = !isHydrated
    ? truncateMessage(HYDRATING_QUOTE, 120)
    : truncateMessage(game.lastAction || state.line, 120);

  const titleLabels = useMemo(
    () => TITLE_DEFS.filter((item) => game.progress.titles.includes(item.key)).map((item) => item.label),
    [game.progress.titles]
  );
  const excitement = hoverAction === "feed" ? 1 : hoverAction ? 0.55 : 0;
  const lookX = cursorTarget.x;
  const lookY = cursorTarget.y;

  const baselineLine = useMemo(() => getState(game.stats).line, [game.stats]);

  /* Window-level pointer: look is computed from cursor vs pet (face) stage center — no CSS transition on look transforms. */
  useLayoutEffect(() => {
    const pending = { x: 0, y: 0, valid: false };

    const flush = () => {
      pointerRafRef.current = null;
      if (!pending.valid) return;
      const el = petStageRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) return;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = (pending.x - centerX) / (rect.width / 2);
      const dy = (pending.y - centerY) / (rect.height / 2);
      setCursorTarget({ x: clamp(dx, -1, 1), y: clamp(dy, -1, 1) });
    };

    const onMove = (event: MouseEvent) => {
      pending.x = event.clientX;
      pending.y = event.clientY;
      pending.valid = true;
      if (pointerRafRef.current != null) return;
      pointerRafRef.current = window.requestAnimationFrame(flush);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (pointerRafRef.current != null) {
        window.cancelAnimationFrame(pointerRafRef.current);
        pointerRafRef.current = null;
      }
    };
  }, []);

  const closeSurfacePanel = () => setOpenSurface(null);

  const deviceFloat = prefersReducedMotion ? {} : { y: [0, -4, 0] };

  return (
    <div
      role="region"
      aria-label="Boetiegotchi"
      className="boetiegotchi-root isolate flex h-full min-h-0 w-full min-w-0 max-h-[100dvh] flex-col overflow-x-hidden overflow-y-hidden text-stone-950 [background:radial-gradient(circle_at_16%_16%,rgba(255,244,205,0.92),transparent_28%),radial-gradient(circle_at_86%_12%,rgba(242,177,84,0.36),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(143,171,112,0.34),transparent_34%),linear-gradient(180deg,#efe4c8_0%,#d9c39b_47%,#b78f62_100%)]"
    >
      <div className="relative mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col justify-center px-2 py-2 sm:px-3 sm:py-2 lg:px-4">
        <div className="grid min-h-0 w-full max-h-[min(100dvh,900px)] grid-cols-1 items-center gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,1.05fr)] lg:gap-x-8 lg:gap-y-0 xl:grid-cols-[minmax(0,0.85fr)_minmax(320px,1.15fr)]">
          <HeaderBlock />

          <section className="relative flex min-h-0 min-w-0 items-start justify-center lg:justify-end">
            <motion.div
              className="relative w-full min-h-0 min-w-0 max-w-[820px]"
              animate={deviceFloat}
              transition={{ duration: prefersReducedMotion ? 0 : 5.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute -left-2 top-[9%] hidden h-20 w-20 rounded-full bg-white/20 blur-2xl md:block" />
              <div className="absolute right-[8%] top-[14%] hidden h-24 w-24 rounded-full bg-[#f3bd58]/25 blur-2xl md:block" />

              <DeviceShell>
                <div className="flex items-center justify-between gap-2 px-2 sm:px-3">
                  <div className="min-w-0">
                    <p className="truncate font-brand text-[clamp(1rem,1.8vw,1.6rem)] leading-none tracking-tight text-[#fff3d1]">
                      BOETIE
                    </p>
                    <p className="mt-1 line-clamp-2 font-ui text-[10px] uppercase leading-tight tracking-[0.2em] text-[#ffd9bf]/80 sm:tracking-[0.28em]">
                      Bumfluffski pocket unit
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2" aria-hidden="true">
                    <span className="h-3.5 w-3.5 rounded-full border border-black/15 bg-[#f3bd58] shadow-inner" />
                    <span className="h-3.5 w-3.5 rounded-full border border-black/15 bg-[#9ac49d] shadow-inner" />
                    <span className="h-3.5 w-3.5 rounded-full border border-black/15 bg-[#fff7df] shadow-inner" />
                  </div>
                </div>

                <DeviceScreen>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 basis-[min(100%,14rem)]">
                      <p className="font-ui text-[9px] font-bold uppercase tracking-[0.26em] text-[#26341f]/65 sm:text-[10px]">
                        Mood today
                      </p>
                      <p
                        className="break-words font-ui text-[0.95rem] font-bold leading-snug text-[#26341f] sm:text-base"
                        aria-live={isHydrated ? "polite" : undefined}
                      >
                        {moodLabel}
                      </p>
                      {!isHydrated ? (
                        <p className="mt-0.5 font-ui text-[10px] font-semibold leading-snug text-[#26341f]/55">
                          First visit? Give him a sec — he&apos;s almost done polishing his attitude.
                        </p>
                      ) : null}
                    </div>
                    <p className="shrink-0 font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-[#26341f]/65 sm:text-xs sm:tracking-[0.22em]">
                      {isHydrated ? `Day ${game.age}` : "—"}
                    </p>
                  </div>

                  <div className="relative mt-2 flex min-h-0 flex-col overflow-hidden rounded-[0.85rem] border border-[#26341f]/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.02))]">
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[28%] bg-[linear-gradient(180deg,rgba(126,161,96,0.1),rgba(79,122,61,0.35))]" />
                    <div className="pointer-events-none absolute bottom-[23%] left-[15%] h-7 w-7 rounded-full border-2 border-[#26341f]/20 bg-[#f3bd58]/70 blur-[1px]" />
                    <div className="pointer-events-none absolute right-[14%] top-[18%] h-9 w-9 rounded-full border-2 border-[#26341f]/15 bg-white/20 blur-[1px]" />
                    <div className="relative flex min-h-[168px] items-center justify-center px-1 pt-1.5 sm:min-h-[178px] md:min-h-[184px]">
                      <div
                        ref={petStageRef}
                        className="flex origin-top scale-[0.72] items-center justify-center sm:scale-[0.78] md:scale-[0.82]"
                      >
                        <BoetieFace
                          face={isHydrated ? state.face : getState(defaultStats).face}
                          lookX={lookX}
                          lookY={lookY}
                          excitement={excitement}
                          hoverAction={hoverAction}
                        />
                      </div>
                    </div>
                    <div className="flex h-[3.1rem] w-full shrink-0 flex-col items-center justify-start border-t border-[#26341f]/12 px-2 pb-1.5 pt-1.5 sm:h-[3.25rem]">
                      <p
                        className="line-clamp-2 max-w-[min(100%,20rem)] text-center font-ui text-[10px] font-bold uppercase leading-snug tracking-[0.08em] text-[#26341f]/78 sm:max-w-[22rem] sm:text-[11px] sm:tracking-[0.1em]"
                        title={isHydrated ? game.lastAction || state.line : HYDRATING_QUOTE}
                      >
                        &ldquo;{quoteLine}&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
                    <div className="max-w-full rounded-full border border-[#4d7a3d]/20 bg-[#fff7df]/70 px-2.5 py-0.5 font-ui text-[9px] font-bold uppercase tracking-[0.12em] text-[#4d7a3d] sm:px-3 sm:text-[10px] sm:tracking-[0.14em]">
                      Streak {isHydrated ? game.progress.balancedStreak : 0}
                    </div>
                    <div
                      className="max-w-[min(100%,100%)] rounded-full border border-[#7b2418]/20 bg-[#fff7df]/70 px-2.5 py-0.5 font-ui text-[9px] font-bold uppercase tracking-[0.12em] text-[#7b2418] sm:px-3 sm:text-[10px] sm:tracking-[0.14em]"
                      title={isHydrated ? game.progress.dominantTrait : PLACEHOLDER_TRAIT}
                    >
                      Trait {truncateMessage(isHydrated ? game.progress.dominantTrait : PLACEHOLDER_TRAIT, 42)}
                    </div>
                    <div
                      className="max-w-full rounded-full border border-[#7b2418]/20 bg-[#fff7df]/70 px-2.5 py-0.5 font-ui text-[9px] font-bold uppercase tracking-[0.12em] text-[#7b2418] sm:px-3 sm:text-[10px] sm:tracking-[0.14em]"
                      title={isHydrated ? game.progress.lastDominantMood : "—"}
                    >
                      Last mood {truncateMessage(isHydrated ? game.progress.lastDominantMood : "—", 36)}
                    </div>
                    {isHydrated && game.persistence.neglectSummary ? (
                      <div
                        className="max-w-full rounded-full border border-[#7b2418]/20 bg-[#fff7df]/70 px-2.5 py-0.5 font-ui text-[9px] font-bold uppercase tracking-[0.12em] text-[#7b2418] sm:px-3 sm:text-[10px] sm:tracking-[0.14em]"
                        title={`Away ~${game.persistence.neglectSummary.hoursAway}h`}
                      >
                        Gone {game.persistence.neglectSummary.hoursAway}h
                      </div>
                    ) : null}
                    {isHydrated && titleLabels.length > 0 ? (
                      <div
                        className="max-w-full rounded-full border border-[#4d7a3d]/30 bg-[#fff7df]/90 px-2.5 py-0.5 font-ui text-[9px] font-bold uppercase tracking-[0.11em] text-[#2b3523] sm:px-3 sm:text-[10px] sm:tracking-[0.12em]"
                        title={titleLabels.join(" · ")}
                      >
                        {truncateMessage(titleLabels.join(" · "), 48)}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-5 sm:gap-2">
                    {statMeta.map((item) => {
                      const value = Math.round(displayStats[item.key]);
                      const iconType =
                        item.key === "chow"
                          ? "food"
                          : item.key === "joy"
                            ? "joy"
                            : item.key === "naps"
                              ? "rest"
                              : item.key === "hygiene"
                                ? "clean"
                                : "chaos";
                      return (
                        <div key={item.key} className="flex min-w-0 flex-col gap-1">
                          <div className="mb-0.5 flex items-center justify-between gap-1 font-ui text-[9px] font-bold uppercase tracking-[0.1em] text-[#26341f]/74 sm:text-[10px] sm:tracking-[0.12em]">
                            <span className="flex min-w-0 items-center gap-0.5 sm:gap-1">
                              <span className="shrink-0 [&_svg]:h-5 [&_svg]:w-5 sm:[&_svg]:h-7 sm:[&_svg]:w-7">
                                <StatIcon type={iconType} />
                              </span>
                              <span className="min-w-0 truncate" title={item.label}>
                                {item.label}
                              </span>
                            </span>
                            <span className="shrink-0 tabular-nums">{value}%</span>
                          </div>
                          <div
                            className="h-2.5 overflow-hidden rounded-full border border-[#26341f]/20 bg-white/25 sm:h-3"
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={value}
                            aria-label={`${item.label} ${value} percent`}
                          >
                            <div
                              className="h-full rounded-full bg-[#4d7a3d] transition-[width] duration-500 ease-out motion-reduce:transition-none"
                              style={{ width: `${value}%` }}
                              aria-hidden="true"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
                    {(Object.keys(SURFACE_META) as SurfaceKey[]).map((key) => {
                      const item = SURFACE_META[key];
                      return (
                        <motion.button
                          key={key}
                          type="button"
                          aria-expanded={openSurface === key}
                          whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                          onClick={() => setOpenSurface(key)}
                          className="max-w-full min-w-0 rounded-full border border-[#7b2418]/18 bg-[#fff7df]/82 px-2.5 py-1.5 text-left font-ui text-[9px] font-bold uppercase tracking-[0.13em] text-[#7b2418] shadow-[0_0_0_0_rgba(141,36,25,0.06)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7b2418] sm:px-3 sm:py-2 sm:text-[10px] sm:tracking-[0.15em]"
                        >
                          <span className="line-clamp-2">{item.title}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </DeviceScreen>

                <div
                  ref={actionGridRef}
                  className="mt-3 grid grid-cols-2 gap-2 px-0.5 sm:mt-3.5 sm:grid-cols-4 sm:gap-2.5 sm:px-1.5"
                  aria-label="Care actions"
                >
                  {actionDefs.map((action) => {
                    const previewLine = HOVER_PREVIEW_LINES[action.id];
                    return (
                    <motion.button
                      key={action.id}
                      type="button"
                      disabled={!isHydrated}
                      aria-label={`${action.label}. ${action.subtitle}`}
                      whileHover={prefersReducedMotion || !isHydrated ? undefined : { y: -3 }}
                      whileTap={prefersReducedMotion || !isHydrated ? undefined : { y: 1 }}
                      onClick={() => isHydrated && applyAction(action)}
                      onMouseEnter={() => {
                        if (!isHydrated) return;
                        setHoverAction(action.id);
                        softSetLastAction(previewLine);
                      }}
                      onMouseLeave={() => {
                        if (!isHydrated) return;
                        setHoverAction(null);
                        softSetLastAction(baselineLine);
                      }}
                      onFocus={() => {
                        if (!isHydrated) return;
                        setHoverAction(action.id);
                        softSetLastAction(previewLine);
                      }}
                      onBlur={(e) => {
                        if (!isHydrated) return;
                        const next = e.relatedTarget;
                        if (next && actionGridRef.current?.contains(next)) return;
                        setHoverAction(null);
                        softSetLastAction(baselineLine);
                      }}
                      className="group flex min-h-[76px] flex-col items-center justify-center rounded-[1.35rem] border-[3px] border-[#7b2418] bg-[linear-gradient(180deg,#ffd992_0%,#f3b54c_100%)] px-0.5 text-center shadow-[0_6px_0_#9a5b18] transition-shadow duration-200 hover:shadow-[0_9px_0_#9a5b18] active:shadow-[0_4px_0_#9a5b18] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#26341f] disabled:pointer-events-none disabled:opacity-60 sm:min-h-[88px] sm:rounded-[1.5rem] sm:border-[4px] md:min-h-[92px]"
                    >
                      <ActionIcon type={action.id} />
                      <span className="mt-2 line-clamp-2 max-w-[95%] font-brand text-sm leading-tight text-[#7c2c13] sm:text-base md:text-lg">
                        {action.label}
                      </span>
                      <span className="mt-1 line-clamp-2 max-w-[95%] font-ui text-[9px] font-bold uppercase leading-tight tracking-[0.14em] text-[#5b2b16] sm:text-[11px]" aria-hidden="true">
                        {action.subtitle}
                      </span>
                    </motion.button>
                    );
                  })}
                </div>

                <SurfacePanel
                  openSurface={openSurface}
                  onClose={closeSurfacePanel}
                  stats={game.stats}
                  progress={game.progress}
                  persistence={game.persistence}
                  age={game.age}
                  onReset={hardReset}
                  onRebirth={rebirth}
                />
              </DeviceShell>
            </motion.div>
          </section>
        </div>
      </div>
    </div>
  );
}
