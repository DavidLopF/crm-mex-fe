export {
  getSuppliers,
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierStatistics,
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrderStatistics,
} from './suppliers.service';

export type {
  SupplierListItem,
  SupplierContact,
  SupplierDetail,
  SupplierFiltersDto,
  SupplierPagination,
  PaginatedSuppliersDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierStatistics,
  PurchaseOrderStatus,
  PurchaseOrderItem,
  PurchaseOrder,
  PurchaseOrderFiltersDto,
  PaginatedPurchaseOrdersDto,
  CreatePurchaseOrderItemDto,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  PurchaseOrderStatistics,
} from './suppliers.types';

export {
  PURCHASE_ORDER_STATUS_LABELS,
  PURCHASE_ORDER_STATUS_COLORS,
} from './suppliers.types';
