'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ShieldX } from 'lucide-react';

interface PermissionGuardProps {
  moduleCode: string;
  children: React.ReactNode;
}

/**
 * Componente que bloquea el acceso a una página si el usuario
 * no tiene canView para el módulo indicado.
 *
 * Muestra una pantalla de "Sin acceso" en lugar de redirigir,
 * para que el usuario entienda por qué no puede ver la página.
 */
export function PermissionGuard({ moduleCode, children }: PermissionGuardProps) {
  const { can, isAuthenticated, permissions } = useAuth();
  const router = useRouter();

  // Si no hay permisos cargados aún (o no está autenticado), no bloquear
  // El AuthProvider ya redirige a /login si no está autenticado
  if (!isAuthenticated || permissions.length === 0) {
    return <>{children}</>;
  }

  const hasAccess = can(moduleCode, 'canView');

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <ShieldX className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Sin acceso
      </h2>
      <p className="text-gray-500 mb-6 max-w-md">
        No tienes permisos para acceder a este módulo. Contacta a un administrador si crees que esto es un error.
      </p>
      <button
        onClick={() => router.push('/')}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Volver al inicio
      </button>
    </div>
  );
}
