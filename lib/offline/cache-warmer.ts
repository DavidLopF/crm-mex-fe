/**
 * Cache Warmer — Pre-cacheado proactivo de datos críticos
 *
 * Estrategia:
 *  - Se ejecuta al montar la app (si hay internet) y al recuperar conexión
 *  - Llama los endpoints más críticos para el trabajo en campo en silencio
 *  - El http-client los cachea automáticamente en IndexedDB tras cada GET exitoso
 *  - Si alguno falla (timeout, error de red), lo ignora silenciosamente
 *
 * Endpoints precacheados:
 *  - /api/pos/products           (30 min TTL) — crítico para vender offline
 *  - /api/clients?limit=200      (10 min TTL) — para selector de clientes
 *
 * No se pre-cachea inventario paginado ni pedidos porque son demasiados
 * registros y el usuario los puede ver al navegar (se cachean on-demand).
 */

import { get } from '@/services/http-client';

/** Tiempo máximo para cada precarga en ms */
const WARM_TIMEOUT_MS = 8_000;

interface WarmResult {
  endpoint: string;
  ok: boolean;
  error?: string;
}

/**
 * Ejecuta un GET con timeout. Resuelve siempre (nunca lanza).
 */
async function warmEndpoint(path: string, params?: Record<string, unknown>): Promise<WarmResult> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), WARM_TIMEOUT_MS),
  );

  try {
    await Promise.race([get(path, params), timeout]);
    return { endpoint: path, ok: true };
  } catch (err) {
    return {
      endpoint: path,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

let warming = false;

/**
 * Función principal. Llama una vez al arrancar y otra al recuperar internet.
 * Guard interno evita ejecuciones paralelas.
 */
export async function warmCriticalCaches(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!navigator.onLine) return;
  if (warming) return;

  warming = true;

  try {
    // Precargamos en paralelo para no bloquear
    const results = await Promise.allSettled([
      warmEndpoint('/api/pos/products'),
      warmEndpoint('/api/clients', { limit: 200, page: 1 }),
    ]);

    if (process.env.NODE_ENV === 'development') {
      results.forEach((r) => {
        if (r.status === 'fulfilled') {
          const { endpoint, ok, error } = r.value;
          console.debug(`[CacheWarmer] ${ok ? '✅' : '❌'} ${endpoint}${error ? ` — ${error}` : ''}`);
        }
      });
    }
  } finally {
    warming = false;
  }
}
