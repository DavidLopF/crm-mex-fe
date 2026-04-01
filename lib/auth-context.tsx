'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { LoginResponse, ModulePermission } from '@/services/auth';
import { logout as logoutService } from '@/services/auth';

// ─── Keys de localStorage ─────────────────────────────────────────────────────
const ACCESS_TOKEN_KEY  = 'crm-auth-access-token';
const REFRESH_TOKEN_KEY = 'crm-auth-refresh-token';
const FULLNAME_KEY      = 'crm-auth-fullname';
const ROLENAME_KEY      = 'crm-auth-rolename';
const PERMISSIONS_KEY   = 'crm-auth-permissions';
const COMPANY_ID_KEY    = 'crm-auth-company-id';
const IS_SUPER_ADMIN_KEY = 'crm-auth-is-super-admin';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extrae el `sub` (userId) del payload del JWT sin verificar firma. */
function parseUserIdFromToken(token: string | null): number | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload?.sub ? Number(payload.sub) : null;
  } catch {
    return null;
  }
}

function loadString(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(key); } catch { return null; }
}

function loadPermissions(): ModulePermission[] {
  const raw = loadString(PERMISSIONS_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as ModulePermission[]; } catch { return []; }
}

function loadCompanyId(): number | null {
  const raw = loadString(COMPANY_ID_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return isNaN(n) ? null : n;
}

function loadIsSuperAdmin(): boolean {
  return loadString(IS_SUPER_ADMIN_KEY) === 'true';
}

// ─── Rutas ────────────────────────────────────────────────────────────────────

const PUBLIC_PAGES      = ['/login', '/forgot-password', '/reset-password'];
const SUPER_ADMIN_ROOT  = '/super-admin';

// ─── Token expiry check ────────────────────────────────────────────────────────

/**
 * Verifica si un JWT está expirado sin verificar la firma.
 * Agrega un buffer de 10s para evitar race conditions en el borde de expiración.
 */
function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false;
    return payload.exp * 1000 < Date.now() + 10_000;
  } catch {
    return true;
  }
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

