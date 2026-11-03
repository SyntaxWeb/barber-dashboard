import { useCallback, useEffect, useMemo, useRef } from "react";

// Each new request invalidates older responses, including after unmount.
export function useRequestGuard() {
  const generation = useRef(0);
  const mounted = useRef(true);
  const invalidate = useCallback(() => { generation.current += 1; }, []);
  const start = useCallback(() => {
    const request = ++generation.current;
    return () => mounted.current && generation.current === request;
  }, []);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; invalidate(); };
  }, [invalidate]);
  return useMemo(() => ({ start, invalidate }), [start, invalidate]);
}
