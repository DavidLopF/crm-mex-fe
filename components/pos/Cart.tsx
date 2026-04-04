'use client';

import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  Minus, Plus, Trash2, ShoppingBag, Receipt, X,
  ChevronDown, Banknote, CreditCard, Info, Loader2,
} from 'lucide-react';
import { usePosStore } from '@/stores';
import { createSale, type PaymentMethod } from '@/services/pos';
import { useGlobalToast } from '@/lib/hooks';
import { useCompany } from '@/lib/company-context';
import { broadcastInvalidation } from '@/lib/cross-tab-sync';
import { OfflineQueuedError } from '@/services/http-client';
import { ClientSelector } from './ClientSelector';
import { cn } from '@/lib/utils';

function NequiIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="#DA0081" />
      <text x="10" y="14.5" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial, sans-serif">N</text>
    </svg>
  );
}

function DaviplataIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="#DA3B24" />
      <text x="10" y="14.5" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial, sans-serif">D</text>
    </svg>
  );
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: 'EFECTIVO',  label: 'Efectivo',  icon: <Banknote className="w-4 h-4" /> },
  { value: 'TARJETA',   label: 'Tarjeta',   icon: <CreditCard className="w-4 h-4" /> },
  { value: 'NEQUI',     label: 'Nequi',     icon: <NequiIcon className="w-4 h-4" /> },
  { value: 'DAVIPLATA', label: 'Daviplata', icon: <DaviplataIcon className="w-4 h-4" /> },
];

interface CartProps {
  onClose?: () => void;
}

