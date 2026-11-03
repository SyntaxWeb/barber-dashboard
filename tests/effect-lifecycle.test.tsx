import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StrictMode, type ReactNode } from "react";
import { usePolling } from "@/hooks/use-polling";
import { useRequestGuard } from "@/hooks/use-request-guard";
import { useIsMobile } from "@/hooks/use-mobile";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
}

function visibility(state: "hidden" | "visible") {
  Object.defineProperty(document, "visibilityState", { configurable: true, value: state });
  document.dispatchEvent(new Event("visibilitychange"));
}

beforeEach(() => { vi.useFakeTimers(); visibility("visible"); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

const tick = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };

describe("polling lifecycle", () => {
  it("waits for a slow response before scheduling another request", async () => {
    const pending = deferred();
    const poll = vi.fn(() => pending.promise);
    renderHook(() => usePolling(poll, 3000, { immediate: true }));
    await tick(0);
    await tick(15000);
    expect(poll).toHaveBeenCalledTimes(1);
    await act(async () => { pending.resolve(); });
    await tick(2999);
    expect(poll).toHaveBeenCalledTimes(1);
    await tick(1);
    expect(poll).toHaveBeenCalledTimes(2);
  });

  it("keeps its timer across parent renders and calls the latest callback", async () => {
    const first = vi.fn(async () => {});
    const second = vi.fn(async () => {});
    const { rerender } = renderHook(({ callback }) => usePolling(callback, 3000), { initialProps: { callback: first } });
    await tick(2000);
    rerender({ callback: second });
    await tick(1000);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("pauses when a tablet sleeps and resumes once without piling up timers", async () => {
    const poll = vi.fn(async () => {});
    renderHook(() => usePolling(poll, 3000, { immediate: true }));
    await tick(0);
    act(() => visibility("hidden"));
    await tick(60000);
    expect(poll).toHaveBeenCalledTimes(1);
    act(() => visibility("visible"));
    await tick(0);
    expect(poll).toHaveBeenCalledTimes(2);
    await tick(3000);
    expect(poll).toHaveBeenCalledTimes(3);
  });

  it("aborts a checkout response after its request key changes or it unmounts", async () => {
    const pending = deferred();
    const signals: AbortSignal[] = [];
    const poll = vi.fn((signal: AbortSignal) => { signals.push(signal); return pending.promise; });
    const { rerender, unmount } = renderHook(({ id }) => usePolling(poll, 3000, { immediate: true, requestKey: id }), { initialProps: { id: 1 } });
    await tick(0);
    rerender({ id: 2 });
    expect(signals[0].aborted).toBe(true);
    await tick(0);
    expect(signals).toHaveLength(2);
    unmount();
    expect(signals[1].aborted).toBe(true);
    await act(async () => { pending.resolve(); });
    await tick(60000);
    expect(poll).toHaveBeenCalledTimes(2);
  });

  it("does not duplicate timers under StrictMode", async () => {
    const poll = vi.fn(async () => {});
    renderHook(() => usePolling(poll, 3000, { immediate: true }), { wrapper: ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode> });
    await tick(0);
    expect(poll).toHaveBeenCalledTimes(1);
    await tick(3000);
    expect(poll).toHaveBeenCalledTimes(2);
  });
});

describe("request guards", () => {
  it("rejects old responses, cleanup responses, and work started after unmount", () => {
    const { result, unmount } = renderHook(() => useRequestGuard());
    const first = result.current.start();
    const second = result.current.start();
    expect(first()).toBe(false);
    expect(second()).toBe(true);
    result.current.invalidate();
    expect(second()).toBe(false);
    const third = result.current.start();
    unmount();
    expect(third()).toBe(false);
    expect(result.current.start()()).toBe(false);
  });
});

describe("tablet breakpoint", () => {
  it("starts with the correct layout on the first render", () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener, removeEventListener })));
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 820 });
    const renders: boolean[] = [];
    const { unmount } = renderHook(() => { const mobile = useIsMobile(); renders.push(mobile); return mobile; });
    expect(renders.every(Boolean)).toBe(true);
    unmount();
    expect(removeEventListener).toHaveBeenCalledTimes(1);
  });

  it("supports older Safari listeners and removes them", () => {
    const addListener = vi.fn();
    const removeListener = vi.fn();
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addListener, removeListener })));
    const { unmount } = renderHook(() => useIsMobile());
    expect(addListener).toHaveBeenCalledTimes(1);
    unmount();
    expect(removeListener).toHaveBeenCalledTimes(1);
  });
});
