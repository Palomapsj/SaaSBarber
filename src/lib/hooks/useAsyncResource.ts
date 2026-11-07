import { useEffect, useEffectEvent, useState } from "react";

export type ResourceState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: unknown; retry: () => void }
  | { status: "ready"; data: T };

type Result<T> = { key: string; data: T } | { key: string; failed: true; error: unknown };

/**
 * Loads data in the browser whenever `key` changes; `key: null` skips loading.
 * The key must describe every input of `load` so a change triggers a new request.
 */
export function useAsyncResource<T>(key: string | null, load: () => Promise<T>): ResourceState<T> {
  const [result, setResult] = useState<Result<T> | null>(null);
  const [attempt, setAttempt] = useState(0);
  const requestKey = key === null ? null : `${key}#${attempt}`;
  const runLoad = useEffectEvent(load);

  useEffect(() => {
    if (requestKey === null) return;
    let active = true;
    runLoad().then(
      (data) => {
        if (active) setResult({ key: requestKey, data });
      },
      (error: unknown) => {
        if (active) setResult({ key: requestKey, failed: true, error });
      },
    );
    return () => {
      active = false;
    };
  }, [requestKey]);

  if (requestKey === null) return { status: "idle" };
  if (result?.key !== requestKey) return { status: "loading" };
  if ("failed" in result) return { status: "error", error: result.error, retry: () => setAttempt((n) => n + 1) };
  return { status: "ready", data: result.data };
}
