const MEMORY_STORE = new Map<string, string>();

const canUseSessionStorage = (): boolean => {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return false;
  }
  try {
    const testKey = "__secure_test__";
    window.sessionStorage.setItem(testKey, "ok");
    window.sessionStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

const hasSessionStorage = canUseSessionStorage();

export const secureStorage = {
  getItem(key: string): string | null {
    if (hasSessionStorage) {
      try {
        return window.sessionStorage.getItem(key);
      } catch {
        return MEMORY_STORE.get(key) ?? null;
      }
    }
    return MEMORY_STORE.get(key) ?? null;
  },
  setItem(key: string, value: string) {
    if (hasSessionStorage) {
      try {
        window.sessionStorage.setItem(key, value);
        return;
      } catch {
        // fallback to memory store if writing fails
      }
    }
    MEMORY_STORE.set(key, value);
  },
  removeItem(key: string) {
    if (hasSessionStorage) {
      try {
        window.sessionStorage.removeItem(key);
      } catch {
        // ignore and clean up memory store copy
      }
    }
    MEMORY_STORE.delete(key);
  },
  clearMemory() {
    MEMORY_STORE.clear();
  },
};
