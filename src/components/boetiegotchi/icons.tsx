type IconType = "food" | "joy" | "rest" | "clean" | "chaos";

const stroke = "#2b3523";
const fill = "#fff7df";

export function StatIcon({ type }: { type: IconType }) {
  if (type === "food") {
    return (
      <svg viewBox="0 0 64 64" className="h-8 w-8" aria-hidden>
        <rect x="10" y="24" width="44" height="24" rx="12" fill="#f3be58" stroke={stroke} strokeWidth="3" />
        <path d="M14 32h36" stroke="#8e4217" strokeWidth="3" strokeLinecap="round" />
        <path
          d="M21 20c0-5 4-8 8-8M32 20c0-5 4-8 8-8M43 20c0-5 4-8 8-8"
          stroke="#4d7a3d"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (type === "joy") {
    return (
      <svg viewBox="0 0 64 64" className="h-8 w-8" aria-hidden>
        <circle cx="32" cy="32" r="21" fill={fill} stroke={stroke} strokeWidth="3" />
        <circle cx="24" cy="28" r="3.5" fill={stroke} />
        <circle cx="40" cy="28" r="3.5" fill={stroke} />
        <path d="M21 38c4 6 18 6 22 0" fill="none" stroke="#d64f4f" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === "rest") {
    return (
      <svg viewBox="0 0 64 64" className="h-8 w-8" aria-hidden>
        <rect x="11" y="27" width="42" height="16" rx="8" fill="#d4c29d" stroke={stroke} strokeWidth="3" />
        <rect x="15" y="23" width="12" height="8" rx="4" fill="#fff7df" stroke={stroke} strokeWidth="3" />
        <path
          d="M43 16h10l-8 10h8"
          fill="none"
          stroke="#7b2418"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (type === "clean") {
    return (
      <svg viewBox="0 0 64 64" className="h-8 w-8" aria-hidden>
        <path
          d="M32 10c8 11 12 17 12 24a12 12 0 1 1-24 0c0-7 4-13 12-24Z"
          fill="#7ab6d9"
          stroke={stroke}
          strokeWidth="3"
        />
        <path
          d="M48 18l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Z"
          fill="#fff7df"
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" className="h-8 w-8" aria-hidden>
      <path
        d="M13 41c0-13 8-22 19-22 8 0 14 5 16 12 6 1 10 6 10 12 0 8-6 14-14 14H27c-8 0-14-7-14-16Z"
        fill="#f1a853"
        stroke={stroke}
        strokeWidth="3"
      />
      <path d="M22 21 26 9M37 17l8-8M44 27h11" stroke="#7b2418" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function ActionIcon({ type }: { type: "feed" | "jol" | "nap" | "wash" }) {
  if (type === "feed") return <StatIcon type="food" />;
  if (type === "jol") return <StatIcon type="joy" />;
  if (type === "nap") return <StatIcon type="rest" />;
  return <StatIcon type="clean" />;
}
