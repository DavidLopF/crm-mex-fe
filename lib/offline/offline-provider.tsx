'use client';

/**
 * OfflineProvider — Inicializa el SyncManager y el CacheWarmer al montar la app
 *
 * Responsabilidades:
 *  - Llama initSyncManager() una sola vez al cargar el cliente
 *  - Ejecuta warmCriticalCaches() al arrancar (si hay internet) y al recuperar conexión
 *  - Limpia los listeners al desmontar
 *  - Muestra toasts de feedback cuando la cola offline se sincroniza
 */

import { useEffect } from 'react';
import { initSyncManager, destroySyncManager } from './sync-manager';
import { warmCriticalCaches } from './cache-warmer';
import { useGlobalToast } from '@/lib/toast-context';
import type { SyncSuccessDetail, SyncErrorDetail } from './sync-manager';

const MODULE_LABELS: Record<string, string> = {
  pos: 'POS',
  orders: 'Pedidos',
  inventory: 'Inventario',
  clients: 'Clientes',
  suppliers: 'Proveedores',
  generic: 'Operación',
};

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const toast = useGlobalToast();

  useEffect(() => {
    // ── 1. Inicializar SyncManager ──
    initSyncManager();

    // ── 2. Pre-caché proactivo al arrancar ──
    void warmCriticalCaches();

    // ── 3. Pre-caché al recuperar internet ──
    const handleOnline = () => {
      void warmCriticalCaches();
    };

    // ── 4. Toasts de feedback de sincronización ──
    const handleSuccess = (e: Event) => {
      const { operation } = (e as CustomEvent<SyncSuccessDetail>).detail;
      const label = MODULE_LABELS[operation.module] ?? 'Operación';
      toast.success(`${label} sincronizada correctamente con el servidor.`, {
        title: '✅ Sincronización completa',
        duration: 5000,
      });
    };

    const handleError = (e: Event) => {
      const { operation, error, permanent } = (e as CustomEvent<SyncErrorDetail>).detail;
      const label = MODULE_LABELS[operation.module] ?? 'Operación';
      if (permanent) {
        // Si el error indica que el estado ya estaba aplicado, no es un error real
        const alreadyApplied = error.includes('ya está') || error.includes('mismo estado') || error.toLowerCase().includes('pagada a pagada') || error.toLowerCase().includes('cannot transition');
        if (alreadyApplied) {
          toast.success('El estado ya estaba actualizado en el servidor.', {
            title: '✅ Sincronización completada',
            duration: 5000,
          });
          return;
        }
        toast.error(
          `No se pudo sincronizar (${label}): ${error}`,
          { title: '❌ Error de sincronización', duration: 10000 },
        );
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline-sync-success', handleSuccess);
    window.addEventListener('offline-sync-error', handleError);

    return () => {
      destroySyncManager();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline-sync-success', handleSuccess);
      window.removeEventListener('offline-sync-error', handleError);
    };
  }, [toast]);

  return <>{children}</>;
}
