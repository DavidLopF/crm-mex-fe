import { get, post, put, del, getPaginated } from '@/services/http-client';
import {
  SupplierDetail,
  SupplierListItem,
  SupplierFiltersDto,
  PaginatedSuppliersDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierStatistics,
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchaseOrderFiltersDto,
  PaginatedPurchaseOrdersDto,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  PurchaseOrderStatistics,
} from './suppliers.types';

const SUPPLIERS_PATH = '/api/suppliers';
const PURCHASE_ORDERS_PATH = '/api/purchase-orders';

// ── Helpers para parsear campos que llegan como string del backend ──

interface RawSupplierDetail extends Omit<SupplierDetail, 'totalPurchases'> {
  totalPurchases: string | number;
}

interface RawSupplierStatistics extends Omit<SupplierStatistics, 'totalPurchases'> {
  totalPurchases: string | number;
}

function parseSupplier(raw: RawSupplierDetail): SupplierDetail {
  return {
    ...raw,
    totalPurchases: typeof raw.totalPurchases === 'string'
      ? parseFloat(raw.totalPurchases) || 0
      : raw.totalPurchases ?? 0,
  };
}

function parseSupplierStatistics(raw: RawSupplierStatistics): SupplierStatistics {
  return {
    ...raw,
    totalPurchases: typeof raw.totalPurchases === 'string'
      ? parseFloat(raw.totalPurchases) || 0
      : raw.totalPurchases ?? 0,
  };
}

// ── Mapeo statusId → PurchaseOrderStatus code ────────────────────────
// El backend retorna statusId (FK a PurchaseOrderStatus table).
// Este mapa se construye dinámicamente según lo que retorna el API,
// pero como fallback usamos el mapeo conocido de los datos de seed.
const STATUS_ID_TO_CODE: Record<number, PurchaseOrderStatus> = {
  7: 'sent',
  8: 'draft',
  9: 'partial',
  10: 'received',
  11: 'confirmed',
  12: 'cancelled',
};

function resolveStatus(statusId: number, statusCode?: string): PurchaseOrderStatus {
  if (statusCode) {
    const lower = statusCode.toLowerCase() as PurchaseOrderStatus;
    if (['draft','sent','confirmed','partial','received','cancelled'].includes(lower)) {
      return lower;
    }
  }
  return STATUS_ID_TO_CODE[statusId] ?? 'draft';
}

interface RawPurchaseOrderItem {
  id: number;
  purchaseOrderId: number;
  variantId: number;
  qty: number;
  qtyReceived: number;
  unitCost: string | number;
  lineTotal: string | number;
  currency: string;
  description?: string;
}

interface RawPurchaseOrder {
  id: number;
  code: string;
  supplierId: number;
  statusId: number;
  statusCode?: string;
  currency: string;
  subtotal: string | number;
  tax: string | number;
  total: string | number;
  notes: string | null;
  expectedDeliveryDate: string | null;
  receivedDate: string | null;
  createdAt: string;
  updatedAt: string;
  supplier: {
    id: number;
    name: string;
    rfc: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    state: string | null;
    country: string;
    isActive: boolean;
  };
  items: RawPurchaseOrderItem[];
}

function parsePurchaseOrder(raw: RawPurchaseOrder): PurchaseOrder {
  return {
    id: raw.id,
    code: raw.code,
    supplierId: raw.supplierId,
    supplierName: raw.supplier?.name ?? '',
    supplier: raw.supplier,
    statusId: raw.statusId,
    status: resolveStatus(raw.statusId, raw.statusCode),
    subtotal: parseFloat(String(raw.subtotal)) || 0,
    tax: parseFloat(String(raw.tax)) || 0,
    total: parseFloat(String(raw.total)) || 0,
    currency: raw.currency,
    notes: raw.notes,
    expectedDeliveryDate: raw.expectedDeliveryDate,
    receivedDate: raw.receivedDate,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    items: (raw.items ?? []).map((item) => ({
      id: item.id,
      purchaseOrderId: item.purchaseOrderId,
      variantId: item.variantId,
      qty: item.qty,
      qtyReceived: item.qtyReceived,
      unitCost: parseFloat(String(item.unitCost)) || 0,
      lineTotal: parseFloat(String(item.lineTotal)) || 0,
      currency: item.currency,
      description: item.description,
    })),
  };
}

