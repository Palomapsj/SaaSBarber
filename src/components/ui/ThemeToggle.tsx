"use client";

import { useLayoutEffect } from "react";
import { MoonIcon } from "@/components/ui/icons/MoonIcon";
import { SunIcon } from "@/components/ui/icons/SunIcon";
import {
  DEFAULT_THEME,
  applyTheme,
  isTheme,
  readStoredTheme,
  saveTheme,
} from "@/lib/theme/theme";

export function ThemeToggle() {
  // In development, Strict Mode remounts <html> and drops the attribute set by the
  // inline script; re-apply it before paint. No-op in production.
  useLayoutEffect(() => {
    const stored = readStoredTheme();
    if (stored) applyTheme(stored);
  }, []);

  function toggle() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = (isTheme(current) ? current : DEFAULT_THEME) === "dark" ? "light" : "dark";
    applyTheme(next);
    saveTheme(next);
  }

  // Visual size follows the prototype (36px); the ::before extends the touch target to 44px.
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Alternar modo claro/escuro"
      className="relative flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-text before:absolute before:-inset-1 before:content-['']"
    >
      <SunIcon size={17} className="hidden dark:block" />
      <MoonIcon size={17} className="block dark:hidden" />
    </button>
  );
}
