'use client';

import { useState, useEffect, useCallback } from 'react';
import { useConnectivity } from '@/lib/hooks/use-connectivity';
import { 
  Search, Eye, FileText, User, Copy, Check, 
  ChevronLeft, ChevronRight, Pencil, CornerUpLeft, 
  Receipt, Download, Loader2, Calendar, Filter
} from 'lucide-react';
import { Card } from '@/components/ui';
import { getSales, getSaleById, type SaleResponseDto, type PaymentMethod } from '@/services/pos';
import { get } from '@/services/http-client';
import { useAuth } from '@/lib/auth-context';
import { onCrossTabInvalidation } from '@/lib/cross-tab-sync';
import { RemisionModal } from './RemisionModal';
import { EditSaleModal } from './EditSaleModal';
import { ReturnSaleModal } from './ReturnSaleModal';
import { FacturacionElectronicaModal } from './FacturacionElectronicaModal';
import { exportSalesToExcel } from '@/lib/export-excel';
import { cn } from '@/lib/utils';

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
      className="ml-1 p-1 rounded-lg hover:bg-zinc-100 text-zinc-300 hover:text-primary transition-all"
      title="Copiar código"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

/** Badge coloreado del medio de pago */
function PaymentBadge({ method }: { method: PaymentMethod }) {
  const styles: Record<PaymentMethod, string> = {
    EFECTIVO:  'bg-emerald-50 text-emerald-700 border-emerald-100',
    TARJETA:   'bg-blue-50 text-blue-700 border-blue-100',
    NEQUI:     'bg-pink-50 text-pink-700 border-pink-100',
    DAVIPLATA: 'bg-red-50 text-red-700 border-red-100',
  };
  const labels: Record<PaymentMethod, string> = {
    EFECTIVO:  'Efectivo',
    TARJETA:   'Tarjeta',
    NEQUI:     'Nequi',
    DAVIPLATA: 'Daviplata',
  };
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border shadow-xs",
      styles[method] ?? 'bg-zinc-50 text-zinc-600 border-zinc-100'
    )}>
      {labels[method] ?? method}
    </span>
  );
}

interface UserItem { id: number; fullName: string; }

const PAGE_SIZE_OPTIONS = [10, 15, 20, 50];

