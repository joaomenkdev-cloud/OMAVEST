import { API_BASE } from "./config.js";
import { getIdToken } from "./firebase-auth.js";

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
  const token = await getIdToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  let data = null;
  try { data = await response.json(); } catch { data = { success: false, message: "Resposta inválida da API." }; }
  if (!response.ok) throw new Error(data?.message || `Erro ${response.status}`);
  return data;
}

export async function apiOr(path, fallback) {
  try { return await api(path); }
  catch (error) { console.warn(`Fallback para ${path}:`, error.message); return typeof fallback === "function" ? fallback() : fallback; }
}

export function post(path, body) { return api(path, { method: "POST", body: JSON.stringify(body) }); }
export function put(path, body) { return api(path, { method: "PUT", body: JSON.stringify(body) }); }
export function patch(path, body = {}) { return api(path, { method: "PATCH", body: JSON.stringify(body) }); }
