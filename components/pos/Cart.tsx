'use client';

import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Minus, Plus, Trash2, ShoppingBag, Receipt, X, ChevronDown, Banknote, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui';
import { usePosStore } from '@/stores';
import { createSale, type PaymentMethod } from '@/services/pos';
import { useGlobalToast } from '@/lib/hooks';
import { broadcastInvalidation } from '@/lib/cross-tab-sync';
import { OfflineQueuedError } from '@/services/http-client';
import { ClientSelector } from './ClientSelector';

/** Ícono Nequi — círculo rosa con "N" blanca (colores de marca) */
function NequiIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="#DA0081" />
      <text x="10" y="14.5" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial, sans-serif">N</text>
    </svg>
  );
}

/** Ícono Daviplata — círculo rojo con "D" blanca (colores de marca) */
function DaviplataIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="#DA3B24" />
      <text x="10" y="14.5" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial, sans-serif">D</text>
    </svg>
  );
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: 'EFECTIVO',   label: 'Efectivo',   icon: <Banknote className="w-4 h-4" /> },
  { value: 'TARJETA',    label: 'Tarjeta',    icon: <CreditCard className="w-4 h-4" /> },
  { value: 'NEQUI',      label: 'Nequi',      icon: <NequiIcon className="w-4 h-4" /> },
  { value: 'DAVIPLATA',  label: 'Daviplata',  icon: <DaviplataIcon className="w-4 h-4" /> },
];

const IVA_RATE = 0.16;

interface CartProps {
  /** Callback para cerrar el drawer en móvil */
  onClose?: () => void;
}

