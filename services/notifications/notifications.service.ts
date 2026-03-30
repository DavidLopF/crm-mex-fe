import { get, patch } from '../http-client';
import type {
  NotificationDto,
  NotificationListDto,
  NotificationsQueryParams,
} from './notifications.types';

const BASE = '/api/notifications';

/** Obtiene las notificaciones del usuario autenticado */
export async function getNotifications(
  params?: NotificationsQueryParams,
): Promise<NotificationListDto> {
  return get<NotificationListDto>(BASE, params as Record<string, unknown>);
}

/** Marca una notificación como leída */
export async function markNotificationAsRead(id: number): Promise<NotificationDto> {
  return patch<NotificationDto>(`${BASE}/${id}/read`, {});
}

/** Marca todas las notificaciones del usuario como leídas */
export async function markAllNotificationsAsRead(): Promise<{ count: number }> {
  return patch<{ count: number }>(`${BASE}/read-all`, {});
}
