'use client';

/**
 * OfflineBanner — Banner inline para páginas que muestran datos del caché
 *
 * Dos variantes:
 *  - `fromCache`: aviso amarillo "Datos del caché — puede no estar actualizado"
 *  - `noCache`:   aviso rojo "Sin conexión — no hay datos disponibles"
 */

import { DatabaseZap, WifiOff } from 'lucide-react';

interface OfflineBannerProps {
  variant: 'fromCache' | 'noCache';
  onRetry?: () => void;
  className?: string;
}

export function OfflineBanner({ variant, onRetry, className = '' }: OfflineBannerProps) {
  if (variant === 'fromCache') {
    return (
      <div
        role="status"
        className={`flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm ${className}`}
      >
        <DatabaseZap className="w-4 h-4 flex-shrink-0" />
        <span className="font-medium">Datos del caché local</span>
        <span className="text-amber-600">— sin conexión, puede no estar actualizado</span>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={`flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm ${className}`}
    >
      <WifiOff className="w-4 h-4 flex-shrink-0" />
      <div className="flex-1">
        <span className="font-medium">Sin conexión — </span>
        <span className="text-red-600">no hay datos en caché para esta sección</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-semibold text-red-700 underline whitespace-nowrap"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
