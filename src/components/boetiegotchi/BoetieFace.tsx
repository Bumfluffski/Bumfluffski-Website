"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { FaceState } from "./types";

type Props = {
  face: FaceState;
  lookX?: number;
  lookY?: number;
  excitement?: number;
  hoverAction?: string | null;
};

export function BoetieFace({ face, lookX = 0, lookY = 0, excitement = 0, hoverAction = null }: Props) {
  const prefersReducedMotion = useReducedMotion();
  const isSleepy = face === "sleepy";
  const isHungry = face === "hungry";
  const isDirty = face === "dirty";
  const isChaos = face === "chaos";
  const isHappy = face === "happy";

  /* Mouse-follow is user-driven (not decorative motion); keep it even when “reduce motion” is on.
     Framer idle loops below still respect prefersReducedMotion. */
  const headTranslateX = lookX * 8;
  const headTranslateY = lookY * 5.5;
  const featureX = lookX * 5.5;
  const featureY = lookY * 3.2;
  const beardTilt = lookX * 3.8;
  const feedGlow = hoverAction === "feed";

  const bodyAnimation = prefersReducedMotion
    ? {}
    : isChaos
      ? { x: [0, -3, 3, -2, 2, 0], y: [0, 1, -1, 1, -1, 0], rotate: [0, -1, 1, -0.7, 0.9, 0] }
      : isSleepy
        ? { y: [8, 14, 8], rotate: [0, -1, 0] }
        : hoverAction === "feed"
          ? {
              y: [0, -2, 1, -1, 1, 0],
              rotate: [0, -1.2, 1.2, -0.8, 0.8, 0],
              scale: [1, 1.01, 1.02, 1.01, 1.02, 1],
            }
          : { y: [0, -2, 0], rotate: [0, -0.3, 0] };

  const beardAnimation = prefersReducedMotion
    ? {}
    : isChaos
      ? { x: [0, -2, 2, -1, 0], rotate: [0, -1, 1, -0.7, 0] }
      : isSleepy
        ? { y: [3, 5, 3] }
        : hoverAction === "feed"
          ? { y: [0, 1, 2, 1, 0], rotate: [0, -0.8, 0.8, -0.6, 0] }
          : { y: [0, 1.5, 0] };

  const mouthFrame = isHungry
    ? "h-[2.9rem] w-[2.9rem] rounded-full"
    : isSleepy
      ? "h-[0.8rem] w-[3.8rem] rounded-full border-t-0 border-x-0 bg-transparent"
      : isChaos
        ? "h-[3.7rem] w-[5.4rem] rounded-[2rem] rounded-t-[0.9rem]"
        : isHappy
          ? "h-[3.5rem] w-[5.1rem] rounded-[2rem] rounded-t-[0.9rem]"
          : "h-[3.2rem] w-[4.8rem] rounded-[1.8rem] rounded-t-[0.8rem]";
  const eyeFrameClass = isSleepy ? "h-1.5 w-8" : isHungry ? "h-11 w-7" : "h-12 w-8";

  return (
    <motion.div
      className="relative flex flex-col items-center"
      animate={bodyAnimation}
      transition={{
        duration: hoverAction === "feed" ? 0.9 : isChaos ? 0.55 : 3.8,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <div className="relative h-[18.5rem] w-[14rem] sm:h-[20rem] sm:w-[15rem]">
        <div
          className="absolute inset-0 transition-transform duration-200 ease-out"
          style={{
            transform: `translate(${headTranslateX}px, ${headTranslateY}px) scale(${1 + excitement * 0.035})`,
          }}
        >
          {feedGlow ? (
            <div className="absolute left-1/2 top-[9.8rem] h-[7.5rem] w-[7.5rem] -translate-x-1/2 rounded-full bg-[#f3bd58]/18 blur-2xl" />
          ) : null}
          <div className="absolute left-1/2 top-0 h-[11.8rem] w-[11.8rem] -translate-x-1/2 rounded-[48%] bg-[#e0b892]" />
          <div className="absolute left-[1.45rem] top-[8.65rem] h-[2.6rem] w-[2rem] rounded-full bg-[#e0b892]" />
          <div className="absolute right-[1.45rem] top-[8.65rem] h-[2.6rem] w-[2rem] rounded-full bg-[#e0b892]" />

          <div className="absolute left-1/2 top-[4.1rem] h-[8.4rem] w-[9.5rem] -translate-x-1/2">
            <div
              className="relative h-full w-full transition-transform duration-200 ease-out"
              style={{ transform: `translate(${featureX}px, ${featureY}px)` }}
            >
              <div
                className={`absolute left-[0.8rem] top-0 h-2.5 w-[3.9rem] rounded-full bg-[#0d1014] ${isChaos ? "rotate-[14deg]" : isHungry ? "-rotate-[15deg]" : isSleepy ? "-rotate-[7deg]" : "-rotate-[10deg]"}`}
              />
              <div
                className={`absolute right-[0.8rem] top-0 h-2.5 w-[3.9rem] rounded-full bg-[#0d1014] ${isChaos ? "-rotate-[16deg]" : isHungry ? "rotate-[11deg]" : isSleepy ? "rotate-[2deg]" : "rotate-[8deg]"}`}
              />
              <motion.div
                className={`absolute left-[1.9rem] top-[1.9rem] overflow-hidden rounded-[999px] ${eyeFrameClass}`}
                animate={
                  prefersReducedMotion
                    ? {}
                    : isSleepy
                      ? { scaleY: [1, 0.55, 1], opacity: [0.92, 0.78, 0.92] }
                      : { scaleY: [1, 1, 0.16, 1, 1] }
                }
                transition={{ duration: isSleepy ? 3.6 : 4.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="absolute inset-0 rounded-[999px] bg-[#0d1014]" />
              </motion.div>
              <motion.div
                className={`absolute right-[1.9rem] top-[1.9rem] overflow-hidden rounded-[999px] ${eyeFrameClass}`}
                animate={
                  prefersReducedMotion
                    ? {}
                    : isSleepy
                      ? { scaleY: [1, 0.55, 1], opacity: [0.92, 0.78, 0.92] }
                      : { scaleY: [1, 1, 0.16, 1, 1] }
                }
                transition={{
                  duration: isSleepy ? 3.6 : 4.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.02,
                }}
              >
                <div className="absolute inset-0 rounded-[999px] bg-[#0d1014]" />
              </motion.div>
              <div className="absolute left-1/2 top-[4.45rem] h-[3.7rem] w-[2.8rem] -translate-x-1/2 rounded-[46%] bg-[#d8ad86]" />
            </div>
          </div>

          <motion.div
            className="absolute left-[1.65rem] top-[8.7rem] h-[8.8rem] w-[3.45rem] rounded-b-[3rem] rounded-t-[1rem] bg-[#090b10]"
            style={{ transform: `rotate(${8 + beardTilt}deg)` }}
            animate={beardAnimation}
            transition={{
              duration: hoverAction === "feed" ? 0.7 : isChaos ? 0.5 : 3.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute right-[1.65rem] top-[8.7rem] h-[8.8rem] w-[3.45rem] rounded-b-[3rem] rounded-t-[1rem] bg-[#090b10]"
            style={{ transform: `rotate(${-8 + beardTilt}deg)` }}
            animate={beardAnimation}
            transition={{
              duration: hoverAction === "feed" ? 0.7 : isChaos ? 0.5 : 3.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.04,
            }}
          />
          <div className="absolute left-1/2 top-[10rem] h-[9.9rem] w-[11.4rem] -translate-x-1/2">
            <motion.div
              className="h-full w-full rounded-b-[4.7rem] rounded-t-[2.7rem] bg-[#090b10]"
              style={{ transform: `rotate(${beardTilt * 0.55}deg)` }}
              animate={beardAnimation}
              transition={{
                duration: hoverAction === "feed" ? 0.7 : isChaos ? 0.5 : 3.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>

          <div className="absolute left-1/2 top-[11.3rem] h-[4.3rem] w-[6rem] -translate-x-1/2 rounded-b-[3rem] rounded-t-[1rem] bg-[#e0b892]" />
          <div className="absolute left-1/2 top-[11.55rem] -translate-x-1/2">
            <div className={`relative border-[4px] border-[#101112] ${mouthFrame}`}>
              {!isHungry && !isSleepy && (
                <>
                  <div className="absolute left-1/2 top-[0.28rem] h-3.5 w-[84%] -translate-x-1/2 rounded-md bg-[#efefeb]" />
                  <div className="absolute left-1/2 top-[1.3rem] h-6 w-[72%] -translate-x-1/2 rounded-b-[1.5rem] rounded-t-[0.5rem] bg-[#f38c9c]" />
                </>
              )}
              {isDirty ? (
                <div className="absolute -right-1 top-[1.65rem] h-2.5 w-2.5 rounded-full bg-[#b99867]" />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
