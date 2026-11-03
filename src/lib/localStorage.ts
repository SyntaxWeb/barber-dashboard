// Browsers may expose localStorage but reject access (privacy mode or quotas).
export const safeLocalStorage = {
  getItem(key: string): string | null {
    try { return window.localStorage.getItem(key); } catch { return null; }
  },
  setItem(key: string, value: string): void {
    try { window.localStorage.setItem(key, value); } catch { /* Preferences must not crash a page. */ }
  },
  removeItem(key: string): void {
    try { window.localStorage.removeItem(key); } catch { /* In-memory state is still cleared. */ }
  },
};
