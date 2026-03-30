/**
 * Utilidades de exportación a Excel (SheetJS).
 *
 * Dos funciones principales:
 *  - exportSalesToExcel   → 2 hojas: "Ventas" (resumen) + "Detalle Ítems"
 *  - exportVentasProductoToExcel → 1 hoja con meta, datos y fila de totales
 *
 * Diseño: 100% cliente — no necesita nuevos endpoints de backend.
 * El llamador se encarga de traer todos los datos (limit alto) antes de invocar.
 */

import * as XLSX from 'xlsx';
import type { SaleResponseDto } from '@/services/pos';
import type { VentaProductoRow, VentasProductoSummary } from '@/services/reports';

// ── Helpers ───────────────────────────────────────────────────────────────────

const PAYMENT_LABELS: Record<string, string> = {
  EFECTIVO:  'Efectivo',
  TARJETA:   'Tarjeta',
  NEQUI:     'Nequi',
  DAVIPLATA: 'Daviplata',
};

const STATUS_LABELS: Record<string, string> = {
  PAGADA:    'Pagada',
  ANULADA:   'Anulada',
  PENDIENTE: 'Pendiente',
};

function fmtDatetime(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
}

function setColWidths(ws: XLSX.WorkSheet, widths: number[]) {
  ws['!cols'] = widths.map((wch) => ({ wch }));
}

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-]/g, '_');
}

// ── Export: Ventas POS ────────────────────────────────────────────────────────

export interface ExportSalesMeta {
  from?: string;
  to?: string;
  status?: string;
  payment?: string;
  seller?: string;
}

/**
 * Genera y descarga un .xlsx con dos hojas:
 *  - "Ventas": una fila por venta con totales al pie
 *  - "Detalle Ítems": una fila por ítem de venta
 */
export function exportSalesToExcel(
  sales: SaleResponseDto[],
  meta: ExportSalesMeta = {},
  filename = 'reporte_ventas',
): void {
  const wb = XLSX.utils.book_new();

  // ── Hoja 1: Ventas ────────────────────────────────────────────────────────
  const metaBlock: unknown[][] = [];
  metaBlock.push(['Reporte de Ventas POS']);
  metaBlock.push(['Generado:', fmtDatetime(new Date().toISOString())]);
  if (meta.from || meta.to) {
    metaBlock.push(['Período:', `${meta.from ? fmtDate(meta.from) : '—'}  →  ${meta.to ? fmtDate(meta.to) : '—'}`]);
  }
  if (meta.status)  metaBlock.push(['Estado:', meta.status]);
  if (meta.payment) metaBlock.push(['Método pago:', meta.payment]);
  if (meta.seller)  metaBlock.push(['Vendedor:', meta.seller]);
  metaBlock.push([]); // línea en blanco antes de la cabecera

  const ventas_headers = [
    'Código', 'Fecha', 'Cliente', 'Vendedor',
    'Núm. Ítems', 'Subtotal', 'IVA', 'Total',
    'Método Pago', 'Estado', 'Factura Elect.',
  ];

  const ventasRows: unknown[][] = sales.map((s) => [
    s.code,
    fmtDatetime(s.createdAt),
    s.clientName  || 'Público general',
    s.sellerName  || '—',
    s.items.length,
    Number(s.subtotal),
    Number(s.taxAmount),
    Number(s.total),
    PAYMENT_LABELS[s.paymentMethod] ?? s.paymentMethod,
    STATUS_LABELS[s.statusCode]     ?? s.status,
    s.feInvoiceId ? `FE #${s.feInvoiceId}` : '—',
  ]);

  // Totales (excluye anuladas)
  const ventasValidas = sales.filter((s) => s.statusCode !== 'ANULADA');
  const totals = ventasValidas.reduce(
    (acc, s) => ({
      subtotal:  acc.subtotal  + Number(s.subtotal),
      taxAmount: acc.taxAmount + Number(s.taxAmount),
      total:     acc.total     + Number(s.total),
    }),
    { subtotal: 0, taxAmount: 0, total: 0 },
  );

  const totalsRow: unknown[] = [
    `TOTAL (${ventasValidas.length} ventas pagadas/pendientes)`,
    '', '', '', ventasValidas.reduce((n, s) => n + s.items.length, 0),
    totals.subtotal, totals.taxAmount, totals.total,
    '', '', '',
  ];

  const ws1Data: unknown[][] = [
    ...metaBlock,
    ventas_headers,
    ...ventasRows,
    [],
    totalsRow,
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);
  setColWidths(ws1, [16, 20, 26, 22, 10, 13, 11, 13, 14, 12, 16]);
  XLSX.utils.book_append_sheet(wb, ws1, 'Ventas');

  // ── Hoja 2: Detalle de ítems ──────────────────────────────────────────────
  const items_headers = [
    'Código Venta', 'Fecha', 'Cliente', 'Vendedor', 'Estado',
    'Producto', 'SKU', 'Variante', 'Tier de Precio',
    'Cantidad', 'Precio Unitario', 'Total Línea',
  ];

  const itemRows: unknown[][] = [];
  for (const s of sales) {
    for (const item of s.items) {
      itemRows.push([
        s.code,
        fmtDatetime(s.createdAt),
        s.clientName || 'Público general',
        s.sellerName || '—',
        STATUS_LABELS[s.statusCode] ?? s.status,
        item.productName,
        item.sku,
        item.variantName      || '—',
        item.appliedTierLabel || '—',
        item.qty,
        Number(item.unitPrice),
        Number(item.lineTotal),
      ]);
    }
  }

  const ws2 = XLSX.utils.aoa_to_sheet([items_headers, ...itemRows]);
  setColWidths(ws2, [16, 20, 24, 20, 12, 28, 14, 18, 18, 8, 14, 14]);
  XLSX.utils.book_append_sheet(wb, ws2, 'Detalle Ítems');

  XLSX.writeFile(wb, `${safeFilename(filename)}.xlsx`);
}

