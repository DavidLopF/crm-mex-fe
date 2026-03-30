'use client';

import { useState, useEffect, useRef } from 'react';
import { Minus, Plus, ShoppingCart, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { usePosStore } from '@/stores';
import type { PosProductDto } from '@/services/pos';

interface Props {
  product: PosProductDto;
  onClose: () => void;
}

export function QuantitySelector({ product, onClose }: Props) {
  const [qty, setQty] = useState(1);
  const [visible, setVisible] = useState(false);
  const addToCart = usePosStore((s) => s.addToCart);
  const inputRef = useRef<HTMLInputElement>(null);

  // Animar entrada
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(price);

  // Resolver tier activo para la cantidad actual
  const getActiveTier = (q: number) => {
    const sorted = [...product.priceTiers].sort((a, b) => b.minQty - a.minQty);
    for (const tier of sorted) {
      if (q >= tier.minQty) return tier;
    }
    return null;
  };

  const activeTier = getActiveTier(qty);
  const currentPrice = activeTier ? activeTier.price : product.defaultPrice;
  const subtotal = currentPrice * qty;
  const maxQty = product.stockTotal > 0 ? product.stockTotal : 0;
  const isOutOfStock = product.stockTotal <= 0;
  const isOverStock = isOutOfStock ? true : qty > maxQty;
  const canIncrease = !isOutOfStock && qty < maxQty;

  const handleAdd = () => {
    if (isOverStock) return;
    addToCart(product, qty);
    handleClose();
  };

  const changeQty = (newQty: number) => {
    if (isOutOfStock) return;
    if (newQty < 1) return;
    if (maxQty > 0) {
      setQty(Math.min(newQty, maxQty));
      return;
    }
    setQty(newQty);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-280 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/*
       * Panel:
       *  - Móvil:  bottom sheet desde abajo, ancho completo, esquinas superiores redondeadas
       *  - sm+:    modal centrado, 440px de ancho, esquinas redondeadas
       */}
      <div
        className={`
          fixed z-50 bg-white shadow-2xl
          left-0 right-0 bottom-0 rounded-t-3xl
          sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2
          sm:-translate-x-1/2 sm:-translate-y-1/2
          sm:w-[440px] sm:rounded-2xl
          transition-transform duration-280 ease-out
          ${visible
            ? 'translate-y-0'
            : 'translate-y-full sm:translate-y-[-40%]'
          }
        `}
        style={{ maxHeight: '92dvh', overflowY: 'auto' }}
      >
        {/* Handle (solo móvil) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-zinc-300 rounded-full" />
        </div>

        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex-1 min-w-0 pr-3">
              <h2 className="text-lg font-bold text-zinc-900 leading-snug">
                {product.productName}
              </h2>
              {product.variantName && (
                <p className="text-sm text-zinc-500 mt-0.5">{product.variantName}</p>
              )}
              <p className="text-xs text-zinc-400 font-mono mt-0.5">{product.sku}</p>
            </div>
            <button
              onClick={handleClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-zinc-100 transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>

          {/* Estado sin stock */}
          {isOutOfStock && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              Sin stock disponible
            </div>
          )}

          {/* Tiers como botones tapeables */}
          {product.priceTiers.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2.5">
                Precios por volumen — toca para seleccionar
              </p>
              <div className="flex flex-col gap-2">
                {product.priceTiers.map((tier) => {
                  const isActive = activeTier?.id === tier.id;
                  return (
                    <button
                      key={tier.id}
                      onClick={() => changeQty(tier.minQty)}
                      disabled={isOutOfStock}
                      className={`
                        flex items-center justify-between w-full px-4 py-3.5 rounded-xl border-2 text-left
                        transition-all active:scale-[0.98]
                        ${isActive
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-zinc-200 bg-white hover:border-zinc-300'
                        }
                        ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <div>
                        <span className={`text-sm font-bold ${isActive ? 'text-primary' : 'text-zinc-700'}`}>
                          {tier.tierLabel}
                        </span>
                        <span className="text-xs text-zinc-400 ml-2">
                          desde {tier.minQty} pza
                        </span>
                      </div>
                      <span className={`text-base font-bold ${isActive ? 'text-primary' : 'text-zinc-900'}`}>
                        {formatPrice(tier.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Precio único si no hay tiers */}
          {product.priceTiers.length === 0 && (
            <div className="mb-5 py-3 bg-zinc-50 rounded-xl text-center">
              <p className="text-xs text-zinc-500 mb-0.5">Precio unitario</p>
              <p className="text-2xl font-bold text-zinc-900 tracking-tight">{formatPrice(product.defaultPrice)}</p>
            </div>
          )}

          {/* Selector de cantidad — botones grandes (56px) para touch */}
          <div className="mb-3">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2.5">
              Cantidad
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                className="w-14 h-14 flex items-center justify-center rounded-2xl border-2 border-zinc-200 text-zinc-600 hover:border-primary hover:text-primary active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => changeQty(qty - 1)}
                disabled={qty <= 1}
                aria-label="Reducir cantidad"
              >
                <Minus className="w-6 h-6" />
              </button>

              <input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                min={1}
                max={maxQty > 0 ? maxQty : undefined}
                value={qty}
                disabled={isOutOfStock}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  if (!isNaN(v) && v > 0) changeQty(v);
                }}
                className="w-24 h-14 text-center text-2xl font-bold border-2 border-zinc-200 rounded-2xl focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />

              <button
                className="w-14 h-14 flex items-center justify-center rounded-2xl border-2 border-zinc-200 text-zinc-600 hover:border-primary hover:text-primary active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => changeQty(qty + 1)}
                disabled={!canIncrease}
                aria-label="Aumentar cantidad"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Accesos rápidos de cantidad */}
          {product.priceTiers.length === 0 && (
            <div className="flex gap-2 justify-center mb-5">
              {[1, 5, 10, 20].map((n) => (
                <button
                  key={n}
                  onClick={() => changeQty(n)}
                  disabled={isOutOfStock}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    qty === n
                      ? 'bg-primary text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  } ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {n}
                </button>
              ))}
            </div>
          )}

          {/* Subtotal */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-zinc-50 rounded-xl mb-4">
            <div>
              <p className="text-xs text-zinc-500">
                {qty} × {formatPrice(currentPrice)}
              </p>
              {activeTier && (
                <p className="text-xs text-green-600 font-medium mt-0.5">
                  ✓ {activeTier.tierLabel}
                </p>
              )}
            </div>
            <p className="text-2xl font-bold text-zinc-900 tracking-tight">{formatPrice(subtotal)}</p>
          </div>

          {/* Aviso de stock */}
          {isOverStock && !isOutOfStock && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2.5 rounded-xl mb-4">
              ⚠ La cantidad supera el stock disponible ({product.stockTotal} pzas)
            </p>
          )}

          {/* Botón agregar */}
          <Button
            className="w-full h-14 text-base font-semibold flex items-center justify-center gap-2 rounded-2xl"
            onClick={handleAdd}
            disabled={isOverStock}
          >
            <ShoppingCart className="w-5 h-5" />
            Agregar al carrito
          </Button>
        </div>
      </div>
    </>
  );
}
