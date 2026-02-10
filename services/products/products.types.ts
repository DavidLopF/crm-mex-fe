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
