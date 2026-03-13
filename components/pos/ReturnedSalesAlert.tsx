'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CornerUpLeft, Pencil, ChevronDown, ChevronUp, X } from 'lucide-react';
import { getSales, type SaleResponseDto } from '@/services/pos';
import { useAuth } from '@/lib/auth-context';
import { onCrossTabInvalidation } from '@/lib/cross-tab-sync';
import { EditSaleModal } from './EditSaleModal';

/**
 * Banner de alerta que aparece en la pantalla del POS cuando el vendedor tiene
 * ventas devueltas pendientes de corrección.
 *
 * - Consulta las ventas PENDIENTE del vendedor actual filtrando por returnedAt != null.
 * - Se actualiza automáticamente via SSE cuando cambia el estado de ventas (pos-sales).
 * - Al corregir, la venta desaparece del banner (returnedAt se limpia en updateSale).
 */
export function ReturnedSalesAlert() {
  const { userId } = useAuth();
  const [returnedSales, setReturnedSales]   = useState<SaleResponseDto[]>([]);
  const [expanded, setExpanded]             = useState(true);
  const [editingSale, setEditingSale]       = useState<SaleResponseDto | null>(null);
  const [dismissed, setDismissed]           = useState(false);

  const loadReturnedSales = useCallback(async () => {
    if (!userId) return;
    try {
      // Traer ventas PENDIENTE del vendedor actual; filtramos returnedAt en cliente
      // (el API no tiene filtro directo por returnedAt todavía)
      const result = await getSales({
        statusCode: 'PENDIENTE',
        sellerId: userId,
        limit: 50,
      });
      const devueltas = result.data.filter((s) => !!s.returnedAt);
      setReturnedSales(devueltas);
      // Si hay nuevas ventas devueltas, volver a mostrar aunque estuviera cerrado
      if (devueltas.length > 0) {
        setDismissed(false);
        setExpanded(true);
      }
    } catch {
      // silencioso — no romper el POS por esto
    }
  }, [userId]);

  useEffect(() => {
    loadReturnedSales();
  }, [loadReturnedSales]);

  // Actualizar en tiempo real cuando el supervisor devuelve una venta
  useEffect(() => {
    return onCrossTabInvalidation('pos-sales', loadReturnedSales);
  }, [loadReturnedSales]);

  const formatDate = (s: string) =>
    new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(s));

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n);

  // No renderizar si no hay ventas devueltas o el usuario cerró el banner
  if (!userId || returnedSales.length === 0 || dismissed) return null;

  return (
    <>
      <div className="mx-4 mt-3 rounded-2xl border-2 border-amber-400 bg-amber-50 shadow-sm overflow-hidden">

        {/* ── Cabecera clickeable ── */}
        <button
          className="w-full flex items-center gap-3 px-4 py-3 text-left"
          onClick={() => setExpanded((v) => !v)}
        >
          {/* Ícono pulsante */}
          <span className="relative flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-amber-50 animate-pulse" />
          </span>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-900">
              {returnedSales.length === 1
                ? '1 venta fue devuelta para corrección'
                : `${returnedSales.length} ventas fueron devueltas para corrección`}
            </p>
            <p className="text-xs text-amber-700">
              Corrígelas antes de continuar vendiendo
            </p>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {expanded
              ? <ChevronUp className="w-4 h-4 text-amber-600" />
              : <ChevronDown className="w-4 h-4 text-amber-600" />
            }
            <button
              onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
              className="p-1 rounded-lg hover:bg-amber-200 text-amber-500 ml-1"
              title="Cerrar (las ventas siguen pendientes)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </button>

        {/* ── Lista de ventas devueltas ── */}
        {expanded && (
          <div className="border-t border-amber-200 divide-y divide-amber-100">
            {returnedSales.map((sale) => (
              <div key={sale.id} className="flex items-center gap-3 px-4 py-3">
                {/* Ícono */}
                <CornerUpLeft className="w-4 h-4 text-amber-500 flex-shrink-0" />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-amber-900">{sale.code}</span>
                    <span className="text-xs text-amber-700">{formatPrice(sale.total)}</span>
                    <span className="text-xs text-gray-400">{formatDate(sale.createdAt)}</span>
                  </div>
                  {sale.returnNotes && (
                    <p className="text-xs text-amber-800 mt-0.5 italic line-clamp-2">
                      Motivo: {sale.returnNotes}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {sale.items.length} producto{sale.items.length !== 1 ? 's' : ''}
                    {sale.clientName ? ` · ${sale.clientName}` : ''}
                  </p>
                </div>

                {/* Botón corregir */}
                <button
                  onClick={() => setEditingSale(sale)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors flex-shrink-0 shadow-sm"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Corregir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de edición */}
      {editingSale && (
        <EditSaleModal
          sale={editingSale}
          onClose={() => setEditingSale(null)}
          onSaved={(updated) => {
            // Quitar del banner (returnedAt ya fue limpiado por updateSale)
            setReturnedSales((prev) => prev.filter((s) => s.id !== updated.id));
            setEditingSale(null);
          }}
        />
      )}
    </>
  );
}
