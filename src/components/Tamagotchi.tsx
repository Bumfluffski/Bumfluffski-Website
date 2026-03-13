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
        <div className="tamaRoom">
          <img src="/ui/tama-character.png" alt="" className="tamaChar" />
          {Array.from({ length: state.poops }).map((_, i) => (
            <div key={i} className={`poop poop-${i}`} />
          ))}
        </div>
        <div className="tamaHardwareButtons">
          <button onClick={feed} disabled={!state.alive} aria-label="Feed" />
          <button onClick={play} disabled={!state.alive} aria-label="Play" />
          <button onClick={clean} disabled={!state.alive} aria-label="Clean" />
        </div>
      </div>

      <div className="tamaStats">
        <div className="tamaFace">{face}</div>
        <div className="tamaBars">
          <StatBar label="HUNGER" value={100 - state.hunger} goodHigher />
          <StatBar label="FUN" value={state.fun} />
          <StatBar label="CLEAN" value={state.clean} />
        </div>
        <p className="tamaMood">{mood}</p>
        {!state.alive && (
          <button onClick={revive} className="revive">
            REVIVE
          </button>
        )}
      </div>

      <style jsx>{`
        .tamaRoot {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 10px;
          font-size: 11px;
          align-items: center;
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
        .tamaRoom {
          position: absolute;
          left: 16px;
          right: 16px;
          top: 28px;
          height: 68px;
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
          left: 14px;
        }
        .poop-1 {
          bottom: 4px;
          right: 14px;
        }
        .poop-2 {
          bottom: 10px;
          left: 30px;
        }
        .poop-3 {
          bottom: 10px;
          right: 30px;
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
        .tamaStats {
          display: grid;
          gap: 6px;
        }
        .tamaFace {
          font-family: "Courier New", monospace;
          text-align: left;
        }
        .tamaBars {
          display: grid;
          gap: 4px;
        }
        .tamaMood {
          margin: 0;
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

