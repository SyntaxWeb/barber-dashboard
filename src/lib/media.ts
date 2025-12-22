const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4002";
const STORAGE_SEGMENT = /\/?storage\//i;

export function resolveMediaUrl(path?: string | null): string | null {
  if (!path) return null;

  const replaced = STORAGE_SEGMENT.test(path) ? path.replace(STORAGE_SEGMENT, "/public/") : path;

  if (/^https?:\/\//i.test(replaced)) {
    return replaced;
  }

  const normalized = replaced.startsWith("/") ? replaced : `/${replaced}`;
  return `${API_URL}${normalized}`;
}
