\"use client\";

import { useEffect, useState } from \"react\";

type PetState = {
  hunger: number; // 0 = full, 100 = starving
  fun: number; // 0 = bored, 100 = happy
  clean: number; // 0 = dirty, 100 = spotless
  lastTick: number; // ms since epoch
  alive: boolean;
};

const STORAGE_KEY = \"bum-room-tamagotchi-v1\";

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function loadState(): PetState {
  if (typeof window === \"undefined\") {
    return {
      hunger: 20,
      fun: 60,
      clean: 80,
      lastTick: Date.now(),
      alive: true,
    };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error(\"no state\");
    const parsed = JSON.parse(raw) as PetState;
    if (
      typeof parsed.hunger !== \"number\" ||
      typeof parsed.fun !== \"number\" ||
      typeof parsed.clean !== \"number\" ||
      typeof parsed.lastTick !== \"number\" ||
      typeof parsed.alive !== \"boolean\"
    ) {
      throw new Error(\"invalid\");
    }
    return parsed;
  } catch {
    return {
      hunger: 20,
      fun: 60,
      clean: 80,
      lastTick: Date.now(),
      alive: true,
    };
  }
}

function saveState(next: PetState) {
  if (typeof window === \"undefined\") return;
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
      const now = Date.now();
      const minutes = (now - state.lastTick) / 60000;
      if (minutes <= 0.01) return;

      let hunger = clamp(state.hunger + minutes * 3, 0, 100);
      let fun = clamp(state.fun - minutes * 2, 0, 100);
      let clean = clamp(state.clean - minutes * 1.5, 0, 100);

      const alive = hunger < 100;

      const next: PetState = {
        hunger,
        fun,
        clean,
        lastTick: now,
        alive,
      };
      setState(next);
      saveState(next);
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
    update({ clean: clamp(state.clean + 35, 0, 100) });
  };

  const revive = () => {
    update({
      hunger: 40,
      fun: 60,
      clean: 80,
      alive: true,
    });
  };

  const face = !state.alive
    ? \"x_x\"
    : state.hunger > 70 || state.clean < 30
    ? \":-(\"
    : state.fun > 70
    ? \"^_^\"
    : \":|\"; 

  const mood =
    !state.alive
      ? \"Your Tama has gone to the big CRT in the sky. Revive?\"
      : state.hunger > 80
      ? \"I'm starving... feed me!\"
      : state.hunger > 60
      ? \"Kinda hungry.\"
      : state.fun < 30
      ? \"I'm bored. Let's play.\"
      : state.clean < 30
      ? \"I feel gross. Clean time.\"
      : \"All good. Just vibing.\";

  return (
    <div className=\"tamaRoot\">
      <div className=\"tamaScreen\">
        <div className=\"tamaFace\">{face}</div>
        <div className=\"tamaBars\">
          <StatBar label=\"HUNGER\" value={100 - state.hunger} goodHigher />
          <StatBar label=\"FUN\" value={state.fun} />
          <StatBar label=\"CLEAN\" value={state.clean} />
        </div>
      </div>

      <p className=\"tamaMood\">{mood}</p>

      <div className=\"tamaButtons\">
        <button onClick={feed} disabled={!state.alive}>
          FEED
        </button>
        <button onClick={play} disabled={!state.alive}>
          PLAY
        </button>
        <button onClick={clean} disabled={!state.alive}>
          CLEAN
        </button>
        {!state.alive && (
          <button onClick={revive} className=\"revive\">
            REVIVE
          </button>
        )}
      </div>

      <style jsx>{`
        .tamaRoot {
          display: grid;
          gap: 10px;
          font-size: 11px;
        }
        .tamaScreen {
          border: 2px inset #808080;
          background: #000080;
          padding: 6px;
          color: #0f0;
          font-family: "Courier New", monospace;
        }
        .tamaFace {
          text-align: center;
          margin-bottom: 4px;
        }
        .tamaBars {
          display: grid;
          gap: 4px;
        }
        .tamaMood {
          margin: 0;
        }
        .tamaButtons {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .tamaButtons button {
          min-width: 60px;
          padding: 2px 6px;
          border: 2px solid #000;
          background: #c0c0c0;
          box-shadow:
            1px 1px 0 #808080,
            -1px -1px 0 #ffffff;
          font-size: 10px;
          cursor: pointer;
        }
        .tamaButtons button:disabled {
          opacity: 0.6;
          cursor: default;
        }
        .revive {
          background: #008000;
          color: #fff;
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
    <div className=\"row\">
      <span className=\"lbl\">{label}</span>
      <div className=\"bar\">
        <div className=\"fill\" />
      </div>
      <span className=\"val\">{Math.round(v)}</span>

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

