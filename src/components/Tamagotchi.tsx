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

"use client";

import { useEffect, useState } from "react";

type PetState = {
  hunger: number; // 0 = full, 100 = starving
  fun: number; // 0 = bored, 100 = happy
  clean: number; // 0 = dirty, 100 = spotless
  poops: number; // 0+ little messes on the floor
  lastTick: number; // ms since epoch
  alive: boolean;
};

const STORAGE_KEY = "bum-room-tamagotchi-v1";

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function loadState(): PetState {
  if (typeof window === "undefined") {
    return {
      hunger: 20,
      fun: 60,
      clean: 80,
      poops: 0,
      lastTick: Date.now(),
      alive: true,
    };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("no state");
    const parsed = JSON.parse(raw) as PetState;
    if (
      typeof parsed.hunger !== "number" ||
      typeof parsed.fun !== "number" ||
      typeof parsed.clean !== "number" ||
      typeof parsed.lastTick !== "number" ||
      typeof parsed.alive !== "boolean"
    ) {
      throw new Error("invalid");
    }
    return {
      hunger: parsed.hunger,
      fun: parsed.fun,
      clean: parsed.clean,
      poops: typeof parsed.poops === "number" ? parsed.poops : 0,
      lastTick: parsed.lastTick,
      alive: parsed.alive,
    };
  } catch {
    return {
      hunger: 20,
      fun: 60,
      clean: 80,
      poops: 0,
      lastTick: Date.now(),
      alive: true,
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

export default function Tamagotchi() {
  const [state, setState] = useState<PetState>(() => loadState());

  // Apply time-based decay on mount and over time
  useEffect(() => {
    const applyDecay = () => {
      setState((prev) => {
        const now = Date.now();
        const minutes = (now - prev.lastTick) / 60000;
        if (minutes <= 0.01) return prev;

        let hunger = clamp(prev.hunger + minutes * 3, 0, 100);
        let fun = clamp(prev.fun - minutes * 2, 0, 100);
        let clean = clamp(prev.clean - minutes * 1.5, 0, 100);

        // Add a poop roughly every 8 minutes of neglect, up to 4
        const extraPoops = Math.floor(minutes / 8);
        let poops = clamp(prev.poops + extraPoops, 0, 4);

        const alive = hunger < 100;

        const next: PetState = {
          hunger,
          fun,
          clean,
          poops,
          lastTick: now,
          alive,
        };
        saveState(next);
        return next;
      });
    };

    // decay immediately based on time away
    applyDecay();

    const id = window.setInterval(applyDecay, 60_000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (partial: Partial<PetState>) => {
    setState((prev) => {
      const next: PetState = {
        ...prev,
        ...partial,
        lastTick: Date.now(),
      };
      saveState(next);
      return next;
    });
  };

  const feed = () => {
    if (!state.alive) return;
    update({ hunger: clamp(state.hunger - 25, 0, 100), clean: clamp(state.clean - 5, 0, 100) });
  };

  const play = () => {
    if (!state.alive) return;
    update({
      fun: clamp(state.fun + 25, 0, 100),
      hunger: clamp(state.hunger + 5, 0, 100),
    });
  };

  const clean = () => {
    if (!state.alive) return;
    update({ clean: clamp(state.clean + 35, 0, 100), poops: 0 });
  };

  const revive = () => {
    update({
      hunger: 40,
      fun: 60,
      clean: 80,
      poops: 0,
      alive: true,
    });
  };

  const face = !state.alive
    ? "x_x"
    : state.hunger > 70 || state.clean < 30
    ? ":-("
    : state.fun > 70
    ? "^_^"
    : ":|";

  const mood =
    !state.alive
      ? "Your Tama has gone to the big CRT in the sky. Revive?"
      : state.hunger > 80
      ? "I'm starving... feed me!"
      : state.hunger > 60
      ? "Kinda hungry."
      : state.fun < 30
      ? "I'm bored. Let's play."
      : state.clean < 30
      ? "I feel gross. Clean time."
      : "All good. Just vibing.";

  return (
    <div className="tamaRoot">
      <div className="tamaShell">
        <div className="tamaKeyring" />
        <div className="tamaLogo">TAMA</div>
        <div className="tamaRoom">
          <img src="/ui/tama-character.png" alt="" className="tamaChar" />
          {Array.from({ length: state.poops }).map((_, i) => (
            <div key={i} className={`poop poop-${i}`} />
          ))}
          <div className="tamaHud">
            <div className="tamaFace">{face}</div>
            <div className="tamaBars">
              <StatBar label="H" value={100 - state.hunger} goodHigher />
              <StatBar label="F" value={state.fun} />
              <StatBar label="C" value={state.clean} />
            </div>
          </div>
        </div>
        <div className="tamaHardwareButtons">
          <button onClick={feed} disabled={!state.alive} aria-label="Feed" />
          <button onClick={play} disabled={!state.alive} aria-label="Play" />
          <button onClick={clean} disabled={!state.alive} aria-label="Clean" />
        </div>
      </div>

      <p className="tamaMood">{mood}</p>
      {!state.alive && (
        <button onClick={revive} className="revive">
          REVIVE
        </button>
      )}

      <style jsx>{`
        .tamaRoot {
          display: grid;
          gap: 6px;
          font-size: 11px;
          justify-items: center;
        }
        .tamaShell {
          position: relative;
          width: 120px;
          height: 150px;
          background: radial-gradient(circle at 30% 20%, #ffe4a0, #e0a25a);
          border-radius: 60px 60px 50px 50px;
          box-shadow:
            0 0 0 2px #3a2a1a,
            0 4px 6px rgba(0, 0, 0, 0.5);
        }
        .tamaKeyring {
          position: absolute;
          top: -16px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 12px;
          border-radius: 999px;
          border: 2px solid #c0c0c0;
          box-shadow: 0 0 0 1px #000;
        }
        .tamaLogo {
          position: absolute;
          top: 16px;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 9px;
          letter-spacing: 1px;
        }
        .tamaRoom {
          position: absolute;
          left: 16px;
          right: 16px;
          top: 32px;
          height: 72px;
          background: linear-gradient(#0b1020 42%, #221622 42%);
          border-radius: 6px;
          border: 2px solid #111;
          overflow: hidden;
        }
        .tamaChar {
          position: absolute;
          bottom: 6px;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          image-rendering: pixelated;
        }
        .poop {
          position: absolute;
          width: 9px;
          height: 6px;
          background: #4b3a1a;
          border-radius: 50% 50% 40% 40%;
        }
        .poop-0 {
          bottom: 4px;
          left: 12px;
        }
        .poop-1 {
          bottom: 4px;
          right: 12px;
        }
        .poop-2 {
          bottom: 10px;
          left: 30px;
        }
        .poop-3 {
          bottom: 10px;
          right: 30px;
        }
        .tamaHud {
          position: absolute;
          inset: 4px 4px auto;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 2px 4px;
          align-items: center;
          font-family: "Courier New", monospace;
          font-size: 9px;
          color: #d5ffb0;
        }
        .tamaFace {
          grid-column: 1 / span 2;
          text-align: center;
        }
        .tamaBars {
          display: grid;
          gap: 1px;
        }
        .tamaHardwareButtons {
          position: absolute;
          bottom: 16px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-evenly;
        }
        .tamaHardwareButtons button {
          width: 14px;
          height: 14px;
          border-radius: 999px;
          border: 1px solid #3a2a1a;
          background: #f6e79a;
          box-shadow:
            1px 1px 0 #c29854,
            -1px -1px 0 #fff6c8;
          padding: 0;
          cursor: pointer;
        }
        .tamaHardwareButtons button:disabled {
          opacity: 0.5;
          cursor: default;
        }
        .tamaMood {
          margin: 0;
          text-align: center;
        }
        .revive {
          margin-top: 4px;
          padding: 2px 6px;
          border: 2px solid #000;
          background: #008000;
          color: #fff;
          font-size: 10px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

type StatProps = { label: string; value: number; goodHigher?: boolean };

function StatBar({ label, value, goodHigher = true }: StatProps) {
  const v = clamp(value, 0, 100);
  const pct = `${v}%`;
  const bad = goodHigher ? v < 30 : v > 70;

  return (
    <div className="row">
      <span className="lbl">{label}</span>
      <div className="bar">
        <div className="fill" />
      </div>
      <span className="val">{Math.round(v)}</span>

      <style jsx>{`
        .row {
          display: grid;
          grid-template-columns: 56px 1fr 26px;
          align-items: center;
          gap: 4px;
        }
        .lbl {
          opacity: 0.9;
        }
        .bar {
          height: 8px;
          border: 1px solid #0f0;
          background: #001040;
          position: relative;
          overflow: hidden;
        }
        .fill {
          position: absolute;
          inset: 0;
          width: ${pct};
          background: ${bad ? "#ff4" : "#0f0"};
        }
        .val {
          text-align: right;
        }
      `}</style>
    </div>
  );
}

