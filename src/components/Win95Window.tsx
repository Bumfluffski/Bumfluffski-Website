"use client";

import { ReactNode, useEffect, useRef } from "react";

type Props = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  height?: number;
  defaultX?: number;
  defaultY?: number;
};

export default function Win95Window({
  title,
  onClose,
  children,
  width = 520,
  height = 360,
  defaultX = 24,
  defaultY = 24,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let dragging = false;
    let sx = 0, sy = 0, ox = defaultX, oy = defaultY;

    const header = el.querySelector(".win95Titlebar") as HTMLDivElement | null;
    if (!header) return;

    const onDown = (e: PointerEvent) => {
      dragging = true;
      (e.target as Element).setPointerCapture?.(e.pointerId);
      sx = e.clientX;
      sy = e.clientY;

      const rect = el.getBoundingClientRect();
      ox = rect.left;
      oy = rect.top;
    };

    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      el.style.left = `${Math.max(8, Math.min(window.innerWidth - 64, ox + dx))}px`;
      el.style.top = `${Math.max(8, Math.min(window.innerHeight - 64, oy + dy))}px`;
    };

    const onUp = () => { dragging = false; };

    header.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      header.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [defaultX, defaultY]);

  return (
    <div
      ref={ref}
      className="win95Window"
      style={{
        width,
        height,
        left: defaultX,
        top: defaultY,
      }}
      role="dialog"
      aria-label={title}
    >
      <div className="win95Titlebar">
        <div className="win95Title">{title}</div>
        <button className="win95Btn" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <div className="win95Body">
        {children}
      </div>

      <style jsx>{`
        .win95Window {
          position: fixed;
          z-index: 40;
          background: var(--win95-face);
          border: 2px solid var(--win95-dark);
          box-shadow:
            2px 2px 0 var(--win95-shadow),
            -2px -2px 0 var(--win95-light);
          user-select: none;
        }
        .win95Titlebar {
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 6px;
          background: linear-gradient(90deg, var(--win95-blue), #0a2a8f);
          cursor: grab;
        }
        .win95Title {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.2px;
        }
        .win95Btn {
          width: 26px;
          height: 22px;
          border: 2px solid var(--win95-dark);
          background: var(--win95-face);
          box-shadow:
            1px 1px 0 var(--win95-shadow),
            -1px -1px 0 var(--win95-light);
          font-size: 12px;
          cursor: pointer;
        }
        .win95Btn:active {
          box-shadow: none;
          transform: translate(1px, 1px);
        }
        .win95Body {
          height: calc(100% - 30px);
          overflow: auto;
          padding: 10px;
          color: #111;
          user-select: text;
        }
      `}</style>
    </div>
  );
}
