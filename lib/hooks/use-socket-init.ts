'use client';

import { useEffect } from 'react';
import { connectSocket, disconnectSocket } from '@/lib/socket-client';

/**
 * Hook que inicializa la conexión Socket.IO cuando el usuario
 * está autenticado. Desconecta al desmontar.
 *
 * Debe usarse UNA vez en el layout principal (AppShell).
 *
 * ```tsx
 * // En AppShell (solo cuando isAuthenticated === true)
 * useSocketInit();
 * ```
 */
export function useSocketInit(): void {
  useEffect(() => {
    connectSocket();

    return () => {
      disconnectSocket();
    };
  }, []);
}
