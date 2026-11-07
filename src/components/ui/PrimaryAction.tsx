import Link from "next/link";
import type { ReactNode } from "react";

/** Also used by form submit buttons that need the same look. */
export const primaryActionClasses =
  "block w-full rounded-xl bg-accent py-4 text-center font-display text-[15px] font-bold tracking-[0.5px] text-on-accent uppercase";

type PrimaryActionProps = {
  href: string;
  disabled?: boolean;
  /** Second, smaller line, e.g. the chosen date and time under "Continuar". */
  detail?: string;
  children: ReactNode;
};

// Full-width red call to action ("Continuar"). A disabled link is rendered as a disabled button.
export function PrimaryAction({ href, disabled = false, detail, children }: PrimaryActionProps) {
  const content = (
    <>
      {children}
      {detail && <span className="mt-0.5 block text-[12px] opacity-85">{detail}</span>}
    </>
  );
  if (disabled) {
    return (
      <button type="button" disabled className={`${primaryActionClasses} cursor-not-allowed opacity-40`}>
        {content}
      </button>
    );
  }
  return (
    <Link href={href} className={primaryActionClasses}>
      {content}
    </Link>
  );
}
