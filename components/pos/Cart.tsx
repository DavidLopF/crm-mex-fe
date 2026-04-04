'use client';

import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Minus, Plus, Trash2, ShoppingBag, Receipt, X, ChevronDown, Banknote, CreditCard, User, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
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
  { value: 'EFECTIVO',   label: 'Efectivo',   icon: <Banknote className="w-4 h-4" /> },
  { value: 'TARJETA',    label: 'Tarjeta',    icon: <CreditCard className="w-4 h-4" /> },
  { value: 'NEQUI',      label: 'Nequi',      icon: <NequiIcon className="w-4 h-4" /> },
  { value: 'DAVIPLATA',  label: 'Daviplata',  icon: <DaviplataIcon className="w-4 h-4" /> },
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

  const subtotal = cart.reduce((sum, i) => sum + i.lineTotal, 0);
  const taxAmount = includesIva ? Math.round(subtotal * ivaRate * 100) / 100 : 0;
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
      broadcastInvalidation(['inventory', 'pos-sales', 'pos-dashboard']);
      toast.success('Venta registrada con éxito', {
        title: '🧾 Remisión #'+sale.code,
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

  if (cart.length === 0) {
    return (
      <div className="flex flex-col h-full glass border-l border-white/20">
        <div className="p-6 flex items-center justify-between border-b border-zinc-100/50">
          <h3 className="text-lg font-black text-zinc-900 tracking-tight">Carrito</h3>
          {onClose && (
            <button onClick={onClose} className="p-2 rounded-xl bg-zinc-50 text-zinc-400 hover:text-primary transition-all">
              <ChevronDown className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-zinc-300 p-10 animate-fadeIn">
          <div className="w-24 h-24 rounded-3xl bg-zinc-50 flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 opacity-20" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Carrito Vacío</p>
            <p className="text-xs font-medium text-zinc-300">Selecciona productos del catálogo para comenzar</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full glass border-l border-white/20 shadow-2xl animate-fadeIn">
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-zinc-100/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          {onClose && (
            <button onClick={onClose} className="p-2 rounded-xl bg-zinc-50 text-zinc-400 hover:text-primary transition-all mr-1">
              <ChevronDown className="w-5 h-5" />
            </button>
          )}
          <h3 className="text-lg font-black text-zinc-900 tracking-tight">Carrito</h3>
          <span className="px-2.5 py-1 bg-primary text-primary-foreground text-[10px] font-black rounded-lg uppercase tracking-tighter">
            {itemCount} Items
          </span>
        </div>
        <button
          onClick={clearCart}
          className="p-2 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all group"
          title="Vaciar carrito"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Item List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {cart.map((item) => (
          <div
            key={item.variantId}
            className="card-premium p-4 space-y-4 border-none bg-white/60 hover:bg-white animate-slideUp"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-zinc-900 leading-tight truncate">
                  {item.productName}
                </p>
                {item.variantName && (
                  <p className="text-[11px] font-bold text-zinc-400 mt-0.5">{item.variantName}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                   <span className="text-xs font-black text-zinc-900">{formatPrice(item.unitPrice)}</span>
                   {item.appliedTierLabel && (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-md uppercase tracking-tighter">
                      {item.appliedTierLabel}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeFromCart(item.variantId)}
                className="p-1.5 rounded-lg text-zinc-200 hover:text-rose-500 hover:bg-rose-50 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center p-1 bg-zinc-50 rounded-xl border border-zinc-100">
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-zinc-600 hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
                  onClick={() => updateQty(item.variantId, item.qty - 1)}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center text-sm font-black text-zinc-900">
                  {item.qty}
                </span>
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-zinc-600 hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
                  onClick={() => updateQty(item.variantId, item.qty + 1)}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-base font-black text-zinc-900 tracking-tight">
                {formatPrice(item.lineTotal)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Checkout Section */}
      <div className="p-6 border-t border-zinc-100/50 bg-white/40 space-y-6 flex-shrink-0">
        
        {/* Customer & Notes */}
        <div className="space-y-3">
          <ClientSelector />
          <div className="relative group">
            <Info className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Notas de la remisión..."
              className="w-full h-12 pl-10 pr-4 bg-white border-2 border-zinc-100 rounded-xl text-sm font-bold text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Medio de Pago</p>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm.value}
                onClick={() => setPaymentMethod(pm.value)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-300 active:scale-[0.97]",
                  paymentMethod === pm.value
                    ? "bg-primary border-primary text-primary-foreground shadow-xl"
                    : "bg-white border-zinc-100 text-zinc-400 hover:border-zinc-300"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                  paymentMethod === pm.value ? "bg-white/10" : "bg-zinc-50"
                )}>
                  {pm.icon}
                </div>
                <span className="text-xs font-black uppercase tracking-tight">{pm.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Taxes Toggle */}
        <button
          onClick={() => !hasRequiredIvaItem && setIncludesIvaManual((v) => !v)}
          disabled={hasRequiredIvaItem}
          className={cn(
            "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300",
            includesIva ? "bg-primary border-primary text-primary-foreground shadow-xl" : "bg-white border-zinc-100 text-zinc-400"
          )}
        >
          <div className="flex flex-col items-start text-left">
            <span className="text-xs font-black uppercase tracking-widest">Incluir IVA ({(ivaRate * 100).toFixed(0)}%)</span>
            {hasRequiredIvaItem && (
              <span className="text-[9px] font-bold text-emerald-400 mt-0.5">Obligatorio por producto</span>
            )}
          </div>
          <div className={cn(
            "w-10 h-5 rounded-full relative transition-colors p-1",
            includesIva ? "bg-emerald-500" : "bg-zinc-200"
          )}>
            <div className={cn(
              "w-3 h-3 bg-white rounded-full transition-transform duration-300",
              includesIva ? "translate-x-5" : "translate-x-0"
            )} />
          </div>
        </button>

        {/* Summary & Button */}
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            {includesIva && (
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
            )}
            <div className="flex items-end justify-between px-1">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Total a Cobrar</span>
                <span className="text-3xl font-black text-zinc-900 tracking-tighter leading-none mt-1">
                  {formatPrice(total)}
                </span>
              </div>
              {includesIva && (
                <div className="text-right">
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">IVA Incluido</span>
                  <p className="text-xs font-bold text-emerald-600">{formatPrice(taxAmount)}</p>
                </div>
              )}
            </div>
          </div>

          <button
            disabled={submitting}
            onClick={handleGenerateRemision}
            className="w-full h-16 rounded-2xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all hover:opacity-90 hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 shadow-xl"
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
    </div>
  );
}
