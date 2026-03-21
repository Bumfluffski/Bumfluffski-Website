import type { ReactNode } from "react";

export function DeviceScreen({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 rounded-[1.75rem] border-[5px] border-[#5a2618] bg-[#5f2a1d] p-2.5 sm:p-3">
      <div
        className="relative overflow-hidden rounded-[1.1rem] border-[4px] border-[#3a2318] bg-[#b9d39d] p-3 sm:p-4 [background-image:linear-gradient(rgba(38,52,31,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(38,52,31,0.08)_1px,transparent_1px)] [background-size:22px_22px]"
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
