import { get, post, put, patch } from '../http-client';
import type {
  PosProductDto,
  PriceTierDto,
  CreateSaleDto,
  SaleResponseDto,
  SalesQueryParams,
  PosDashboardDto,
} from './pos.types';

const BASE = '/api/pos';

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

// ── Dashboard POS ──

export async function getPosDashboard(): Promise<PosDashboardDto> {
  return get<PosDashboardDto>(`${BASE}/dashboard`);
}
