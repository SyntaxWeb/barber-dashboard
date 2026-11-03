import { afterEach, expect, it, vi } from "vitest";
import { apiFetch } from "@/services/api";

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it("times out a stalled read so the effect can leave the loading state", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", vi.fn((_url, options: RequestInit) => new Promise((_resolve, reject) => {
    options.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
  })));
  const request = apiFetch("/api/settings");
  const assertion = expect(request).rejects.toThrow("A consulta demorou para responder");
  await vi.advanceTimersByTimeAsync(30000);
  await assertion;
});

it("forwards page cancellation and removes the read timeout", async () => {
  vi.useFakeTimers();
  let signal!: AbortSignal;
  vi.stubGlobal("fetch", vi.fn((_url, options: RequestInit) => {
    signal = options.signal!;
    return new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError"))));
  }));
  const page = new AbortController();
  const request = apiFetch("/api/settings", { signal: page.signal });
  const assertion = expect(request).rejects.toMatchObject({ name: "AbortError" });
  page.abort();
  await assertion;
  expect(signal.aborted).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
});
