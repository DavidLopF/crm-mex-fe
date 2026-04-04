/**
 * SyncManager — Procesador de la cola offline
 *
 * Responsabilidades:
 *  1. Escuchar el evento `online` del browser
 *  2. Iterar las operaciones en offlineQueue de Dexie (FIFO por queuedAt)
 *  3. Re-ejecutar cada request con el http-client original
 *  4. Manejar fallos con retry limitado (max 3 intentos)
 *  5. Emitir eventos custom para que la UI pueda reaccionar
 *
 * Eventos emitidos (en window):
 *  - `offline-queue-changed`  : cuando cambia el número de items en cola
 *  - `offline-sync-success`   : cuando una operación se sincronizó ok
 *  - `offline-sync-error`     : cuando una operación falla definitivamente
 *  - `offline-sync-complete`  : cuando se termina de procesar toda la cola
 */

import { getOfflineDB, type OfflineOperation } from './db';

const MAX_RETRIES = 3;

// ── Tipos de eventos ─────────────────────────────────────────────────────────

export interface QueueChangedDetail {
  count: number;
}

export interface SyncSuccessDetail {
  operation: OfflineOperation;
  responseData: unknown;
}

export interface SyncErrorDetail {
  operation: OfflineOperation;
  error: string;
  permanent: boolean;
}

// ── Singleton ────────────────────────────────────────────────────────────────

let initialized = false;

/**
 * Inicializa el SyncManager. Llamar una sola vez en el Provider raíz.
 * Es seguro llamarlo varias veces — se protege con el guard `initialized`.
 */
export function initSyncManager(): void {
  if (typeof window === 'undefined' || initialized) return;
  initialized = true;

  window.addEventListener('online', handleOnline);

  // Si arrancamos ya con internet y hay cola pendiente, procesamos
  if (navigator.onLine) {
    void processQueue();
  }
}

export function destroySyncManager(): void {
  if (typeof window === 'undefined') return;
  window.removeEventListener('online', handleOnline);
  initialized = false;
}

// ── Handlers ─────────────────────────────────────────────────────────────────

function handleOnline(): void {
  void processQueue();
}

// ── Cola ─────────────────────────────────────────────────────────────────────

let processing = false;

export async function processQueue(): Promise<void> {
  if (processing) return;
  processing = true;

  try {
    const db = getOfflineDB();
    const operations = await db.offlineQueue.orderBy('queuedAt').toArray();

    for (const op of operations) {
      if (!navigator.onLine) break; // Si se cae internet durante el proceso, paramos

      await processSingleOperation(op);
    }

    emitEvent('offline-sync-complete', {});
  } finally {
    processing = false;
    await emitQueueCount();
  }
}

async function processSingleOperation(op: OfflineOperation): Promise<void> {
  const db = getOfflineDB();

  try {
    const data = await executeOperation(op);

    // Éxito: borrar de la cola
    await db.offlineQueue.delete(op.id!);

    emitEvent<SyncSuccessDetail>('offline-sync-success', {
      operation: op,
      responseData: data,
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const newRetries = op.retries + 1;

    if (newRetries >= MAX_RETRIES) {
      // Fallo definitivo: eliminamos para no bloquear la cola
      await db.offlineQueue.delete(op.id!);
      emitEvent<SyncErrorDetail>('offline-sync-error', {
        operation: op,
        error,
        permanent: true,
      });
    } else {
      // Actualizamos el contador de reintentos
      await db.offlineQueue.update(op.id!, {
        retries: newRetries,
        lastError: error,
      });
      emitEvent<SyncErrorDetail>('offline-sync-error', {
        operation: op,
        error,
        permanent: false,
      });
    }
  }
}

/**
 * Ejecuta la operación contra el backend.
 * Importamos el http-client de forma dinámica para evitar dependencia circular.
 */
async function executeOperation(op: OfflineOperation): Promise<unknown> {
  // Import dinámico para evitar ciclos en el módulo
  const httpClient = await import('@/services/http-client');

  switch (op.method) {
    case 'POST':
      return httpClient.post(op.path, op.body, op.params);
    case 'PUT':
      return httpClient.put(op.path, op.body, op.params);
    case 'PATCH':
      return httpClient.patch(op.path, op.body, op.params);
    case 'DELETE':
      return httpClient.del(op.path, op.params);
    default:
      throw new Error(`Método HTTP no soportado en sync: ${op.method}`);
  }
}

// ── Queue helpers (públicos para la UI) ──────────────────────────────────────

/**
 * Encola una operación de mutación para sincronizar cuando haya internet.
 * Solo deduplica si es una actualización (PUT/PATCH) al mismo recurso exacto
 * y el clientId coincide, o si es un reintento manual.
 */
export async function enqueueOperation(
  op: Omit<OfflineOperation, 'id' | 'clientId' | 'queuedAt' | 'retries'>
): Promise<void> {
  const db = getOfflineDB();
  const clientId = crypto.randomUUID();

  // Para POST nunca deduplicamos (cada creación es única)
  // Para PUT/PATCH/DELETE podríamos deduplicar si el path es idéntico (ej: editar el mismo producto 2 veces)
  if (op.method !== 'POST') {
    const existing = await db.offlineQueue
      .filter((item) => item.method === op.method && item.path === op.path)
      .first();

    if (existing?.id !== undefined) {
      await db.offlineQueue.update(existing.id, {
        body: op.body,
        params: op.params,
        queuedAt: Date.now(),
        retries: 0,
        lastError: undefined,
      });
      await emitQueueCount();
      return;
    }
  }

  await db.offlineQueue.add({
    ...op,
    clientId,
    queuedAt: Date.now(),
    retries: 0,
  });

  await emitQueueCount();
}

export async function getPendingCount(): Promise<number> {
  try {
    const db = getOfflineDB();
    return db.offlineQueue.count();
  } catch {
    return 0;
  }
}

export async function clearQueue(): Promise<void> {
  const db = getOfflineDB();
  await db.offlineQueue.clear();
  await emitQueueCount();
}

async function emitQueueCount(): Promise<void> {
  const count = await getPendingCount();
  emitEvent<QueueChangedDetail>('offline-queue-changed', { count });
}

// Exportar para que el http-client pueda notificar cambios en la cola
export async function notifyQueueChanged(): Promise<void> {
  await emitQueueCount();
}

// ── Utilidad de eventos ───────────────────────────────────────────────────────

function emitEvent<T extends object>(name: string, detail: T): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}
