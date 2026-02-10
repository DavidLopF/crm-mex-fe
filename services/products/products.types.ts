import { Producto } from '@/types';

// ── Filtros para GET /api/products ──────────────────────────────────
export interface ProductFiltersDto {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  sku?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  hasStock?: boolean;
}

// ── Forma cruda que devuelve el backend ─────────────────────────────
export interface ApiProduct {
  id: number;
  name: string;
  sku: string;
  category: string;
  categoryId: number;
  defaultPrice: number;
  currency: string;
  totalStock: number;
  status: string;
  description?: string;
  image?: string;
}

export interface ApiPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/** Estructura real: { success, data: { data: ApiProduct[], pagination } } */
export interface ApiProductsResponse {
  data: ApiProduct[];
  pagination: ApiPagination;
}

// ── Respuesta ya mapeada al frontend ────────────────────────────────
export interface PaginatedProductsDto {
  items: Producto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Mapper: convierte un ApiProduct → Producto del frontend ─────────
export function mapApiProductToProducto(api: ApiProduct): Producto {
  return {
    id: String(api.id),
    nombre: api.name,
    descripcion: api.description ?? '',
    sku: api.sku,
    precio: api.defaultPrice,
    costo: 0,
    categoria: api.category,
    imagen: api.image,
    variaciones: [],
    stockTotal: api.totalStock,
    activo: api.status === 'Activo',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ── Estadísticas de inventario ─────────────────────────────────────
export interface ProductStatistics {
  totalProducts: number;
  totalStockOnHand: number;
  totalStockReserved: number;
  activeProducts: number;
  inactiveProducts: number;
}

// ── Detalle de producto ────────────────────────────────────────────
export interface ApiWarehouse {
  warehouseId: number;
  warehouseName: string;
  qtyOnHand: number;
  qtyReserved: number;
  qtyAvailable: number;
}

export interface ApiVariant {
  id: number;
  sku: string;
  barcode: string;
  variantName: string;
  stock: number;
  reserved: number;
  available: number;
  status: string;
  warehouses: ApiWarehouse[];
}

export interface ApiProductDetail {
  id: number;
  name: string;
  description?: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  currency: string;
  totalStock: number;
  status: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  variants: ApiVariant[];
}

// ── Categorías ──────────────────────────────────────────────────────
export interface CategoryDto {
  id: number;
  name: string;
  description?: string;
}

// ── Crear producto ──────────────────────────────────────────────────
export interface CreateProductVariantDto {
  variantName: string;
  stock: number;
  warehouseId?: number; // Opcional: si no se especifica, usa el almacén por defecto
}

export interface CreateProductDto {
  name: string;
  description?: string;
  sku: string;
  categoryId: number;
  defaultPrice: number;
  cost?: number;
  currency?: string;
  image?: string;
  variants: CreateProductVariantDto[];
}

