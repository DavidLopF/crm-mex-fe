import { get } from '../http-client';
import { DashboardSummary, ComprasDashboardSummary } from './dashboard.types';

/**
 * GET /api/dashboard
 * Retorna todos los datos del dashboard en una sola petición.
 */
export async function getDashboard(): Promise<DashboardSummary> {
  return get<DashboardSummary>('/api/dashboard');
}

/**
 * GET /api/dashboard/compras
 * Retorna métricas de proveedores y órdenes de compra.
 */
export async function getDashboardCompras(): Promise<ComprasDashboardSummary> {
  return get<ComprasDashboardSummary>('/api/dashboard/compras');
}
