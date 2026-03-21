import type { ReactNode } from "react";

export function DeviceScreen({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 rounded-[2rem] border-[5px] border-[#5a2618] bg-[#5f2a1d] p-3 sm:p-4">
      <div
        className="relative overflow-hidden rounded-[1.2rem] border-[4px] border-[#3a2318] bg-[#b9d39d] p-4 sm:p-5 [background-image:linear-gradient(rgba(38,52,31,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(38,52,31,0.08)_1px,transparent_1px)] [background-size:22px_22px]"
        style={{
          boxShadow:
            "inset 0 8px 30px rgba(255,255,255,0.18), inset 0 -12px 25px rgba(38,52,31,0.16)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