interface AuthContextValue {
  accessToken: string | null;
  /** ID numérico del usuario autenticado (extraído del JWT). */
  userId: number | null;
  fullName: string | null;
  roleName: string | null;
  permissions: ModulePermission[];
  /** ID de la empresa del usuario. null = Super Admin sin empresa asignada. */
  companyId: number | null;
  /** true si el usuario tiene el rol SUPER_ADMIN. */
  isSuperAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Guarda tokens + fullName + permisos tras login exitoso. */
  setSession: (data: LoginResponse) => void;
  /** Cierra sesión: revoca refresh token en el servidor y limpia localStorage. */
  logout: () => void;
  /** Verifica si el usuario tiene un permiso específico para un módulo. */
  can: (moduleCode: string, action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete') => boolean;
}

const AuthContext = createContext<AuthContextValue>({
  accessToken: null,
  userId: null,
  fullName: null,
  roleName: null,
  permissions: [],
  companyId: null,
  isSuperAdmin: false,
  isAuthenticated: false,
  isLoading: true,
  setSession: () => {},
  logout: () => {},
  can: () => false,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [accessToken,   setAccessToken]   = useState<string | null>(() => loadString(ACCESS_TOKEN_KEY));
  const [fullName,      setFullName]      = useState<string | null>(() => loadString(FULLNAME_KEY));
  const [roleName,      setRoleName]      = useState<string | null>(() => loadString(ROLENAME_KEY));
  const [permissions,   setPermissions]   = useState<ModulePermission[]>(() => loadPermissions());
  const [companyId,     setCompanyId]     = useState<number | null>(() => loadCompanyId());
  const [isSuperAdmin,  setIsSuperAdmin]  = useState<boolean>(() => loadIsSuperAdmin());
  const [isLoading,     setIsLoading]     = useState(true);

  // Habilita el estado del cliente (evita spinner infinito en SSR)
  useEffect(() => { setIsLoading(false); }, []);

  // ── Escuchar eventos del http-client (refresh automático) ─────────────────
  useEffect(() => {
    const handleTokensUpdated = () => setAccessToken(loadString(ACCESS_TOKEN_KEY));

    const handleSessionExpired = () => {
      setAccessToken(null);
      setFullName(null);
      setRoleName(null);
      setPermissions([]);
      setCompanyId(null);
      setIsSuperAdmin(false);
      router.replace('/login');
    };

    window.addEventListener('auth-tokens-updated', handleTokensUpdated);
    window.addEventListener('auth-session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth-tokens-updated', handleTokensUpdated);
      window.removeEventListener('auth-session-expired', handleSessionExpired);
    };
  }, [router]);

  // ── Lógica de redirección ─────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;

    const isPublicPage      = PUBLIC_PAGES.includes(pathname);
    const isSuperAdminRoute = pathname.startsWith(SUPER_ADMIN_ROOT);

    if (!accessToken) {
      // No autenticado → a /login (excepto si ya estás en página pública)
      if (!isPublicPage) router.replace('/login');
      return;
    }

    // Autenticado + página pública → redirigir al home correcto.
    // EXCEPCIÓN: si el token está expirado, dejar al usuario en la página pública
    // (ej. /forgot-password) para que pueda recuperar su acceso sin ser redirigido.
    if (isPublicPage) {
      if (!isTokenExpired(accessToken)) {
        router.replace(isSuperAdmin ? SUPER_ADMIN_ROOT : '/');
      }
      return;
    }

    // Super Admin intentando acceder a rutas de empresa → a su panel
    if (isSuperAdmin && !isSuperAdminRoute) {
      router.replace(SUPER_ADMIN_ROOT);
      return;
    }

    // Usuario de empresa intentando acceder a rutas de super admin → a su home
    if (!isSuperAdmin && isSuperAdminRoute) {
      router.replace('/');
      return;
    }
  }, [accessToken, isLoading, isSuperAdmin, pathname, router]);

  // ── Acciones ──────────────────────────────────────────────────────────────
  const setSession = useCallback((data: LoginResponse) => {
    localStorage.setItem(ACCESS_TOKEN_KEY,   data.auth.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY,  data.auth.refreshToken);
    localStorage.setItem(FULLNAME_KEY,       data.fullName);
    if (data.roleName) localStorage.setItem(ROLENAME_KEY, data.roleName);
    localStorage.setItem(PERMISSIONS_KEY,    JSON.stringify(data.permissions ?? []));
    localStorage.setItem(IS_SUPER_ADMIN_KEY, String(data.isSuperAdmin ?? false));
    if (data.companyId !== null && data.companyId !== undefined) {
      localStorage.setItem(COMPANY_ID_KEY, String(data.companyId));
    } else {
      localStorage.removeItem(COMPANY_ID_KEY);
    }

    setAccessToken(data.auth.accessToken);
    setFullName(data.fullName);
    setRoleName(data.roleName ?? null);
    setPermissions(data.permissions ?? []);
    setCompanyId(data.companyId ?? null);
    setIsSuperAdmin(data.isSuperAdmin ?? false);
  }, []);

  const logout = useCallback(async () => {
    const rt = loadString(REFRESH_TOKEN_KEY);
    if (rt) {
      try { await logoutService({ refreshToken: rt }); } catch { /* ignore */ }
    }
    [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, FULLNAME_KEY, ROLENAME_KEY,
     PERMISSIONS_KEY, COMPANY_ID_KEY, IS_SUPER_ADMIN_KEY].forEach((k) =>
      localStorage.removeItem(k),
    );
    setAccessToken(null);
    setFullName(null);
    setRoleName(null);
    setPermissions([]);
    setCompanyId(null);
    setIsSuperAdmin(false);
    router.replace('/login');
  }, [router]);

  const can = useCallback(
    (moduleCode: string, action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete'): boolean => {
      // Super Admin tiene acceso total sin necesidad de permisos por módulo
      if (isSuperAdmin) return true;
      const mod = permissions.find((p) => p.moduleCode === moduleCode);
      return mod ? mod[action] : false;
    },
    [isSuperAdmin, permissions],
  );

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        userId: parseUserIdFromToken(accessToken),
        fullName,
        roleName,
        permissions,
        companyId,
        isSuperAdmin,
        isAuthenticated: !!accessToken,
        isLoading,
        setSession,
        logout,
        can,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
