/**
 * HTTP Client base reutilizable para todos los servicios.
 *
 * - Centraliza base URL, headers, manejo de errores e interceptores.
 * - Cada módulo de servicio lo importa en lugar de usar fetch directamente.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

function getBaseUrl(): string {
  if (API_BASE_URL) return API_BASE_URL;
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const url = new URL(path, getBaseUrl());
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      url.searchParams.append(key, String(value));
    });
  }
  return url.toString();
}

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

interface ApiPaginatedSuccessResponse<T> {
  success: true;
  data: T;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

async function request<T>(
  path: string,
  options: RequestInit = {},
  params?: Record<string, unknown>,
): Promise<T> {
  const url = buildUrl(path, params);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Aquí se pueden agregar interceptores (auth token, etc.)
  // const token = getAuthToken();
  // if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    throw new Error((json as ApiErrorResponse).message || 'Error desconocido');
  }

  return (json as ApiSuccessResponse<T>).data;
}

/** GET request */
export function get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  return request<T>(path, { method: 'GET' }, params);
}

/** POST request */
export function post<T>(path: string, body?: unknown, params?: Record<string, unknown>): Promise<T> {
  return request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }, params);
}

/** PUT request */
export function put<T>(path: string, body?: unknown, params?: Record<string, unknown>): Promise<T> {
  return request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }, params);
}

/** PATCH request */
export function patch<T>(path: string, body?: unknown, params?: Record<string, unknown>): Promise<T> {
  return request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }, params);
}

/** DELETE request */
export function del<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  return request<T>(path, { method: 'DELETE' }, params);
}

/** Resultado paginado genérico */
export interface PaginatedResult<T> {
  data: T;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * GET request que preserva la metadata de paginación.
 * Útil para endpoints que devuelven { success, data, pagination }.
 */
export async function getPaginated<T>(
  path: string,
  params?: Record<string, unknown>,
): Promise<PaginatedResult<T>> {
  const url = buildUrl(path, params);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const res = await fetch(url, { method: 'GET', headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  const json: ApiPaginatedSuccessResponse<T> | ApiErrorResponse = await res.json();

  if (!json.success) {
    throw new Error((json as ApiErrorResponse).message || 'Error desconocido');
  }

  const success = json as ApiPaginatedSuccessResponse<T>;
  return {
    data: success.data,
    pagination: success.pagination,
  };
}
