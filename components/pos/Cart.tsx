'use client';

import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  Minus, Plus, Trash2, ShoppingBag, Receipt, X,
  ChevronDown, Banknote, CreditCard, Info, Loader2,
  Wallet, Sparkles, User, ShieldCheck
} from 'lucide-react';
import { usePosStore } from '@/stores';
import { createSale, type PaymentMethod } from '@/services/pos';
import { useGlobalToast } from '@/lib/hooks';
import { useCompany } from '@/lib/company-context';
import { broadcastInvalidation } from '@/lib/cross-tab-sync';
import { OfflineQueuedError } from '@/services/http-client';
import { ClientSelector } from './ClientSelector';
import { cn, formatCurrency } from '@/lib/utils';

function NequiIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("rounded-full", className)} aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="#DA0081" />
      <text x="10" y="14.5" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial, sans-serif">N</text>
    </svg>
  );
}

function DaviplataIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("rounded-full", className)} aria-hidden="true">
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
  mobileMode?: boolean;
}

export function Cart({ onClose, mobileMode = false }: CartProps) {
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

  const ivaRate = settings?.defaultIvaRate ?? 0.16;
  const hasRequiredIvaItem = cart.some((i) => i.requiresIva);
  const includesIva = hasRequiredIvaItem || includesIvaManual;

  const subtotal   = cart.reduce((sum, i) => sum + i.lineTotal, 0);
  const taxAmount  = includesIva ? Math.round(subtotal * ivaRate * 100) / 100 : 0;
  const total      = subtotal + taxAmount;
  const itemCount  = cart.reduce((sum, i) => sum + i.qty, 0);

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
      <div className="flex flex-col h-full bg-white animate-fadeIn">
        <div className={cn(
          'flex items-center justify-between border-b border-zinc-100 bg-white sticky top-0 z-10',
          mobileMode ? 'px-4 py-3.5' : 'px-6 py-5'
        )}>
          <div className="flex items-center gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden w-8 h-8 flex items-center justify-center rounded-full bg-zinc-50 text-zinc-500 active:bg-zinc-100 transition-colors"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-lg font-black text-zinc-900 tracking-tight">Carrito</h2>
          </div>
        </div>

        <div className={cn(
          'flex-1 flex flex-col items-center justify-center gap-6',
          mobileMode ? 'p-6' : 'p-8'
        )}>
          <div className="relative">
            <div className="w-24 h-24 rounded-[2.5rem] bg-zinc-50 flex items-center justify-center rotate-3 border border-zinc-100">
              <ShoppingBag className="w-10 h-10 text-zinc-200 -rotate-3" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div className="text-center space-y-2 max-w-[200px]">
            <p className="text-sm font-black text-zinc-800 uppercase tracking-[0.1em]">Carrito Vacío</p>
            <p className="text-xs text-zinc-400 font-medium leading-relaxed">Agrega productos del catálogo para comenzar la venta.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 relative overflow-hidden">
      
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div className={cn(
        'flex-shrink-0 bg-white border-b border-zinc-200/60 flex items-center justify-between sticky top-0 z-20 shadow-sm backdrop-blur-sm bg-white/90',
        mobileMode ? 'px-4 py-3' : 'px-5 py-4'
      )}>
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 active:scale-90 transition-all"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className={cn(
              'font-black text-zinc-900 tracking-tight flex items-center gap-2',
              mobileMode ? 'text-sm' : 'text-base'
            )}>
              Resumen de Venta
              <span className={cn(
                'flex items-center justify-center bg-zinc-900 text-white font-black rounded-md',
                mobileMode ? 'min-w-[18px] h-4.5 px-1.5 text-[9px]' : 'min-w-[20px] h-5 px-1.5 text-[10px]'
              )}>
                {itemCount}
              </span>
            </h2>
          </div>
        </div>
        <button
          onClick={clearCart}
          title="Vaciar carrito"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-rose-400 hover:bg-rose-50 active:bg-rose-100 transition-colors"
        >
          <Trash2 className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* ── CONTENIDO SCROLLABLE ───────────────────────────────── */}
      <div className={cn(
        'flex-1 overflow-y-auto overscroll-contain space-y-4 custom-scrollbar',
        mobileMode ? 'px-3 py-3 pb-5' : 'px-4 py-4'
      )}>
        
        {/* Items */}
        <div className="space-y-2.5">
          {cart.map((item) => (
            <div
              key={item.variantId}
              className={cn(
                'group bg-white rounded-2xl border border-zinc-200/60 shadow-sm hover:border-zinc-300 transition-all duration-200',
                mobileMode ? 'p-3.5' : 'p-4'
              )}
            >
              <div className="flex justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className={cn(
                    'font-bold text-zinc-900 leading-tight line-clamp-2',
                    mobileMode ? 'text-[12px]' : 'text-[13px]'
                  )}>
                    {item.productName}
                  </h3>
                  {item.variantName && (
                    <p className={cn(
                      'text-zinc-400 font-semibold mt-0.5 uppercase tracking-wide',
                      mobileMode ? 'text-[10px]' : 'text-[11px]'
                    )}>
                      {item.variantName}
                    </p>
                  )}
                  {item.appliedTierLabel && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-lg mt-1.5 uppercase tracking-tighter border border-emerald-100">
                      {item.appliedTierLabel}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => removeFromCart(item.variantId)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-300 hover:text-rose-500 hover:bg-rose-50 transition-all flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center bg-zinc-50 border border-zinc-100 rounded-xl p-0.5">
                  <button
                    onClick={() => updateQty(item.variantId, item.qty - 1)}
                    className={cn(
                      'flex items-center justify-center rounded-lg bg-white shadow-sm border border-zinc-100 text-zinc-600 active:scale-90 transition-all',
                      mobileMode ? 'w-7 h-7' : 'w-8 h-8'
                    )}
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className={cn(
                    'text-center font-black text-zinc-900 tabular-nums',
                    mobileMode ? 'w-8 text-[13px]' : 'w-9 text-sm'
                  )}>
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.variantId, item.qty + 1)}
                    className={cn(
                      'flex items-center justify-center rounded-lg bg-white shadow-sm border border-zinc-100 text-zinc-600 active:scale-90 transition-all',
                      mobileMode ? 'w-7 h-7' : 'w-8 h-8'
                    )}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-zinc-400 leading-none mb-1">
                    {formatCurrency(item.unitPrice)}
                  </p>
                  <p className={cn(
                    'font-black text-zinc-900 tabular-nums leading-none',
                    mobileMode ? 'text-[13px]' : 'text-[14px]'
                  )}>
                    {formatCurrency(item.lineTotal)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sección Datos */}
        <div className={cn(
          'space-y-3',
          mobileMode ? 'pt-6 space-y-4' : 'pt-8 md:pt-10'
        )}>
           <div className="flex items-center gap-2 px-1">
              <User className="w-3.5 h-3.5 text-zinc-400" />
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Cliente</p>
           </div>
           <div className="bg-white rounded-2xl border border-zinc-200/60 p-1 shadow-sm">
             <ClientSelector />
           </div>

              <div className={cn('flex items-center gap-2 px-1', mobileMode ? 'pt-3' : 'pt-4')}>
              <Info className="w-3.5 h-3.5 text-zinc-400" />
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Notas adicionales</p>
           </div>
           <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm overflow-hidden">
              <input
                type="text"
                placeholder="Escribe una nota interna..."
                className={cn(
                  'w-full bg-transparent text-sm font-medium text-zinc-900 placeholder:text-zinc-300 focus:outline-none',
                  mobileMode ? 'h-11 px-3.5' : 'h-12 px-4'
                )}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
           </div>
        </div>

        {/* Pago */}
            <div className={cn(mobileMode ? 'pt-4' : 'pt-6')}>
          <div className="flex items-center gap-2 px-1 mb-3">
             <Wallet className="w-3.5 h-3.5 text-zinc-400" />
             <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Método de pago</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((pm) => {
              const active = paymentMethod === pm.value;
              return (
                <button
                  key={pm.value}
                  onClick={() => setPaymentMethod(pm.value)}
                  className={cn(
                    'flex items-center gap-3 h-14 px-3 rounded-2xl border-2 transition-all duration-200 relative group',
                    active
                      ? 'bg-zinc-900 border-zinc-900 text-white shadow-lg shadow-zinc-200'
                      : 'bg-white border-zinc-200/60 text-zinc-500 hover:border-zinc-300'
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-xl shrink-0 transition-colors",
                    active ? "bg-zinc-800 text-white" : "bg-zinc-50 text-zinc-400"
                  )}>
                    {pm.icon}
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wider">{pm.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* IVA */}
        <div className={cn(mobileMode ? 'pt-4' : 'pt-6')}>
          <button
            onClick={() => !hasRequiredIvaItem && setIncludesIvaManual((v) => !v)}
            disabled={hasRequiredIvaItem}
            className={cn(
              'w-full flex items-center justify-between h-14 px-4 rounded-2xl border-2 transition-all duration-200',
              includesIva
                ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800'
                : 'bg-white border-zinc-200/60 text-zinc-500'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 flex items-center justify-center rounded-xl shrink-0 transition-colors",
                includesIva ? "bg-emerald-500 text-white" : "bg-zinc-50 text-zinc-400"
              )}>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block text-[11px] font-black uppercase tracking-wider">
                  Incluir IVA ({(ivaRate * 100).toFixed(0)}%)
                </span>
                {hasRequiredIvaItem && (
                  <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-tighter">Obligatorio por producto</span>
                )}
              </div>
            </div>
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

        <div className="h-4" />
      </div>

      {/* ── FOOTER (AJUSTADO PARA SAFARI IPHONE) ───────────────── */}
      <div
        className={cn(
          'flex-shrink-0 bg-white border-t border-zinc-200/80 shadow-[0_-12px_40px_rgba(0,0,0,0.08)] z-30 relative',
          mobileMode ? 'px-4 pt-4 pb-5' : 'px-6 pt-5 pb-6'
        )}
        style={{ 
          paddingBottom: mobileMode
            ? 'calc(max(2.5rem, env(safe-area-inset-bottom, 0px)) + 16px)'
            : 'calc(max(1.25rem, env(safe-area-inset-bottom, 0px)) + 8px)',
        }}
      >
        <div className="space-y-2 mb-6">
          {includesIva && (
            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 tracking-wider">
              <span>SUBTOTAL SIN IVA</span>
              <span className="tabular-nums">{formatCurrency(subtotal)}</span>
            </div>
          )}
          {includesIva && (
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-600 tracking-wider">
              <span>IVA ({(ivaRate * 100).toFixed(0)}%)</span>
              <span className="tabular-nums">+ {formatCurrency(taxAmount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-1 gap-4">
            <span className={cn(
              'font-black text-zinc-900 uppercase tracking-[0.2em]',
              mobileMode ? 'text-[11px]' : 'text-[12px]'
            )}>Total a Pagar</span>
            <span className={cn(
              'font-black text-zinc-900 tracking-tighter tabular-nums leading-none',
              mobileMode ? 'text-[2rem]' : 'text-3xl'
            )}>
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        <button
          disabled={submitting}
          onClick={handleGenerateRemision}
          className={cn(
            'w-full rounded-[1.25rem] bg-zinc-900 text-white font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all active:scale-[0.97] hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-zinc-900/20 border border-white/10',
            mobileMode ? 'h-14 text-[12px] mb-1' : 'h-16 text-[13px]'
          )}
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Receipt className="w-5 h-5 text-primary" />
              Generar Remisión
            </>
          )}
        </button>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e4e4e7;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
