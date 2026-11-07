import type { ReactNode } from "react";

// Client screens. Phones (< 768px): the prototype's mobile layout, a centered 480px column
// with a shadow on large phones. Tablets and desktops (≥ 768px): full width; each screen's
// content uses `content-width` to stay readable on big monitors.
export function ClientScreen({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg min-[481px]:max-md:shadow-page md:max-w-none">
      {children}
    </div>
  );
}
