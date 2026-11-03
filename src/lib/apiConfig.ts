// An empty URL uses the frontend Nginx proxy in production.
export const API_URL = (import.meta.env.VITE_API_URL ?? "").trim().replace(/\/+$/, "");
