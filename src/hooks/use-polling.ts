import { useEffect, useLayoutEffect, useRef } from "react";

// Keep timers stable when a parent renders, and never overlap requests.
export function usePolling(
  callback: (signal: AbortSignal) => Promise<void>,
  delay: number,
  { enabled = true, immediate = false, requestKey }: { enabled?: boolean; immediate?: boolean; requestKey?: string | number } = {},
) {
  const latest = useRef(callback);
  useLayoutEffect(() => { latest.current = callback; }, [callback]);

  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let running = false;
    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController | undefined;
    const visible = () => document.visibilityState !== "hidden";
    const schedule = (wait: number) => {
      clearTimeout(timer);
      if (!stopped && visible()) timer = setTimeout(run, wait);
    };
    const run = async () => {
      if (stopped || running || !visible()) return;
      running = true;
      controller = new AbortController();
      try { await latest.current(controller.signal); }
      catch { /* Retry on the next cycle; cancellation is expected on navigation. */ }
      finally { running = false; schedule(delay); }
    };
    const onVisibility = () => {
      clearTimeout(timer);
      if (!visible()) controller?.abort();
      else if (!running) schedule(0);
    };
    document.addEventListener("visibilitychange", onVisibility);
    schedule(immediate ? 0 : delay);
    return () => {
      stopped = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [delay, enabled, immediate, requestKey]);
}