// ── Shape real del API: data contiene { purchaseOrders, pagination } ─
interface RawPurchaseOrdersApiData {
  purchaseOrders: RawPurchaseOrder[];
  pagination: { total: number; page: number; limit: number };
}

// ══════════════════════════════════════════════════════════════════════
// ── PROVEEDORES ──────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════

/**
 * Obtener lista paginada de proveedores
 * GET /api/suppliers?page=1&limit=10&search=...
 */
export async function getSuppliers(filters: SupplierFiltersDto = {}): Promise<PaginatedSuppliersDto> {
  try {
    const params: Record<string, unknown> = {
      page: filters.page,
      limit: filters.limit,
      search: filters.search,
    };

    const hasActive = filters.active === true;
    const hasInactive = filters.inactive === true;

    if (hasActive && !hasInactive) {
      params.active = true;
      params.inactive = false;
    } else if (!hasActive && hasInactive) {
      params.active = false;
      params.inactive = true;
    }

    const response = await getPaginated<RawSupplierDetail[]>(SUPPLIERS_PATH, params);
    const limit = response.pagination.limit || 10;
    const total = response.pagination.total ?? 0;

    return {
      items: response.data.map(parseSupplier),
      total,
      page: response.pagination.page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (err) {
    console.error('Error al obtener proveedores:', err);
    throw err;
  }
}

/**
 * Obtener lista simple de todos los proveedores (para selects/dropdowns)
 * GET /api/suppliers/list
 */
export async function getAllSuppliers(): Promise<SupplierListItem[]> {
  try {
    const response = await get<SupplierListItem[]>(`${SUPPLIERS_PATH}/list`);
    return response;
  } catch (err) {
    console.error('Error al obtener proveedores:', err);
    throw err;
  }
}

/**
 * Obtener un proveedor por ID
 * GET /api/suppliers/:id
 */
export async function getSupplierById(id: number | string): Promise<SupplierDetail> {
  try {
    const response = await get<RawSupplierDetail>(`${SUPPLIERS_PATH}/${id}`);
    return parseSupplier(response);
  } catch (err) {
    console.error('Error al obtener proveedor:', err);
    throw err;
  }
}

/**
 * Crear un nuevo proveedor
 * POST /api/suppliers
 */
export async function createSupplier(data: CreateSupplierDto): Promise<SupplierDetail> {
  try {
    const response = await post<RawSupplierDetail>(SUPPLIERS_PATH, data);
    return parseSupplier(response);
  } catch (err) {
    console.error('Error al crear proveedor:', err);
    throw err;
  }
}

/**
 * Actualizar un proveedor
 * PUT /api/suppliers/:id
 */
export async function updateSupplier(id: number | string, data: UpdateSupplierDto): Promise<SupplierDetail> {
  try {
    const response = await put<RawSupplierDetail>(`${SUPPLIERS_PATH}/${id}`, data);
    return parseSupplier(response);
  } catch (err) {
    console.error('Error al actualizar proveedor:', err);
    throw err;
  }
}

/**
 * Eliminar (desactivar) un proveedor
 * DELETE /api/suppliers/:id
 */
export async function deleteSupplier(id: number | string): Promise<void> {
  try {
    await del<void>(`${SUPPLIERS_PATH}/${id}`);
  } catch (err) {
    console.error('Error al eliminar proveedor:', err);
    throw err;
  }
}

/**
 * Obtener estadísticas de proveedores
 * GET /api/suppliers/statistics
 */
export async function getSupplierStatistics(): Promise<SupplierStatistics> {
  try {
    const response = await get<RawSupplierStatistics>(`${SUPPLIERS_PATH}/statistics`);
    return parseSupplierStatistics(response);
  } catch (err) {
    console.error('Error al obtener estadísticas de proveedores:', err);
    throw err;
  }
}

// ══════════════════════════════════════════════════════════════════════
// ── ÓRDENES DE COMPRA ────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════

/**
 * Obtener lista paginada de órdenes de compra
 * GET /api/purchase-orders?page=1&limit=10&...
 */
export async function getPurchaseOrders(filters: PurchaseOrderFiltersDto = {}): Promise<PaginatedPurchaseOrdersDto> {
  try {
    const params: Record<string, unknown> = {
      page: filters.page,
      limit: filters.limit,
      search: filters.search,
      supplierId: filters.supplierId,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    };

    if (filters.status && filters.status !== 'all') {
      params.status = filters.status;
    }

    // El backend retorna: { success, data: { purchaseOrders: [...], pagination: {...} }, pagination: {...} }
    // getPaginated extrae data y pagination de la raíz.
    // data aquí es el objeto { purchaseOrders, pagination } — no el array directo.
    const response = await getPaginated<RawPurchaseOrdersApiData>(PURCHASE_ORDERS_PATH, params);

    // Soporte para ambas shapes que puede retornar el backend:
    // Shape A (actual): data = { purchaseOrders: [...], pagination: {...} }
    // Shape B (futura): data = [...] (array directo)
    const dataField = response.data as unknown;
    let rawOrders: RawPurchaseOrder[];
    let pagination: { total: number; page: number; limit: number };

    if (Array.isArray(dataField)) {
      // Shape B: el array viene directamente en data
      rawOrders = dataField as RawPurchaseOrder[];
      pagination = response.pagination;
    } else {
      // Shape A: el array viene en data.purchaseOrders
      const wrapped = dataField as RawPurchaseOrdersApiData;
      rawOrders = Array.isArray(wrapped?.purchaseOrders) ? wrapped.purchaseOrders : [];
      pagination = wrapped?.pagination ?? response.pagination;
    }
    const total = pagination.total ?? 0;
    const limit = pagination.limit || 10;

    return {
      items: rawOrders.map(parsePurchaseOrder),
      total,
      page: pagination.page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (err) {
    console.error('Error al obtener órdenes de compra:', err);
    throw err;
  }
}

/**
 * Obtener una orden de compra por ID
 * GET /api/purchase-orders/:id
 */
export async function getPurchaseOrderById(id: number | string): Promise<PurchaseOrder> {
  try {
    const response = await get<RawPurchaseOrder>(`${PURCHASE_ORDERS_PATH}/${id}`);
    return parsePurchaseOrder(response);
  } catch (err) {
    console.error('Error al obtener orden de compra:', err);
    throw err;
  }
}

/**
 * Crear una nueva orden de compra
 * POST /api/purchase-orders
 */
export async function createPurchaseOrder(data: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
  try {
    const response = await post<RawPurchaseOrder>(PURCHASE_ORDERS_PATH, data);
    return parsePurchaseOrder(response);
  } catch (err) {
    console.error('Error al crear orden de compra:', err);
    throw err;
  }
}

/**
 * Actualizar una orden de compra
 * PUT /api/purchase-orders/:id
 */
export async function updatePurchaseOrder(id: number | string, data: UpdatePurchaseOrderDto): Promise<PurchaseOrder> {
  try {
    const response = await put<RawPurchaseOrder>(`${PURCHASE_ORDERS_PATH}/${id}`, data);
    return parsePurchaseOrder(response);
  } catch (err) {
    console.error('Error al actualizar orden de compra:', err);
    throw err;
  }
}

/**
 * Eliminar (cancelar) una orden de compra
 * DELETE /api/purchase-orders/:id
 */
export async function deletePurchaseOrder(id: number | string): Promise<void> {
  try {
    await del<void>(`${PURCHASE_ORDERS_PATH}/${id}`);
  } catch (err) {
    console.error('Error al eliminar orden de compra:', err);
    throw err;
  }
}

/**
 * Obtener estadísticas de órdenes de compra
 * GET /api/purchase-orders/statistics
 */
export async function getPurchaseOrderStatistics(): Promise<PurchaseOrderStatistics> {
  try {
    const response = await get<PurchaseOrderStatistics>(`${PURCHASE_ORDERS_PATH}/statistics`);
    return response;
  } catch (err) {
    console.error('Error al obtener estadísticas de órdenes de compra:', err);
    throw err;
  }
}
