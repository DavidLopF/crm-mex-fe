import { get } from '@/services/http-client';
import type {
  VentasProductoFilters,
  VentasProductoResponse,
  KardexFilters,
  KardexData,
  VarianteOption,
} from './reports.types';

const BASE = '/api/reports';

// ─── Reporte de Ventas por Producto ──────────────────────────────────────────

/**
 * Obtiene el reporte de ventas agrupadas por producto.
 * El backend devuelve { rows, pagination, summary } dentro de `data`,
 * compatible con el get() del http-client que extrae automáticamente el campo data.
 */
export async function getVentasPorProducto(
  filters: VentasProductoFilters = {},
): Promise<VentasProductoResponse> {
  const params: Record<string, unknown> = {};
  if (filters.from)      params.from      = filters.from;
  if (filters.to)        params.to        = filters.to;
  if (filters.productId) params.productId = filters.productId;
  if (filters.search)    params.search    = filters.search;
  if (filters.page)      params.page      = filters.page;
  if (filters.limit)     params.limit     = filters.limit;

  return get<VentasProductoResponse>(`${BASE}/ventas-producto`, params);
}

// ─── Kardex ───────────────────────────────────────────────────────────────────

/**
 * Obtiene el kardex de movimientos de una variante de producto.
 */
export async function getKardex(filters: KardexFilters): Promise<KardexData> {
  const params: Record<string, unknown> = { variantId: filters.variantId };
  if (filters.from) params.from = filters.from;
  if (filters.to)   params.to   = filters.to;

  return get<KardexData>(`${BASE}/kardex`, params);
}

// ─── Selector de variantes ────────────────────────────────────────────────────

/**
 * Obtiene el listado de variantes para el selector del kardex.
 */
export async function getVariantesParaKardex(
  search?: string,
): Promise<VarianteOption[]> {
  return get<VarianteOption[]>(
    `${BASE}/kardex/variantes`,
    search ? { search } : undefined,
  );
}
