'use client';

import { useState, useEffect, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Search, Package, Plus, WifiOff, DatabaseZap } from 'lucide-react';
import { getPosProducts, type PosProductDto } from '@/services/pos';
import { usePosStore } from '@/stores';
import { useCrossTabSync } from '@/lib/hooks';
import { QuantitySelector } from './QuantitySelector';
import { OfflineCacheError } from '@/services/http-client';

export function ProductGrid() {
  const [products, setProducts] = useState<PosProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<PosProductDto | null>(null);
  /** true cuando los datos vienen del caché local (sin internet) */
  const [fromCache, setFromCache] = useState(false);
  /** true cuando no hay internet Y tampoco hay caché */
  const [offlineNoCache, setOfflineNoCache] = useState(false);

  const { searchTerm, setSearchTerm, cart } = usePosStore(useShallow((s) => ({
    searchTerm: s.searchTerm,
    setSearchTerm: s.setSearchTerm,
    cart: s.cart,
  })));

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setOfflineNoCache(false);
      // Escuchar si el http-client sirvió desde caché
      const onCacheHit = () => setFromCache(true);
      window.addEventListener('offline-cache-hit', onCacheHit, { once: true });

      const data = await getPosProducts(searchTerm || undefined);
      setProducts(data);
      // Si llegamos aquí sin el evento, los datos son frescos del servidor
      window.removeEventListener('offline-cache-hit', onCacheHit);
    } catch (err) {
      if (err instanceof OfflineCacheError) {
        // Sin internet y sin caché — estado vacío con mensaje apropiado
        setProducts([]);
        setOfflineNoCache(true);
        setFromCache(false);
      } else {
        console.error('Error cargando productos POS:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(loadProducts, 300);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  // ── Recargar productos cuando el inventario cambia (venta, recepción, etc.) ──
  useCrossTabSync('inventory', () => {
    loadProducts();
  });

  const getBestPrice = (p: PosProductDto) => {
    if (p.priceTiers.length === 0) return p.defaultPrice;
    return Math.min(...p.priceTiers.map((t) => t.price));
  };

  const getMaxPrice = (p: PosProductDto) => {
    if (p.priceTiers.length === 0) return null;
    return Math.max(...p.priceTiers.map((t) => t.price));
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(price);

  const getCartQty = (variantId: number) =>
    cart.find((i) => i.variantId === variantId)?.qty ?? 0;

  return (
    <>
      {/* Buscador — grande y touch-friendly */}
      <div className="relative mb-4 sticky top-0 bg-white/95 backdrop-blur-sm z-10 pt-1 pb-2">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" style={{ marginTop: '2px' }} />
        <input
          type="text"
          placeholder="Buscar por nombre o SKU..."
          className="w-full pl-12 pr-4 py-3.5 border-2 border-zinc-200 rounded-2xl text-base focus:outline-none focus:border-primary transition-colors"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoComplete="off"
        />
        {/* Badge: datos desde caché local */}
        {fromCache && !loading && (
          <div className="flex items-center gap-1.5 mt-2 px-1 text-amber-600">
            <DatabaseZap className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-xs font-medium">Mostrando productos en caché — sin conexión</span>
          </div>
        )}
      </div>

      {/* Estado de carga */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 rounded-full border-3 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-zinc-400">Cargando productos...</p>
        </div>
      ) : offlineNoCache ? (
        /* Sin internet y sin caché — estado especial */
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-500 px-4 text-center">
          <WifiOff className="w-14 h-14 opacity-30" />
          <div>
            <p className="text-base font-semibold">Sin conexión</p>
            <p className="text-sm text-gray-400 mt-1">
              No hay productos en caché todavía.{' '}
              Conéctate a internet al menos una vez para que los productos queden disponibles offline.
            </p>
          </div>
          <button
            onClick={() => loadProducts()}
            className="text-sm text-primary underline"
          >
            Reintentar
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
          <Package className="w-14 h-14 opacity-30" />
          <p className="text-base">No se encontraron productos</p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-sm text-primary underline"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        /*
         * Grid adaptativo:
         *  - Móvil y paneles angostos: 1 columna para que el texto se lea completo
         *  - md 768+: 2 columnas
         *  - xl 1280+: 3 columnas
         */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {products.map((product) => {
            const cartQty = getCartQty(product.variantId);
            const inCart = cartQty > 0;
            const bestPrice = getBestPrice(product);
            const maxPrice = getMaxPrice(product);
            const hasTiers = product.priceTiers.length > 0;
            const outOfStock = product.stockTotal === 0;

            return (
              <button
                key={product.variantId}
                onClick={() => setSelectedProduct(product)}
                disabled={outOfStock}
                className={`
                  relative flex flex-col text-left rounded-2xl border-2 p-3.5 transition-all
                  active:scale-[0.97] select-none
                  ${inCart
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm'
                  }
                  ${outOfStock ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {/* Indicador "en carrito" */}
                {inCart && (
                  <span className="absolute top-2.5 right-2.5 w-6 h-6 bg-primary text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {cartQty}
                  </span>
                )}

                {/* Badge tiers */}
                {hasTiers && !inCart && !outOfStock && (
                  <span className="absolute top-2.5 right-2.5 text-[10px] text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full font-medium">
                    -{Math.round((1 - bestPrice / (maxPrice ?? bestPrice)) * 100)}%
                  </span>
                )}

                {/* Badge sin stock */}
                {outOfStock && (
                  <span className="absolute top-2.5 right-2.5 text-[10px] text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full font-medium">
                    Sin stock
                  </span>
                )}

                {/* Nombre del producto */}
                <p className="text-sm font-semibold text-zinc-900 leading-snug mb-1 pr-8 break-words">
                  {product.productName}
                </p>
                {product.variantName && (
                  <p className="text-xs text-zinc-400 mb-2 break-words">{product.variantName}</p>
                )}

                {/* Categoría */}
                <p className="text-[11px] text-zinc-400 mb-3">{product.category}</p>

                {/* Precio y stock */}
                <div className="mt-auto flex items-end justify-between gap-1">
                  <div>
                    {hasTiers && maxPrice && maxPrice !== bestPrice ? (
                      <>
                        <p className="text-[11px] text-zinc-400 line-through">{formatPrice(maxPrice)}</p>
                        <p className="text-base font-bold text-primary leading-tight">{formatPrice(bestPrice)}</p>
                      </>
                    ) : (
                      <p className="text-base font-bold text-zinc-900">{formatPrice(bestPrice)}</p>
                    )}
                    <p className={`text-[11px] mt-0.5 ${outOfStock ? 'text-red-500' : 'text-zinc-400'}`}>
                      {outOfStock ? 'Sin stock' : `Stock: ${product.stockTotal}`}
                    </p>
                  </div>

                  {/* Botón + */}
                  <div
                    className={`
                      w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center transition-colors
                      ${inCart ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-600'}
                    `}
                  >
                    <Plus className="w-5 h-5" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* QuantitySelector */}
      {selectedProduct && (
        <QuantitySelector
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
}
