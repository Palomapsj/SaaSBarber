import type { ReactNode } from "react";

type BookingFooterProps = {
  /** Secondary content above the summary, e.g. the waitlist button. */
  aside?: ReactNode;
  summary?: ReactNode;
  children: ReactNode;
};

// Pinned to the bottom while the content scrolls. Phones: stacked, full-width action.
// Tablet/desktop: one full-width bar with aside and summary on the left, action on the right.
export function BookingFooter({ aside, summary, children }: BookingFooterProps) {
  return (
    <div className="sticky bottom-0 bg-bg md:mt-6 md:border-t md:border-border">
      <div className="content-width md:flex md:items-center md:gap-6 md:px-8 md:py-4">
        {aside !== undefined && <div className="px-5 pb-3 md:max-w-[420px] md:p-0">{aside}</div>}
        {summary !== undefined ? (
          <p aria-live="polite" className="px-5 pb-1.5 text-[12px] text-muted md:flex-1 md:p-0 md:text-[14px]">
            {summary}
          </p>
        ) : (
          <div className="hidden md:block md:flex-1" />
        )}
        <div className="px-5 pt-4 pb-[calc(24px+env(safe-area-inset-bottom))] md:w-[320px] md:shrink-0 md:p-0">
          {children}
        </div>
      </div>
    </div>
  );
}
