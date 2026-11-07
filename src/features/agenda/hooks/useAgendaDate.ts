import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { LocalDate } from "@/lib/api/types";
import { localDateOf } from "@/lib/format/date";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The day shown by an agenda. It lives in the address (?dia=AAAA-MM-DD) so the link can be
 * shared and the browser's back button works; without it, the agenda shows today.
 */
export function useAgendaDate() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [today] = useState(() => localDateOf(new Date()));
  const requested = searchParams.get("dia");
  const date: LocalDate = requested && DATE_PATTERN.test(requested) ? requested : today;

  const goTo = (target: LocalDate) => router.push(target === today ? pathname : `${pathname}?dia=${target}`);

  return { date, isToday: date === today, goTo };
}
