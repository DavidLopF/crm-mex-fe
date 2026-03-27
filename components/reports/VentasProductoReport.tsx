'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, TrendingUp, Package, DollarSign, ChevronLeft, ChevronRight, Download, Loader2 } from 'lucide-react';
import { getVentasPorProducto } from '@/services/reports';
import type { VentaProductoRow, VentasProductoSummary } from '@/services/reports';
import { exportVentasProductoToExcel } from '@/lib/export-excel';
import { useCompany } from '@/lib/company-context';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-CO').format(value);
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center gap-4">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: color + '15' }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="text-base font-semibold text-zinc-900">{value}</p>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function VentasProductoReport() {
  const { settings } = useCompany();
  const primaryColor = settings.primaryColor;

  const [rows, setRows] = useState<VentaProductoRow[]>([]);
  const [summary, setSummary] = useState<VentasProductoSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const LIMIT = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getVentasPorProducto({
        search: search || undefined,
        from: from || undefined,
        to: to || undefined,
        page,
        limit: LIMIT,
      });
      setRows(result.rows);
      setSummary(result.summary);
      setTotalPages(result.pagination.totalPages);
      setHasNext(result.pagination.hasNextPage);
      setHasPrev(result.pagination.hasPrevPage);
    } catch (err) {
      setError('No se pudo cargar el reporte. Intenta nuevamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, from, to, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setPage(1);
  }

  function handleFromChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFrom(e.target.value);
    setPage(1);
  }

  function handleToChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTo(e.target.value);
    setPage(1);
  }

  // ── Exportar a Excel (trae TODOS los productos con los filtros activos) ──────
  async function handleExport() {
    setIsExporting(true);
    try {
      const result = await getVentasPorProducto({
        search: search || undefined,
        from:   from   || undefined,
        to:     to     || undefined,
        page:   1,
        limit:  10000, // traer todo
      });

      const dateTag = from
        ? `_${from.replace(/-/g, '')}${to ? '_' + to.replace(/-/g, '') : ''}`
        : '';

      exportVentasProductoToExcel(
        result.rows,
        result.summary,
        { from: from || undefined, to: to || undefined, search: search || undefined },
        `reporte_ventas_producto${dateTag}`,
      );
    } catch (err) {
      console.error('Error al exportar reporte de ventas por producto:', err);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Tarjetas de resumen */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            label="Productos con ventas"
            value={formatNumber(summary.totalProductos)}
            icon={Package}
            color={primaryColor}
          />
          <SummaryCard
            label="Unidades vendidas"
            value={formatNumber(summary.totalUnidades)}
            icon={TrendingUp}
            color="#10B981"
          />
          <SummaryCard
            label="Revenue total"
            value={formatCurrency(summary.totalRevenue)}
            icon={DollarSign}
            color="#F59E0B"
          />
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Buscador */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>

          {/* Fecha desde */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-400 flex-shrink-0" />
            <input
              type="date"
              value={from}
              onChange={handleFromChange}
              className="text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none"
              title="Fecha desde"
            />
          </div>

          {/* Fecha hasta */}
          <input
            type="date"
            value={to}
            onChange={handleToChange}
            className="text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none"
            title="Fecha hasta"
          />

          {/* Exportar */}
          <button
            onClick={handleExport}
            disabled={isExporting || loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-zinc-200 rounded-lg hover:bg-green-50 hover:border-green-300 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap ml-auto"
            title="Exportar todos los resultados a Excel"
          >
            {isExporting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Download className="w-4 h-4" />}
            {isExporting ? 'Exportando...' : 'Exportar Excel'}
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center py-16 text-zinc-400 text-sm">
            Cargando reporte...
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center justify-center py-16 text-red-500 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className="flex items-center justify-center py-16 text-zinc-400 text-sm">
            No hay datos para los filtros seleccionados.
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                    Producto
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                    Categoría
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                    Uds. POS
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                    Revenue POS
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                    Uds. Pedidos
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                    Revenue Pedidos
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                    Total Uds.
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                    Revenue Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {rows.map((row) => (
                  <tr
                    key={row.productId}
                    className="hover:bg-zinc-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {row.productName}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {row.categoryName ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-700">
                      {formatNumber(row.qtySoldPos)}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-700">
                      {formatCurrency(row.revenuePos)}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-700">
                      {formatNumber(row.qtySoldOrders)}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-700">
                      {formatCurrency(row.revenueOrders)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-zinc-900">
                      {formatNumber(row.qtyTotal)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold" style={{ color: primaryColor }}>
                      {formatCurrency(row.revenueTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {!loading && rows.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100">
            <span className="text-xs text-zinc-500">
              Página {page} de {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={!hasPrev}
                className="p-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 hover:bg-zinc-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-zinc-600" />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNext}
                className="p-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 hover:bg-zinc-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-zinc-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
