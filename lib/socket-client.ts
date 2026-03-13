// ══════════════════════════════════════════════════════════════════════
// ── SSE Client — sincronización entre computadores ──────────────────
//
// Usa la API nativa EventSource del navegador (sin paquetes npm).
// Se conecta a /api/sse del backend, que emite eventos "invalidate"
// cuando cambia el inventario, órdenes, etc.
//
// Al recibir un evento "invalidate", llama a broadcastInvalidation()
// del sistema existente de cross-tab-sync, que dispara re-fetch en
// la pestaña actual y en todas las demás del mismo navegador.
//
// EventSource reconecta automáticamente — no necesitamos lógica extra.
// ══════════════════════════════════════════════════════════════════════

import {
  broadcastInvalidation,
  type InvalidationModule,
} from "./cross-tab-sync";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
const TOKEN_KEY = "crm-auth-access-token";

let eventSource: EventSource | null = null;

// ── Registro de listeners para eventos "notification" ────────────────

export type NotificationEventType = "sale-returned" | "sale-approved";

export interface SseNotificationPayload {
  notificationId: number;
  type: NotificationEventType;
  message: string;
  saleId: number;
  saleCode: string;
  metadata: {
    saleCode: string;
    returnNotes: string | null;
    cashierName: string | null;
  } | null;
}

type NotificationCallback = (payload: SseNotificationPayload) => void;
const notificationListeners = new Set<NotificationCallback>();

/**
 * Suscribe un callback que se invoca en tiempo real cuando el servidor
 * emite un evento de notificación dirigido al usuario conectado.
 * Devuelve cleanup para useEffect.
 *
 * @example
 * useEffect(() => onNotification((p) => toast(p.message)), []);
 */
export function onNotification(cb: NotificationCallback): () => void {
  notificationListeners.add(cb);
  return () => notificationListeners.delete(cb);
}

/**
 * Conecta el cliente SSE al backend.
 * Si ya hay conexión activa, no hace nada.
 * Usa el JWT de localStorage como query param (EventSource no soporta headers).
 */
export function connectSocket(): void {
  if (typeof window === "undefined") return; // SSR guard

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return;

  // Si ya hay una conexión activa o conectándose, no crear otra
  if (
    eventSource &&
    (eventSource.readyState === EventSource.OPEN ||
      eventSource.readyState === EventSource.CONNECTING)
  ) {
    return;
  }

  // Limpiar EventSource anterior si existe
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }

  const url = `${API_URL}/sse?token=${encodeURIComponent(token)}`;
  eventSource = new EventSource(url);

  // ── Evento: invalidación de módulo (broadcast a todos) ──────────
  eventSource.addEventListener(
    "invalidate",
    (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data) as {
          module: InvalidationModule;
          ts: number;
        };
        broadcastInvalidation(payload.module);
      } catch {
        // Ignorar mensajes malformados
      }
    },
  );

  // ── Evento: notificación dirigida a este usuario ─────────────────
  eventSource.addEventListener(
    "notification",
    (e: MessageEvent) => {
      try {
        const { type, payload } = JSON.parse(e.data) as {
          type: NotificationEventType;
          payload: SseNotificationPayload;
          ts: number;
        };
        const normalized: SseNotificationPayload = { ...payload, type };
        for (const cb of notificationListeners) {
          try { cb(normalized); } catch { /* no romper el loop */ }
        }
      } catch {
        // Ignorar mensajes malformados
      }
    },
  );

  // ── Logging (solo dev) ────────────────────────────────────────────
  eventSource.onopen = () => {
    if (process.env.NODE_ENV === "development") {
      console.log("[SSE] Conectado al servidor");
    }
  };

  eventSource.onerror = () => {
    if (process.env.NODE_ENV === "development") {
      console.warn("[SSE] Reconectando...");
    }
  };
}

/**
 * Desconecta el SSE (ej. al hacer logout).
 */
export function disconnectSocket(): void {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
    console.log("[SSE] Desconectado");
  }
}

/**
 * Reconecta el SSE con un nuevo token (ej. después de refresh de token).
 */
export function reconnectSocket(): void {
  disconnectSocket();
  connectSocket();
}

/**
 * Indica si el SSE está actualmente conectado.
 */
export function isSocketConnected(): boolean {
  return eventSource?.readyState === EventSource.OPEN;
}
