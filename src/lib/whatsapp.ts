const DEFAULT_COUNTRY_CODE = "55";

export function normalizeWhatsAppPhone(phone?: string | null): string | null {
  if (!phone) return null;

  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.length >= 12) return digits;
  if (digits.length >= 10) return `${DEFAULT_COUNTRY_CODE}${digits}`;

  return null;
}

export function buildWhatsAppUrl(phone?: string | null, message?: string): string | null {
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  if (!normalizedPhone) return null;

  const params = new URLSearchParams();
  if (message?.trim()) {
    params.set("text", message.trim());
  }

  const query = params.toString();
  return `https://wa.me/${normalizedPhone}${query ? `?${query}` : ""}`;
}

export function openWhatsAppChat(phone?: string | null, message?: string): boolean {
  if (typeof window === "undefined") return false;

  const url = buildWhatsAppUrl(phone, message);
  if (!url) return false;

  const opened = window.open(url, "_blank", "noopener,noreferrer");
  return Boolean(opened);
}
