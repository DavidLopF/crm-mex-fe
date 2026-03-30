// ─── Ventas por Producto ──────────────────────────────────────────────────────

export interface VentaProductoRow {
  productId: number;
  productName: string;
  categoryName: string | null;
  qtySoldPos: number;
  revenuePos: number;
  qtySoldOrders: number;
  revenueOrders: number;
  qtyTotal: number;
  revenueTotal: number;
}

export interface VentasProductoSummary {
  totalProductos: number;
  totalUnidades: number;
  totalRevenue: number;
}

export interface VentasProductoFilters {
  from?: string;
  to?: string;
  productId?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface VentasProductoPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Estructura que devuelve el backend dentro de `data`.
 * Compatible con el http-client (get<T> extrae automáticamente el campo data).
 */
export interface VentasProductoResponse {
  rows: VentaProductoRow[];
  pagination: VentasProductoPagination;
  summary: VentasProductoSummary;
}

// ─── Kardex ───────────────────────────────────────────────────────────────────

export type KardexMovementType = 'ENTRADA' | 'SALIDA';

export interface KardexMovimiento {
  fecha: string;
  tipo: KardexMovementType;
  concepto: string;
  referencia: string;
  almacen: string | null;
  qty: number;
  costo: number | null;
  saldo: number;
}

export interface KardexStockItem {
  almacen: string;
  qtyDisponible: number;
  qtyReservada: number;
  qtyTotal: number;
}

export interface KardexResumen {
  totalEntradas: number;
  totalSalidas: number;
  saldoFinal: number;
}

export interface KardexData {
  variante: {
    id: number;
    sku: string;
    variantName: string | null;
    productName: string;
    categoryName: string | null;
  };
  stockActual: KardexStockItem[];
  movimientos: KardexMovimiento[];
  resumen: KardexResumen;
}

export interface KardexFilters {
  variantId: number;
  from?: string;
  to?: string;
}

// ─── Selector de variantes ────────────────────────────────────────────────────

export interface VarianteOption {
  id: number;
  sku: string;
  variantName: string | null;
  product: { name: string };
}
