// ── Proveedor (item para selects/dropdowns) ────────────────────────
export interface SupplierListItem {
  id: number;
  name: string;
}

// ── Contacto del proveedor ─────────────────────────────────────────
export interface SupplierContact {
  name: string;
  phone: string;
  email: string;
  position?: string;
}

// ── Proveedor completo (detalle) ───────────────────────────────────
export interface SupplierDetail {
  id: number;
  name: string;
  rfc: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  /** Total de compras acumulado (viene como string del backend, se parsea a number en el servicio) */
  totalPurchases: number;
}

// ── Filtros para GET /api/suppliers (paginado) ─────────────────────
export interface SupplierFiltersDto {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
  inactive?: boolean;
}

// ── Paginación del API ─────────────────────────────────────────────
export interface SupplierPagination {
  total: number;
  page: number;
  limit: number;
}

// ── Respuesta paginada del API ─────────────────────────────────────
export interface ApiSuppliersResponse {
  data: SupplierDetail[];
  pagination: SupplierPagination;
}

// ── Respuesta ya mapeada para el frontend ──────────────────────────
export interface PaginatedSuppliersDto {
  items: SupplierDetail[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── DTO para crear un proveedor ────────────────────────────────────
export interface CreateSupplierDto {
  name: string;
  rfc?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
}

// ── DTO para actualizar un proveedor ───────────────────────────────
export interface UpdateSupplierDto {
  name?: string;
  rfc?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  isActive?: boolean;
}

// ── Estadísticas de proveedores ────────────────────────────────────
export interface SupplierStatistics {
  totalSuppliers: number;
  activeSuppliers: number;
  inactiveSuppliers: number;
  newSuppliersLastMonth: number;
  /** Total de compras acumulado (viene como string del backend, se parsea a number en el servicio) */
  totalPurchases: number;
}

// ══════════════════════════════════════════════════════════════════════
// ── ÓRDENES DE COMPRA (Purchase Orders) ──────────────────────────────
// ══════════════════════════════════════════════════════════════════════

export type PurchaseOrderStatus =
  | 'draft'
  | 'sent'
  | 'confirmed'
  | 'partial'
  | 'received'
  | 'cancelled';

export const PURCHASE_ORDER_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  confirmed: 'Confirmada',
  partial: 'Parcial',
  received: 'Recibida',
  cancelled: 'Cancelada',
};

export const PURCHASE_ORDER_STATUS_COLORS: Record<PurchaseOrderStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-purple-100 text-purple-700',
  partial: 'bg-orange-100 text-orange-700',
  received: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

// ── Item de orden de compra ────────────────────────────────────────
export interface PurchaseOrderItem {
  id: number;
  purchaseOrderId: number;
  variantId: number;
  qty: number;
  qtyReceived: number;
  unitCost: number;
  lineTotal: number;
  currency: string;
  description?: string;
}

// ── Proveedor embebido en la orden (viene como objeto del backend) ──
export interface PurchaseOrderSupplier {
  id: number;
  name: string;
  rfc: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string;
  isActive: boolean;
}

// ── Orden de compra (detalle) ──────────────────────────────────────
export interface PurchaseOrder {
  id: number;
  code: string;
  supplierId: number;
  /** Nombre del proveedor — derivado del objeto supplier embebido */
  supplierName: string;
  supplier: PurchaseOrderSupplier;
  statusId: number;
  /** Código de estado mapeado desde statusId — derivado en el servicio */
  status: PurchaseOrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  notes: string | null;
  expectedDeliveryDate: string | null;
  receivedDate: string | null;
  createdAt: string;
  updatedAt: string;
  items: PurchaseOrderItem[];
}

// ── Filtros para GET /api/purchase-orders ──────────────────────────
export interface PurchaseOrderFiltersDto {
  page?: number;
  limit?: number;
  search?: string;
  supplierId?: number;
  status?: PurchaseOrderStatus | 'all';
  dateFrom?: string;
  dateTo?: string;
}

// ── Respuesta paginada de órdenes de compra ────────────────────────
export interface PaginatedPurchaseOrdersDto {
  items: PurchaseOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── DTO para crear item de la orden ────────────────────────────────
export interface CreatePurchaseOrderItemDto {
  variantId: number;
  qty: number;
  unitCost: number;
  description?: string;
}

// ── DTO para crear una orden de compra ─────────────────────────────
export interface CreatePurchaseOrderDto {
  supplierId: number;
  items: CreatePurchaseOrderItemDto[];
  notes?: string;
  expectedDeliveryDate?: string;
}

// ── DTO para actualizar una orden de compra ────────────────────────
export interface UpdatePurchaseOrderDto {
  status?: PurchaseOrderStatus;
  notes?: string;
  expectedDeliveryDate?: string;
  items?: CreatePurchaseOrderItemDto[];
}

// ── Estadísticas de órdenes de compra ──────────────────────────────
export interface PurchaseOrderStatistics {
  totalOrders: number;
  draftOrders: number;
  sentOrders: number;
  confirmedOrders: number;
  receivedOrders: number;
  cancelledOrders: number;
  totalSpent: number;
}
