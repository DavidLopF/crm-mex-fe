import { get } from '../http-client';
import { DashboardSummary } from './dashboard.types';

/**
 * GET /api/dashboard
 * Retorna todos los datos del dashboard en una sola petición.
 */
export async function getDashboard(): Promise<DashboardSummary> {
  return get<DashboardSummary>('/api/dashboard');
}
