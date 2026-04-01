'use client';

/**
 * OfflineProvider — Inicializa el SyncManager y el CacheWarmer al montar la app
 *
 * Responsabilidades:
 *  - Llama initSyncManager() una sola vez al cargar el cliente
 *  - Ejecuta warmCriticalCaches() al arrancar (si hay internet) y al recuperar conexión
 *    SOLO cuando el usuario está autenticado y no está en una página pública.
 *    Esto evita que peticiones a endpoints protegidos disparen 'auth-session-expired'
 *    desde páginas como /forgot-password o /login.
 *  - Limpia los listeners al desmontar
 *  - Muestra toasts de feedback cuando la cola offline se sincroniza
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initSyncManager, destroySyncManager } from './sync-manager';
import { warmCriticalCaches } from './cache-warmer';
import { useGlobalToast } from '@/lib/toast-context';
import { useAuth } from '@/lib/auth-context';
import type { SyncSuccessDetail, SyncErrorDetail } from './sync-manager';

const OFFLINE_PUBLIC_PAGES = ['/login', '/forgot-password', '/reset-password'];

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
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const isPublicPage = OFFLINE_PUBLIC_PAGES.includes(pathname);

  // ── Inicializar SyncManager una sola vez ──────────────────────────────────
  useEffect(() => {
    initSyncManager();
    return () => { destroySyncManager(); };
  }, []);

  // ── Pre-caché proactivo: SOLO cuando autenticado y en página privada ───────
  // Evita llamar a endpoints protegidos desde /login, /forgot-password, etc.,
  // lo que dispararía 'auth-session-expired' incluso sin token.
  useEffect(() => {
    if (!isAuthenticated || isPublicPage) return;

    void warmCriticalCaches();

    const handleOnline = () => { void warmCriticalCaches(); };
    window.addEventListener('online', handleOnline);
    return () => { window.removeEventListener('online', handleOnline); };
  }, [isAuthenticated, isPublicPage]);

  // ── Toasts de feedback de sincronización ─────────────────────────────────
  useEffect(() => {
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

    window.addEventListener('offline-sync-success', handleSuccess);
    window.addEventListener('offline-sync-error', handleError);

    return () => {
      window.removeEventListener('offline-sync-success', handleSuccess);
      window.removeEventListener('offline-sync-error', handleError);
    };
  }, [toast]);

  return <>{children}</>;
}
