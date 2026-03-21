"use client";

import { motion, useReducedMotion } from "framer-motion";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { BoetieFace } from "./BoetieFace";
import { actionDefs, defaultStats, statMeta, SURFACE_META, TITLE_DEFS } from "./constants";
import { DeviceScreen } from "./DeviceScreen";
import { DeviceShell } from "./DeviceShell";
import { ActionIcon, StatIcon } from "./icons";
import { SurfacePanel } from "./SurfacePanel";
import type { SurfaceKey } from "./types";
import { useBoetieGame } from "./useBoetieGame";
import { clamp, getState } from "./gameEngine";
import { truncateMessage } from "./stringUtils";

const HYDRATING_MOOD = "Just a sec…";
const HYDRATING_QUOTE = "Syncing your saved boetie from this device.";
const PLACEHOLDER_TRAIT = "Loose unit";

function HeaderBlock() {
  return (
    <section className="z-10 flex min-w-0 flex-col justify-center lg:min-h-0 lg:max-w-[min(100%,28rem)] xl:max-w-[min(100%,34rem)]">
      <div className="w-full max-w-[30rem] xl:max-w-[34rem]">
        <div className="flex w-full justify-center lg:justify-start">
          <p
            className="max-w-full break-words font-brand text-center text-[clamp(1.5rem,5vw,3.25rem)] leading-[0.92] tracking-[0.01em] text-[#8d2419] drop-shadow-[0_3px_0_rgba(255,255,255,0.2)] lg:text-left"
            aria-hidden="true"
          >
            BOETIEGOTCHI
          </p>
        </div>
        <h1 className="mt-3 font-ui text-[clamp(0.9rem,2vw,1.45rem)] font-bold leading-[1.08] text-stone-900">
          Your pocket-sized Bumfluffski, built for snacks, chirps and mild destruction.
        </h1>
        <p className="mt-3 max-w-[32rem] font-ui text-[clamp(0.82rem,1.25vw,1rem)] leading-relaxed text-stone-800/85">
          Care surfaces live inside the toy — same little machine, extra hidden layers.
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
    ? HYDRATING_QUOTE
    : truncateMessage(game.lastAction || state.line, 220);

  const titleLabels = useMemo(
    () => TITLE_DEFS.filter((item) => game.progress.titles.includes(item.key)).map((item) => item.label),
    [game.progress.titles]
  );
  const excitement = hoverAction === "feed" ? 1 : hoverAction ? 0.55 : 0;
  const lookX = cursorTarget.x;
  const lookY = cursorTarget.y;

  const baselineLine = useMemo(() => getState(game.stats).line, [game.stats]);

  useEffect(() => {
    if (!isHydrated || prefersReducedMotion) return;

    const el = petStageRef.current;
    if (!el) return;

    const pending = { x: 0, y: 0, valid: false };

    const flush = () => {
      pointerRafRef.current = null;
      if (!pending.valid) return;
      const rect = el.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) return;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = (pending.x - centerX) / (rect.width / 2);
      const dy = (pending.y - centerY) / (rect.height / 2);
      startTransition(() => setCursorTarget({ x: clamp(dx, -1, 1), y: clamp(dy, -1, 1) }));
    };

    const onMove = (event: MouseEvent) => {
      pending.x = event.clientX;
      pending.y = event.clientY;
      pending.valid = true;
      if (pointerRafRef.current != null) return;
      pointerRafRef.current = window.requestAnimationFrame(flush);
    };

    const onLeave = () => {
      pending.valid = false;
      startTransition(() => setCursorTarget({ x: 0, y: 0 }));
    };

    el.addEventListener("mousemove", onMove, { passive: true });
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      if (pointerRafRef.current != null) {
        window.cancelAnimationFrame(pointerRafRef.current);
        pointerRafRef.current = null;
      }
    };
  }, [isHydrated, prefersReducedMotion]);

  const closeSurfacePanel = () => setOpenSurface(null);

  const deviceFloat = prefersReducedMotion ? {} : { y: [0, -5, 0] };

  return (
    <div
      role="region"
      aria-label="Boetiegotchi"
      className="boetiegotchi-root isolate min-h-0 w-full min-w-0 overflow-x-hidden text-stone-950 [background:radial-gradient(circle_at_16%_16%,rgba(255,244,205,0.92),transparent_28%),radial-gradient(circle_at_86%_12%,rgba(242,177,84,0.36),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(143,171,112,0.34),transparent_34%),linear-gradient(180deg,#efe4c8_0%,#d9c39b_47%,#b78f62_100%)]"
    >
      <div className="relative mx-auto flex w-full max-w-[1600px] items-stretch justify-center px-2 py-3 sm:px-4 sm:py-4 lg:px-5">
        <div className="grid w-full min-w-0 grid-cols-1 items-start gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,1.05fr)] lg:gap-x-10 lg:gap-y-8 xl:grid-cols-[minmax(0,0.85fr)_minmax(320px,1.15fr)]">
          <HeaderBlock />

          <section className="relative flex min-w-0 items-start justify-center lg:justify-end lg:pt-1">
            <motion.div
              className="relative w-full min-w-0 max-w-[820px]"
              animate={deviceFloat}
              transition={{ duration: prefersReducedMotion ? 0 : 5.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute -left-2 top-[9%] hidden h-24 w-24 rounded-full bg-white/20 blur-2xl md:block" />
              <div className="absolute right-[8%] top-[14%] hidden h-28 w-28 rounded-full bg-[#f3bd58]/25 blur-2xl md:block" />

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
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 basis-[min(100%,14rem)]">
                      <p className="font-ui text-[10px] font-bold uppercase tracking-[0.28em] text-[#26341f]/65">
                        Mood today
                      </p>
                      <p
                        className="break-words font-ui text-base font-bold leading-snug text-[#26341f] sm:text-lg"
                        aria-live={isHydrated ? "polite" : undefined}
                      >
                        {moodLabel}
                      </p>
                      {!isHydrated ? (
                        <p className="mt-1 font-ui text-[11px] font-semibold leading-snug text-[#26341f]/55">
                          First visit? You&apos;ll meet him properly in a moment.
                        </p>
                      ) : null}
                    </div>
                    <p className="shrink-0 font-ui text-xs font-bold uppercase tracking-[0.22em] text-[#26341f]/65">
                      {isHydrated ? `Day ${game.age}` : "—"}
                    </p>
                  </div>

                  <div className="relative mt-4 flex min-h-[220px] items-center justify-center overflow-hidden rounded-[1rem] border border-[#26341f]/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.02))] px-2 py-4 sm:min-h-[280px] sm:px-4 sm:py-6 md:min-h-[300px]">
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[28%] bg-[linear-gradient(180deg,rgba(126,161,96,0.1),rgba(79,122,61,0.35))]" />
                    <div className="pointer-events-none absolute bottom-[23%] left-[15%] h-8 w-8 rounded-full border-2 border-[#26341f]/20 bg-[#f3bd58]/70 blur-[1px]" />
                    <div className="pointer-events-none absolute right-[14%] top-[18%] h-10 w-10 rounded-full border-2 border-[#26341f]/15 bg-white/20 blur-[1px]" />
                    <div
                      ref={petStageRef}
                      className="relative flex max-w-full cursor-default flex-col items-center touch-pan-y"
                    >
                      <BoetieFace
                        face={isHydrated ? state.face : getState(defaultStats).face}
                        lookX={lookX}
                        lookY={lookY}
                        excitement={excitement}
                        hoverAction={hoverAction}
                      />
                      <p
                        className="mt-2 max-w-full px-1 text-center font-ui text-[11px] font-bold uppercase leading-snug tracking-[0.1em] text-[#26341f]/72 sm:max-w-[min(100%,22rem)] sm:text-[0.95rem] sm:tracking-[0.12em]"
                        title={isHydrated ? game.lastAction || state.line : HYDRATING_QUOTE}
                      >
                        &ldquo;{quoteLine}&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <div className="max-w-full rounded-full border border-[#4d7a3d]/20 bg-[#fff7df]/70 px-3 py-1 font-ui text-[10px] font-bold uppercase tracking-[0.14em] text-[#4d7a3d]">
                      Streak {isHydrated ? game.progress.balancedStreak : 0}
                    </div>
                    <div
                      className="max-w-[min(100%,100%)] rounded-full border border-[#7b2418]/20 bg-[#fff7df]/70 px-3 py-1 font-ui text-[10px] font-bold uppercase tracking-[0.14em] text-[#7b2418]"
                      title={isHydrated ? game.progress.dominantTrait : PLACEHOLDER_TRAIT}
                    >
                      Trait {truncateMessage(isHydrated ? game.progress.dominantTrait : PLACEHOLDER_TRAIT, 42)}
                    </div>
                    <div
                      className="max-w-full rounded-full border border-[#7b2418]/20 bg-[#fff7df]/70 px-3 py-1 font-ui text-[10px] font-bold uppercase tracking-[0.14em] text-[#7b2418]"
                      title={isHydrated ? game.progress.lastDominantMood : "—"}
                    >
                      Last mood {truncateMessage(isHydrated ? game.progress.lastDominantMood : "—", 36)}
                    </div>
                    {isHydrated && game.persistence.neglectSummary ? (
                      <div
                        className="max-w-full rounded-full border border-[#7b2418]/20 bg-[#fff7df]/70 px-3 py-1 font-ui text-[10px] font-bold uppercase tracking-[0.14em] text-[#7b2418]"
                        title={`Away ~${game.persistence.neglectSummary.hoursAway}h`}
                      >
                        Gone {game.persistence.neglectSummary.hoursAway}h
                      </div>
                    ) : null}
                    {isHydrated && titleLabels.length > 0 ? (
                      <div
                        className="max-w-full rounded-full border border-[#4d7a3d]/30 bg-[#fff7df]/90 px-3 py-1 font-ui text-[10px] font-bold uppercase tracking-[0.12em] text-[#2b3523]"
                        title={titleLabels.join(" · ")}
                      >
                        {truncateMessage(titleLabels.join(" · "), 48)}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
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
                        <div key={item.key} className="flex min-w-0 flex-col gap-1.5">
                          <div className="mb-0.5 flex items-center justify-between gap-1 font-ui text-[10px] font-bold uppercase tracking-[0.12em] text-[#26341f]/74 sm:text-[11px]">
                            <span className="flex min-w-0 items-center gap-1">
                              <span className="shrink-0 [&_svg]:h-6 [&_svg]:w-6 sm:[&_svg]:h-8 sm:[&_svg]:w-8">
                                <StatIcon type={iconType} />
                              </span>
                              <span className="min-w-0 truncate" title={item.label}>
                                {item.label}
                              </span>
                            </span>
                            <span className="shrink-0 tabular-nums">{value}%</span>
                          </div>
                          <div
                            className="h-3 overflow-hidden rounded-full border border-[#26341f]/20 bg-white/25"
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={value}
                            aria-label={`${item.label} ${value} percent`}
                          >
                            <div
                              className="h-full rounded-full bg-[#4d7a3d] transition-[width] duration-700 ease-out motion-reduce:transition-none"
                              style={{ width: `${value}%` }}
                              aria-hidden="true"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {(Object.keys(SURFACE_META) as SurfaceKey[]).map((key) => {
                      const item = SURFACE_META[key];
                      return (
                        <motion.button
                          key={key}
                          type="button"
                          aria-expanded={openSurface === key}
                          whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                          onClick={() => setOpenSurface(key)}
                          className="max-w-full min-w-0 rounded-full border border-[#7b2418]/18 bg-[#fff7df]/82 px-3 py-2 text-left font-ui text-[10px] font-bold uppercase tracking-[0.15em] text-[#7b2418] shadow-[0_0_0_0_rgba(141,36,25,0.06)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7b2418]"
                        >
                          <span className="line-clamp-2">{item.title}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </DeviceScreen>

                <div
                  ref={actionGridRef}
                  className="mt-4 grid grid-cols-2 gap-2 px-1 sm:mt-5 sm:grid-cols-4 sm:gap-3 sm:px-2"
                  aria-label="Care actions"
                >
                  {actionDefs.map((action) => {
                    const previewLine =
                      action.id === "feed"
                        ? "Aweh… are those Boeries for me?"
                        : action.id === "jol"
                          ? "Wait wait wait... are we joling now?"
                          : action.id === "nap"
                            ? "Yoh. A tactical kip sounds elite."
                            : "Freshen up? Finally, some standards.";
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
                      className="group flex min-h-[92px] flex-col items-center justify-center rounded-[1.6rem] border-[4px] border-[#7b2418] bg-[linear-gradient(180deg,#ffd992_0%,#f3b54c_100%)] px-1 text-center shadow-[0_8px_0_#9a5b18] transition-shadow duration-200 hover:shadow-[0_11px_0_#9a5b18] active:shadow-[0_5px_0_#9a5b18] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#26341f] disabled:pointer-events-none disabled:opacity-60 sm:min-h-[104px] md:min-h-[108px]"
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