export function Cart({ onClose }: CartProps) {
  const {
    cart, clientName, clientId, notes, paymentMethod,
    updateQty, removeFromCart, clearCart,
    setNotes, setPaymentMethod,
  } = usePosStore(useShallow((s) => ({
    cart: s.cart,
    clientName: s.clientName,
    clientId: s.clientId,
    notes: s.notes,
    paymentMethod: s.paymentMethod,
    updateQty: s.updateQty,
    removeFromCart: s.removeFromCart,
    clearCart: s.clearCart,
    setNotes: s.setNotes,
    setPaymentMethod: s.setPaymentMethod,
  })));

  const [submitting, setSubmitting] = useState(false);
  const [includesIvaManual, setIncludesIvaManual] = useState(false);
  const toast = useGlobalToast();

  /**
   * Si hay al menos un producto con requiresIva=true en el carrito,
   * el IVA se aplica automáticamente y el toggle se bloquea ON.
   */
  const hasRequiredIvaItem = cart.some((i) => i.requiresIva);
  const includesIva = hasRequiredIvaItem || includesIvaManual;

  const subtotal = cart.reduce((sum, i) => sum + i.lineTotal, 0);
  const taxAmount = includesIva ? Math.round(subtotal * IVA_RATE * 100) / 100 : 0;
  const total = subtotal + taxAmount;
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
        includesIva,
        paymentMethod,
      });
      // Invalidar módulos afectados:
      //  - 'inventory'     → stock actualizado en otras vistas
      //  - 'pos-sales'     → SalesList recarga el historial al instante
      //  - 'pos-dashboard' → PosDashboardCards recarga contadores
      broadcastInvalidation(['inventory', 'pos-sales', 'pos-dashboard']);
      toast.success('Pendiente de cobro', {
        title: '🧾 Remisión generada',
        code: sale.code,
        duration: 7000,
      });
      clearCart();
      onClose?.();
    } catch (err) {
      // ── Venta encolada offline: tratar como éxito parcial ──
      if (err instanceof OfflineQueuedError) {
        toast.warning('Se guardó localmente y se enviará en cuanto vuelva la conexión.', {
          title: '📱 Venta guardada offline',
          duration: 9000,
        });
        clearCart();
        onClose?.();
        return;
      }
      toast.error(err instanceof Error ? err.message : 'Error al crear la venta', { title: 'No se pudo crear' });
    } finally {
      setSubmitting(false);
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
          {/* Selector de cliente con búsqueda y creación inline */}
          <ClientSelector />
          <input
            type="text"
            placeholder="Notas (opcional)"
            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* ── IVA toggle + Total + Botón ── */}
        <div
          className="px-5 py-4 border-t-2 border-gray-100 bg-gray-50/80 flex-shrink-0 space-y-3"
          style={{
            paddingBottom: onClose
              ? 'calc(max(env(safe-area-inset-bottom), 20px) + 96px)'
              : 'calc(max(env(safe-area-inset-bottom), 0px) + 16px)',
          }}
        >

          {/* Medio de pago */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Medio de pago</p>
            <div className="grid grid-cols-2 gap-1.5">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.value}
                  type="button"
                  onClick={() => setPaymentMethod(pm.value)}
                  className={`
                    flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 text-xs font-medium transition-all
                    ${paymentMethod === pm.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }
                  `}
                >
                  {pm.icon}
                  <span>{pm.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Toggle IVA */}
          <button
            type="button"
            onClick={() => !hasRequiredIvaItem && setIncludesIvaManual((v) => !v)}
            disabled={hasRequiredIvaItem}
            title={hasRequiredIvaItem ? 'Uno o más productos requieren IVA obligatorio' : undefined}
            className={`
              w-full flex items-center justify-between px-4 py-2.5 rounded-xl border-2 transition-all
              ${includesIva
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              }
              ${hasRequiredIvaItem ? 'cursor-not-allowed opacity-90' : ''}
            `}
          >
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">Incluye IVA (16%)</span>
              {hasRequiredIvaItem && (
                <span className="text-[11px] text-amber-600 font-normal leading-tight">
                  Obligatorio — producto(s) con IVA incluido
                </span>
              )}
            </div>
            {/* Switch visual */}
            <span className={`w-10 h-5 flex items-center rounded-full transition-colors flex-shrink-0 ml-2 ${includesIva ? 'bg-primary' : 'bg-gray-300'}`}>
              <span className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${includesIva ? 'translate-x-5' : 'translate-x-0'}`} />
            </span>
          </button>

          {/* Desglose */}
          <div className="space-y-1">
            {includesIva && (
              <>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-green-700">
                  <span>IVA 16%</span>
                  <span>+ {formatPrice(taxAmount)}</span>
                </div>
                <div className="border-t border-gray-200 pt-1" />
              </>
            )}
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-gray-500">Total a cobrar</span>
              <span className="text-3xl font-bold text-gray-900 tracking-tight">
                {formatPrice(total)}
              </span>
            </div>
          </div>

          {!onClose && (
            <Button
              className="w-full h-14 text-base font-semibold flex items-center justify-center gap-2 rounded-2xl shadow-sm"
              onClick={handleGenerateRemision}
              disabled={submitting}
            >
              <Receipt className="w-5 h-5" />
              {submitting ? 'Generando...' : 'Generar Remisión'}
            </Button>
          )}
        </div>

        {onClose && (
          <div
            className="md:hidden fixed left-0 right-0 z-[70] px-4 pt-2"
            style={{
              bottom: 'calc(max(env(safe-area-inset-bottom), 0px) + 6px)',
              background: 'linear-gradient(to top, rgba(255,255,255,1) 72%, rgba(255,255,255,0))',
            }}
          >
            <Button
              className="w-full h-14 text-base font-semibold flex items-center justify-center gap-2 rounded-2xl shadow-2xl bg-gray-900 text-white hover:bg-gray-800"
              onClick={handleGenerateRemision}
              disabled={submitting}
            >
              <Receipt className="w-5 h-5" />
              {submitting ? 'Generando...' : 'Generar Remisión'}
            </Button>
          </div>
        )}
      </div>

    </>
  );
}
