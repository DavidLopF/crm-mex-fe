import { get, post, put, patch } from '../http-client';
import type {
  PosProductDto,
  PaginatedPosProductsDto,
  PriceTierDto,
  CreateSaleDto,
  SaleResponseDto,
  SalesQueryParams,
  PosDashboardDto,
  CashCloseSummaryDto,
  CreateCashCloseDto,
  CashCloseResponseDto,
  UpdateSaleDto,
} from './pos.types';

const BASE = '/api/pos';

type PosProductsResponseLike = Record<string, unknown> & {
  data?: unknown;
  items?: unknown;
  pagination?: Record<string, unknown>;
  total?: unknown;
  page?: unknown;
  limit?: unknown;
  totalPages?: unknown;
};

function isPosProductDto(value: unknown): value is PosProductDto {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'variantId' in value &&
      'sku' in value &&
      'productName' in value,
  );
}

function normalizePosProductsResponse(payload: unknown): PaginatedPosProductsDto {
  if (Array.isArray(payload)) {
    const data = payload.filter(isPosProductDto);
    return {
      data,
      total: data.length,
      page: 1,
      limit: data.length || 20,
      totalPages: data.length > 0 ? 1 : 0,
    };
  }

  if (!payload || typeof payload !== 'object') {
    return {
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    };
  }

  const response = payload as PosProductsResponseLike;
  const nestedData = response.data;
  const source = Array.isArray(nestedData)
    ? nestedData
    : Array.isArray(response.items)
      ? response.items
      : Array.isArray((nestedData as Record<string, unknown> | undefined)?.data)
        ? (nestedData as { data: unknown[] }).data
        : [];

  const data = source.filter(isPosProductDto);
  const pagination = response.pagination;
  const total = typeof response.total === 'number'
    ? response.total
    : typeof pagination?.total === 'number'
      ? pagination.total
      : data.length;
  const page = typeof response.page === 'number'
    ? response.page
    : typeof pagination?.page === 'number'
      ? pagination.page
      : 1;
  const limit = typeof response.limit === 'number'
    ? response.limit
    : typeof pagination?.limit === 'number'
      ? pagination.limit
      : data.length || 20;
  const totalPages = typeof response.totalPages === 'number'
    ? response.totalPages
    : typeof pagination?.totalPages === 'number'
      ? pagination.totalPages
      : Math.ceil(total / Math.max(limit, 1));

  return { data, total, page, limit, totalPages };
}

function toDateOnly(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ── Productos POS ──

export async function getPosProducts(
  search?: string,
  page = 1,
  limit = 20,
): Promise<PaginatedPosProductsDto> {
  const raw = await get<unknown>(`${BASE}/products`, { search, page, limit });
  return normalizePosProductsResponse(raw);
}

export async function getVariantTiers(variantId: number): Promise<PriceTierDto[]> {
  return get<PriceTierDto[]>(`${BASE}/products/${variantId}/tiers`);
}

export async function upsertVariantTiers(
  variantId: number,
  tiers: Omit<PriceTierDto, 'id'>[]
): Promise<PriceTierDto[]> {
  return put<PriceTierDto[]>(`${BASE}/products/${variantId}/tiers`, { tiers });
}

// ── Ventas POS ──

export async function createSale(dto: CreateSaleDto): Promise<SaleResponseDto> {
  return post<SaleResponseDto>(`${BASE}/sales`, dto);
}

export async function getSales(
  params: SalesQueryParams
): Promise<{ data: SaleResponseDto[]; total: number }> {
  return get<{ data: SaleResponseDto[]; total: number }>(`${BASE}/sales`, params as Record<string, unknown>);
}

export async function getSaleById(saleId: number): Promise<SaleResponseDto> {
  return get<SaleResponseDto>(`${BASE}/sales/${saleId}`);
}

export async function changeSaleStatus(
  saleId: number,
  newStatusCode: string
): Promise<SaleResponseDto> {
  return patch<SaleResponseDto>(`${BASE}/sales/${saleId}/status`, { newStatusCode });
}

export async function updateSale(
  saleId: number,
  dto: UpdateSaleDto
): Promise<SaleResponseDto> {
  return put<SaleResponseDto>(`${BASE}/sales/${saleId}`, dto);
}

export async function returnSaleToSeller(
  saleId: number,
  returnNotes?: string
): Promise<SaleResponseDto> {
  return patch<SaleResponseDto>(`${BASE}/sales/${saleId}/return`, { returnNotes });
}

// ── Dashboard POS ──

export async function getPosDashboard(): Promise<PosDashboardDto> {
  return get<PosDashboardDto>(`${BASE}/dashboard`);
}

// ── Cierre de Caja ──

/**
 * Obtiene el resumen de ventas PAGADAS del período directamente desde el
 * backend. Se eliminó el cálculo local (que incluía incorrectamente ventas
 * PENDIENTES) para garantizar consistencia con lo que el backend guarda al
 * registrar el cierre definitivo.
 */
export async function getCashCloseSummary(
  from: string,
  to: string
): Promise<CashCloseSummaryDto> {
  const fromDate = toDateOnly(from);
  const toDate = toDateOnly(to);
  return get<CashCloseSummaryDto>(`${BASE}/cash-close/summary`, {
    from: fromDate,
    to: toDate,
  });
}

export async function createCashClose(
  dto: CreateCashCloseDto
): Promise<CashCloseResponseDto> {
  return post<CashCloseResponseDto>(`${BASE}/cash-close`, dto);
}

export async function getCashCloseHistory(
  page = 1,
  limit = 10
): Promise<{ data: CashCloseResponseDto[]; total: number }> {
  return get<{ data: CashCloseResponseDto[]; total: number }>(
    `${BASE}/cash-close`,
    { page, limit }
  );
}
