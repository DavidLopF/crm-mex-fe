'use client';

import { useState } from 'react';
import { CornerUpLeft, Loader2, X } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { returnSaleToSeller, type SaleResponseDto } from '@/services/pos';
import { useGlobalToast } from '@/lib/hooks';
import { broadcastInvalidation } from '@/lib/cross-tab-sync';

interface Props {
  sale: SaleResponseDto;
  onClose: () => void;
  onReturned: (updated: SaleResponseDto) => void;
}

/**
 * Modal para devolver una venta PENDIENTE al vendedor.
 * Registra la fecha de devolución y notas opcionales del revisor.
 * La venta permanece en PENDIENTE pero queda marcada como "devuelta".
 */
export function ReturnSaleModal({ sale, onClose, onReturned }: Props) {
  const toast = useGlobalToast();
  const [returnNotes, setReturnNotes] = useState('');
  const [submitting, setSubmitting]   = useState(false);

  const handleReturn = async () => {
    try {
      setSubmitting(true);
      const updated = await returnSaleToSeller(sale.id, returnNotes.trim() || undefined);
      broadcastInvalidation(['pos-sales']);
      toast.warning(`La venta fue enviada de vuelta al vendedor`, {
        title: '↩️ Venta devuelta',
        code: updated.code,
        duration: 6000,
      });
      onReturned(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al devolver la venta', {
        title: 'No se pudo devolver',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} size="sm">
      <div className="w-full">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <CornerUpLeft className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">Devolver al Vendedor</h2>
              <p className="text-xs text-zinc-500 font-mono">{sale.code}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-zinc-600 leading-relaxed">
            Esta venta regresará al vendedor para que corrija los productos.
            Permanecerá en estado <span className="font-semibold text-yellow-700">Pendiente</span> y
            quedará marcada como devuelta hasta que el vendedor la edite.
          </p>

          {/* Vendedor */}
          {sale.sellerName && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
              <CornerUpLeft className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                Se notificará a <span className="font-semibold">{sale.sellerName}</span>
              </p>
            </div>
          )}

          {/* Notas del revisor */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1.5">
              Motivo / notas para el vendedor{' '}
              <span className="font-normal text-zinc-400">(opcional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Ej: El producto X fue ingresado con precio incorrecto..."
              className="w-full px-4 py-3 text-sm border border-zinc-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-colors"
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              maxLength={500}
            />
            {returnNotes.length > 0 && (
              <p className="text-xs text-zinc-400 text-right mt-0.5">{returnNotes.length}/500</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-2">
          <Button
            className="flex-1 h-11 text-sm font-semibold flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600"
            onClick={handleReturn}
            disabled={submitting}
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Devolviendo...</>
            ) : (
              <><CornerUpLeft className="w-4 h-4" /> Devolver al Vendedor</>
            )}
          </Button>
          <Button
            className="px-5 h-11 rounded-xl bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
