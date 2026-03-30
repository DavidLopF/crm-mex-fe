'use client';

import { WifiOff, RefreshCw, CloudUpload, CheckCircle2 } from 'lucide-react';
import { useConnectivity } from '@/lib/hooks/use-connectivity';
import { useEffect, useState } from 'react';

export function ConnectivityBanner() {
  const { isOnline, pendingCount, isSyncing, syncNow } = useConnectivity();
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

  // ── Sin conexión ──
  if (!isOnline) {
    return (
      <div
        role="alert"
        aria-live="polite"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 bg-zinc-800/90 backdrop-blur-sm text-white text-xs font-medium px-3.5 py-2 rounded-full shadow-lg"
      >
        <WifiOff className="w-3.5 h-3.5 flex-shrink-0 text-zinc-400" />
        <span>Sin conexión</span>
        {pendingCount > 0 && (
          <span className="bg-white/15 rounded-full px-2 py-0.5 text-[11px]">
            {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    );
  }

  // ── Online con cola pendiente ──
  if (isOnline && pendingCount > 0) {
    return (
      <div
        role="status"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 bg-amber-500/90 backdrop-blur-sm text-white text-xs font-medium px-3.5 py-2 rounded-full shadow-lg"
      >
        <CloudUpload className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}</span>
        <button
          onClick={syncNow}
          disabled={isSyncing}
          className="flex items-center gap-1 bg-white/20 hover:bg-white/30 disabled:opacity-60 rounded-full px-2.5 py-0.5 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Sync...' : 'Sincronizar'}
        </button>
      </div>
    );
  }

  // ── Sincronización completada ──
  if (justSynced) {
    return (
      <div
        role="status"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 bg-green-600/90 backdrop-blur-sm text-white text-xs font-medium px-3.5 py-2 rounded-full shadow-lg"
      >
        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Sincronizado</span>
      </div>
    );
  }

  return null;
}
