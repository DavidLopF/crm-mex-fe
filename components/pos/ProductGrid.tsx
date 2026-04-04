'use client';

import { useState, useEffect, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Search, Package, Plus, WifiOff, DatabaseZap, ShoppingCart, AlertCircle } from 'lucide-react';
import { getPosProducts, type PosProductDto } from '@/services/pos';
import { usePosStore } from '@/stores';
import { useCrossTabSync } from '@/lib/hooks';
import { QuantitySelector } from './QuantitySelector';
import { OfflineCacheError } from '@/services/http-client';
import { cn } from '@/lib/utils';

export function ProductGrid() {
  const [products, setProducts] = useState<PosProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<PosProductDto | null>(null);
  const [fromCache, setFromCache] = useState(false);
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
      const onCacheHit = () => setFromCache(true);
      window.addEventListener('offline-cache-hit', onCacheHit, { once: true });

      const data = await getPosProducts(searchTerm || undefined);
      setProducts(data);
      window.removeEventListener('offline-cache-hit', onCacheHit);
    } catch (err) {
      if (err instanceof OfflineCacheError) {
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
    <div className="space-y-6">
      {/* Buscador — Estética consistente con el Header */}
      <div className="sticky top-0 z-20 pt-2 pb-4 bg-background/80 backdrop-blur-md">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Buscar por nombre, SKU o categoría..."
            className="w-full h-14 pl-12 pr-4 bg-white border-2 border-zinc-100 rounded-2xl text-base font-bold text-zinc-900 placeholder:text-zinc-300 transition-all focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
          />
          {fromCache && !loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full text-amber-600">
              <DatabaseZap className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Modo Offline</span>
            </div>
          )}
        </div>
      </div>

      {/* Estado de carga */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-zinc-100 border-t-primary animate-spin" />
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-[0.2em]">Sincronizando Catálogo...</p>
        </div>
      ) : offlineNoCache ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-fadeIn">
          <div className="w-20 h-20 rounded-3xl bg-zinc-50 flex items-center justify-center mb-6">
            <WifiOff className="w-10 h-10 text-zinc-300" />
          </div>
          <h3 className="text-xl font-black text-zinc-900 tracking-tight">Sin Conexión</h3>
          <p className="text-sm font-medium text-zinc-500 mt-2 max-w-xs mx-auto">
            No encontramos productos guardados localmente. Conéctate para actualizar el catálogo.
          </p>
          <button
            onClick={() => loadProducts()}
            className="mt-6 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg"
          >
            Reintentar Conexión
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-400 animate-fadeIn">
          <div className="w-20 h-20 rounded-3xl bg-zinc-50 flex items-center justify-center mb-6">
            <Package className="w-10 h-10 text-zinc-200" />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-zinc-300">No hay coincidencias</p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 text-xs font-bold text-zinc-900 underline underline-offset-4 decoration-zinc-200 hover:text-primary hover:decoration-primary transition-all"
            >
              Ver todos los productos
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-fadeIn">
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
                className={cn(
                  "card-premium group relative flex flex-col text-left p-5 border-none transition-all duration-300 active:scale-[0.98]",
                  inCart && "ring-2 ring-primary",
                  outOfStock && "opacity-60 cursor-not-allowed grayscale"
                )}
              >
                {/* Badges Superior */}
                <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-10">
                  {inCart && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary text-primary-foreground rounded-lg shadow-xl animate-slideUp">
                      <ShoppingCart className="w-3 h-3" />
                      <span className="text-[10px] font-black">{cartQty}</span>
                    </div>
                  )}
                  {hasTiers && !inCart && !outOfStock && (
                    <div className="px-2 py-1 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-tighter rounded-lg shadow-md">
                      Oferta
                    </div>
                  )}
                  {outOfStock && (
                    <div className="px-2 py-1 bg-rose-500 text-white text-[9px] font-black uppercase tracking-tighter rounded-lg shadow-md">
                      Agotado
                    </div>
                  )}
                </div>

                {/* Categoría y SKU */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] bg-zinc-50 px-2 py-0.5 rounded-md">
                    {product.category || 'General'}
                  </span>
                </div>

                {/* Info Principal */}
                <div className="space-y-1 mb-6">
                  <h4 className="text-sm font-black text-zinc-900 leading-tight group-hover:text-primary transition-colors">
                    {product.productName}
                  </h4>
                  {product.variantName && (
                    <p className="text-xs font-bold text-zinc-400">{product.variantName}</p>
                  )}
                </div>

                {/* Footer Tarjeta */}
                <div className="mt-auto pt-4 border-t border-zinc-50 flex items-end justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-col">
                      {hasTiers && maxPrice && maxPrice !== bestPrice && (
                        <span className="text-[10px] font-bold text-zinc-300 line-through tracking-tight">
                          {formatPrice(maxPrice)}
                        </span>
                      )}
                      <span className={cn(
                        "text-lg font-black tracking-tight",
                        hasTiers ? "text-emerald-600" : "text-zinc-900"
                      )}>
                        {formatPrice(bestPrice)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        outOfStock ? "bg-rose-400" : product.stockTotal < 5 ? "bg-amber-400" : "bg-emerald-400"
                      )} />
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        Stock: {product.stockTotal}
                      </span>
                    </div>
                  </div>

                  {/* Botón Acción */}
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm",
                    inCart ? "bg-primary text-primary-foreground scale-110 shadow-xl" : "bg-zinc-50 text-zinc-400 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg"
                  )}>
                    <Plus className={cn("w-6 h-6 transition-transform duration-500", inCart && "rotate-90")} />
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
    </div>
  );
}
