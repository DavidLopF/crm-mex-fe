'use client';

import { 
  Printer, CheckCircle, XCircle, Copy, Check, 
  Pencil, CornerUpLeft, Receipt, ShoppingBag, 
  User, Calendar, CreditCard, Sparkles, 
  ChevronRight, ArrowRight, Download, Share2,
  Clock, Loader2, Info
} from 'lucide-react';
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
import { useCompany } from '@/lib/company-context';
import { cn } from '@/lib/utils';

interface Props {
  sale: SaleResponseDto;
  onClose: (clearCart?: boolean) => void;
  readOnly?: boolean;
}

export function RemisionModal({ sale: initialSale, onClose, readOnly = false }: Props) {
  const { settings } = useCompany();
  const toast = useGlobalToast();
  const { isOnline } = useConnectivity();
  const [sale, setSale]           = useState<SaleResponseDto>(initialSale);
  const [processing, setProcessing] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showEdit, setShowEdit]     = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [showFE, setShowFE]         = useState(false);

  const isPaid = sale.statusCode === 'PAGADA';
  const isCanceled = sale.statusCode === 'ANULADA';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sale.code).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN',
      maximumFractionDigits: 0
    }).format(price);

  const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateStr));

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmPayment = async () => {
    try {
      setProcessing(true);

      if (!isOnline) {
        await enqueueOperation({
          method: 'PATCH',
          path: `/api/pos/sales/${sale.id}/status`,
          body: { newStatusCode: 'PAGADA' },
          module: 'pos',
        });
        setSale((prev) => ({ ...prev, statusCode: 'PAGADA', status: 'Pagada' }));
        toast.success('El pago se sincronizará automáticamente al recuperar la conexión.', {
          title: '📋 Pago registrado en contingencia',
          duration: 7000,
        });
        return;
      }

      await changeSaleStatus(sale.id, 'PAGADA');
      broadcastInvalidation(['inventory', 'pos-sales', 'pos-dashboard']);
      setSale(prev => ({ ...prev, statusCode: 'PAGADA', status: 'Pagada' }));
      toast.success('Venta confirmada y stock actualizado', {
        title: '✅ ¡Venta Pagada!',
        duration: 4000,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al confirmar pago');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    try {
      setProcessing(true);
      await changeSaleStatus(sale.id, 'ANULADA');
      broadcastInvalidation(['pos-sales', 'pos-dashboard']);
      toast.warning('La venta fue marcada como anulada');
      onClose(true);
    } catch (err) {
      toast.error('Error al anular la venta');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal isOpen onClose={() => onClose(false)} size="lg" noPadding className="bg-zinc-50 border-zinc-200">
      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
            size: 80mm auto;
          }
          body * {
            visibility: hidden;
            background: none !important;
            box-shadow: none !important;
          }
          #remision-print, #remision-print * {
            visibility: visible;
          }
          #remision-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 10mm 5mm;
            margin: 0;
            background: white !important;
            color: black !important;
            display: block !important;
            height: auto !important;
            overflow: visible !important;
          }
          .print-no-border { border: none !important; }
          .print-text-xs { font-size: 8pt !important; }
          .print-text-sm { font-size: 9pt !important; }
          .print-text-lg { font-size: 11pt !important; }
          .print-text-xl { font-size: 13pt !important; }
          .print-w-full { width: 100% !important; }
          .print-hidden { display: none !important; }
          .print-m-0 { margin: 0 !important; }
          .print-p-0 { padding: 0 !important; }
          
          /* Forzar estilos de ticket */
          .rounded-3xl, .rounded-2xl, .rounded-xl, .rounded-full { border-radius: 0 !important; }
          .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl { box-shadow: none !important; }
          .bg-zinc-50, .bg-white, .bg-zinc-100 { background: white !important; }
          .border { border: none !important; border-bottom: 1px dashed #ccc !important; }
          
          /* Ajuste de columnas */
          .grid-cols-2 { grid-template-columns: 1fr !important; gap: 10px !important; }
          
          /* Ocultar elementos innecesarios */
          button, .print-hide { display: none !important; }
          
          /* Separador visual */
          .ticket-divider {
            border-bottom: 1px dashed black !important;
            margin: 10px 0 !important;
          }
        }
      `}</style>

      <div className="flex flex-col max-h-[90vh]">
        
        {/* Contenido Imprimible */}
        <div id="remision-print" className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-8 bg-zinc-50">
          
          {/* Company Header (Solo para impresión o siempre visible) */}
          <div className="hidden print:block text-center space-y-1 mb-6">
            <h1 className="text-xl font-black uppercase tracking-tighter">{settings.companyName}</h1>
            <p className="text-[10px] font-bold text-zinc-500 uppercase">Comprobante de Venta</p>
            <div className="ticket-divider" />
          </div>

          {/* Status Header */}
          <div className="flex flex-col items-center text-center space-y-4 print:space-y-2">
            {!isPaid && !isCanceled ? (
              <div className="w-20 h-20 rounded-full bg-amber-500 flex items-center justify-center shadow-xl shadow-amber-100 animate-fadeIn print:hidden">
                <Clock className="w-10 h-10 text-white" />
              </div>
            ) : isPaid ? (
              <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-100 animate-fadeIn print:hidden">
                <Sparkles className="w-10 h-10 text-white animate-pulse" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-rose-500 flex items-center justify-center shadow-xl shadow-rose-100 animate-fadeIn print:hidden">
                <XCircle className="w-10 h-10 text-white" />
              </div>
            )}

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight print:text-lg">
                {isPaid ? '¡Venta Confirmada!' : isCanceled ? 'Venta Anulada' : 'Venta Pendiente'}
              </h2>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-sm font-bold text-zinc-400 uppercase tracking-widest print:text-black print:text-xs">{sale.code}</span>
                <button onClick={handleCopyCode} className="p-1 rounded-lg hover:bg-zinc-200 hover:text-primary transition-all print:hidden">
                  {codeCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-zinc-300" />}
                </button>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
            <div className="p-5 bg-white rounded-2xl border border-zinc-200 shadow-sm space-y-3 print:p-2 print:border-none">
              <div className="flex items-center gap-2 text-zinc-400 print:text-black">
                <User className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Cliente</span>
              </div>
              <p className="text-sm font-black text-zinc-900 uppercase truncate print:text-xs">{sale.clientName || 'Público General'}</p>
              <div className="flex items-center gap-2 text-zinc-400 print:text-black">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-xs font-bold print:text-[10px]">{formatDate(sale.createdAt)}</span>
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-zinc-200 shadow-sm space-y-3 print:p-2 print:border-none">
              <div className="flex items-center gap-2 text-zinc-400 print:text-black">
                <CreditCard className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Pago y Vendedor</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-600 text-[10px] font-black uppercase border border-zinc-200 print:border-none print:p-0">
                  {sale.paymentMethod}
                </span>
                <span className="text-zinc-200 print:hidden">·</span>
                <p className="text-sm font-bold text-zinc-600 truncate print:text-xs">{sale.sellerName || 'Sistema'}</p>
              </div>
              <div className="flex items-center gap-2 text-zinc-400 print:hidden">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">{sale.items.length} productos registrados</span>
              </div>
            </div>
          </div>

          {/* Items List Container */}
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden print:border-none">
            <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-100 flex items-center justify-between print:bg-white print:px-2 print:py-2">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest print:text-black">Detalle</span>
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest print:text-black">Total</span>
            </div>
            <div className="divide-y divide-zinc-50 print:divide-zinc-200">
              {sale.items.map((item) => (
                <div key={item.id} className="px-6 py-5 flex items-center justify-between gap-4 hover:bg-zinc-50/50 transition-colors print:px-2 print:py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-zinc-900 uppercase truncate print:text-xs">{item.productName}</p>
                    <p className="text-[10px] font-bold text-zinc-400 mt-0.5 print:text-black">
                      {item.qty}uds × {formatPrice(item.unitPrice)}
                      {item.variantName && <span className="ml-2 text-primary font-black print:text-black">({item.variantName})</span>}
                    </p>
                  </div>
                  <span className="text-sm font-black text-zinc-900 tabular-nums print:text-xs">
                    {formatPrice(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Totals Section */}
            <div className="bg-zinc-100/50 p-8 space-y-4 print:bg-white print:p-4 print:space-y-2">
              {sale.taxAmount > 0 && (
                <div className="flex justify-between items-center text-xs font-bold text-zinc-400 uppercase tracking-widest print:text-black print:text-[10px]">
                  <span>Subtotal Neto</span>
                  <span className="tabular-nums font-black text-zinc-600 print:text-black">{formatPrice(sale.subtotal)}</span>
                </div>
              )}
              {sale.taxAmount > 0 && (
                <div className="flex justify-between items-center text-xs font-bold text-emerald-600 uppercase tracking-widest print:text-black print:text-[10px]">
                  <span>IVA ({Math.round(sale.taxRate * 100)}%)</span>
                  <span className="tabular-nums font-black">{formatPrice(sale.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-end pt-2 border-t border-zinc-200 print:border-black print:pt-4">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1 print:text-black">TOTAL</span>
                <span className="text-4xl font-black text-zinc-900 tracking-tighter leading-none print:text-2xl">
                  {formatPrice(sale.total)}
                </span>
              </div>
            </div>
          </div>

          {/* DIAN Banner */}
          {sale.feInvoiceId && (
            <div className="p-6 rounded-3xl bg-white border-2 border-emerald-100 space-y-4 animate-fadeIn print:border-none print:p-2 print:space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 print:gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-100 print:hidden">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest print:text-black">Factura DIAN</p>
                    <p className="text-base font-black text-emerald-900 uppercase print:text-sm">#{sale.feInvoiceId}</p>
                  </div>
                </div>
                <button className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all print:hidden">
                  <Download className="w-5 h-5" />
                </button>
              </div>
              {sale.feCufe && (
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 print:bg-white print:p-0 print:border-none">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 print:text-black">CUFE</p>
                  <p className="font-mono text-[9px] text-zinc-600 break-all leading-relaxed select-all print:text-black">
                    {sale.feCufe}
                  </p>
                </div>
              )}
            </div>
          )}

          {sale.notes && (
            <div className="flex items-start gap-3 p-5 bg-white rounded-2xl border border-zinc-200 border-dashed print:p-2 print:border-none">
              <Info className="w-4 h-4 text-zinc-300 mt-0.5 flex-shrink-0 print:hidden" />
              <p className="text-xs font-medium text-zinc-500 leading-relaxed italic print:text-[10px] print:text-black">"{sale.notes}"</p>
            </div>
          )}

          <div className="hidden print:block text-center pt-8">
            <p className="text-[10px] font-bold uppercase tracking-widest">¡Gracias por su compra!</p>
            <p className="text-[8px] text-zinc-400 mt-1">Este no es una factura legal si no tiene número de DIAN</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-200 bg-white print:hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button 
                onClick={handlePrint}
                className="flex-1 sm:flex-none h-12 px-6 rounded-xl bg-zinc-100 text-zinc-600 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
              
              {!isPaid && !isCanceled && !readOnly && (
                <button 
                  onClick={handleCancel}
                  disabled={processing}
                  className="flex-1 sm:flex-none h-12 px-6 rounded-xl bg-white border border-rose-200 text-rose-600 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-50 transition-all active:scale-95"
                >
                  <XCircle className="w-4 h-4" />
                  Anular
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {isPaid ? (
                <>
                  {!sale.feInvoiceId && (
                    <button 
                      onClick={() => setShowFE(true)}
                      className="flex-1 sm:flex-none h-12 px-6 rounded-xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95"
                    >
                      <Receipt className="w-4 h-4" />
                      Facturar
                    </button>
                  )}
                  <button 
                    onClick={() => onClose(true)}
                    className="flex-1 sm:flex-none h-12 px-8 rounded-xl bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center transition-all hover:opacity-90 active:scale-95 shadow-lg"
                  >
                    Finalizar
                  </button>
                </>
              ) : isCanceled ? (
                <button 
                  onClick={() => onClose(true)}
                  className="w-full sm:w-auto h-12 px-10 rounded-xl bg-zinc-900 text-white font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95"
                >
                  Cerrar
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => setShowEdit(true)}
                    disabled={processing}
                    className="flex-1 sm:flex-none h-12 px-6 rounded-xl bg-white border border-zinc-200 text-zinc-500 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all active:scale-95"
                  >
                    <Pencil className="w-4 h-4" />
                    Editar
                  </button>
                  <button 
                    onClick={handleConfirmPayment}
                    disabled={processing}
                    className="flex-1 sm:flex-none h-12 px-8 rounded-xl bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:opacity-90 shadow-lg transition-all active:scale-95"
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Cobrar
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Sub-modales */}
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
