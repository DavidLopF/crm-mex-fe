/**
 * Tipos para el servicio de Facturación Electrónica DIAN (core-fe)
 */

// ── Comprador / Receptor de la factura ──────────────────────────────────────

export interface BuyerDto {
  name: string;
  nit: string;
  nitDv?: string;
  address: string;
  cityCode: string;
  cityName: string;
  departmentCode: string;
  departmentName: string;
  countryCode?: string;
  email: string;
  phone?: string;
}

// ── Impuesto por línea ───────────────────────────────────────────────────────

export type TaxCode = '01' | '03' | '04'; // IVA | INC | ICA

export interface TaxLineDto {
  taxCode: TaxCode;
  taxRate: number;    // porcentaje: ej. 19
  taxAmount: number;  // valor calculado
}

// ── Línea de la factura ──────────────────────────────────────────────────────

export interface InvoiceLineDto {
  description: string;
  quantity: number;
  unitCode?: string;
  unitPrice: number;
  discountAmount?: number;
  taxes?: TaxLineDto[];
}

// ── DTO de creación de factura ───────────────────────────────────────────────

export interface CreateInvoiceFromSaleDto {
  currency: string;
  paymentMeans: '1' | '2'; // 1=contado, 2=crédito
  paymentDueDate?: string;
  orderReference?: string;
  notes?: string;
  buyer: BuyerDto;
  lines: InvoiceLineDto[];
}

// ── Respuesta de la DIAN ─────────────────────────────────────────────────────

export type DianStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'ERROR';

export interface EmitInvoiceResult {
  documentId: number;
  cufe: string;
  dianStatus: DianStatus;
  statusMessage: string;
}

// ── Listado de facturas ──────────────────────────────────────────────────────

export interface InvoiceListItem {
  id: number;
  prefix: string;
  number: number;
  cufe: string;
  status: DianStatus;
  total: number;
  buyerName: string;
  buyerNit: string;
  issueDate: string;
  createdAt: string;
}

export interface InvoicesListResponse {
  data: InvoiceListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// ── Filtros de listado ───────────────────────────────────────────────────────

export interface InvoicesQueryParams {
  status?: DianStatus;
  buyerNit?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}
