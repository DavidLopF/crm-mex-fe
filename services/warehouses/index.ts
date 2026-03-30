export {
  getWarehouseList,
  getWarehouses,
  getWarehouseById,
  getWarehouseStats,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from './warehouses.service';

export type {
  Warehouse,
  WarehouseListItem,
  WarehouseFiltersDto,
  WarehousePagination,
  PaginatedWarehousesDto,
  CreateWarehouseDto,
  UpdateWarehouseDto,
  WarehouseStats,
} from './warehouses.types';
