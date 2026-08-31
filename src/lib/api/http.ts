import { getToken } from "./auth-storage";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]> | string[];

  constructor(status: number, message: string, errors: Record<string, string[]> | string[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }

  fieldErrors(): Record<string, string[]> {
    return Array.isArray(this.errors) ? {} : this.errors;
  }
}

interface Envelope<T> {
  success: boolean;
  data: T;
  message: string | null;
  errors: Record<string, string[]> | string[];
}

/**
 * Serializes filter objects into a query string using PHP's bracket
 * convention for arrays (status[]=a&status[]=b) — Symfony's InputBag only
 * groups repeated keys into an array when they carry the [] suffix.
 */
export function buildQuery<T extends object>(params: T = {} as T): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value === undefined || value === null || value === "") continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null || item === "") continue;
        search.append(`${key}[]`, String(item));
      }
    } else {
      search.append(key, String(value));
    }
  }

  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  let envelope: Envelope<T> | null = null;
  try {
    envelope = await response.json();
  } catch {
    // Empty/non-JSON body (e.g. some 204s) — fall through to status-based handling below.
  }

  if (!response.ok || !envelope || !envelope.success) {
    throw new ApiError(
      response.status,
      envelope?.message ?? "Une erreur est survenue. Veuillez réessayer.",
      envelope?.errors ?? [],
    );
  }

  return envelope.data;
}

export const http = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