export function SalesList() {
  const { can } = useAuth();
  const canEdit = can('POS', 'canEdit');
  const { isOnline } = useConnectivity();

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
  const [feSale, setFeSale]               = useState<SaleResponseDto | null>(null);
  const [isExporting, setIsExporting]     = useState(false);

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

  useEffect(() => {
    return onCrossTabInvalidation('pos-sales', () => {
      setPage(1);
      loadSales();
    });
  }, [loadSales]);

  const handleViewSale = async (saleId: number) => {
    if (!isOnline) {
      const cached = sales.find((s) => s.id === saleId);
      if (cached) { setSelectedSale(cached); return; }
    }
    try {
      const sale = await getSaleById(saleId);
      setSelectedSale(sale);
    } catch (err) {
      const cached = sales.find((s) => s.id === saleId);
      if (cached) { setSelectedSale(cached); return; }
      console.error('Error cargando venta:', err);
    }
  };

  const handleModalClose = (statusChanged?: boolean) => {
    setSelectedSale(null);
    if (statusChanged) loadSales();
  };

  const fmt  = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);
  const fmtD = (s: string) => new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(s));

  const statusColor = (code: string) => {
    if (code === 'PAGADA')  return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (code === 'ANULADA') return 'bg-rose-50 text-rose-700 border-rose-100';
    return 'bg-amber-50 text-amber-700 border-amber-100';
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await getSales({
        search:        search        || undefined,
        statusCode:    filterStatus  || undefined,
        from:          filterFrom    || undefined,
        to:            filterTo      || undefined,
        sellerId:      filterSellerId !== '' ? Number(filterSellerId) : undefined,
        paymentMethod: filterPayment || undefined,
        page:  1,
        limit: 5000, 
      });

      const sellerLabel = filterSellerId !== ''
        ? (users.find((u) => u.id === Number(filterSellerId))?.fullName ?? String(filterSellerId))
        : undefined;

      const dateTag = filterFrom
        ? `_${filterFrom.replace(/-/g, '')}${filterTo ? '_' + filterTo.replace(/-/g, '') : ''}`
        : '';

      exportSalesToExcel(
        result.data,
        {
          from:    filterFrom    || undefined,
          to:      filterTo      || undefined,
          status:  filterStatus  || undefined,
          payment: filterPayment || undefined,
          seller:  sellerLabel,
        },
        `reporte_ventas${dateTag}`,
      );
    } catch (err) {
      console.error('Error al exportar ventas:', err);
    } finally {
      setIsExporting(false);
    }
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

  const selectCls = "h-10 px-3 text-xs font-bold bg-white border-2 border-zinc-100 rounded-xl focus:outline-none focus:border-primary transition-all";

  return (
    <>
      <div className="card-premium p-6 bg-white space-y-6">
        {/* ── Filtros Avanzados ── */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Buscar por código, cliente o vendedor..."
                className="w-full h-12 pl-11 pr-4 text-sm font-bold bg-zinc-50/50 border-2 border-zinc-100 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                value={search}
                onChange={(e) => { setSearch(e.target.value); resetPage(); }}
              />
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting || loading}
              className="h-12 px-6 rounded-2xl bg-emerald-50 text-emerald-700 font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 border-2 border-emerald-100 hover:bg-emerald-100 transition-all disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{isExporting ? 'Exportando...' : 'Exportar Excel'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-zinc-400">
              <Filter className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Filtros:</span>
            </div>
            
            <select
              className={selectCls}
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); resetPage(); }}
            >
              <option value="">Estados</option>
              <option value="PENDIENTE">⏳ Pendientes</option>
              <option value="PAGADA">✅ Pagadas</option>
              <option value="ANULADA">❌ Anuladas</option>
            </select>

            <select
              className={selectCls}
              value={filterPayment}
              onChange={(e) => { setFilterPayment(e.target.value as PaymentMethod | ''); resetPage(); }}
            >
              <option value="">Medios de Pago</option>
              <option value="EFECTIVO">💵 Efectivo</option>
              <option value="TARJETA">💳 Tarjeta</option>
              <option value="NEQUI">👛 Nequi</option>
              <option value="DAVIPLATA">📱 Daviplata</option>
            </select>

            <select
              className={cn(selectCls, "max-w-[180px]")}
              value={filterSellerId}
              onChange={(e) => { setFilterSellerId(e.target.value === '' ? '' : Number(e.target.value)); resetPage(); }}
            >
              <option value="">Todos los vendedores</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
            </select>

            <div className="flex items-center gap-2 ml-auto">
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-50 rounded-xl border border-zinc-100">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <input type="date" className="bg-transparent text-xs font-bold text-zinc-600 outline-none"
                  value={filterFrom} onChange={(e) => { setFilterFrom(e.target.value); resetPage(); }} />
                <span className="text-zinc-300 text-xs">—</span>
                <input type="date" className="bg-transparent text-xs font-bold text-zinc-600 outline-none"
                  value={filterTo} onChange={(e) => { setFilterTo(e.target.value); resetPage(); }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Contenido ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-zinc-100 border-t-primary animate-spin" />
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Cargando Ventas...</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-300">
            <FileText className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm font-bold uppercase tracking-widest">No se encontraron ventas</p>
          </div>
        ) : (
          <>
            {/* ── Vista tabla (md+) ── */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-100">
                    <th className="text-left pb-4 px-2">Código</th>
                    <th className="text-left pb-4 px-2">Fecha</th>
                    <th className="text-left pb-4 px-2">Cliente</th>
                    <th className="text-left pb-4 px-2">Vendedor</th>
                    <th className="text-right pb-4 px-2">Total</th>
                    <th className="text-center pb-4 px-2">Pago</th>
                    <th className="text-center pb-4 px-2">Estado</th>
                    <th className="text-right pb-4 px-2">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="group hover:bg-zinc-50/50 transition-colors">
                      <td className="py-4 px-2">
                        <span className="flex items-center gap-1">
                          <span className="font-mono text-[11px] font-bold text-zinc-900">{sale.code}</span>
                          <CopyCodeBtn code={sale.code} />
                        </span>
                      </td>
                      <td className="py-4 px-2 text-xs font-bold text-zinc-500 whitespace-nowrap">{fmtD(sale.createdAt)}</td>
                      <td className="py-4 px-2 text-xs font-black text-zinc-900 uppercase truncate max-w-[150px]">{sale.clientName || 'Público general'}</td>
                      <td className="py-4 px-2 text-xs font-bold text-zinc-400">{sale.sellerName || '—'}</td>
                      <td className="py-4 px-2 text-right font-black text-zinc-900 whitespace-nowrap">{fmt(sale.total)}</td>
                      <td className="py-4 px-2 text-center">
                        <PaymentBadge method={sale.paymentMethod} />
                      </td>
                      <td className="py-4 px-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border",
                            statusColor(sale.statusCode)
                          )}>
                            {sale.status}
                          </span>
                          {sale.returnedAt && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter bg-amber-100 text-amber-800 border border-amber-200"
                              title={sale.returnNotes ? `Motivo: ${sale.returnNotes}` : 'Devuelta al vendedor'}
                            >
                              <CornerUpLeft className="w-2.5 h-2.5" />
                              Devuelta
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="p-2 rounded-xl text-zinc-400 hover:text-primary hover:bg-white hover:shadow-md transition-all"
                            onClick={() => handleViewSale(sale.id)}
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {sale.statusCode === 'PENDIENTE' && (canEdit || !!sale.returnedAt) && (
                            <button
                              className={cn(
                                "p-2 rounded-xl transition-all hover:shadow-md",
                                sale.returnedAt ? 'text-amber-500 hover:bg-white' : 'text-zinc-400 hover:text-blue-600 hover:bg-white'
                              )}
                              onClick={() => setEditSale(sale)}
                              title={sale.returnedAt ? 'Corregir venta devuelta' : 'Editar venta'}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {canEdit && sale.statusCode === 'PENDIENTE' && !sale.returnedAt && (
                            <button
                              className="p-2 rounded-xl text-zinc-400 hover:text-amber-600 hover:bg-white hover:shadow-md transition-all"
                              onClick={() => setReturnSale(sale)}
                              title="Devolver al vendedor"
                            >
                              <CornerUpLeft className="w-4 h-4" />
                            </button>
                          )}
                          {sale.statusCode === 'PAGADA' && (
                            sale.feInvoiceId ? (
                              <span
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-tighter bg-emerald-50 text-emerald-700 border border-emerald-100"
                                title={`Facturada electrónicamente · Doc #${sale.feInvoiceId}`}
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                FE #{sale.feInvoiceId}
                              </span>
                            ) : (
                              <button
                                className="p-2 rounded-xl text-zinc-400 hover:text-emerald-600 hover:bg-white hover:shadow-md transition-all disabled:opacity-30"
                                onClick={() => isOnline && setFeSale(sale)}
                                disabled={!isOnline}
                                title={isOnline ? 'Generar Factura Electrónica DIAN' : 'Requiere conexión a internet'}
                              >
                                <Receipt className="w-4 h-4" />
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Vista cards (mobile) ── */}
            <div className="md:hidden space-y-3">
              {sales.map((sale) => (
                <div
                  key={sale.id}
                  className="card-premium p-4 bg-zinc-50/50 border-zinc-100"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs font-black text-zinc-900">{sale.code}</span>
                        <CopyCodeBtn code={sale.code} />
                      </div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{fmtD(sale.createdAt)}</p>
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border",
                      statusColor(sale.statusCode)
                    )}>
                      {sale.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-black text-zinc-900 uppercase truncate max-w-[180px]">
                      {sale.clientName || 'Público general'}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400">{sale.sellerName || '—'}</span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                    <div className="flex items-center gap-2">
                      <PaymentBadge method={sale.paymentMethod} />
                      <span className="text-[10px] font-bold text-zinc-400">{sale.items.length} uds.</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-zinc-900">{fmt(sale.total)}</span>
                      <button
                        className="p-2 rounded-xl bg-white shadow-sm text-zinc-400 active:scale-95 transition-all"
                        onClick={() => handleViewSale(sale.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Paginación mejorada ── */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-zinc-100">
              <div className="flex items-center gap-4">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  {total === 0 ? 'Sin resultados' : `Mostrando ${rangeFrom}–${rangeTo} de ${total}`}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Filas:</span>
                  <select
                    className="h-8 px-2 text-[10px] font-black bg-zinc-50 border border-zinc-100 rounded-lg outline-none focus:border-primary transition-all"
                    value={limit}
                    onChange={(e) => { setLimit(Number(e.target.value)); resetPage(); }}
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-zinc-400 hover:text-primary hover:bg-zinc-50 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {getPageNumbers().map((p, i) =>
                  p === '...'
                    ? <span key={`e${i}`} className="w-8 text-center text-xs font-black text-zinc-300">…</span>
                    : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={cn(
                          "w-9 h-9 rounded-xl text-[11px] font-black transition-all",
                          p === page
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110'
                            : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50'
                        )}
                      >
                        {p}
                      </button>
                    )
                )}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-zinc-400 hover:text-primary hover:bg-zinc-50 disabled:opacity-30 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedSale && (
        <RemisionModal
          sale={selectedSale}
          onClose={handleModalClose}
          readOnly={!canEdit}
        />
      )}

      {editSale && (
        <EditSaleModal
          sale={editSale}
          onClose={() => setEditSale(null)}
          onSaved={(updated) => {
            setSales((prev) => prev.map((s) => s.id === updated.id ? updated : s));
            setEditSale(null);
          }}
        />
      )}

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

      {feSale && (
        <FacturacionElectronicaModal
          sale={feSale}
          onClose={() => setFeSale(null)}
          onSuccess={(result) => {
            setSales((prev) =>
              prev.map((s) =>
                s.id === feSale.id
                  ? { ...s, feInvoiceId: result.documentId, feCufe: result.cufe }
                  : s,
              ),
            );
          }}
        />
      )}
    </>
  );
}
