import { get, post, put } from '@/services/http-client';
import {
  ProductFiltersDto,
  PaginatedProductsDto,
  ApiProductsResponse,
  ProductStatistics,
  ApiProductDetail,
  CategoryDto,
  CreateProductDto,
  UpdateProductDto,
  UpdateProductResponseDto,
  mapApiProductToProducto,
} from './products.types';
import { Producto } from '@/types';

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

/**
 * Obtener detalle completo de un producto.
 * GET /api/products/:id
 * 
 * Retorna tanto el producto mapeado como los datos raw del API
 * para tener acceso a variantes con almacenes.
 */
export async function getProductById(id: string | number): Promise<{ producto: Producto; raw: ApiProductDetail }> {
  try {
    const raw = await get<ApiProductDetail>(`${BASE_PATH}/${id}`);
    
    // Mapear variantes/variants
    const variaciones = raw.variants.map(v => ({
      id: String(v.id),
      nombre: v.variantName,
      valor: v.sku, // Usamos SKU como valor por ahora
      stock: v.stock,
      precio: undefined, // Las variantes no tienen precio individual en este modelo
    }));

    // Mapear el producto completo
    const producto: Producto = {
      id: String(raw.id),
      nombre: raw.name,
      descripcion: raw.description ?? '',
      sku: raw.sku,
      precio: raw.price,
      costo: raw.cost,
      categoria: raw.category,
      imageUrl: raw.image,
      variaciones,
      stockTotal: raw.totalStock,
      activo: raw.status === 'Activo',
      requiresIva: raw.requiresIva ?? false,
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
    };

    return { producto, raw };
  } catch (err) {
    console.error('Error al obtener detalle del producto:', err);
    throw err;
  }
}

/**
 * Obtener lista de categorías de productos.
 * GET /api/products/categories
 * 
 * El backend responde: { success, data: CategoryDto[], count }
 */
export async function getCategories(): Promise<CategoryDto[]> {
  try {
    const response = await get<CategoryDto[]>(`${BASE_PATH}/categories`);
    return response;
  } catch (err) {
    console.error('Error al obtener categorías:', err);
    throw err;
  }
}

/**
 * Crear un nuevo producto.
 * POST /api/products
 * 
 * El backend espera:
 * {
 *   name: string,
 *   sku: string,
 *   categoryId: number,
 *   defaultPrice: number,
 *   cost?: number,
 *   description?: string,
 *   image?: string,
 *   currency?: string,
 *   variants: [{ variantName: string, stock: number, warehouseId?: number }]
 * }
 * 
 * Responde: { success, data: ApiProductDetail }
 */
export async function createProduct(productData: CreateProductDto): Promise<ApiProductDetail> {
  try {
    const response = await post<ApiProductDetail>(BASE_PATH, productData);
    return response;
  } catch (err) {
    console.error('Error al crear producto:', err);
    throw err;
  }
}

/**
 * Actualizar un producto existente.
 * PUT /api/products/:id
 * 
 * El backend espera:
 * {
 *   name?: string,
 *   description?: string,
 *   categoryId?: number,
 *   price?: number,
 *   cost?: number,
 *   currency?: string,
 *   image?: string,
 *   isActive?: boolean,
 *   variants?: [{ 
 *     id?: number,        // Si tiene id, se actualiza. Si no, se crea nueva
 *     variantName: string, 
 *     stock: number,
 *     sku?: string,
 *     warehouseId?: number
 *   }]
 * }
 * 
 * Responde: { success, data: UpdateProductResponseDto }
 */
export async function updateProduct(
  id: string | number,
  productData: UpdateProductDto
): Promise<UpdateProductResponseDto> {
  try {
    const response = await put<UpdateProductResponseDto>(`${BASE_PATH}/${id}`, productData);
    return response;
  } catch (err) {
    console.error('Error al actualizar producto:', err);
    throw err;
  }
}

// ── OPERACIONES MASIVAS POR EXCEL ─────────────────────────────────────────────

export interface BulkPriceUpdateRow {
  sku: string;
  defaultPrice: number;
  cost?: number;
}

export interface BulkPriceUpdateResult {
  updated: number;
  errors: { sku: string; reason: string }[];
}

export interface BulkImportRow {
  name: string;
  sku: string;
  defaultPrice: number;
  cost?: number;
  categoryName: string;
  description?: string;
  variantName?: string;
  barcode?: string;
  stock?: number;
  currency?: string;
  requiresIva?: boolean;
}

export interface BulkImportResult {
  created: number;
  errors: { sku: string; reason: string }[];
}

/**
 * Actualización masiva de precios.
 * POST /api/products/bulk-price-update
 */
export async function bulkPriceUpdate(rows: BulkPriceUpdateRow[]): Promise<BulkPriceUpdateResult> {
  return post<BulkPriceUpdateResult>(`${BASE_PATH}/bulk-price-update`, { rows });
}

/**
 * Importación masiva de productos.
 * POST /api/products/bulk-import
 */
export async function bulkImportProducts(rows: BulkImportRow[]): Promise<BulkImportResult> {
  return post<BulkImportResult>(`${BASE_PATH}/bulk-import`, { rows });
}

// ── PRECIOS POR VOLUMEN / MAYOREO ─────────────────────────────────────────────

export interface BulkPriceTierRow {
  sku: string;
  minQty: number;
  price: number;
  tierLabel?: string;
}

export interface BulkPriceTiersResult {
  updatedSkus: number;
  tiersCreated: number;
  errors: { sku: string; reason: string }[];
}

/**
 * Actualización masiva de precios por volumen/mayoreo.
 * Un SKU puede tener N filas (tiers). Reemplaza todos los tiers del SKU.
 * POST /api/products/bulk-price-tiers
 */
export async function bulkPriceTiers(rows: BulkPriceTierRow[]): Promise<BulkPriceTiersResult> {
  return post<BulkPriceTiersResult>(`${BASE_PATH}/bulk-price-tiers`, { rows });
}

