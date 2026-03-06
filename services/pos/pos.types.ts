/**
 * Tipos para el módulo Punto de Venta (POS)
 */

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
  /** Tasa de IVA aplicada (0 = sin IVA, 0.16 = 16%) */
  taxRate: number;
  /** Monto de IVA = subtotal × taxRate */
  taxAmount: number;
  total: number;
  notes: string | null;
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
  page?: number;
  limit?: number;
}
