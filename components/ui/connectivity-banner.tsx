'use client';

/**
 * ConnectivityBanner — Indicador persistente de estado de conexión
 *
 * Comportamiento:
 *  - Offline: banner rojo fijo en la parte superior
 *  - Online con cola pendiente: banner amarillo con botón "Sincronizar ahora"
 *  - Sincronizando: spinner + mensaje
 *  - Online y sin cola: no se renderiza (invisible)
 *
 * Se monta una sola vez en el layout raíz.
 */

import { WifiOff, RefreshCw, CloudUpload, CheckCircle2 } from 'lucide-react';
import { useConnectivity } from '@/lib/hooks/use-connectivity';
import { useEffect, useState } from 'react';

export function ConnectivityBanner() {
  const { isOnline, pendingCount, isSyncing, syncNow } = useConnectivity();

  // Mostrar "sincronizado" brevemente al terminar
  const [justSynced, setJustSynced] = useState(false);

  useEffect(() => {
    const handleComplete = () => {
      if (pendingCount === 0 && isOnline) {
        setJustSynced(true);
        const t = setTimeout(() => setJustSynced(false), 3000);
        return () => clearTimeout(t);
      }
    };
    window.addEventListener('offline-sync-complete', handleComplete);
    return () => window.removeEventListener('offline-sync-complete', handleComplete);
  }, [pendingCount, isOnline]);

  // ── Sin conexión ──────────────────────────────────────────────────────────
  if (!isOnline) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 bg-red-600 text-white text-sm font-medium py-2 px-4 shadow-md"
      >
        <WifiOff className="w-4 h-4 flex-shrink-0" />
        <span>
          Sin conexión — trabajando en modo offline
          {pendingCount > 0 && (
            <span className="ml-2 bg-white/20 rounded-full px-2 py-0.5 text-xs">
              {pendingCount} {pendingCount === 1 ? 'operación pendiente' : 'operaciones pendientes'}
            </span>
          )}
        </span>
      </div>
    );
  }

  // ── Online pero con cola pendiente ────────────────────────────────────────
  if (isOnline && pendingCount > 0) {
    return (
      <div
        role="status"
        className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-3 bg-amber-500 text-white text-sm font-medium py-2 px-4 shadow-md"
      >
        <CloudUpload className="w-4 h-4 flex-shrink-0" />
        <span>
          {pendingCount} {pendingCount === 1 ? 'operación pendiente' : 'operaciones pendientes'} de sincronizar
        </span>
        <button
          onClick={syncNow}
          disabled={isSyncing}
          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 disabled:opacity-60 rounded-full px-3 py-1 text-xs font-semibold transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}
        </button>
      </div>
    );
  }

  // ── Feedback de sincronización completada ─────────────────────────────────
  if (justSynced) {
    return (
      <div
        role="status"
        className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 bg-green-600 text-white text-sm font-medium py-2 px-4 shadow-md transition-all"
      >
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
        <span>Todo sincronizado correctamente</span>
      </div>
    );
  }

  return null;
}
