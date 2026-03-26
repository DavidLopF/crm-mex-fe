/**
 * Offline Database — Dexie (IndexedDB wrapper)
 *
 * Dos tablas:
 *  - offlineQueue : mutaciones pendientes de sincronizar (POST/PUT/PATCH/DELETE)
 *  - cachedRequests : respuestas GET cacheadas para servir sin internet
 *
 * Arquitectura:
 *  - Solo se instancia en el browser (guard de SSR incluido)
 *  - Versión única: si el schema cambia, incrementar el número de versión
 */

import Dexie, { type Table } from 'dexie';

// ── Tipos ────────────────────────────────────────────────────────────────────

/** Solo métodos que generan mutaciones (nunca GET) */
export type HttpMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface OfflineOperation {
  /** Auto-increment PK de IndexedDB */
  id?: number;
  /** UUID generado en cliente para idempotencia */
  clientId: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  params?: Record<string, unknown>;
  /** Módulo lógico — para agrupar operaciones en la UI */
  module: 'pos' | 'orders' | 'inventory' | 'clients' | 'suppliers' | 'generic';
  /** Timestamp de cuando se encoló */
  queuedAt: number;
  /** Número de intentos de sync (para exponential backoff) */
  retries: number;
  /** Error del último intento, para debugging */
  lastError?: string;
}

export interface CachedRequest {
  /** Clave compuesta: `${method}:${path}:${paramsHash}` */
  cacheKey: string;
  data: unknown;
  cachedAt: number;
  /** TTL en milisegundos. Default: 5 minutos */
  ttl: number;
}

// ── Database ─────────────────────────────────────────────────────────────────

class CrmOfflineDB extends Dexie {
  offlineQueue!: Table<OfflineOperation, number>;
  cachedRequests!: Table<CachedRequest, string>;

  constructor() {
    super('crm-offline-db');

    this.version(1).stores({
      offlineQueue: '++id, clientId, module, queuedAt',
      cachedRequests: 'cacheKey, cachedAt',
    });
  }
}

// ── Singleton (browser-only) ─────────────────────────────────────────────────

let _db: CrmOfflineDB | null = null;

export function getOfflineDB(): CrmOfflineDB {
  if (typeof window === 'undefined') {
    throw new Error('getOfflineDB() solo puede llamarse en el browser.');
  }
  if (!_db) {
    _db = new CrmOfflineDB();
  }
  return _db;
}

// ── Helpers de cache key ─────────────────────────────────────────────────────

export function buildCacheKey(path: string, params?: Record<string, unknown>): string {
  if (!params || Object.keys(params).length === 0) return `GET:${path}`;
  // Orden determinístico de params para la clave
  const sorted = Object.keys(params)
    .sort()
    .filter((k) => params[k] !== undefined && params[k] !== null)
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return `GET:${path}:${sorted}`;
}

// ── TTL por módulo (milisegundos) ────────────────────────────────────────────

export const CACHE_TTL = {
  /** Productos del POS — críticos para vender offline */
  POS_PRODUCTS: 30 * 60 * 1000,   // 30 min
  /** Lista de clientes */
  CLIENTS: 10 * 60 * 1000,         // 10 min
  /** Inventario general */
  INVENTORY: 5 * 60 * 1000,        // 5 min
  /** Pedidos */
  ORDERS: 5 * 60 * 1000,           // 5 min
  /** Default */
  DEFAULT: 5 * 60 * 1000,          // 5 min
} as const;
