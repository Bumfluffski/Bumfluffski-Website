import type { ReactNode } from "react";

export function DeviceShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto aspect-[0.86] w-full max-w-[min(730px,92vw)] rounded-[2.6rem] border-[6px] border-[#7d2218] bg-[linear-gradient(145deg,#d84e39_0%,#b13322_54%,#7d2218_100%)] px-3 pb-4 pt-4 shadow-[0_32px_72px_rgba(67,29,17,0.22)] sm:px-5 sm:pb-5 sm:pt-5">
      <div className="absolute inset-x-[9%] top-[2.8%] h-8 rounded-full bg-white/12 blur-md" />
      {children}
    </div>
  );
}
