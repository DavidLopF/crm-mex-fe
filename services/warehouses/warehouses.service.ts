import { get, post, put, del, getPaginated } from '@/services/http-client';
import type {
  Warehouse,
  WarehouseListItem,
  WarehouseFiltersDto,
  PaginatedWarehousesDto,
  CreateWarehouseDto,
  UpdateWarehouseDto,
  WarehouseStats,
} from './warehouses.types';

const WAREHOUSES_PATH = '/api/warehouses';

// ── READ ───────────────────────────────────────────────────────────

/** Lista simple id+name para dropdowns (solo activos). */
export async function getWarehouseList(): Promise<WarehouseListItem[]> {
  return get<WarehouseListItem[]>(`${WAREHOUSES_PATH}/list`);
}

/** Listado paginado con búsqueda y filtro por estado. */
export async function getWarehouses(
  filters: WarehouseFiltersDto = {},
): Promise<PaginatedWarehousesDto> {
  const params: Record<string, unknown> = {};
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  if (filters.search) params.search = filters.search;
  if (filters.active !== undefined) params.active = String(filters.active);

  const result = await getPaginated<Warehouse[]>(WAREHOUSES_PATH, params);

  return {
    warehouses: result.data,
    pagination: {
      total: result.pagination.total,
      page: result.pagination.page,
      limit: result.pagination.limit,
      totalPages: result.pagination.totalPages ?? Math.ceil(result.pagination.total / (filters.limit ?? 10)),
    },
  };
}

/** Detalle de un warehouse por ID. */
export async function getWarehouseById(id: number | string): Promise<Warehouse> {
  return get<Warehouse>(`${WAREHOUSES_PATH}/${id}`);
}

/** Estadísticas de un warehouse. */
export async function getWarehouseStats(id: number | string): Promise<WarehouseStats> {
  return get<WarehouseStats>(`${WAREHOUSES_PATH}/${id}/stats`);
}

// ── MUTACIONES ─────────────────────────────────────────────────────

/** Crea un nuevo almacén. */
export async function createWarehouse(data: CreateWarehouseDto): Promise<Warehouse> {
  return post<Warehouse>(WAREHOUSES_PATH, data);
}

/** Actualiza nombre y/o estado de un almacén. */
export async function updateWarehouse(
  id: number | string,
  data: UpdateWarehouseDto,
): Promise<Warehouse> {
  return put<Warehouse>(`${WAREHOUSES_PATH}/${id}`, data);
}

/** Soft-delete: desactiva el almacén (isActive = false). */
export async function deleteWarehouse(id: number | string): Promise<void> {
  return del<void>(`${WAREHOUSES_PATH}/${id}`);
}
