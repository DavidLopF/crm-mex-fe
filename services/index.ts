// Barrel export de todos los servicios.
// Importa desde aquí: import { getProducts } from '@/services';

export * from './products';
export * from './clients';
export * from './inventory';
export * from './orders';
export * from './users';
export * from './company';
export * from './auth';
export * from './dashboard';
export * from './suppliers';
export * from './receptions';
export * from './pos';
export * from './reports';
// Warehouses — exportación explícita para evitar conflictos con receptions
export {
  getWarehouseList,
  getWarehouses as getWarehousesPaginated,
  getWarehouseById,
  getWarehouseStats,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from './warehouses';
export type {
  Warehouse,
  WarehouseFiltersDto,
  WarehousePagination,
  PaginatedWarehousesDto,
  CreateWarehouseDto,
  UpdateWarehouseDto,
  WarehouseStats,
} from './warehouses';
