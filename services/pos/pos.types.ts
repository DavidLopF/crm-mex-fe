/**
 * Tipos para el módulo Punto de Venta (POS)
 */

export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'NEQUI' | 'DAVIPLATA';

export interface PriceTierDto {
  id: number;
  minQty: number;
  price: number;
  tierLabel: string;
  sortOrder: number;
}

export interface PosProductDto {
  variantId: number;
  sku: string;
  productName: string;
  variantName: string | null;
  category: string;
  stockTotal: number;
  defaultPrice: number;
  currency: string | null;
  priceTiers: PriceTierDto[];
  isActive: boolean;
  /** true = el producto siempre debe venderse con IVA (16%); el toggle en el POS se bloquea ON */
  requiresIva: boolean;
}

export interface CreateSaleItemDto {
  variantId: number;
  qty: number;
}

export interface CreateSaleDto {
  clientId?: number;
  clientName?: string;
  currency?: string;
  notes?: string;
  items: CreateSaleItemDto[];
  sellerId?: number;
  /** true → aplica 16% IVA sobre el subtotal */
  includesIva?: boolean;
  /** Medio de pago: EFECTIVO | TARJETA | NEQUI | DAVIPLATA (default: EFECTIVO) */
  paymentMethod?: PaymentMethod;
}

export interface SaleItemResponseDto {
  id: number;
  variantId: number;
  sku: string;
  productName: string;
  variantName: string | null;
  qty: number;
  unitPrice: number;
  appliedTierLabel: string | null;
  lineTotal: number;
}

export interface SaleResponseDto {
  id: number;
  code: string;
  status: string;
  statusCode: string;
  clientId: number | null;
  clientName: string | null;
  sellerName: string | null;
  currency: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string | null;
  paymentMethod: PaymentMethod;
  items: SaleItemResponseDto[];
  createdAt: string;
  /** Fecha en que fue devuelta al vendedor (null = no devuelta) */
  returnedAt: string | null;
  /** Notas del revisor al devolver */
  returnNotes: string | null;
  /** ID del documento FE en core-fe (null = no facturada electrónicamente) */
  feInvoiceId: number | null;
  /** CUFE SHA-384 del documento FE */
  feCufe: string | null;
}

// ── Editar venta ──

export interface UpdateSaleItemDto {
  variantId: number;
  qty: number;
  /** Precio manual opcional; si se omite se recalcula con tiers */
  unitPrice?: number;
}

export interface UpdateSaleDto {
  clientId?: number | null;
  clientName?: string | null;
  notes?: string | null;
  paymentMethod?: PaymentMethod;
  includesIva?: boolean;
  items: UpdateSaleItemDto[];
}

// ── Devolver venta al vendedor ──

export interface ReturnSaleDto {
  returnNotes?: string;
}

export interface PosDashboardDto {
  todaySalesCount: number;
  todaySalesTotal: number;
  monthSalesCount: number;
  monthSalesTotal: number;
  topProductsToday: {
    productName: string;
    variantName: string | null;
    qtyTotal: number;
    revenueTotal: number;
  }[];
}

export interface SalesQueryParams {
  from?: string;
  to?: string;
  statusCode?: string;
  search?: string;
  sellerId?: number;
  paymentMethod?: PaymentMethod;
  page?: number;
  limit?: number;
}

// ── Cierre de Caja ──

export interface CashCloseSummaryDto {
  periodFrom: string;
  periodTo: string;
  salesCount: number;
  totalSales: number;
  totalEfectivo: number;
  totalTarjeta: number;
  totalNequi: number;
  totalDaviplata: number;
  sales: SaleResponseDto[];
}

export interface CreateCashCloseDto {
  periodFrom: string;
  periodTo: string;
  declaredEfectivo: number;
  declaredTarjeta: number;
  declaredNequi: number;
  declaredDaviplata: number;
  notes?: string;
}

export interface CashCloseResponseDto {
  id: number;
  closedByName: string;
  periodFrom: string;
  periodTo: string;
  totalEfectivo: number;
  totalTarjeta: number;
  totalNequi: number;
  totalDaviplata: number;
  totalSales: number;
  salesCount: number;
  declaredEfectivo: number;
  declaredTarjeta: number;
  declaredNequi: number;
  declaredDaviplata: number;
  diffEfectivo: number;
  diffTarjeta: number;
  diffNequi: number;
  diffDaviplata: number;
  notes: string | null;
  createdAt: string;
}
