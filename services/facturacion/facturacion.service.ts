/**
 * Servicio de Facturación Electrónica DIAN
 *
 * Cliente HTTP dedicado al microservicio core-fe (NEXT_PUBLIC_FE_API_URL).
 * Usa el mismo JWT del CRM para autenticarse (secreto compartido).
 */

import type {
  CreateInvoiceFromSaleDto,
  EmitInvoiceResult,
  InvoicesListResponse,
  InvoicesQueryParams,
} from './facturacion.types';

// Base URL del microservicio FE (puerto 3005 por defecto)
const FE_BASE = (process.env.NEXT_PUBLIC_FE_API_URL ?? 'http://localhost:3005/api').replace(/\/$/, '');
const ACCESS_TOKEN_KEY = 'crm-auth-access-token';

// ── HTTP helpers ─────────────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

function buildFeHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function feRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${FE_BASE}${path}`;
  const res = await fetch(url, { ...options, headers: buildFeHeaders() });

  if (!res.ok) {
    const text = await res.text();
    let message = `Error ${res.status}`;
    try {
      const json = JSON.parse(text);
      message = json.message || message;
    } catch {
      // leave default message
    }
    throw new Error(message);
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.message || 'Error al procesar la solicitud');
  }
  return json.data as T;
}

// ── API calls ────────────────────────────────────────────────────────────────

/**
 * Emite una factura electrónica en la DIAN.
 * Retorna el documentId, CUFE y estado.
 */
export async function emitInvoice(dto: CreateInvoiceFromSaleDto): Promise<EmitInvoiceResult> {
  return feRequest<EmitInvoiceResult>('/invoices', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

/**
 * Lista facturas emitidas con filtros opcionales.
 */
export async function getInvoices(params?: InvoicesQueryParams): Promise<InvoicesListResponse> {
  const qs = params
    ? '?' +
      new URLSearchParams(
        Object.fromEntries(
          Object.entries(params)
            .filter(([, v]) => v != null && v !== '')
            .map(([k, v]) => [k, String(v)]),
        ),
      ).toString()
    : '';
  return feRequest<InvoicesListResponse>(`/invoices${qs}`, { method: 'GET' });
}

/**
 * Vincula el ID del documento FE a la venta en el CRM
 * para evitar doble facturación.
 */
export async function linkSaleToInvoice(
  saleId: number,
  feInvoiceId: number,
  feCufe?: string,
): Promise<void> {
  const CRM_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '');
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${CRM_BASE}/pos/sales/${saleId}/fe`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ feInvoiceId, ...(feCufe && { feCufe }) }),
  });

  if (!res.ok) {
    const text = await res.text();
    let message = `Error ${res.status}`;
    try { message = JSON.parse(text).message || message; } catch { /* noop */ }
    throw new Error(message);
  }
}

// ── Descarga de archivos con autenticación ───────────────────────────────────
// Los endpoints /xml y /zip requieren JWT → no se pueden usar con <a href>.
// Estas funciones hacen fetch con el token y devuelven un Blob para descarga.

async function feDownload(path: string): Promise<Blob> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${FE_BASE}${path}`, { method: 'GET', headers });

  if (!res.ok) {
    const text = await res.text();
    let message = `Error ${res.status}`;
    try { message = JSON.parse(text).message || message; } catch { /* noop */ }
    throw new Error(message);
  }

  return res.blob();
}

/**
 * Descarga el XML firmado como Blob autenticado.
 */
export function downloadInvoiceXml(invoiceId: number): Promise<Blob> {
  return feDownload(`/invoices/${invoiceId}/xml`);
}

/**
 * Descarga el ZIP DIAN como Blob autenticado.
 */
export function downloadInvoiceZip(invoiceId: number): Promise<Blob> {
  return feDownload(`/invoices/${invoiceId}/zip`);
}
