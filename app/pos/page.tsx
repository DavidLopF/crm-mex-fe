'use client';

import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ShoppingCart } from 'lucide-react';
import { ProductGrid, Cart, ReturnedSalesAlert } from '@/components/pos';
import { PermissionGuard } from '@/components/layout';
import { usePosStore } from '@/stores';

export default function PosPage() {
  const [showMobileCart, setShowMobileCart] = useState(false);
  const { cart, getCartTotal, getCartItemCount } = usePosStore(useShallow((s) => ({
    cart: s.cart,
    getCartTotal: s.getCartTotal,
    getCartItemCount: s.getCartItemCount,
  })));

  const itemCount = getCartItemCount();
  const total = getCartTotal();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(price);

  return (
    <PermissionGuard moduleCode="POS">
      {/*
       * Layout principal:
       *  - Móvil (<768px):   columna única con drawer del carrito desde abajo
       *  - Tablet (768-1024): split 55/45
       *  - Desktop (>1024):  split flex-1 / 380px fijo
       */}
      <div className="flex h-[calc(100dvh-4rem)] overflow-hidden">

        {/* ── Panel de productos ── */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 pt-4 pb-2 flex-shrink-0">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
              Punto de Venta
            </h1>
            <p className="text-gray-500 text-xs md:text-sm">
              Selecciona productos para agregar al carrito
            </p>
          </div>

          {/* Banner de ventas devueltas — solo visible si el vendedor tiene ventas para corregir */}
          <ReturnedSalesAlert />

          {/* Grid scrollable */}
          <div className="flex-1 overflow-y-auto px-4 pb-24 md:pb-4">
            <ProductGrid />
          </div>
        </div>

        {/* ── Carrito: panel lateral en tablet/desktop ── */}
        <div className="hidden md:flex w-[340px] lg:w-[380px] flex-shrink-0 border-l border-gray-200 flex-col overflow-hidden">
          <Cart />
        </div>

        {/* ── Botón flotante del carrito (solo móvil) ── */}
        {cart.length > 0 && (
          <button
            className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3.5 bg-gray-900 text-white rounded-2xl shadow-2xl active:scale-95 transition-transform"
            onClick={() => setShowMobileCart(true)}
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-primary rounded-full text-[10px] font-bold flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </div>
            <span className="font-semibold text-sm">Ver carrito</span>
            <span className="text-sm font-bold opacity-90">{formatPrice(total)}</span>
          </button>
        )}

        {/* ── Drawer del carrito (solo móvil) ── */}
        {showMobileCart && (
          <>
            {/* Overlay */}
            <div
              className="md:hidden fixed inset-0 z-40 bg-black/40"
              onClick={() => setShowMobileCart(false)}
            />
            {/* Drawer */}
            <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-2xl shadow-2xl flex flex-col"
              style={{ maxHeight: '88dvh' }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>
              <div className="flex-1 overflow-hidden">
                <Cart onClose={() => setShowMobileCart(false)} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Estilos de impresión */}
      <style jsx global>{`
        @media print {
          body > * { visibility: hidden; }
          #remision-print,
          #remision-print * { visibility: visible; }
          #remision-print {
            position: absolute;
            left: 0; top: 0; width: 100%;
          }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </PermissionGuard>
  );
}
