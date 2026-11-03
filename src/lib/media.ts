import { API_URL } from "@/lib/apiConfig";
const STORAGE_SEGMENT = /\/?storage\//i;
const PUBLIC_SEGMENT = /\/?public\//i;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export function resolveMediaUrl(path?: string | null): string | null {
  if (!path) return null;

  const replaced = PUBLIC_SEGMENT.test(path)
    ? path.replace(PUBLIC_SEGMENT, "/storage/")
    : STORAGE_SEGMENT.test(path)
      ? path.replace(STORAGE_SEGMENT, "/storage/")
      : path;

  if (/^https?:\/\//i.test(replaced)) {
    try {
      const assetUrl = new URL(replaced);
      const apiUrl = new URL(API_URL || window.location.origin);

      if (LOCAL_HOSTS.has(assetUrl.hostname)) {
        assetUrl.protocol = apiUrl.protocol;
        assetUrl.host = apiUrl.host;
      }

      return assetUrl.toString();
    } catch {
      return replaced;
    }
  }

  const normalized = replaced.startsWith("/") ? replaced : `/${replaced}`;
  return `${API_URL}${normalized}`;
}
