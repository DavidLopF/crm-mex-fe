import { get, post, put, patch } from '../http-client';
import type {
  PosProductDto,
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

export async function getPosProducts(search?: string): Promise<PosProductDto[]> {
  return get<PosProductDto[]>(`${BASE}/products`, search ? { search } : undefined);
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

export async function getCashCloseSummary(
  from: string,
  to: string
): Promise<CashCloseSummaryDto> {
  return get<CashCloseSummaryDto>(`${BASE}/cash-close/summary`, {
    from: toDateOnly(from),
    to: toDateOnly(to),
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
