import { apiFetch, handleResponse } from "@/services/api";

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  const response = await apiFetch("/api/password/forgot", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  return handleResponse<{ message: string }>(response, "Não foi possível enviar o link de redefinição.");
}

export async function resetPassword(payload: {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}): Promise<{ message: string }> {
  const response = await apiFetch("/api/password/reset", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<{ message: string }>(response, "Não foi possível redefinir a senha.");
}
