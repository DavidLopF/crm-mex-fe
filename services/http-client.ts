/**
 * HTTP Client base reutilizable para todos los servicios.
 *
 * - Centraliza base URL, headers, manejo de errores e interceptores.
 * - Intercepta 401 y refresca el token automáticamente (1 vez por request).
 * - Cada módulo de servicio lo importa en lugar de usar fetch directamente.
 *
 * ── Soporte Offline (PWA) ──────────────────────────────────────────────────
 * - GET requests: si hay error de red, intenta servir desde caché IndexedDB.
 * - Mutaciones (POST/PUT/PATCH/DELETE): si !navigator.onLine, encola la
 *   operación en IndexedDB y lanza OfflineQueuedError.
 * - Tras cada GET exitoso, guarda la respuesta en caché automáticamente.
 */

import {
  getOfflineDB,
  buildCacheKey,
  CACHE_TTL,
  notifyQueueChanged,
  type HttpMethod,
  type OfflineOperation,
} from '@/lib/offline/db';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

const ACCESS_TOKEN_KEY = 'crm-auth-access-token';
const REFRESH_TOKEN_KEY = 'crm-auth-refresh-token';

// ── Errores especiales offline ────────────────────────────────────────────────

export class OfflineQueuedError extends Error {
  constructor(
    public readonly clientId: string,
    public readonly module: OfflineOperation['module'] = 'generic',
  ) {
    super('Sin conexión — la operación se enviará automáticamente cuando vuelva el internet.');
    this.name = 'OfflineQueuedError';
  }
}

export class OfflineCacheError extends Error {
  constructor() {
    super('Sin conexión y sin datos en caché para esta sección.');
    this.name = 'OfflineCacheError';
  }
}

// ── Utilidades offline ────────────────────────────────────────────────────────

function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError) {
    const msg = err.message.toLowerCase();
    return msg.includes('fetch') || msg.includes('network') || msg.includes('failed');
  }
  return false;
}

function isOffline(): boolean {
  if (typeof window === 'undefined') return false;
  return !navigator.onLine;
}

function detectModule(path: string): OfflineOperation['module'] {
  if (path.includes('/pos')) return 'pos';
  if (path.includes('/orders') || path.includes('/pedidos')) return 'orders';
  if (path.includes('/inventory') || path.includes('/inventario')) return 'inventory';
  if (path.includes('/clients') || path.includes('/clientes')) return 'clients';
  if (path.includes('/suppliers') || path.includes('/proveedores')) return 'suppliers';
  return 'generic';
}

function detectTtl(path: string): number {
  if (path.includes('/pos/products')) return CACHE_TTL.POS_PRODUCTS;
  if (path.includes('/clients')) return CACHE_TTL.CLIENTS;
  if (path.includes('/inventory')) return CACHE_TTL.INVENTORY;
  if (path.includes('/orders') || path.includes('/pedidos')) return CACHE_TTL.ORDERS;
  return CACHE_TTL.DEFAULT;
}

// ── Cache helpers (IndexedDB) ─────────────────────────────────────────────────

async function saveToCache(
  path: string,
  params: Record<string, unknown> | undefined,
  data: unknown,
  ttl: number = CACHE_TTL.DEFAULT,
): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const db = getOfflineDB();
    const cacheKey = buildCacheKey(path, params);
    await db.cachedRequests.put({ cacheKey, data, cachedAt: Date.now(), ttl });
  } catch {
    /* no interrumpir el flujo si el caché falla */
  }
}

async function getFromCache<T>(
  path: string,
  params?: Record<string, unknown>,
): Promise<T | null> {
  if (typeof window === 'undefined') return null;
  try {
    const db = getOfflineDB();
    const cacheKey = buildCacheKey(path, params);
    const cached = await db.cachedRequests.get(cacheKey);
    if (!cached) return null;
    if (Date.now() - cached.cachedAt > cached.ttl) {
      void db.cachedRequests.delete(cacheKey);
      return null;
    }
    return cached.data as T;
  } catch {
    return null;
  }
}

// ── Cola de operaciones offline ───────────────────────────────────────────────

async function enqueueOfflineOperation(
  method: HttpMethod,
  path: string,
  body?: unknown,
  params?: Record<string, unknown>,
): Promise<string> {
  // uuid simple sin dependencia extra
  const clientId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const op: Omit<OfflineOperation, 'id'> = {
    clientId,
    method,
    path,
    body,
    params,
    module: detectModule(path),
    queuedAt: Date.now(),
    retries: 0,
  };

  try {
    const db = getOfflineDB();
    await db.offlineQueue.add(op as OfflineOperation);
    await notifyQueueChanged();
  } catch {
    /* si IndexedDB falla, al menos lanzamos el error al caller */
  }

  return clientId;
}

// ── Base URL ──────────────────────────────────────────────────────────────────

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

// ── Tipos API ─────────────────────────────────────────────────────────────────

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
    totalPages?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
}

interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ── Token helpers ─────────────────────────────────────────────────────────────

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function saveTokens(accessToken: string, refreshToken: string): void {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch {
    // ignore
  }
}

function clearTokens(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // ignore
  }
}

