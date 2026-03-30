import { ReactNode } from 'react';

/**
 * Layout para el área de Super Admin.
 * El AppShell del root layout ya gestiona sidebar + header;
 * aquí solo pasamos los children sin añadir capas adicionales.
 */
export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
