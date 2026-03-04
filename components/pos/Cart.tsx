'use client';

import { useState } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, Receipt, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui';
import { usePosStore } from '@/stores';
import { createSale } from '@/services/pos';
import { useToast } from '@/lib/hooks';
import { RemisionModal } from './RemisionModal';

interface CartProps {
  /** Callback para cerrar el drawer en móvil */
  onClose?: () => void;
}

export function Cart({ onClose }: CartProps) {
  const cart = usePosStore((s) => s.cart);
  const clientName = usePosStore((s) => s.clientName);
  const clientId = usePosStore((s) => s.clientId);
  const notes = usePosStore((s) => s.notes);
  const updateQty = usePosStore((s) => s.updateQty);
  const removeFromCart = usePosStore((s) => s.removeFromCart);
  const clearCart = usePosStore((s) => s.clearCart);
  const setClientName = usePosStore((s) => s.setClientName);
  const setNotes = usePosStore((s) => s.setNotes);
  const setLastSale = usePosStore((s) => s.setLastSale);
  const lastSale = usePosStore((s) => s.lastSale);

  const [submitting, setSubmitting] = useState(false);
  const [showRemision, setShowRemision] = useState(false);
  const toast = useToast();

  const total = cart.reduce((sum, i) => sum + i.lineTotal, 0);
  const itemCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(price);

  const handleGenerateRemision = async () => {
    if (cart.length === 0) return;
    try {
      setSubmitting(true);
      const sale = await createSale({
        clientId: clientId ?? undefined,
        clientName: clientName || undefined,
        notes: notes || undefined,
        currency: 'MXN',
        items: cart.map((i) => ({ variantId: i.variantId, qty: i.qty })),
      });
      setLastSale(sale);
      setShowRemision(true);
      toast.success('Remisión generada exitosamente');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear la venta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemisionClose = (clearAfter?: boolean) => {
    setShowRemision(false);
    if (clearAfter) {
      clearCart();
      setLastSale(null);
      onClose?.();
    }
  };

  // ── Carrito vacío ──
  if (cart.length === 0) {
    return (
      <div className="flex flex-col h-full">
        {/* Header con botón cerrar en móvil */}
        {onClose && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Carrito</h3>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100">
              <ChevronDown className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        )}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400 p-6">
          <ShoppingBag className="w-16 h-16 opacity-25" />
          <p className="text-base font-medium">Carrito vacío</p>
          <p className="text-sm text-center">Toca un producto para agregarlo</p>
          {onClose && (
            <button
              onClick={onClose}
              className="mt-2 text-sm text-primary underline"
            >
              Ver productos
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full bg-white">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            {onClose && (
              <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 mr-1">
                <ChevronDown className="w-5 h-5 text-gray-500" />
              </button>
            )}
            <h3 className="font-semibold text-gray-900">
              Carrito
            </h3>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              {itemCount} items
            </span>
          </div>
          <button
            onClick={clearCart}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Vaciar
          </button>
        </div>

        {/* ── Lista de items ── */}
        <div className="flex-1 overflow-y-auto py-2">
          {cart.map((item) => (
            <div
              key={item.variantId}
              className="flex items-start gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0"
            >
              {/* Info del producto */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 leading-snug">
                  {item.productName}
                </p>
                {item.variantName && (
                  <p className="text-xs text-gray-400 mt-0.5">{item.variantName}</p>
                )}
                {item.appliedTierLabel && (
                  <span className="inline-block mt-1 text-[11px] text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-medium">
                    {item.appliedTierLabel}
                  </span>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {formatPrice(item.unitPrice)} c/u
                </p>
              </div>

              {/* Controles de cantidad — mínimo 44×44px para touch */}
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-0.5">
                  <button
                    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-l-xl border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                    onClick={() => updateQty(item.variantId, item.qty - 1)}
                    aria-label="Reducir cantidad"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 h-8 sm:h-9 text-center text-sm font-bold border-y border-gray-200 flex items-center justify-center bg-white">
                    {item.qty}
                  </span>
                  <button
                    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-r-xl border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                    onClick={() => updateQty(item.variantId, item.qty + 1)}
                    aria-label="Aumentar cantidad"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Subtotal + eliminar */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatPrice(item.lineTotal)}
                  </span>
                  <button
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    onClick={() => removeFromCart(item.variantId)}
                    aria-label="Eliminar producto"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Cliente y notas ── */}
        <div className="px-5 py-3 border-t border-gray-100 space-y-2.5 flex-shrink-0">
          <input
            type="text"
            placeholder="Nombre del cliente (opcional)"
            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Notas (opcional)"
            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* ── Total + Botón ── */}
        <div className="px-5 py-4 border-t-2 border-gray-100 bg-gray-50/80 flex-shrink-0">
          <div className="flex items-baseline justify-between mb-4">
            <span className="text-sm text-gray-500">Total a cobrar</span>
            <span className="text-3xl font-bold text-gray-900 tracking-tight">
              {formatPrice(total)}
            </span>
          </div>
          <Button
            className="w-full h-14 text-base font-semibold flex items-center justify-center gap-2 rounded-2xl shadow-sm"
            onClick={handleGenerateRemision}
            disabled={submitting}
          >
            <Receipt className="w-5 h-5" />
            {submitting ? 'Generando...' : 'Generar Remisión'}
          </Button>
        </div>
      </div>

      {/* Modal de remisión */}
      {showRemision && lastSale && (
        <RemisionModal sale={lastSale} onClose={handleRemisionClose} />
      )}
    </>
  );
}
