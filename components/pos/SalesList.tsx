'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, FileText } from 'lucide-react';
import { Card } from '@/components/ui';
import { getSales, getSaleById, type SaleResponseDto } from '@/services/pos';
import { RemisionModal } from './RemisionModal';

export function SalesList() {
  const [sales, setSales] = useState<SaleResponseDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [selectedSale, setSelectedSale] = useState<SaleResponseDto | null>(null);

  const limit = 15;

  const loadSales = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getSales({
        search: search || undefined,
        statusCode: filterStatus || undefined,
        from: filterFrom || undefined,
        to: filterTo || undefined,
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
  }, [search, filterStatus, filterFrom, filterTo, page]);

  useEffect(() => {
    const timer = setTimeout(loadSales, 300);
    return () => clearTimeout(timer);
  }, [loadSales]);

  const handleViewSale = async (saleId: number) => {
    try {
      const sale = await getSaleById(saleId);
      setSelectedSale(sale);
    } catch (err) {
      console.error('Error cargando venta:', err);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price);

  const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(dateStr));

  const statusColor = (code: string) => {
    switch (code) {
      case 'PAGADA':
        return 'bg-green-100 text-green-800';
      case 'ANULADA':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <Card className="p-4">
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código o cliente..."
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          >
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="PAGADA">Pagada</option>
            <option value="ANULADA">Anulada</option>
          </select>
          <input
            type="date"
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50"
            value={filterFrom}
            onChange={(e) => { setFilterFrom(e.target.value); setPage(1); }}
          />
          <span className="text-gray-400 text-sm">a</span>
          <input
            type="date"
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50"
            value={filterTo}
            onChange={(e) => { setFilterTo(e.target.value); setPage(1); }}
          />
        </div>

        {/* Tabla */}
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
                  <tr className="border-b-2 border-gray-200 text-gray-500">
                    <th className="text-left py-2 px-3">Código</th>
                    <th className="text-left py-2 px-3">Fecha</th>
                    <th className="text-left py-2 px-3">Cliente</th>
                    <th className="text-center py-2 px-3">Items</th>
                    <th className="text-right py-2 px-3">Total</th>
                    <th className="text-center py-2 px-3">Estado</th>
                    <th className="text-center py-2 px-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-mono text-xs">{sale.code}</td>
                      <td className="py-2.5 px-3 text-gray-600">{formatDate(sale.createdAt)}</td>
                      <td className="py-2.5 px-3">{sale.clientName || 'Público general'}</td>
                      <td className="py-2.5 px-3 text-center">{sale.items.length}</td>
                      <td className="py-2.5 px-3 text-right font-semibold">{formatPrice(sale.total)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(sale.statusCode)}`}>
                          {sale.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-primary"
                          onClick={() => handleViewSale(sale.id)}
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-2">
                <p className="text-xs text-gray-500">
                  {total} ventas en total
                </p>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium ${
                        p === page
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Modal de detalle */}
      {selectedSale && (
        <RemisionModal
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
          readOnly
        />
      )}
    </>
  );
}
