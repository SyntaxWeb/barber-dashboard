import { resolveMediaUrl } from "@/lib/media";
import { secureStorage } from "@/lib/secureStorage";
import { apiFetch, handleResponse } from "@/services/api";

export type DiscoveryService = {
  id: number;
  nome: string;
  preco: number;
  duracao: number;
};

export type DiscoveredCompany = {
  id: number;
  nome: string;
  slug: string;
  descricao?: string | null;
  icon_url?: string | null;
  cover_url?: string | null;
  address?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distance_km?: number | null;
  rating?: number | null;
  reviews_count: number;
  services: DiscoveryService[];
  next_availability?: { date: string; time: string } | null;
};

export type DiscoveryFilters = {
  q?: string;
  location?: string;
  service?: string;
  price_min?: number;
  price_max?: number;
  rating_min?: number;
  available_on?: string;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  page?: number;
};

export type DiscoveryPage = {
  data: DiscoveredCompany[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

const normalizeCompany = (company: DiscoveredCompany): DiscoveredCompany => ({
  ...company,
  icon_url: resolveMediaUrl(company.icon_url),
  cover_url: resolveMediaUrl(company.cover_url),
});

export async function discoverCompanies(filters: DiscoveryFilters): Promise<DiscoveryPage> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  });
  params.set("per_page", "12");

  const response = await apiFetch(`/api/discover/companies?${params.toString()}`);
  const result = await handleResponse<DiscoveryPage>(response, "Não foi possível buscar estabelecimentos.");
  return { ...result, data: result.data.map(normalizeCompany) };
}

export type ClientCompany = {
  id: number;
  nome: string;
  slug: string;
  icon_url?: string | null;
  address?: string | null;
  appointments_count: number;
  last_appointment_date?: string | null;
};

export async function fetchClientCompanies(): Promise<ClientCompany[]> {
  const token = secureStorage.getItem("cliente-token");
  const response = await apiFetch(
    "/api/clients/companies",
    { headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } },
    "client",
  );
  const result = await handleResponse<{ data: ClientCompany[] }>(response, "Não foi possível carregar suas barbearias.");
  return result.data.map((company) => ({ ...company, icon_url: resolveMediaUrl(company.icon_url) }));
}
