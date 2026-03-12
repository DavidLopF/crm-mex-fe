/**
 * Tipos para el módulo Punto de Venta (POS)
 */

export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';

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
  /** Medio de pago (default: EFECTIVO) */
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
  totalTransferencia: number;
  sales: SaleResponseDto[];
}

export interface CreateCashCloseDto {
  periodFrom: string;
  periodTo: string;
  declaredEfectivo: number;
  declaredTarjeta: number;
  declaredTransferencia: number;
  notes?: string;
}

export interface CashCloseResponseDto {
  id: number;
  closedByName: string;
  periodFrom: string;
  periodTo: string;
  totalEfectivo: number;
  totalTarjeta: number;
  totalTransferencia: number;
  totalSales: number;
  salesCount: number;
  declaredEfectivo: number;
  declaredTarjeta: number;
  declaredTransferencia: number;
  diffEfectivo: number;
  diffTarjeta: number;
  diffTransferencia: number;
  notes: string | null;
  createdAt: string;
}
