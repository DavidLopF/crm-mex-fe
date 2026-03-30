/**
 * useOfflineFetch — Hook genérico para fetching con soporte offline
 *
 * Envuelve cualquier función async de fetching y añade:
 *  - Estado `fromCache`: true cuando los datos vienen del IndexedDB local
 *  - Estado `offlineNoCache`: true cuando no hay red NI caché
 *  - Re-fetch automático cuando el browser vuelve a estar online
 *
 * Uso:
 * ```ts
 * const { data, loading, error, fromCache, offlineNoCache, reload } =
 *   useOfflineFetch(() => getOrders({ page: 1 }));
 * ```
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { OfflineCacheError } from '@/services/http-client';

interface OfflineFetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Los datos vienen del caché local (sin internet en ese momento) */
  fromCache: boolean;
  /** Sin internet y sin caché — no hay nada que mostrar */
  offlineNoCache: boolean;
  reload: () => void;
}

export function useOfflineFetch<T>(
  fetchFn: () => Promise<T>,
  /** Deps de la función (equivalente al array de deps de useEffect) */
  deps: unknown[] = [],
): OfflineFetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [offlineNoCache, setOfflineNoCache] = useState(false);

  // Ref para evitar actualizaciones en componentes desmontados
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const execute = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    setError(null);
    setFromCache(false);
    setOfflineNoCache(false);

    // Escuchar si el http-client sirvió desde caché
    let cacheHit = false;
    const onCacheHit = () => { cacheHit = true; };
    window.addEventListener('offline-cache-hit', onCacheHit, { once: true });

    try {
      const result = await fetchFn();
      if (!mountedRef.current) return;
      window.removeEventListener('offline-cache-hit', onCacheHit);
      setData(result);
      setFromCache(cacheHit);
    } catch (err) {
      if (!mountedRef.current) return;
      window.removeEventListener('offline-cache-hit', onCacheHit);
      if (err instanceof OfflineCacheError) {
        setOfflineNoCache(true);
        setFromCache(false);
      } else {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Fetch inicial y re-fetch al volver online
  useEffect(() => {
    void execute();

    const handleOnline = () => void execute();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [execute]);

  return {
    data,
    loading,
    error,
    fromCache,
    offlineNoCache,
    reload: execute,
  };
}