export function Cart({ onClose }: CartProps) {
  const { settings } = useCompany();
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

  const ivaRate = settings?.defaultIvaRate ?? 0.19;
  const hasRequiredIvaItem = cart.some((i) => i.requiresIva);
  const includesIva = hasRequiredIvaItem || includesIvaManual;

  const subtotal   = cart.reduce((sum, i) => sum + i.lineTotal, 0);
  const taxAmount  = includesIva ? Math.round(subtotal * ivaRate * 100) / 100 : 0;
  const total      = subtotal + taxAmount;
  const itemCount  = cart.reduce((sum, i) => sum + i.qty, 0);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(price);

  const handleGenerateRemision = async () => {
    if (cart.length === 0) return;
    try {
      setSubmitting(true);
      const sale = await createSale({
        clientId: clientId ?? undefined,
        clientName: clientName || undefined,
        notes: notes || undefined,
        currency: 'COP',
        items: cart.map((i) => ({ variantId: i.variantId, qty: i.qty })),
        includesIva,
        paymentMethod,
      });
      broadcastInvalidation(['inventory', 'pos-sales', 'pos-dashboard']);
      toast.success('Venta registrada con éxito', {
        title: '🧾 Remisión #' + sale.code,
        duration: 5000,
      });
      clearCart();
      onClose?.();
    } catch (err) {
      if (err instanceof OfflineQueuedError) {
        toast.warning('Operación guardada localmente.', { title: '📱 Offline' });
        clearCart();
        onClose?.();
        return;
      }
      toast.error('Error al procesar la venta');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Estado vacío ──────────────────────────────────────────────────
  if (cart.length === 0) {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Header vacío */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-zinc-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            {onClose && (
              <button
                onClick={onClose}
                aria-label="Cerrar carrito"
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 active:bg-zinc-200 transition-colors"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            )}
            <span className="text-base font-black text-zinc-900 tracking-tight">Carrito</span>
          </div>
        </div>

        {/* Empty state */}
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 animate-fadeIn">
          <div className="w-20 h-20 rounded-3xl bg-zinc-50 flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-zinc-200" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-black text-zinc-500 uppercase tracking-widest">Carrito Vacío</p>
            <p className="text-xs text-zinc-400">Selecciona productos del catálogo</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Carrito con items — Bottom Sheet Layout ───────────────────────
  return (
    <div className="flex flex-col h-full bg-zinc-50">

      {/* ── ZONA 1: Header fijo ────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 pt-4 pb-3 bg-white border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Cerrar carrito"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 active:bg-zinc-200 transition-colors"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          )}
          <span className="text-base font-black text-zinc-900 tracking-tight">Carrito</span>
          <span className="px-2.5 py-1 bg-primary text-primary-foreground text-[10px] font-black rounded-lg uppercase tracking-tight">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
        </div>
        <button
          onClick={clearCart}
          aria-label="Vaciar carrito"
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-400 active:bg-rose-100 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* ── ZONA 2: Contenido scrolleable ──────────────────────── */}
      <div className="flex-1 overflow-y-auto overscroll-contain">

        {/* Lista de items */}
        <div className="px-3 pt-3 space-y-2">
          {cart.map((item) => (
            <div
              key={item.variantId}
              className="bg-white rounded-2xl px-4 py-3 shadow-sm animate-slideUp"
            >
              {/* Fila superior: info + eliminar */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-zinc-900 leading-tight">
                    {item.productName}
                  </p>
                  {item.variantName && (
                    <p className="text-[11px] text-zinc-400 font-medium mt-0.5">{item.variantName}</p>
                  )}
                  {item.appliedTierLabel && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-md uppercase tracking-tight">
                      {item.appliedTierLabel}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => removeFromCart(item.variantId)}
                  aria-label={`Eliminar ${item.productName}`}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-300 hover:text-rose-500 hover:bg-rose-50 active:bg-rose-100 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Fila inferior: precio unitario + stepper + total línea */}
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs font-bold text-zinc-400">{formatPrice(item.unitPrice)}</span>

                {/* Stepper — 44px touch targets */}
                <div className="flex items-center bg-zinc-50 rounded-xl border border-zinc-100 p-0.5 gap-0.5">
                  <button
                    onClick={() => updateQty(item.variantId, item.qty - 1)}
                    aria-label="Disminuir cantidad"
                    className="w-11 h-11 flex items-center justify-center rounded-lg bg-white text-zinc-600 shadow-sm active:bg-zinc-100 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-9 text-center text-sm font-black text-zinc-900 tabular-nums">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.variantId, item.qty + 1)}
                    aria-label="Aumentar cantidad"
                    className="w-11 h-11 flex items-center justify-center rounded-lg bg-white text-zinc-600 shadow-sm active:bg-zinc-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="text-sm font-black text-zinc-900 tabular-nums">
                  {formatPrice(item.lineTotal)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Separador */}
        <div className="px-4 pt-5 pb-2">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Detalles del pedido</p>
        </div>

        {/* Cliente + Notas */}
        <div className="px-3 space-y-2">
          <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
            <ClientSelector />
          </div>
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="relative">
              <Info className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
              <input
                type="text"
                placeholder="Notas de la remisión..."
                className="w-full h-12 pl-11 pr-4 bg-transparent rounded-2xl text-sm text-zinc-900 placeholder:text-zinc-300 focus:outline-none"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Medios de pago — fila horizontal scrolleable */}
        <div className="pt-4 pb-2 px-4">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3">Medio de pago</p>
          <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-none">
            {PAYMENT_METHODS.map((pm) => {
              const active = paymentMethod === pm.value;
              return (
                <button
                  key={pm.value}
                  onClick={() => setPaymentMethod(pm.value)}
                  className={cn(
                    'flex-shrink-0 snap-start flex items-center gap-2.5 h-11 px-4 rounded-2xl border-2 transition-all duration-200 active:scale-95',
                    active
                      ? 'bg-primary border-primary text-primary-foreground shadow-lg'
                      : 'bg-white border-zinc-100 text-zinc-500'
                  )}
                >
                  <span className={cn(
                    'w-6 h-6 flex items-center justify-center rounded-lg transition-colors',
                    active ? 'text-primary-foreground' : 'text-zinc-400'
                  )}>
                    {pm.icon}
                  </span>
                  <span className="text-xs font-black uppercase tracking-tight whitespace-nowrap">{pm.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Toggle IVA — fila compacta */}
        <div className="px-3 pb-3 pt-1">
          <button
            onClick={() => !hasRequiredIvaItem && setIncludesIvaManual((v) => !v)}
            disabled={hasRequiredIvaItem}
            className={cn(
              'w-full flex items-center justify-between h-12 px-4 rounded-2xl border-2 transition-all duration-200',
              includesIva
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                : 'bg-white border-zinc-100 text-zinc-500'
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest">
                IVA ({(ivaRate * 100).toFixed(0)}%)
              </span>
              {hasRequiredIvaItem && (
                <span className="text-[9px] font-bold text-emerald-500 bg-emerald-100 px-1.5 py-0.5 rounded-md uppercase">
                  Obligatorio
                </span>
              )}
            </div>
            {/* Toggle pill */}
            <div className={cn(
              'w-10 h-6 rounded-full relative transition-colors duration-300 flex-shrink-0',
              includesIva ? 'bg-emerald-500' : 'bg-zinc-200'
            )}>
              <div className={cn(
                'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300',
                includesIva ? 'left-5' : 'left-1'
              )} />
            </div>
          </button>
        </div>

        {/* Spacer para que el contenido no quede bajo el bottom bar */}
        <div className="h-36" />
      </div>

      {/* ── ZONA 3: Bottom bar sticky — siempre visible ─────────── */}
      <div
        className="flex-shrink-0 bg-white/95 backdrop-blur-md border-t border-zinc-100 px-4 pt-4 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Resumen de totales */}
        <div className="space-y-1 mb-4">
          {includesIva && (
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-semibold">Subtotal</span>
              <span className="font-bold tabular-nums">{formatPrice(subtotal)}</span>
            </div>
          )}
          {includesIva && (
            <div className="flex items-center justify-between text-xs text-emerald-600">
              <span className="font-semibold">IVA ({(ivaRate * 100).toFixed(0)}%)</span>
              <span className="font-bold tabular-nums">+ {formatPrice(taxAmount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Total</span>
            <span className="text-2xl font-black text-zinc-900 tracking-tighter tabular-nums leading-none">
              {formatPrice(total)}
            </span>
          </div>
        </div>

        {/* Botón generar remisión */}
        <button
          disabled={submitting}
          onClick={handleGenerateRemision}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-primary/25"
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Receipt className="w-5 h-5" />
              Generar Remisión
            </>
          )}
        </button>
      </div>

    </div>
  );
}