// ── Export: Ventas por Producto ───────────────────────────────────────────────

export interface ExportVentasProductoMeta {
  from?: string;
  to?: string;
  search?: string;
}

/**
 * Genera y descarga un .xlsx con una hoja que incluye:
 * - Bloque de metadatos en la parte superior
 * - Tabla de datos (un producto por fila)
 * - Fila de totales al pie
 */
export function exportVentasProductoToExcel(
  rows: VentaProductoRow[],
  summary: VentasProductoSummary,
  meta: ExportVentasProductoMeta = {},
  filename = 'reporte_ventas_por_producto',
): void {
  const wb = XLSX.utils.book_new();

  const sheetData: unknown[][] = [];

  // Metadata
  sheetData.push(['Reporte: Ventas por Producto']);
  sheetData.push(['Generado:', fmtDatetime(new Date().toISOString())]);
  if (meta.from || meta.to) {
    sheetData.push(['Período:', `${meta.from ? fmtDate(meta.from) : '—'}  →  ${meta.to ? fmtDate(meta.to) : '—'}`]);
  }
  if (meta.search) sheetData.push(['Filtro:', meta.search]);
  sheetData.push([]);

  // Cabecera de tabla
  sheetData.push([
    'Producto', 'Categoría',
    'Uds. POS', 'Revenue POS',
    'Uds. Pedidos', 'Revenue Pedidos',
    'Total Uds.', 'Revenue Total',
  ]);

  // Datos
  for (const row of rows) {
    sheetData.push([
      row.productName,
      row.categoryName ?? '—',
      row.qtySoldPos,
      Number(row.revenuePos),
      row.qtySoldOrders,
      Number(row.revenueOrders),
      row.qtyTotal,
      Number(row.revenueTotal),
    ]);
  }

  // Fila de totales
  sheetData.push([]);
  sheetData.push([
    `TOTAL (${summary.totalProductos} productos)`, '—',
    '', '',
    '', '',
    summary.totalUnidades,
    Number(summary.totalRevenue),
  ]);

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  setColWidths(ws, [32, 18, 10, 16, 14, 18, 12, 18]);
  XLSX.utils.book_append_sheet(wb, ws, 'Ventas x Producto');

  XLSX.writeFile(wb, `${safeFilename(filename)}.xlsx`);
}
