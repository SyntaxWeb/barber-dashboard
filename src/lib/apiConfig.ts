// Keep all API consumers on the same configured backend.
export const API_URL = (import.meta.env.VITE_API_URL?.trim() || "https://api-atendimento.syntaxatendimento.com.br").replace(/\/+$/, "");
