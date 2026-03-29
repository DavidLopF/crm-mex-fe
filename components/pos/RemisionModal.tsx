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
    <Modal isOpen onClose={() => onClose(false)} size="md">
      <div className="w-full mx-auto">
        {/* Contenido imprimible */}
        <div id="remision-print" className="p-6">
          {/* Header de remisión */}
          <div className="text-center border-b pb-4 mb-4">
            <h2 className="text-xl font-semibold text-zinc-900 tracking-tight">NOTA DE VENTA</h2>
            {/* Código con botón copiar */}
            <div className="flex items-center justify-center gap-2 mt-1">
              <p className="text-lg font-mono text-primary">{sale.code}</p>
              <button
                onClick={handleCopyCode}
                className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-primary transition-colors print:hidden"
                title="Copiar código"
                type="button"
              >
                {codeCopied
                  ? <Check className="w-4 h-4 text-green-500" />
                  : <Copy className="w-4 h-4" />
                }
              </button>
            </div>
            <p className="text-sm text-zinc-500">{formatDate(sale.createdAt)}</p>
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
              <tr className="border-b-2 border-zinc-200">
                <th className="text-left py-2 text-zinc-500">Producto</th>
                <th className="text-center py-2 text-zinc-500 w-16">Cant.</th>
                <th className="text-right py-2 text-zinc-500 w-24">P. Unit.</th>
                <th className="text-right py-2 text-zinc-500 w-28">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => (
                <tr key={item.id} className="border-b border-zinc-100">
                  <td className="py-2">
                    <p className="font-medium text-zinc-900">{item.productName}</p>
                    {item.variantName && (
                      <p className="text-xs text-zinc-400">{item.variantName}</p>
                    )}
                    {item.appliedTierLabel && (
                      <p className="text-[10px] text-green-600">{item.appliedTierLabel}</p>
                    )}
                  </td>
                  <td className="py-2 text-center">{item.qty}</td>
                  <td className="py-2 text-right">{formatPrice(item.unitPrice)}</td>
                  <td className="py-2 text-right font-medium">{formatPrice(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total (con desglose IVA si aplica) */}
          <div className="border-t-2 border-zinc-900 pt-3 space-y-1">
            {sale.taxAmount > 0 && (
              <>
                <div className="flex items-center justify-between text-sm text-zinc-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(sale.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-zinc-600">
                  <span>IVA ({Math.round(sale.taxRate * 100)}%)</span>
                  <span>{formatPrice(sale.taxAmount)}</span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-zinc-900">TOTAL</span>
              <span className="text-2xl font-bold text-zinc-900 tracking-tight">{formatPrice(sale.total)}</span>
            </div>
          </div>

          {/* Notas */}
          {sale.notes && (
            <div className="mt-3 p-2 bg-zinc-50 rounded text-xs text-zinc-500">
              Notas: {sale.notes}
            </div>
          )}

          {/* Estado */}
          <div className="mt-4 text-center">
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                sale.statusCode === 'PAGADA'
                  ? 'bg-green-100 text-green-800'
                  : sale.statusCode === 'ANULADA'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {sale.status}
            </span>
          </div>

          {/* Facturación Electrónica DIAN — sección visible cuando la FE ya fue emitida */}
          {sale.feInvoiceId && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-green-800">
                  Factura Electrónica DIAN · Doc #{sale.feInvoiceId}
                </span>
              </div>
              {sale.feCufe && (
                <div>
                  <p className="text-xs text-green-700 mb-0.5">CUFE</p>
                  <p className="font-mono text-xs text-green-900 break-all bg-green-100 px-2 py-1.5 rounded">
                    {sale.feCufe}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Acciones (no se imprimen) */}
        <div className="px-6 py-4 border-t border-zinc-200 flex flex-wrap gap-2 print:hidden">
          <Button
            className="flex items-center gap-2"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>

          {/* Facturación Electrónica — solo ventas PAGADAS */}
          {sale.statusCode === 'PAGADA' && (
            sale.feInvoiceId ? (
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-100 text-green-800 text-sm font-medium cursor-default">
                <Receipt className="w-4 h-4" />
                Facturada Electrónicamente · Doc #{sale.feInvoiceId}
              </span>
            ) : (
              <Button
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setShowFE(true)}
              >
                <Receipt className="w-4 h-4" />
                Generar Factura Electrónica
              </Button>
            )
          )}

          {sale.statusCode === 'PENDIENTE' && (
            <>
              {/* Confirmar Pago — supervisores O vendedor en venta devuelta */}
              {(!readOnly || sale.returnedAt) && (
                <Button
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  onClick={handleConfirmPayment}
                  disabled={processing}
                >
                  <CheckCircle className="w-4 h-4" />
                  {processing ? 'Procesando...' : 'Confirmar Pago'}
                </Button>
              )}

              {/* Editar — supervisores con canEdit, O cualquier vendedor si la venta fue devuelta */}
              {(!readOnly || sale.returnedAt) && (
                <Button
                  className={`flex items-center gap-2 ${sale.returnedAt ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                  onClick={() => setShowEdit(true)}
                  disabled={processing}
                >
                  <Pencil className="w-4 h-4" />
                  {sale.returnedAt ? 'Corregir y reenviar' : 'Editar'}
                </Button>
              )}

              {/* Devolver — solo supervisores, solo si aún no fue devuelta */}
              {!readOnly && !sale.returnedAt && (
                <Button
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600"
                  onClick={() => setShowReturn(true)}
                  disabled={processing}
                >
                  <CornerUpLeft className="w-4 h-4" />
                  Devolver al vendedor
                </Button>
              )}

              {/* Anular — solo supervisores */}
              {!readOnly && (
                <Button
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
                  onClick={handleCancel}
                  disabled={processing}
                >
                  <XCircle className="w-4 h-4" />
                  Anular
                </Button>
              )}
            </>
          )}

          <Button
            className="ml-auto bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
            onClick={() => onClose(sale.statusCode !== 'PENDIENTE')}
          >
            Cerrar
          </Button>
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
