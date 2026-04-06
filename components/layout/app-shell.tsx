'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { PageTransition } from '@/components/layout/page-transition';
import { useSocketInit } from '@/lib/hooks/use-socket-init';

/**
 * Componente invisible que inicializa la conexión Socket.IO.
 * Se renderiza solo cuando el usuario está autenticado.
 */
function SocketInitializer() {
  useSocketInit();
  return null;
}

/**
 * Renders the app shell (sidebar + header) only for authenticated pages.
 * Login and other public pages render children directly.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isPublicPage = ['/login', '/forgot-password', '/reset-password'].includes(pathname);

  useEffect(() => {
    setMounted(true);
    const media = window.matchMedia('(max-width: 1023px)');
    const update = () => {
      const nextIsMobile = media.matches;
      setIsMobile(nextIsMobile);
      if (!nextIsMobile) setMobileSidebarOpen(false);
    };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  // Antes de montar en cliente, renderizar el mismo loader que ve el server
  // para evitar hydration mismatch (retornar null causaba diff server/client).
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
          <p className="text-sm text-zinc-400 font-medium tracking-wide">Cargando…</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
          <p className="text-sm text-zinc-400 font-medium tracking-wide">Cargando…</p>
        </div>
      </div>
    );
  }

  // Public pages: no sidebar/header
  if (isPublicPage || !isAuthenticated) {
    return <>{children}</>;
  }

  // Authenticated pages: full layout
  return (
    <div className="min-h-screen bg-zinc-50">
      <SocketInitializer />
      <Sidebar
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        isMobile={isMobile}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <div
        className="transition-all duration-300 ease-in-out"
        style={{ marginLeft: isMobile ? 0 : (collapsed ? '80px' : '16rem') }}
      >
        <Header
          showMobileMenu={isMobile}
          onMobileMenuClick={() => setMobileSidebarOpen((v) => !v)}
        />
        <PageTransition>
          {children}
        </PageTransition>
      </div>
    </div>
  );
}
