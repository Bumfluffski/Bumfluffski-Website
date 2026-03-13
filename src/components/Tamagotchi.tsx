"use client";

import { useEffect, useState } from "react";

type PetState = {
  stage: 0 | 1 | 2 | 3; // 0 = full hair, 3 = bald + beard
  boerie: number;
  beer: number;
  spentBoerie: number;
  spentBeer: number;
  poops: number;
  lastTick: number; // ms since epoch
};

const STORAGE_KEY = "bum-room-boerie-v1";

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function loadState(): PetState {
  if (typeof window === "undefined") {
    return {
      stage: 0,
      boerie: 1,
      beer: 0,
      spentBoerie: 0,
      spentBeer: 0,
      poops: 0,
      lastTick: Date.now(),
    };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("no state");
    const parsed = JSON.parse(raw) as Partial<PetState>;
    const stage =
      parsed.stage === 1 || parsed.stage === 2 || parsed.stage === 3 ? parsed.stage : 0;
    return {
      stage,
      boerie: typeof parsed.boerie === "number" ? parsed.boerie : 1,
      beer: typeof parsed.beer === "number" ? parsed.beer : 0,
      spentBoerie: typeof parsed.spentBoerie === "number" ? parsed.spentBoerie : 0,
      spentBeer: typeof parsed.spentBeer === "number" ? parsed.spentBeer : 0,
      poops: typeof parsed.poops === "number" ? parsed.poops : 0,
      lastTick: typeof parsed.lastTick === "number" ? parsed.lastTick : Date.now(),
    };
  } catch {
    return {
      stage: 0,
      boerie: 1,
      beer: 0,
      spentBoerie: 0,
      spentBeer: 0,
      poops: 0,
      lastTick: Date.now(),
    };
  }
}

function saveState(next: PetState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage failures
  }
}

const HEADS = [
  "/ui/health-0.png",
  "/ui/health-1.png",
  "/ui/health-2.png",
  "/ui/health-3.png",
] as const;