// ── Refresh token logic ───────────────────────────────────────────────────────

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;

  try {
    const res = await fetch(`${getBaseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });

    if (!res.ok) {
      clearTokens();
      return false;
    }

    const json = await res.json();
    if (!json.success) {
      clearTokens();
      return false;
    }

    saveTokens(json.data.auth.accessToken, json.data.auth.refreshToken);
    window.dispatchEvent(new Event('auth-tokens-updated'));
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

function refreshOnce(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = tryRefreshToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// ── Headers ───────────────────────────────────────────────────────────────────

function buildHeaders(extra?: HeadersInit): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extra as Record<string, string> | undefined),
  };
  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ── Core request ──────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
  params?: Record<string, unknown>,
): Promise<T> {
  const methodRaw = (options.method || 'GET').toUpperCase();
  const isMutation = methodRaw !== 'GET';
  const method = methodRaw as HttpMethod;

  // ── Offline check para mutaciones ANTES de intentar fetch ──
  if (isMutation && isOffline()) {
    const body = options.body ? JSON.parse(options.body as string) : undefined;
    const clientId = await enqueueOfflineOperation(method, path, body, params);
    throw new OfflineQueuedError(clientId, detectModule(path));
  }

  const url = buildUrl(path, params);
  const headers = buildHeaders(options.headers as Record<string, string>);

  try {
    let res = await fetch(url, { ...options, headers });

    // 401 → intentar refresh y reintentar
    if (res.status === 401) {
      const refreshed = await refreshOnce();
      if (refreshed) {
        const retryHeaders = buildHeaders(options.headers as Record<string, string>);
        res = await fetch(url, { ...options, headers: retryHeaders });
      } else {
        clearTokens();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth-session-expired'));
        }
        throw new Error('Sesión expirada. Inicia sesión nuevamente.');
      }
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    const json: ApiResponse<T> = await res.json();

    if (!json.success) {
      throw new Error((json as ApiErrorResponse).message || 'Error desconocido');
    }

    const data = (json as ApiSuccessResponse<T>).data;

    // ── Cachear respuestas GET exitosas para offline posterior ──
    if (!isMutation) {
      void saveToCache(path, params, data, detectTtl(path));
    }

    return data;
  } catch (err) {
    // ── Fallo de red en GET → servir desde caché ──
    if (!isMutation && (isNetworkError(err) || isOffline())) {
      const cached = await getFromCache<T>(path, params);
      if (cached !== null) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('offline-cache-hit', { detail: { path } }));
        }
        return cached;
      }
      throw new OfflineCacheError();
    }

    // ── Fallo de red en mutación → encolar (estaba online pero se cayó mid-request) ──
    if (isMutation && (isNetworkError(err) || isOffline())) {
      const body = options.body ? JSON.parse(options.body as string) : undefined;
      const clientId = await enqueueOfflineOperation(method, path, body, params);
      throw new OfflineQueuedError(clientId, detectModule(path));
    }

    throw err;
  }
}

// ── API pública ───────────────────────────────────────────────────────────────

/** GET request */
export function get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  return request<T>(path, { method: 'GET' }, params);
}

/** GET que retorna el JSON raw completo sin extraer .data */
export async function getRaw<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const url = buildUrl(path, params);
  const headers = buildHeaders();

  try {
    let res = await fetch(url, { method: 'GET', headers });

    if (res.status === 401) {
      const refreshed = await refreshOnce();
      if (refreshed) {
        const retryHeaders = buildHeaders();
        res = await fetch(url, { method: 'GET', headers: retryHeaders });
      } else {
        clearTokens();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth-session-expired'));
        }
        throw new Error('Sesión expirada. Inicia sesión nuevamente.');
      }
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || 'Error desconocido');
    }

    void saveToCache(path, params, json, detectTtl(path));

    return json as unknown as T;
  } catch (err) {
    if (isNetworkError(err) || isOffline()) {
      const cached = await getFromCache<T>(path, params);
      if (cached !== null) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('offline-cache-hit', { detail: { path } }));
        }
        return cached;
      }
      throw new OfflineCacheError();
    }
    throw err;
  }
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
    totalPages?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
}

export async function getPaginated<T>(
  path: string,
  params?: Record<string, unknown>,
): Promise<PaginatedResult<T>> {
  const url = buildUrl(path, params);
  const headers = buildHeaders();

  try {
    let res = await fetch(url, { method: 'GET', headers });

    if (res.status === 401) {
      const refreshed = await refreshOnce();
      if (refreshed) {
        const retryHeaders = buildHeaders();
        res = await fetch(url, { method: 'GET', headers: retryHeaders });
      } else {
        clearTokens();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth-session-expired'));
        }
        throw new Error('Sesión expirada. Inicia sesión nuevamente.');
      }
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    const json: ApiPaginatedSuccessResponse<T> | ApiErrorResponse = await res.json();

    if (!json.success) {
      throw new Error((json as ApiErrorResponse).message || 'Error desconocido');
    }

    const success = json as ApiPaginatedSuccessResponse<T>;
    const result: PaginatedResult<T> = {
      data: success.data,
      pagination: success.pagination,
    };

    void saveToCache(path, params, result, detectTtl(path));

    return result;
  } catch (err) {
    if (isNetworkError(err) || isOffline()) {
      const cached = await getFromCache<PaginatedResult<T>>(path, params);
      if (cached !== null) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('offline-cache-hit', { detail: { path } }));
        }
        return cached;
      }
      throw new OfflineCacheError();
    }
    throw err;
  }
}
