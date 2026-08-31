import { secureStorage } from "@/lib/secureStorage";
import { apiFetch } from "@/services/api";

const authHeaders = () => {
  const token = secureStorage.getItem("barbeiro-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const response = await apiFetch(
    path,
    {
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(options.headers || {}),
        ...authHeaders(),
      },
    },
    "provider",
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Erro na requisição");
  }

  if (response.status === 204) return {} as T;
  return (await response.json()) as T;
}

export type Product = {
  id: number;
  name: string;
  sku?: string | null;
  description?: string | null;
  image_url?: string | null;
  sale_price: number;
  cost_price?: number | null;
  stock_quantity: number;
  minimum_stock: number;
  active: boolean;
  low_stock: boolean;
};

export type StockMovement = {
  id: number;
  product_id: number;
  type: string;
  quantity: number;
  balance_after: number;
  notes?: string | null;
  created_at: string;
};

export type SaleItem = {
  id: number;
  type: "service" | "product";
  service_id?: number | null;
  product_id?: number | null;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
};


export type SalePayment = {
  id: number;
  provider: string;
  sale_id?: number | null;
  status: string;
  amount: number;
  payment_method: string;
  external_reference: string;
  provider_status?: string | null;
  paid_at?: string | null;
  pix?: {
    qr_code?: string | null;
    qr_code_base64?: string | null;
    ticket_url?: string | null;
  };
};

export type Sale = {
  id: number;
  appointment_id?: number | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  status: "open" | "closed" | "cancelled";
  services_total: number;
  products_total: number;
  discount: number;
  addition: number;
  total: number;
  payment_method?: string | null;
  notes?: string | null;
  closed_at?: string | null;
  latest_payment?: SalePayment | null;
  items: SaleItem[];
};

export type ProductPayload = {
  name: string;
  sku?: string;
  description?: string;
  sale_price: number;
  cost_price?: number | null;
  stock_quantity: number;
  minimum_stock: number;
  image?: File | null;
  remove_image?: boolean;
};

export function fetchProducts(): Promise<Product[]> {
  return api<Product[]>("/api/products");
}

const buildProductFormData = (payload: ProductPayload, method?: "PUT") => {
  const formData = new FormData();
  if (method) formData.append("_method", method);
  formData.append("name", payload.name);
  if (payload.sku) formData.append("sku", payload.sku);
  if (payload.description) formData.append("description", payload.description);
  formData.append("sale_price", String(payload.sale_price));
  if (payload.cost_price !== null && payload.cost_price !== undefined) formData.append("cost_price", String(payload.cost_price));
  formData.append("stock_quantity", String(payload.stock_quantity));
  formData.append("minimum_stock", String(payload.minimum_stock));
  if (payload.image) formData.append("image", payload.image);
  if (payload.remove_image) formData.append("remove_image", "1");
  return formData;
};

export function createProduct(payload: ProductPayload): Promise<Product> {
  return api<Product>("/api/products", { method: "POST", body: buildProductFormData(payload) });
}

export function updateProduct(id: number, payload: ProductPayload): Promise<Product> {
  return api<Product>(`/api/products/${id}`, { method: "POST", body: buildProductFormData(payload, "PUT") });
}

export async function deleteProduct(id: number): Promise<void> {
  await api(`/api/products/${id}`, { method: "DELETE" });
}

export function adjustProductStock(id: number, quantity: number, notes?: string): Promise<Product> {
  return api<Product>(`/api/products/${id}/stock`, { method: "POST", body: JSON.stringify({ quantity, notes }) });
}


export function fetchSales(params: { status?: string; from?: string; to?: string } = {}): Promise<Sale[]> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return api<Sale[]>(`/api/sales${suffix}`);
}

export function fetchAppointmentSale(appointmentId: number): Promise<Sale> {
  return api<Sale>(`/api/appointments/${appointmentId}/sale`);
}

export function fetchSale(saleId: number): Promise<Sale> {
  return api<Sale>(`/api/sales/${saleId}`);
}

export function closeAppointmentSale(
  appointmentId: number,
  payload: {
    products: Array<{ product_id: number; quantity: number }>;
    discount?: number;
    addition?: number;
    payment_method?: string;
    notes?: string;
  },
): Promise<Sale> {
  return api<Sale>(`/api/appointments/${appointmentId}/sale/close`, { method: "POST", body: JSON.stringify(payload) });
}


export function closeDirectSale(payload: {
  customer_name?: string;
  customer_phone?: string;
  services: Array<{ service_id: number; quantity: number }>;
  products: Array<{ product_id: number; quantity: number }>;
  discount?: number;
  addition?: number;
  payment_method?: string;
  notes?: string;
}): Promise<Sale> {
  return api<Sale>("/api/sales/direct/close", { method: "POST", body: JSON.stringify(payload) });
}

export type PixPaymentResponse = {
  id: number;
  provider: string;
  sale_id?: number | null;
  status: string;
  amount: number;
  payment_method: string;
  external_reference: string;
  pix: {
    qr_code?: string | null;
    qr_code_base64?: string | null;
    ticket_url?: string | null;
  };
};

export function createAppointmentPixPayment(
  appointmentId: number,
  payload: {
    amount?: number;
    description?: string;
    payer_email?: string;
    products?: Array<{ product_id: number; quantity: number }>;
    discount?: number;
    addition?: number;
  } = {},
): Promise<PixPaymentResponse> {
  return api<PixPaymentResponse>(`/api/appointments/${appointmentId}/payments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createDirectPixPayment(payload: {
  amount: number;
  description?: string;
  payer_email?: string;
  payer_name?: string;
  customer_name?: string;
  customer_phone?: string;
  services?: Array<{ service_id: number; quantity?: number }>;
  products?: Array<{ product_id: number; quantity: number }>;
  discount?: number;
  addition?: number;
}): Promise<PixPaymentResponse> {
  return api<PixPaymentResponse>("/api/sales/direct/payments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
