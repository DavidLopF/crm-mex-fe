'use client';

import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPendingCount } from '@/lib/offline/sync-manager';

export function SyncStatus() {
  const [count, setCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [status, setStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Inicializar estado
    setIsOnline(navigator.onLine);
    getPendingCount().then(setCount);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    const handleQueueChanged = (e: any) => {
      setCount(e.detail.count);
      if (e.detail.count > 0 && isOnline) {
        setStatus('syncing');
      } else if (e.detail.count === 0) {
        // Solo pasar a idle si no estamos en medio de un éxito/error visual
        setTimeout(() => setStatus('idle'), 3000);
      }
    };

    const handleSyncSuccess = () => {
      setStatus('success');
      setLastMessage('Sincronización exitosa');
      setTimeout(() => {
        setStatus('idle');
        setLastMessage(null);
      }, 3000);
    };

    const handleSyncError = (e: any) => {
      setStatus('error');
      setLastMessage(e.detail.error);
      // No quitar el error automáticamente si es permanente
      if (!e.detail.permanent) {
        setTimeout(() => setStatus('idle'), 5000);
      }
    };

    const handleSyncComplete = () => {
      if (status !== 'error') {
        setStatus('success');
        setTimeout(() => setStatus('idle'), 3000);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline-queue-changed', handleQueueChanged);
    window.addEventListener('offline-sync-success', handleSyncSuccess);
    window.addEventListener('offline-sync-error', handleSyncError);
    window.addEventListener('offline-sync-complete', handleSyncComplete);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-queue-changed', handleQueueChanged);
      window.removeEventListener('offline-sync-success', handleSyncSuccess);
      window.removeEventListener('offline-sync-error', handleSyncError);
      window.removeEventListener('offline-sync-complete', handleSyncComplete);
    };
  }, [isOnline, status]);

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 animate-in fade-in slide-in-from-bottom-2">
        <CloudOff className="w-4 h-4" />
        <span className="text-xs font-medium">Modo Offline</span>
        {count > 0 && (
          <span className="bg-amber-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
            {count} pendientes
          </span>
        )}
      </div>
    );
  }

  if (count === 0 && status === 'idle') return null;

  return (
    <div 
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 animate-in fade-in slide-in-from-bottom-2",
        status === 'syncing' && "bg-blue-50 text-blue-700 border-blue-200",
        status === 'success' && "bg-emerald-50 text-emerald-700 border-emerald-200",
        status === 'error' && "bg-red-50 text-red-700 border-red-200"
      )}
      title={lastMessage || undefined}
    >
      {status === 'syncing' && <RefreshCw className="w-4 h-4 animate-spin" />}
      {status === 'success' && <CheckCircle2 className="w-4 h-4" />}
      {status === 'error' && <AlertCircle className="w-4 h-4" />}
      
      <span className="text-xs font-medium">
        {status === 'syncing' && `Sincronizando (${count})...`}
        {status === 'success' && 'Actualizado'}
        {status === 'error' && 'Error de sincronización'}
      </span>

      {status === 'error' && (
        <button 
          onClick={() => window.location.reload()} 
          className="ml-1 hover:underline text-[10px] font-bold"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
