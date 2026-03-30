'use client';

import { Printer, CheckCircle, XCircle, Copy, Check, Pencil, CornerUpLeft, Receipt } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { changeSaleStatus, type SaleResponseDto } from '@/services/pos';
import { useGlobalToast } from '@/lib/hooks';
import { broadcastInvalidation } from '@/lib/cross-tab-sync';
import { useConnectivity } from '@/lib/hooks/use-connectivity';
import { enqueueOperation } from '@/lib/offline/sync-manager';
import { useState } from 'react';
import { EditSaleModal } from './EditSaleModal';
import { ReturnSaleModal } from './ReturnSaleModal';
import { FacturacionElectronicaModal } from './FacturacionElectronicaModal';

interface Props {
  sale: SaleResponseDto;
  onClose: (clearCart?: boolean) => void;
  readOnly?: boolean;
}

export function RemisionModal({ sale: initialSale, onClose, readOnly = false }: Props) {
  const toast = useGlobalToast();
  const { isOnline } = useConnectivity();
  const [sale, setSale]           = useState<SaleResponseDto>(initialSale);
  const [processing, setProcessing] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showEdit, setShowEdit]     = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [showFE, setShowFE]         = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sale.code).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price);

  const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(dateStr));

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmPayment = async () => {
    try {
      setProcessing(true);

      if (!isOnline) {
        // Modo contingencia: encolar para sincronizar al recuperar conexión
        await enqueueOperation({
          method: 'PATCH',
          path: `/api/pos/sales/${sale.id}/status`,
          body: { newStatusCode: 'PAGADA' },
          module: 'pos',
        });
        // Actualización optimista local
        setSale((prev) => ({ ...prev, statusCode: 'PAGADA', status: 'Pagada' }));
        toast.success('El pago se sincronizará automáticamente al recuperar la conexión.', {
          title: '📋 Pago registrado en contingencia',
          duration: 7000,
        });
        onClose(true);
        return;
      }

      await changeSaleStatus(sale.id, 'PAGADA');
      broadcastInvalidation(['inventory', 'pos-sales', 'pos-dashboard']);
      toast.success('Pago registrado y stock actualizado', {
        title: '✅ ¡Venta confirmada!',
        code: sale.code,
        duration: 6000,
      });
      onClose(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al confirmar pago', {
        title: 'Error al confirmar',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    try {
      setProcessing(true);
      await changeSaleStatus(sale.id, 'ANULADA');
      // Reflejar anulación en historial y KPIs en tiempo real
      broadcastInvalidation(['pos-sales', 'pos-dashboard']);
      toast.warning('La venta fue marcada como anulada', {
        title: 'Venta anulada',
        code: sale.code,
      });
      onClose(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al anular la venta', {
        title: 'Error al anular',
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal isOpen onClose={() => onClose(false)} size="md" noPadding>
      <div className="flex flex-col">
        {/* Contenido imprimible */}
        <div id="remision-print" className="px-6 py-5 flex-1">
          {/* Header de remisión */}
          <div className="text-center border-b border-zinc-100 pb-5 mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Nota de Venta</p>
            <div className="flex items-center justify-center gap-1.5">
              <span className="font-mono text-base font-semibold text-zinc-900">{sale.code}</span>
              <button
                onClick={handleCopyCode}
                className="p-1 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors print:hidden"
                title="Copiar código"
                type="button"
              >
                {codeCopied
                  ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                  : <Copy className="w-3.5 h-3.5" />
                }
              </button>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">{formatDate(sale.createdAt)}</p>
          </div>

          {/* Info cliente / vendedor */}
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <p className="text-zinc-500">Cliente</p>
              <p className="font-medium">{sale.clientName || 'Público general'}</p>
            </div>
            <div>
              <p className="text-zinc-500">Vendedor</p>
              <p className="font-medium">{sale.sellerName || '—'}</p>
            </div>
          </div>

          {/* Tabla de items */}
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="text-left pb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Producto</th>
                <th className="text-center pb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 w-14">Cant.</th>
                <th className="text-right pb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 w-24">P. Unit.</th>
                <th className="text-right pb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 w-24">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => (
                <tr key={item.id} className="border-b border-zinc-100/80">
                  <td className="py-2.5">
                    <p className="font-medium text-zinc-900 text-sm">{item.productName}</p>
                    {item.variantName && (
                      <p className="text-xs text-zinc-400 mt-0.5">{item.variantName}</p>
                    )}
                    {item.appliedTierLabel && (
                      <p className="text-[10px] text-emerald-600 mt-0.5">{item.appliedTierLabel}</p>
                    )}
                  </td>
                  <td className="py-2.5 text-center text-zinc-700 tabular-nums">{item.qty}</td>
                  <td className="py-2.5 text-right text-zinc-700 tabular-nums">{formatPrice(item.unitPrice)}</td>
                  <td className="py-2.5 text-right font-semibold text-zinc-900 tabular-nums">{formatPrice(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total (con desglose IVA si aplica) */}
          <div className="border-t border-zinc-200 pt-3 space-y-1.5">
            {sale.taxAmount > 0 && (
              <>
                <div className="flex items-center justify-between text-sm text-zinc-500">
                  <span>Subtotal</span>
                  <span>{formatPrice(sale.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-zinc-500">
                  <span>IVA ({Math.round(sale.taxRate * 100)}%)</span>
                  <span>{formatPrice(sale.taxAmount)}</span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-semibold text-zinc-500 uppercase tracking-widest">Total</span>
              <span className="text-xl font-bold text-zinc-900 tabular-nums">{formatPrice(sale.total)}</span>
            </div>
          </div>

          {/* Notas */}
          {sale.notes && (
            <div className="mt-3 p-2 bg-zinc-50 rounded text-xs text-zinc-500">
              Notas: {sale.notes}
            </div>
          )}

          {/* Estado */}
          <div className="mt-4 flex justify-center">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide ${
                sale.statusCode === 'PAGADA'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : sale.statusCode === 'ANULADA'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {sale.status}
            </span>
          </div>

          {/* Facturación Electrónica DIAN — sección visible cuando la FE ya fue emitida */}
          {sale.feInvoiceId && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200/70 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                  Factura Electrónica DIAN · #{sale.feInvoiceId}
                </span>
              </div>
              {sale.feCufe && (
                <div>
                  <p className="text-[10px] text-emerald-600 mb-0.5 font-medium">CUFE</p>
                  <p className="font-mono text-[10px] text-emerald-900 break-all bg-emerald-100/60 px-2 py-1.5 rounded">
                    {sale.feCufe}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Acciones (no se imprimen) */}
        <div className="px-6 py-3.5 border-t border-zinc-100 print:hidden">
          <div className="flex items-center justify-between gap-2 flex-wrap">

            {/* Izquierda: acciones secundarias y destructivas */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="secondary" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5" />
                Imprimir
              </Button>

              {sale.statusCode === 'PENDIENTE' && !readOnly && (
                <Button variant="danger-outline" size="sm" onClick={handleCancel} disabled={processing}>
                  <XCircle className="w-3.5 h-3.5" />
                  Anular
                </Button>
              )}
            </div>

            {/* Derecha: flujo principal */}
            <div className="flex items-center gap-2 flex-wrap">
              {sale.statusCode === 'PAGADA' && sale.feInvoiceId && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-700">
                  <Receipt className="w-3.5 h-3.5" />
                  Facturada · #{sale.feInvoiceId}
                </span>
              )}

              {sale.statusCode === 'PAGADA' && !sale.feInvoiceId && (
                <Button variant="outline" size="sm" onClick={() => setShowFE(true)}>
                  <Receipt className="w-3.5 h-3.5" />
                  Factura Electrónica
                </Button>
              )}

              {sale.statusCode === 'PENDIENTE' && !readOnly && !sale.returnedAt && (
                <Button variant="outline" size="sm" onClick={() => setShowReturn(true)} disabled={processing}>
                  <CornerUpLeft className="w-3.5 h-3.5" />
                  Devolver
                </Button>
              )}

              {sale.statusCode === 'PENDIENTE' && (!readOnly || sale.returnedAt) && (
                <Button variant="outline" size="sm" onClick={() => setShowEdit(true)} disabled={processing}>
                  <Pencil className="w-3.5 h-3.5" />
                  {sale.returnedAt ? 'Corregir y reenviar' : 'Editar'}
                </Button>
              )}

              {sale.statusCode === 'PENDIENTE' && (!readOnly || sale.returnedAt) && (
                <Button variant="brand" size="sm" onClick={handleConfirmPayment} disabled={processing}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  {processing ? 'Procesando...' : 'Confirmar Pago'}
                </Button>
              )}

              <button
                type="button"
                onClick={() => onClose(sale.statusCode !== 'PENDIENTE')}
                className="px-2 py-1.5 text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Sub-modales — montados sobre el RemisionModal */}
      {showEdit && (
        <EditSaleModal
          sale={sale}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => { setSale(updated); setShowEdit(false); }}
        />
      )}

      {showReturn && (
        <ReturnSaleModal
          sale={sale}
          onClose={() => setShowReturn(false)}
          onReturned={(updated) => { setSale(updated); setShowReturn(false); }}
        />
      )}

      {showFE && (
        <FacturacionElectronicaModal
          sale={sale}
          onClose={() => setShowFE(false)}
          onSuccess={(result) => {
            // Actualiza el sale local → el badge cambia inmediatamente
            setSale((prev) => ({
              ...prev,
              feInvoiceId: result.documentId,
              feCufe: result.cufe,
            }));
            setShowFE(false);
          }}
        />
      )}
    </Modal>
  );
}
