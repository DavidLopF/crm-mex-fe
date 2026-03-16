'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, X, Check, CheckCheck, ShoppingCart, CornerUpLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type NotificationDto,
} from '@/services/notifications';
import { onNotification, type SseNotificationPayload } from '@/lib/socket-client';
import { useAuth } from '@/lib/auth-context';
import { useGlobalToast } from '@/lib/hooks';

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min  = Math.floor(diff / 60_000);
  const hrs  = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (min < 1)   return 'ahora mismo';
  if (min < 60)  return `hace ${min} min`;
  if (hrs < 24)  return `hace ${hrs} h`;
  return `hace ${days} d`;
}

// Ícono según tipo de notificación
function NotifIcon({ type }: { type: string }) {
  if (type === 'SALE_RETURNED') {
    return (
      <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
        <CornerUpLeft className="w-4 h-4 text-amber-600" />
      </span>
    );
  }
  return (
    <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
      <ShoppingCart className="w-4 h-4 text-blue-600" />
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const toast   = useGlobalToast();
  const router  = useRouter();
  const bellRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [open, setOpen]                   = useState(false);
  const [loading, setLoading]             = useState(false);
  const [markingAll, setMarkingAll]       = useState(false);

  // ── Cargar notificaciones desde la API ────────────────────────────

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const result = await getNotifications({ limit: 20 });
      setNotifications(result.data);
      setUnreadCount(result.unreadCount);
    } catch {
      // silencioso — no romper el layout
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // ── Escuchar eventos SSE en tiempo real ───────────────────────────
  // Cuando el backend emite "notification" por SSE, agregamos la nueva
  // notificación al inicio de la lista y mostramos un toast al usuario.

  useEffect(() => {
    return onNotification((payload: SseNotificationPayload) => {
      // Construir la notificación local a partir del payload SSE
      const newNotif: NotificationDto = {
        id: payload.notificationId,
        type: 'SALE_RETURNED',
        message: payload.message,
        isRead: false,
        readAt: null,
        saleId: payload.saleId,
        saleCode: payload.saleCode,
        metadata: payload.metadata,
        createdAt: new Date().toISOString(),
      };

      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Toast en la esquina para que el vendedor note la alerta
      toast.warning(payload.message, {
        title: '🔔 Venta devuelta',
        duration: 8000,
      });
    });
  }, [toast]);

  // ── Cerrar el panel al hacer click fuera ──────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // ── Marcar una como leída y navegar si aplica ─────────────────────
  const handleRead = async (notif: NotificationDto) => {
    if (!notif.isRead) {
      try {
        await markNotificationAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => n.id === notif.id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // silencioso
      }
    }

    // Para SALE_RETURNED: navegar al módulo POS del vendedor
    if (notif.type === 'SALE_RETURNED') {
      setOpen(false);
      router.push('/pos');
    }
  };

  // ── Marcar todas como leídas ──────────────────────────────────────
  const handleMarkAll = async () => {
    if (unreadCount === 0) return;
    try {
      setMarkingAll(true);
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt ?? new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch {
      toast.error('No se pudieron marcar las notificaciones');
    } finally {
      setMarkingAll(false);
    }
  };

  // No renderizar si no hay sesión
  if (!isAuthenticated) return null;

  return (
    <div ref={bellRef} className="relative z-50">
      {/* ── Botón campana ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5" />

        {/* Badge de no leídas */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Panel desplegable ── */}
      {open && (
        <div className="absolute top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 z-[100] overflow-hidden w-[calc(100vw-2rem)] max-w-sm left-1/2 -translate-x-1/2 sm:w-80 sm:max-w-none sm:left-auto sm:right-0 sm:translate-x-0">

          {/* Cabecera del panel */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-800">Notificaciones</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Marcar todas como leídas */}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  disabled={markingAll}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-500 hover:text-primary hover:bg-gray-100 transition-colors disabled:opacity-50"
                  title="Marcar todas como leídas"
                >
                  {markingAll
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <CheckCheck className="w-3.5 h-3.5" />
                  }
                  <span className="hidden sm:inline">Leer todas</span>
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-[380px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8 gap-2 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando...
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
                <Bell className="w-8 h-8 opacity-30" />
                <p className="text-sm">Sin notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleRead(notif)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                      notif.isRead
                        ? 'bg-white hover:bg-gray-50'
                        : 'bg-amber-50 hover:bg-amber-100'
                    }`}
                  >
                    {/* Ícono */}
                    <NotifIcon type={notif.type} />

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${notif.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs text-gray-400">{notif.saleCode}</span>
                        <span className="text-[10px] text-gray-400">·</span>
                        <span className="text-xs text-gray-400">{timeAgo(notif.createdAt)}</span>
                      </div>
                      {notif.metadata?.returnNotes && (
                        <p className="text-xs text-amber-700 mt-0.5 italic line-clamp-1">
                          "{notif.metadata.returnNotes}"
                        </p>
                      )}
                    </div>

                    {/* Indicador no leída */}
                    {!notif.isRead && (
                      <span className="w-2 h-2 mt-1.5 rounded-full bg-primary flex-shrink-0" />
                    )}
                    {notif.isRead && (
                      <Check className="w-3.5 h-3.5 text-gray-300 mt-1 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 text-center">
              <button
                onClick={() => { setOpen(false); router.push('/pos'); }}
                className="text-xs text-primary hover:underline"
              >
                Ir al módulo POS →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
