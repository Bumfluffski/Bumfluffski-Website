import type { ReactNode } from "react";

export function DeviceShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto aspect-[0.86] w-full max-w-[730px] rounded-[2.8rem] border-[6px] border-[#7d2218] bg-[linear-gradient(145deg,#d84e39_0%,#b13322_54%,#7d2218_100%)] px-4 pb-6 pt-5 shadow-[0_40px_90px_rgba(67,29,17,0.23)] sm:px-6 sm:pb-7 sm:pt-6">
      <div className="absolute inset-x-[9%] top-[2.8%] h-8 rounded-full bg-white/12 blur-md" />
      {children}
    </div>
  );
}