export default function Tamagotchi() {
  const [state, setState] = useState<PetState>(() => loadState());

  // Time-based accumulation of boerie + beer, and poop build-up
  useEffect(() => {
    const tick = () => {
      setState((prev) => {
        const now = Date.now();
        const minutes = (now - prev.lastTick) / 60000;
        if (minutes <= 0.25) {
          return { ...prev, lastTick: now }; // keep ticking to avoid big jumps
        }

        let boerie = prev.boerie + Math.floor(minutes / 2); // 1 boerie every 2 min
        let beer = prev.beer + Math.floor(minutes / 4); // 1 beer every 4 min
        boerie = clamp(boerie, 0, 24);
        beer = clamp(beer, 0, 16);

        let poops = prev.poops;
        if (minutes > 6) {
          // chance to add a poop every ~6 minutes
          const extra = Math.min(3 - poops, Math.floor(minutes / 6));
          poops += extra;
        }

        const next = {
          ...prev,
          boerie,
          beer,
          poops,
          lastTick: now,
        };
        saveState(next);
        return next;
      });
    };

    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const update = (partial: Partial<PetState>) => {
    setState((prev) => {
      const next: PetState = { ...prev, ...partial, lastTick: Date.now() };
      saveState(next);
      return next;
    });
  };

  const tryLevelUp = (partial?: Partial<PetState>) => {
    setState((prev) => {
      const base: PetState = { ...prev, ...(partial || {}), lastTick: Date.now() };
      let { stage, spentBoerie, spentBeer } = base;
      if (stage < 3 && spentBoerie >= 3 && spentBeer >= 1) {
        stage = (stage + 1) as 0 | 1 | 2 | 3;
        spentBoerie -= 3;
        spentBeer -= 1;
      }
      const next: PetState = { ...base, stage, spentBoerie, spentBeer };
      saveState(next);
      return next;
    });
  };

  const feedBoerie = () => {
    if (state.boerie <= 0) return;
    tryLevelUp({
      boerie: state.boerie - 1,
      spentBoerie: state.spentBoerie + 1,
    });
  };

  const giveBeer = () => {
    if (state.beer <= 0) return;
    tryLevelUp({
      beer: state.beer - 1,
      spentBeer: state.spentBeer + 1,
    });
  };

  const cleanUp = () => {
    if (state.poops === 0) return;
    update({ poops: 0 });
  };

  // South African phrases based on needs
  let bubble = "";
  if (state.poops > 0) {
    bubble = "Yoh, I had a lekka plop, please clean my bum";
  } else if (state.boerie === 0 && state.stage < 3) {
    bubble = "Jirre I'm hungry";
  } else if (state.beer === 0 && state.stage < 3) {
    bubble = "Got dop?";
  } else if (state.stage < 3) {
    bubble = "Shot for the nosh, bru";
  } else {
    bubble = "Life is lekker";
  }

  return (
    <div className="boerieRoot">
      <div className="boerieDevice">
        <div className="boerieRoom">
          <img src="/ui/tama-character.png" alt="" className="boerieBody" />
          <img src={HEADS[state.stage]} alt="" className="boerieHead" />
          {Array.from({ length: state.poops }).map((_, i) => (
            <div key={i} className={`poop poop-${i}`} />
          ))}
          <div className="speech">{bubble}</div>
        </div>

        <div className="boerieStats">
          <div>Stage: {state.stage + 1} / 4</div>
          <div>Boerie: {state.boerie}</div>
          <div>Beer: {state.beer}</div>
        </div>

        <div className="boerieButtons">
          <button onClick={feedBoerie} disabled={state.boerie <= 0}>
            FEED BOERIE
          </button>
          <button onClick={giveBeer} disabled={state.beer <= 0}>
            GIVE BEER
          </button>
          <button onClick={cleanUp} disabled={state.poops === 0}>
            CLEAN UP
          </button>
        </div>
      </div>

      <style jsx>{`
        .boerieRoot {
          display: grid;
          gap: 8px;
          font-size: 11px;
        }
        .boerieDevice {
          display: grid;
          grid-template-columns: auto;
          gap: 6px;
        }
        .boerieRoom {
          position: relative;
          width: 140px;
          height: 90px;
          background: linear-gradient(#101528 45%, #261822 45%);
          border-radius: 8px;
          border: 2px solid #000;
          overflow: hidden;
        }
        .boerieBody {
          position: absolute;
          bottom: 6px;
          left: 50%;
          transform: translateX(-50%);
          width: 48px;
          image-rendering: pixelated;
        }
        .boerieHead {
          position: absolute;
          bottom: 44px;
          left: 50%;
          transform: translateX(-50%);
          width: 32px;
          image-rendering: pixelated;
        }
        .poop {
          position: absolute;
          width: 10px;
          height: 7px;
          background: #4b3a1a;
          border-radius: 50% 50% 40% 40%;
        }
        .poop-0 {
          bottom: 4px;
          left: 18px;
        }
        .poop-1 {
          bottom: 4px;
          right: 18px;
        }
        .poop-2 {
          bottom: 10px;
          left: 34px;
        }
        .poop-3 {
          bottom: 10px;
          right: 34px;
        }
        .speech {
          position: absolute;
          top: 4px;
          left: 4px;
          right: 4px;
          padding: 2px 4px;
          background: rgba(0, 0, 0, 0.65);
          color: #f8f8f8;
          font-size: 9px;
          border-radius: 4px;
        }
        .boerieStats {
          display: grid;
          gap: 2px;
        }
        .boerieButtons {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .boerieButtons button {
          flex: 1 1 0;
          min-width: 80px;
          padding: 2px 6px;
          border: 2px solid #000;
          background: #c0c0c0;
          box-shadow:
            1px 1px 0 #808080,
            -1px -1px 0 #ffffff;
          font-size: 10px;
          cursor: pointer;
        }
        .boerieButtons button:disabled {
          opacity: 0.6;
          cursor: default;
        }
      `}</style>
    </div>
  );
}
