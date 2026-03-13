'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, FileText, User, Copy, Check, ChevronLeft, ChevronRight, Pencil, CornerUpLeft } from 'lucide-react';
import { Card } from '@/components/ui';
import { getSales, getSaleById, type SaleResponseDto, type PaymentMethod } from '@/services/pos';
import { get } from '@/services/http-client';
import { useAuth } from '@/lib/auth-context';
import { onCrossTabInvalidation } from '@/lib/cross-tab-sync';
import { RemisionModal } from './RemisionModal';
import { EditSaleModal } from './EditSaleModal';
import { ReturnSaleModal } from './ReturnSaleModal';

/** Botón copiar inline para códigos en la tabla */
function CopyCodeBtn({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={(e) => { e.stopPropagation(); handle(); }}
      className="ml-1 p-0.5 rounded hover:bg-gray-200 text-gray-300 hover:text-gray-600 transition-colors"
      title="Copiar código"
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

/** Badge coloreado del medio de pago */
function PaymentBadge({ method }: { method: PaymentMethod }) {
  const styles: Record<PaymentMethod, string> = {
    EFECTIVO:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
    TARJETA:   'bg-blue-50 text-blue-700 border border-blue-200',
    NEQUI:     'bg-pink-50 text-pink-700 border border-pink-200',
    DAVIPLATA: 'bg-red-50 text-red-700 border border-red-200',
  };
  const labels: Record<PaymentMethod, string> = {
    EFECTIVO:  'Efectivo',
    TARJETA:   'Tarjeta',
    NEQUI:     'Nequi',
    DAVIPLATA: 'Daviplata',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[method] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[method] ?? method}
    </span>
  );
}

interface UserItem { id: number; fullName: string; }

const PAGE_SIZE_OPTIONS = [10, 15, 20, 50];

export function SalesList() {
  const { can } = useAuth();
  const canEdit = can('POS', 'canEdit');

  const [sales, setSales]               = useState<SaleResponseDto[]>([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [page, setPage]                 = useState(1);
  const [limit, setLimit]               = useState(15);
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFrom, setFilterFrom]     = useState('');
  const [filterTo, setFilterTo]         = useState('');
  const [filterSellerId, setFilterSellerId] = useState<number | ''>('');
  const [filterPayment, setFilterPayment]   = useState<PaymentMethod | ''>('');
  const [users, setUsers]               = useState<UserItem[]>([]);
  const [selectedSale, setSelectedSale]   = useState<SaleResponseDto | null>(null);
  const [editSale, setEditSale]           = useState<SaleResponseDto | null>(null);
  const [returnSale, setReturnSale]       = useState<SaleResponseDto | null>(null);

  useEffect(() => {
    get<UserItem[]>('/api/users', { limit: 100, active: 'true' })
      .then((data) => { setUsers(Array.isArray(data) ? data : []); })
      .catch(() => setUsers([]));
  }, []);

  const loadSales = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getSales({
        search: search || undefined,
        statusCode: filterStatus || undefined,
        from: filterFrom || undefined,
        to: filterTo || undefined,
        sellerId: filterSellerId !== '' ? Number(filterSellerId) : undefined,
        paymentMethod: filterPayment || undefined,
        page,
        limit,
      });
      setSales(result.data);
      setTotal(result.total);
    } catch (err) {
      console.error('Error cargando ventas:', err);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterFrom, filterTo, filterSellerId, filterPayment, page, limit]);

  useEffect(() => {
    const timer = setTimeout(loadSales, 300);
    return () => clearTimeout(timer);
  }, [loadSales]);

  // Tiempo real: recargar cuando se cree o cambie una venta
  useEffect(() => {
    return onCrossTabInvalidation('pos-sales', () => {
      setPage(1);
      loadSales();
    });
  }, [loadSales]);

  const handleViewSale = async (saleId: number) => {
    try {
      const sale = await getSaleById(saleId);
      setSelectedSale(sale);
    } catch (err) {
      console.error('Error cargando venta:', err);
    }
  };

  const handleModalClose = (statusChanged?: boolean) => {
    setSelectedSale(null);
    if (statusChanged) loadSales();
  };

  const fmt  = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
  const fmtD = (s: string) => new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(s));

  const statusColor = (code: string) => {
    if (code === 'PAGADA')  return 'bg-green-100 text-green-800';
    if (code === 'ANULADA') return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const rangeFrom  = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeTo    = Math.min(page * limit, total);
  const resetPage  = () => setPage(1);

  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (page > 3) pages.push('...');
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) pages.push(p);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return (
    <>
      <Card className="p-4">
        {/* ── Filtros ── */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código, cliente o vendedor..."
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50"
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            />
          </div>

          <select
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); resetPage(); }}
          >
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="PAGADA">Pagada</option>
            <option value="ANULADA">Anulada</option>
          </select>

          <select
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50"
            value={filterPayment}
            onChange={(e) => { setFilterPayment(e.target.value as PaymentMethod | ''); resetPage(); }}
          >
            <option value="">Todos los medios</option>
            <option value="EFECTIVO">Efectivo</option>
            <option value="TARJETA">Tarjeta</option>
            <option value="NEQUI">Nequi</option>
            <option value="DAVIPLATA">Daviplata</option>
          </select>

          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50"
              value={filterSellerId}
              onChange={(e) => { setFilterSellerId(e.target.value === '' ? '' : Number(e.target.value)); resetPage(); }}
            >
              <option value="">Todos los vendedores</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
            </select>
          </div>

          <input type="date" className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50"
            value={filterFrom} onChange={(e) => { setFilterFrom(e.target.value); resetPage(); }} />
          <span className="text-gray-400 text-sm">a</span>
          <input type="date" className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50"
            value={filterTo} onChange={(e) => { setFilterTo(e.target.value); resetPage(); }} />
        </div>

        {/* ── Tabla ── */}
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No se encontraron ventas</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="text-left py-2 px-3">Código</th>
                    <th className="text-left py-2 px-3">Fecha</th>
                    <th className="text-left py-2 px-3">Cliente</th>
                    <th className="text-left py-2 px-3">Vendedor</th>
                    <th className="text-center py-2 px-3">Items</th>
                    <th className="text-right py-2 px-3">Total</th>
                    <th className="text-center py-2 px-3">Pago</th>
                    <th className="text-center py-2 px-3">Estado</th>
                    <th className="text-center py-2 px-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="flex items-center gap-0.5">
                          <span className="font-mono text-xs">{sale.code}</span>
                          <CopyCodeBtn code={sale.code} />
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">{fmtD(sale.createdAt)}</td>
                      <td className="py-2.5 px-3">{sale.clientName || 'Público general'}</td>
                      <td className="py-2.5 px-3 text-gray-600">{sale.sellerName || '—'}</td>
                      <td className="py-2.5 px-3 text-center">{sale.items.length}</td>
                      <td className="py-2.5 px-3 text-right font-semibold whitespace-nowrap">{fmt(sale.total)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <PaymentBadge method={sale.paymentMethod} />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(sale.statusCode)}`}>
                            {sale.status}
                          </span>
                          {/* Badge "Devuelta" — solo si fue devuelta al vendedor */}
                          {sale.returnedAt && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200"
                              title={sale.returnNotes ? `Motivo: ${sale.returnNotes}` : 'Devuelta al vendedor'}
                            >
                              <CornerUpLeft className="w-2.5 h-2.5" />
                              Devuelta
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Ver detalle */}
                          <button
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-primary transition-colors"
                            onClick={() => handleViewSale(sale.id)}
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {/* Editar — solo PENDIENTE + canEdit */}
                          {canEdit && sale.statusCode === 'PENDIENTE' && (
                            <button
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                              onClick={() => setEditSale(sale)}
                              title="Editar venta"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {/* Devolver — solo PENDIENTE + canEdit */}
                          {canEdit && sale.statusCode === 'PENDIENTE' && (
                            <button
                              className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"
                              onClick={() => setReturnSale(sale)}
                              title="Devolver al vendedor"
                            >
                              <CornerUpLeft className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Paginación mejorada ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-gray-100">
              {/* Info y selector de filas por página */}
              <div className="flex items-center gap-3">
                <p className="text-xs text-gray-500">
                  {total === 0
                    ? 'Sin resultados'
                    : `Mostrando ${rangeFrom}–${rangeTo} de ${total} ventas`}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400">Filas:</span>
                  <select
                    className="text-xs border border-gray-200 rounded-md px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary/40"
                    value={limit}
                    onChange={(e) => { setLimit(Number(e.target.value)); resetPage(); }}
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Navegación de páginas */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {getPageNumbers().map((p, i) =>
                  p === '...'
                    ? <span key={`e${i}`} className="w-6 text-center text-xs text-gray-400">…</span>
                    : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`min-w-[2rem] h-8 px-2 rounded-lg text-xs font-medium transition-colors ${
                          p === page
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {p}
                      </button>
                    )
                )}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Página siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </Card>

      {selectedSale && (
        <RemisionModal
          sale={selectedSale}
          onClose={handleModalClose}
          readOnly={!canEdit}
        />
      )}

      {/* Modal de edición directa desde la lista */}
      {editSale && (
        <EditSaleModal
          sale={editSale}
          onClose={() => setEditSale(null)}
          onSaved={(updated) => {
            // Actualizar la fila localmente sin recargar todo
            setSales((prev) => prev.map((s) => s.id === updated.id ? updated : s));
            setEditSale(null);
          }}
        />
      )}

      {/* Modal de devolución directa desde la lista */}
      {returnSale && (
        <ReturnSaleModal
          sale={returnSale}
          onClose={() => setReturnSale(null)}
          onReturned={(updated) => {
            setSales((prev) => prev.map((s) => s.id === updated.id ? updated : s));
            setReturnSale(null);
          }}
        />
      )}
    </>
  );
}
