import { get } from '@/services/http-client';
import {
  ProductFiltersDto,
  PaginatedProductsDto,
  ApiProductsResponse,
  ProductStatistics,
  mapApiProductToProducto,
} from './products.types';

const BASE_PATH = '/api/products';

/**
 * Obtener lista de productos con paginación y filtros.
 * GET /api/products
 *
 * El backend responde: { success, data: { data: ApiProduct[], pagination } }
 * Aquí mapeamos a PaginatedProductsDto con items: Producto[]
 */
export async function getProducts(filters: ProductFiltersDto = {}): Promise<PaginatedProductsDto> {
  const raw = await get<ApiProductsResponse>(BASE_PATH, {
    page: filters.page,
    limit: filters.limit,
    search: filters.search,
    categoryId: filters.categoryId,
    sku: filters.sku,
    isActive: filters.isActive,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    hasStock: filters.hasStock,
  });

  return {
    items: raw.data.map(mapApiProductToProducto),
    total: raw.pagination.total,
    page: raw.pagination.page,
    limit: raw.pagination.limit,
    totalPages: raw.pagination.totalPages,
  };
}

/**
 * Obtener estadísticas globales del inventario.
 * GET /api/products/statistics
 */
export async function getStadistics(): Promise<ProductStatistics> {
  try {
    const raw = await get<ProductStatistics>(`${BASE_PATH}/statistics`);
    return raw;
  } catch (err) {
    console.error('Error al obtener estadísticas de productos:', err);
    throw err;
  }
}

