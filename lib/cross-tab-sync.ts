// ══════════════════════════════════════════════════════════════════════
// ── Cross-tab invalidation via BroadcastChannel ──────────────────────
//
// Problema: Zustand vive en memoria de UNA pestaña. Si el usuario tiene
// abierta Pestaña A (Pedidos) y Pestaña B (Inventario), crear un pedido
// en A no actualiza el inventario en B.
//
// Solución: Cuando cualquier store muta datos, emitimos un mensaje
// por BroadcastChannel con el nombre del módulo que cambió. Las demás
// pestañas escuchan y re-fetch los datos afectados.
//
// Uso en pages:
//   1. En el handler que muta: llamar `broadcastInvalidation('inventory')`
//   2. En el useEffect inicial: `useCrossTabSync('inventory', loadFn)`
// ══════════════════════════════════════════════════════════════════════

/** Módulos que pueden emitir invalidaciones */
export type InvalidationModule =
  | 'inventory'
  | 'clients'
  | 'orders'
  | 'suppliers'
  | 'purchase-orders'
  | 'config-users'
  | 'config-roles';

interface InvalidationMessage {
  module: InvalidationModule;
  /** Timestamp para deduplicar */
  ts: number;
  /** Id de la pestaña que originó el cambio (no re-fetch en la misma) */
  sourceTabId: string;
}

const CHANNEL_NAME = 'crm-mex-invalidation';

/**
 * Id único de esta pestaña — se genera una vez al cargar.
 * Se usa para evitar que la pestaña que emitió el cambio
 * también re-fetch (ella ya actualizó su store localmente).
 */
const TAB_ID =
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/** Singleton del canal — lazy init */
let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null; // SSR guard
  if (!('BroadcastChannel' in window)) return null; // Safari < 15.4
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
  return channel;
}

// ─── Emitir ──────────────────────────────────────────────────────────

/**
 * Notifica a todas las demás pestañas que un módulo cambió.
 * Llamar después de cualquier mutación exitosa (create, update, delete).
 *
 * Se puede pasar un array de módulos cuando una acción afecta a varios
 * (e.g. crear un pedido afecta 'orders' + 'inventory').
 */
export function broadcastInvalidation(
  modules: InvalidationModule | InvalidationModule[],
): void {
  const ch = getChannel();
  if (!ch) return;

  const list = Array.isArray(modules) ? modules : [modules];
  const ts = Date.now();

  for (const mod of list) {
    const msg: InvalidationMessage = {
      module: mod,
      ts,
      sourceTabId: TAB_ID,
    };
    ch.postMessage(msg);
  }
}

// ─── Escuchar ────────────────────────────────────────────────────────

type CleanupFn = () => void;

/**
 * Suscribe un callback que se ejecuta cuando OTRA pestaña invalida
 * el módulo indicado. Devuelve una función cleanup.
 *
 * Ejemplo:
 * ```ts
 * useEffect(() => {
 *   return onCrossTabInvalidation('inventory', () => {
 *     loadProducts();
 *     loadStatistics();
 *   });
 * }, []);
 * ```
 */
export function onCrossTabInvalidation(
  modules: InvalidationModule | InvalidationModule[],
  callback: () => void,
): CleanupFn {
  const ch = getChannel();
  if (!ch) return () => {};

  const set = new Set(Array.isArray(modules) ? modules : [modules]);

  const handler = (event: MessageEvent<InvalidationMessage>) => {
    const msg = event.data;
    // Ignorar mensajes de esta misma pestaña
    if (msg.sourceTabId === TAB_ID) return;
    // Solo reaccionar a los módulos que nos interesan
    if (set.has(msg.module)) {
      callback();
    }
  };

  ch.addEventListener('message', handler);
  return () => ch.removeEventListener('message', handler);
}
