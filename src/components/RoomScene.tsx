"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Win95Window from "@/components/Win95Window";
import { newsletters, projects } from "@/data/content";

type Panel =
  | "desktop"
  | "projects"
  | "about"
  | "newsletters"
  | "cheat"
  | "tv"
  | null;

type Box = { left: number; top: number; width: number; height: number };
type PolyPoint = { x: number; y: number }; // percentage coords (0–100)

export default function RoomScene() {
  const rainRef = useRef<HTMLCanvasElement | null>(null);
  const stormRef = useRef<HTMLCanvasElement | null>(null);

  const [panel, setPanel] = useState<Panel>(null);
  const [glitch, setGlitch] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [desktopTime, setDesktopTime] = useState("");
  const playlistUrl =
    "https://www.youtube.com/watch?v=YfVHMnqf_RE&list=PL4QmEcRcvG6JPfM0OyA-e2ZwOTJox2zSI";

  // NEW: debug overlay to line things up
  const [debug, setDebug] = useState(false);


  /**
   * HOTSPOTS
   * These values are tuned for the current room image as shown in your screenshot.
   * If you change the art, you only adjust these numbers.
   */
  const hotspots = useMemo(() => {
    return {
      // PC screen (measured from Photoshop)
      // Image: 2400x1792
      // Corners:
      //   top-left     (1102, 581)
      //   top-right    (1299, 581)
      //   bottom-right (1299, 769)
      //   bottom-left  (1102, 769)
      // Axis-aligned box:
      //   x = 1102, y = 581, w = 197, h = 188
      // Percentages:
      //   left ≈ 45.92%, top ≈ 32.42%, width ≈ 8.21%, height ≈ 10.49%
      pc: { left: 45.9, top: 32.4, width: 8.2, height: 10.5 },
    } satisfies Record<string, Box>;
  }, []);

  // Exact bookshelf polygon (front face) using Photoshop points and full-image percentages
  const shelfPoly: PolyPoint[] = useMemo(
    () => [
      // top-left  (376, 679)
      { x: (376 / 2400) * 100, y: (679 / 1792) * 100 },
      // top-right (615, 599)
      { x: (615 / 2400) * 100, y: (599 / 1792) * 100 },
      // bottom-right (616, 1165)
      { x: (616 / 2400) * 100, y: (1165 / 1792) * 100 },
      // bottom-left (384, 1279)
      { x: (384 / 2400) * 100, y: (1279 / 1792) * 100 },
    ],
    []
  );

  // TV screen polygon using Photoshop points
  const tvPoly: PolyPoint[] = useMemo(
    () => [
      // top-left  (1409, 673)
      { x: (1409 / 2400) * 100, y: (673 / 1792) * 100 },
      // top-right (1619, 777)
      { x: (1619 / 2400) * 100, y: (777 / 1792) * 100 },
      // bottom-right (1618, 1002)
      { x: (1618 / 2400) * 100, y: (1002 / 1792) * 100 },
      // bottom-left (1404, 903)
      { x: (1404 / 2400) * 100, y: (903 / 1792) * 100 },
    ],
    []
  );

  // Pizza box polygon using Photoshop points
  const pizzaPoly: PolyPoint[] = useMemo(
    () => [
      // top-left  (917, 1196)
      { x: (917 / 2400) * 100, y: (1196 / 1792) * 100 },
      // top-right (1061, 1119)
      { x: (1061 / 2400) * 100, y: (1119 / 1792) * 100 },
      // bottom-right (1197, 1193)
      { x: (1197 / 2400) * 100, y: (1193 / 1792) * 100 },
      // bottom-left (1059, 1268)
      { x: (1059 / 2400) * 100, y: (1268 / 1792) * 100 },
    ],
    []
  );

  // Nirvana poster polygon using Photoshop points
  const nirvanaPoly: PolyPoint[] = useMemo(
    () => [
      // top-left  (1530, 280)
      { x: (1530 / 2400) * 100, y: (280 / 1792) * 100 },
      // top-right (1762, 395)
      { x: (1762 / 2400) * 100, y: (395 / 1792) * 100 },
      // bottom-right (1762, 751)
      { x: (1762 / 2400) * 100, y: (751 / 1792) * 100 },
      // bottom-left (1529, 645)
      { x: (1529 / 2400) * 100, y: (645 / 1792) * 100 },
    ],
    []
  );

  // Gaming console polygon using Photoshop points
  const consolePoly: PolyPoint[] = useMemo(
    () => [
      // top-left  (1711, 1167)
      { x: (1711 / 2400) * 100, y: (1167 / 1792) * 100 },
      // top-right (1810, 1089)
      { x: (1810 / 2400) * 100, y: (1089 / 1792) * 100 },
      // bottom-right (1924, 1162)
      { x: (1924 / 2400) * 100, y: (1162 / 1792) * 100 },
      // bottom-left (1815, 1219)
      { x: (1815 / 2400) * 100, y: (1219 / 1792) * 100 },
    ],
    []
  );

  // Toggle debug with "D"
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "d") setDebug((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Desktop clock (local viewer time, Win95-style)
  useEffect(() => {
    const format = () =>
      new Date().toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      });

    setDesktopTime(format());
    const id = window.setInterval(() => {
      setDesktopTime(format());
    }, 30_000);

    return () => window.clearInterval(id);
  }, []);

  // Storm particles canvas
  useEffect(() => {
    const canvas = stormRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const particles = Array.from({ length: 140 }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random(),
      vx: 0.08 + Math.random() * 0.18,
      vy: 0.25 + Math.random() * 0.35,
    }));

    const resize = () => {
      w = Math.floor(window.innerWidth);
      h = Math.floor(window.innerHeight);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      for (const p of particles) {
        p.x += p.vx * 0.0025;
        p.y += p.vy * 0.0035;

        if (p.x > 1.1) p.x = -0.1;
        if (p.y > 1.1) p.y = -0.1;

        const px = p.x * w;
        const py = p.y * h;
        const size = 1 + p.z * 2.2;

        ctx.fillStyle = `rgba(120,160,255,${0.04 + p.z * 0.06})`;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(120,160,255,${0.02 + p.z * 0.05})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - 14 * p.z, py - 24 * p.z);
        ctx.stroke();
      }

      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Rain on glass canvas
  useEffect(() => {
    const canvas = rainRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // keep everything crunchy / low-fi
    // @ts-ignore
    ctx.imageSmoothingEnabled = false;

    let w = 0, h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const drops = Array.from({ length: 110 }, () => spawnDrop());

    function spawnDrop() {
      return {
        x: Math.random(),
        y: Math.random(),
        // how tall the streak is (in grid steps)
        len: 2 + Math.floor(Math.random() * 4),
        v: 0.25 + Math.random() * 0.55,
      };
    }

    const resize = () => {
      w = Math.floor(window.innerWidth);
      h = Math.floor(window.innerHeight);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);

      // subtle dark overlay to keep contrast with the room
      ctx.fillStyle = "rgba(0,0,20,0.45)";
      ctx.fillRect(0, 0, w, h);

      const cell = 4; // pixel grid size

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        d.y += d.v * 0.006;

        if (d.y > 1.05) {
          drops[i] = spawnDrop();
          continue;
        }

        // snap to a chunky grid for 8‑bit feeling
        const gx = Math.floor((d.x * w) / cell) * cell;
        const gy = Math.floor((d.y * h) / cell) * cell;
        const hPixels = cell * d.len;

        // bright core of the streak
        ctx.fillStyle = "rgba(190,210,255,0.95)";
        ctx.fillRect(gx, gy - hPixels, cell, hPixels);

        // darker tail pixel
        ctx.fillStyle = "rgba(70,90,140,0.9)";
        ctx.fillRect(gx, gy, cell, cell);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const triggerGlitch = () => {
    setGlitch(true);
    window.setTimeout(() => setGlitch(false), 420);
  };
  const toggleMusic = () => {
    setMusicOn((prev) => {
      const next = !prev;
      if (next) {
        const index = Math.floor(Math.random() * 30) + 1; // rough upper bound; safe if fewer
        const url = `${playlistUrl}&index=${index}`;
        window.open(url, "_blank", "noopener,noreferrer");
      }
      return next;
    });
  };

  const hasPanel = panel !== null;

  return (
    <div className={`sceneRoot ${glitch ? "glitch" : ""}`}>
      <canvas ref={stormRef} className="stormCanvas" aria-hidden />
      <canvas ref={rainRef} className="rainCanvas" aria-hidden />

      <div className="roomStage">
        <div className="roomFloatShadow" />
        <div className="room">
          <img className="roomImg" src="/room.png" alt="Isometric room" />

          {/* Glows */}
          <div className="glow tvGlow" />
          <div className="glow pcGlow" />
          <div className="glow lampGlow" />

          {/* Click hotspots */}
          <button className="hotspot" style={boxStyle(hotspots.pc)} onClick={() => setPanel("desktop")} aria-label="Open PC Desktop" />
          <button
            className="hotspot hotspot-tv"
            style={polygonStyle(tvPoly)}
            onClick={() =>
              window.open("https://bumfluffski.co.za/streamroll/", "_blank", "noopener,noreferrer")
            }
            aria-label="Open Stream Roll"
          />
          {/* Bookshelf uses a polygon hit area so it can match the isometric face */}
          <button
            className="hotspot hotspot-shelf"
            style={polygonStyle(shelfPoly)}
            onClick={() => setPanel("newsletters")}
            aria-label="Open Bookshelf"
          />
          {/* Nirvana poster hotspot opens newsletter area too */}
          <button
            className="hotspot hotspot-nirvana"
            style={polygonStyle(nirvanaPoly)}
            onClick={() =>
              window.open(
                "https://open.spotify.com/user/bumfluffski?si=5c63d9a280e6487e",
                "_blank",
                "noopener,noreferrer"
              )
            }
            aria-label="Open Spotify profile"
          />

          {/* Additional polygon hotspots */}
          <button
            className="hotspot hotspot-pizza"
            style={polygonStyle(pizzaPoly)}
            onClick={() =>
              window.open("https://buymeacoffee.com/bumfluffski", "_blank", "noopener,noreferrer")
            }
            aria-label="Buy me a coffee"
          />
          <button
            className="hotspot hotspot-console"
            style={polygonStyle(consolePoly)}
            onClick={() => {
              triggerGlitch();
              window.alert("Coming Soon... Maybe, I get distracted");
            }}
            aria-label="Game console"
          />

          {/* DEBUG overlay */}
          {debug && (
            <>
              <div className="debugTag">DEBUG (press D to toggle)</div>
              <div className="debugBox" style={boxStyle(hotspots.pc)}><span>PC</span></div>
              <div className="debugPoly" style={polygonStyle(shelfPoly)}><span>Bookshelf</span></div>
              <div className="debugPoly" style={polygonStyle(tvPoly)}><span>TV</span></div>
              <div className="debugPoly" style={polygonStyle(pizzaPoly)}><span>Pizza</span></div>
              <div className="debugPoly" style={polygonStyle(nirvanaPoly)}><span>Nirvana</span></div>
              <div className="debugPoly" style={polygonStyle(consolePoly)}><span>Console</span></div>
            </>
          )}
        </div>
      </div>

      {hasPanel && <div className="modalBackdrop" onClick={() => setPanel(null)} />}

      {/* Windows */}
      {panel === "desktop" && (
        <Win95Window
          title="AFTERSCHOOL-LAIR"
          onClose={() => setPanel(null)}
          width={640}
          height={460}
          defaultX={80}
          defaultY={60}
        >
          <div className="desktop">
            <div className="desktop-wallpaper" />

            {/* Left-aligned classic desktop icons */}
            <div className="desktop-icons">
              <button className="desktop-icon">
                <img
                  src="/win95/my-computer.png"
                  alt="My Computer"
                  className="desktop-icon-image"
                />
                <span className="desktop-icon-label">My Computer</span>
              </button>

              <a
                className="desktop-icon"
                href="https://discord.gg/EuDnYGH"
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src="/win95/network-neighborhood.png"
                  alt="Network Neighborhood"
                  className="desktop-icon-image"
                />
                <span className="desktop-icon-label">Network Neighborhood</span>
              </a>

              <a
                className="desktop-icon"
                href="https://substack.com/@bumfluffski?utm_source=user-menu"
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src="/win95/my-documents.png"
                  alt="My Documents"
                  className="desktop-icon-image"
                />
                <span className="desktop-icon-label">My Documents</span>
              </a>

              <a
                className="desktop-icon"
                href="https://linktr.ee/bumfluffski"
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src="/win95/recycle-bin-full.png"
                  alt="Recycle Bin"
                  className="desktop-icon-image"
                />
                <span className="desktop-icon-label">Recycle Bin</span>
              </a>

              <a
                className="desktop-icon"
                href="https://bumfluffski.co.za/streamroll/"
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src="/win95/internet.png"
                  alt="Stream Roll"
                  className="desktop-icon-image"
                />
                <span className="desktop-icon-label">Stream Roll</span>
              </a>

              <a
                className="desktop-icon"
                href="https://patreon.com/c/bum_fluffski"
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src="/win95/internet.png"
                  alt="Patreon"
                  className="desktop-icon-image"
                />
                <span className="desktop-icon-label">Patreon</span>
              </a>

              <a
                className="desktop-icon"
                href="https://bumfluffski.co.za/youtube/"
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src="/win95/multimedia.png"
                  alt="Multimedia"
                  className="desktop-icon-image"
                />
                <span className="desktop-icon-label">Multimedia</span>
              </a>

              <a
                className="desktop-icon"
                href="https://open.spotify.com/user/bumfluffski?si=d1d047332c0b450f"
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src="/win95/music.png"
                  alt="Music"
                  className="desktop-icon-image"
                />
                <span className="desktop-icon-label">Music</span>
              </a>

              <a
                className="desktop-icon"
                href="https://www.twitch.tv/bumfluffski"
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src="/win95/windows_movie.png"
                  alt="Windows Movie"
                  className="desktop-icon-image"
                />
                <span className="desktop-icon-label">Windows Movie</span>
              </a>

              <a
                className="desktop-icon"
                href="https://www.instagram.com/bumfluffski/"
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src="/win95/camera.png"
                  alt="Camera"
                  className="desktop-icon-image"
                />
                <span className="desktop-icon-label">Camera</span>
              </a>
            </div>

            <div className="desktop-taskbar">
              <button className="taskbar-start">
                <img
                  src="/win95/start-button.png"
                  alt="Start"
                  className="taskbar-start-image"
                />
              </button>
              <div className="taskbar-spacer" />
              <div className="taskbar-clock">{desktopTime}</div>
            </div>
          </div>
        </Win95Window>
      )}
      {panel === "tv" && (
        <Win95Window title="TV · Paused Game" onClose={() => setPanel(null)} defaultX={180} defaultY={80}>
          <div className="winSection">
            <p>The game is currently paused.</p>
            <p>Use this space later for easter eggs, channel links, or controls.</p>
          </div>
        </Win95Window>
      )}

      {panel === "projects" && (
        <Win95Window title="Projects" onClose={() => setPanel(null)} defaultX={60} defaultY={70}>
          <div className="winSection">
            {projects.map((p) => (
              <div key={p.title} className="cardRow">
                <div className="cardTitle">{p.title}</div>
                <div className="cardDesc">{p.desc}</div>
                <div className="cardActions">
                  <a href={p.link} target="_blank" rel="noreferrer">Open</a>
                </div>
              </div>
            ))}
          </div>
        </Win95Window>
      )}

      {panel === "about" && (
        <Win95Window title="About Me" onClose={() => setPanel(null)} defaultX={110} defaultY={120}>
          <div className="winSection">
            <p>Replace this with your real story.</p>
          </div>
        </Win95Window>
      )}

      {panel === "newsletters" && (
        <Win95Window title="Newsletter Stack" onClose={() => setPanel(null)} defaultX={150} defaultY={90}>
          <div className="winSection">
            {newsletters.map((n) => (
              <div key={n.name} className="cardRow">
                <div className="cardTitle">{n.name}</div>
                <div className="cardDesc">{n.desc}</div>
                <div className="cardActions">
                  <a href={n.link} target="_blank" rel="noreferrer">Read</a>
                </div>
              </div>
            ))}
          </div>
        </Win95Window>
      )}

      {panel === "cheat" && (
        <Win95Window title="Cheat Code Unlocked" onClose={() => setPanel(null)} defaultX={210} defaultY={160}>
          <div className="winSection">
            <p><b>SECRET:</b> NU-DGE-1998</p>
          </div>
        </Win95Window>
      )}

      <div className="status" onClick={toggleMusic}>
        <span className="dot" data-on={musicOn ? "1" : "0"} />
        <span>{musicOn ? "Radio: On" : "Radio: Off"}</span>
      </div>

      <style jsx>{`
        .sceneRoot {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .stormCanvas, .rainCanvas {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        /* FIX #3: center the room reliably */
        .roomStage {
          position: relative;
          z-index: 10;
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
        }

        .roomFloatShadow {
          position: absolute;
          width: min(1200px, 96vw);
          aspect-ratio: 1487 / 1021;
          background: radial-gradient(closest-side, rgba(0,0,0,0.35), rgba(0,0,0,0));
          filter: blur(18px);
          transform: translate3d(0, 34px, 0);
          pointer-events: none;
          animation: roomFloatShadow 5.2s ease-in-out infinite;
        }

        .room {
          position: relative;
          width: min(1200px, 96vw);
          aspect-ratio: 1487 / 1021;
          border-radius: 18px;
          overflow: visible;
          filter: drop-shadow(0 30px 60px rgba(0,0,0,0.55));
          animation: roomFloat 5.2s ease-in-out infinite;
        }

        .roomImg {
          width: 100%;
          height: 100%;
          display: block;
          image-rendering: pixelated;
          border-radius: 18px;
        }

        .glow {
          position: absolute;
          pointer-events: none;
          filter: blur(18px);
          opacity: 0.55;
          mix-blend-mode: screen;
        }

        .tvGlow {
          /* centered roughly on the TV screen polygon */
          left: 63%;
          top: 47%;
          width: 18%;
          height: 22%;
          background: radial-gradient(circle at 55% 45%, rgba(90, 170, 255, 0.8), rgba(0,0,0,0));
          animation: tvPulse 2.2s infinite;
        }

        .pcGlow {
          /* centered on the PC screen rectangle */
          left: 50%;
          top: 38%;
          width: 16%;
          height: 20%;
          background: radial-gradient(circle at 45% 45%, rgba(120, 255, 160, 0.65), rgba(0,0,0,0));
          animation: pcFlicker 1.6s infinite;
        }

        .lampGlow {
          left: 30%;
          top: 46%;
          width: 24%;
          height: 24%;
          background: radial-gradient(circle at 40% 45%, rgba(255, 205, 120, 0.55), rgba(0,0,0,0));
          animation: lampFlicker 3.4s infinite;
        }

        @keyframes tvPulse {
          0% { opacity: 0.45; transform: scale(0.98); }
          50% { opacity: 0.62; transform: scale(1.02); }
          100% { opacity: 0.48; transform: scale(0.99); }
        }
        @keyframes pcFlicker {
          0% { opacity: 0.44; }
          8% { opacity: 0.62; }
          16% { opacity: 0.48; }
          22% { opacity: 0.68; }
          40% { opacity: 0.52; }
          60% { opacity: 0.64; }
          100% { opacity: 0.46; }
        }
        @keyframes lampFlicker {
          0% { opacity: 0.52; }
          12% { opacity: 0.61; }
          18% { opacity: 0.48; }
          26% { opacity: 0.66; }
          33% { opacity: 0.56; }
          72% { opacity: 0.64; }
          100% { opacity: 0.54; }
        }

        @keyframes roomFloat {
          0% { transform: translate3d(0, -6px, 0); }
          50% { transform: translate3d(0, 6px, 0); }
          100% { transform: translate3d(0, -6px, 0); }
        }
        @keyframes roomFloatShadow {
          0% { transform: translate3d(0, 32px, 0) scale(0.98); opacity: 0.82; }
          50% { transform: translate3d(0, 38px, 0) scale(1.02); opacity: 0.96; }
          100% { transform: translate3d(0, 32px, 0) scale(0.98); opacity: 0.82; }
        }

        /* FIX #2 + #4: stop any “moving hover”, keep hotspots stable */
        .hotspot {
          position: absolute;
          background: transparent;
          border: 0;
          cursor: pointer;
          border-radius: 10px;
        }

        .hotspot:hover {
          outline: 1px solid rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.03);
        }

        .hotspot:active {
          outline: 1px solid rgba(90,170,255,0.25);
          background: rgba(90,170,255,0.06);
        }

        /* Glitch */
        .glitch .room {
          animation: glitchShake 0.42s steps(2, end);
          filter: drop-shadow(0 30px 60px rgba(0,0,0,0.55)) saturate(1.25) contrast(1.12);
        }
        .glitch .roomImg {
          animation: glitchRGB 0.42s linear;
        }
        @keyframes glitchShake {
          0% { transform: translate3d(0,0,0); }
          20% { transform: translate3d(2px,-1px,0); }
          40% { transform: translate3d(-2px,1px,0); }
          60% { transform: translate3d(1px,2px,0); }
          80% { transform: translate3d(-1px,-2px,0); }
          100% { transform: translate3d(0,0,0); }
        }
        @keyframes glitchRGB {
          0% { filter: none; }
          30% { filter: drop-shadow(2px 0 0 rgba(255,0,80,0.5)) drop-shadow(-2px 0 0 rgba(0,180,255,0.5)); }
          100% { filter: none; }
        }

        .status {
          position: fixed;
          bottom: 14px;
          left: 14px;
          z-index: 50;
          display: flex;
          gap: 10px;
          align-items: center;
          padding: 8px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          backdrop-filter: blur(10px);
          font-size: 12px;
          color: rgba(255,255,255,0.85);
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: rgba(255,255,255,0.25);
          box-shadow: 0 0 14px rgba(255,255,255,0.18);
        }
        .dot[data-on="1"] {
          background: rgba(120,255,160,0.65);
          box-shadow: 0 0 16px rgba(120,255,160,0.35);
        }

        .winSection { display: grid; gap: 10px; }
        .cardRow {
          padding: 10px;
          border: 2px solid #000;
          box-shadow: 2px 2px 0 #808080, -2px -2px 0 #fff;
          background: rgba(255,255,255,0.25);
        }
        .cardTitle { font-weight: 800; margin-bottom: 4px; }
        .cardDesc { opacity: 0.85; margin-bottom: 8px; }
        .cardActions a {
          display: inline-block;
          padding: 4px 8px;
          background: #c0c0c0;
          border: 2px solid #000;
          box-shadow: 1px 1px 0 #808080, -1px -1px 0 #fff;
          color: #111;
          text-decoration: none;
          font-weight: 700;
          font-size: 12px;
        }
        .cardActions a:active {
          box-shadow: none;
          transform: translate(1px, 1px);
        }

        /* DEBUG */
        .debugTag {
          position: absolute;
          left: 10px;
          top: 10px;
          z-index: 60;
          padding: 6px 10px;
          border-radius: 10px;
          background: rgba(0,0,0,0.55);
          border: 1px solid rgba(255,255,255,0.18);
          color: rgba(255,255,255,0.9);
          font-size: 12px;
        }
        .debugBox {
          position: absolute;
          z-index: 60;
          outline: 2px dashed rgba(255, 80, 120, 0.85);
          background: rgba(255, 80, 120, 0.08);
          pointer-events: none;
        }
        .debugBox span {
          position: absolute;
          left: 6px;
          top: 6px;
          font-size: 12px;
          color: rgba(255,255,255,0.9);
          text-shadow: 0 1px 6px rgba(0,0,0,0.8);
        }
        .debugTvOutline {
          position: absolute;
          z-index: 60;
          left: 69.4%;
          top: 43.6%;
          width: 9.6%;
          height: 8.4%;
          outline: 2px solid rgba(90,170,255,0.9);
          pointer-events: none;
          transform-origin: center;
          transform: rotate(-10deg) skewX(-10deg);
        }

        .modalBackdrop {
          position: fixed;
          inset: 0;
          z-index: 30;
          background: rgba(0,0,0,0.45);
        }

        /* Win95-style desktop inside the PC window */
        .desktop {
          position: relative;
          inset: 0;
          width: 100%;
          height: 100%;
          background: #008080;
          overflow: hidden;
        }
        .desktop-wallpaper {
          position: absolute;
          inset: 0;
          background: #008080;
          opacity: 1;
        }
        .desktop-icons {
          position: relative;
          z-index: 1;
          padding: 8px 6px;
          display: grid;
          grid-template-columns: repeat(auto-fill, 96px);
          grid-auto-rows: 70px;
          grid-auto-flow: row;
          justify-content: flex-start;
          align-content: flex-start;
          column-gap: 12px;
          row-gap: 6px;
        }
        .desktop-icon {
          border: none;
          padding: 2px 2px;
          background: transparent;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          color: #fff;
          text-decoration: none;
          font-size: 11px;
        }
        .desktop-icon:hover {
          background: rgba(0, 0, 80, 0.35);
          outline: 1px dotted #fff;
        }
        .desktop-icon-image {
          width: 32px;
          height: 32px;
          image-rendering: pixelated;
          display: block;
        }
        .desktop-icon-label {
          max-width: 96px;
          text-align: center;
          text-shadow: 1px 1px 0 #000;
          word-wrap: break-word;
          line-height: 1.1;
        }
        .desktop-taskbar {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 26px;
          background: #c0c0c0;
          border-top: 2px solid #ffffff;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 2px 4px;
          box-shadow:
            inset 0 1px 0 #ffffff,
            inset 0 -1px 0 #808080;
          font-size: 11px;
        }
        .taskbar-start {
          padding: 0;
          height: 22px;
          border: 2px solid #000;
          background: #c0c0c0;
          box-shadow:
            1px 1px 0 #808080,
            -1px -1px 0 #ffffff;
          font-size: 11px;
          cursor: pointer;
        }
        .taskbar-start-image {
          display: block;
          height: 100%;
          image-rendering: pixelated;
        }
        .taskbar-spacer {
          flex: 1;
        }
        .taskbar-clock {
          padding: 2px 6px;
          border: 1px inset #808080;
        }

        .hotspot-shelf,
        .hotspot-tv,
        .hotspot-nirvana,
        .hotspot-console {
          border-radius: 0;
        }

        .debugPoly {
          position: absolute;
          z-index: 60;
          pointer-events: none;
          outline: 2px dashed rgba(255, 80, 120, 0.9);
        }
        .debugPoly span {
          position: absolute;
          left: 6px;
          top: 6px;
          font-size: 12px;
          color: rgba(255,255,255,0.9);
          text-shadow: 0 1px 6px rgba(0,0,0,0.8);
        }
      `}</style>
    </div>
  );
}

function boxStyle(b: Box) {
  return {
    left: `${b.left}%`,
    top: `${b.top}%`,
    width: `${b.width}%`,
    height: `${b.height}%`,
  } as const;
}

function polygonStyle(points: PolyPoint[]) {
  const path = points.map((p) => `${p.x}% ${p.y}%`).join(", ");
  return {
    position: "absolute" as const,
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    clipPath: `polygon(${path})`,
  };
}
