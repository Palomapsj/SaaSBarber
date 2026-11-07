import type { ReactNode } from "react";

// Empty and error states inside a booking step: a short text and an optional action.
export function StepMessage({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="content-width px-5 py-[18px] text-[13px] text-muted md:px-8">
      <p>{children}</p>
      {action && <div className="mt-2 font-semibold text-accent">{action}</div>}
    </div>
  );
}
