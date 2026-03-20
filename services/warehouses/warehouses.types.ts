// ── Item para selects/dropdowns ────────────────────────────────────
export interface WarehouseListItem {
  id: number;
  name: string;
}

// ── Warehouse completo ─────────────────────────────────────────────
export interface Warehouse {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Filtros para GET /api/warehouses (paginado) ────────────────────
export interface WarehouseFiltersDto {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
}

// ── Paginación ─────────────────────────────────────────────────────
export interface WarehousePagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Respuesta paginada ─────────────────────────────────────────────
export interface PaginatedWarehousesDto {
  warehouses: Warehouse[];
  pagination: WarehousePagination;
}

// ── Mutaciones ─────────────────────────────────────────────────────
export interface CreateWarehouseDto {
  name: string;
}

export interface UpdateWarehouseDto {
  name?: string;
  isActive?: boolean;
}

// ── Estadísticas ───────────────────────────────────────────────────
export interface WarehouseStats {
  warehouseId: number;
  warehouseName: string;
  totalSkus: number;
  totalUnitsOnHand: number;
  totalUnitsReserved: number;
  totalUnitsAvailable: number;
  totalReceptions: number;
}
