/**
 * useConnectivity — Hook para estado de conexión a internet
 *
 * Expone:
 *  - isOnline         : boolean en tiempo real
 *  - pendingCount     : número de operaciones encoladas offline
 *  - isSyncing        : true mientras se procesa la cola
 *  - syncNow()        : forzar sincronización manual
 *  - clearOfflineQueue(): vaciar la cola (acción destructiva)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPendingCount, processQueue, clearQueue } from '@/lib/offline/sync-manager';

export interface ConnectivityState {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  syncNow: () => void;
  clearOfflineQueue: () => Promise<void>;
}

export function useConnectivity(): ConnectivityState {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // ── Sincronizar conteo de cola ────────────────────────────────────────────
  const refreshCount = useCallback(async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  }, []);

  // ── Sincronización manual ─────────────────────────────────────────────────
  const syncNow = useCallback(() => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    processQueue().finally(() => {
      setIsSyncing(false);
      void refreshCount();
    });
  }, [isOnline, isSyncing, refreshCount]);

  // ── Limpiar cola ──────────────────────────────────────────────────────────
  const clearOfflineQueue = useCallback(async () => {
    await clearQueue();
    setPendingCount(0);
  }, []);

  // ── Listeners de eventos ──────────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleQueueChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ count: number }>).detail;
      setPendingCount(detail.count);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline-queue-changed', handleQueueChanged);

    // Carga inicial del conteo
    void refreshCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-queue-changed', handleQueueChanged);
    };
  }, [refreshCount]);

  return { isOnline, pendingCount, isSyncing, syncNow, clearOfflineQueue };
}
