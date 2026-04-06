'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Search, Package, Plus, WifiOff, DatabaseZap, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPosProducts, type PosProductDto } from '@/services/pos';
import { usePosStore } from '@/stores';
import { useCrossTabSync } from '@/lib/hooks';
import { QuantitySelector } from './QuantitySelector';
import { OfflineCacheError } from '@/services/http-client';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

export function ProductGrid() {
  const [products, setProducts] = useState<PosProductDto[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<PosProductDto | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [offlineNoCache, setOfflineNoCache] = useState(false);
  const gridTopRef = useRef<HTMLDivElement>(null);

  const { searchTerm, setSearchTerm, cart } = usePosStore(useShallow((s) => ({
    searchTerm: s.searchTerm,
    setSearchTerm: s.setSearchTerm,
    cart: s.cart,
  })));

  const loadProducts = useCallback(async (currentPage: number, currentSearch: string) => {
    try {
      setLoading(true);
      setOfflineNoCache(false);
      setFromCache(false);
      const onCacheHit = () => setFromCache(true);
      window.addEventListener('offline-cache-hit', onCacheHit, { once: true });

      const result = await getPosProducts(currentSearch || undefined, currentPage, PAGE_SIZE);
      setProducts(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      window.removeEventListener('offline-cache-hit', onCacheHit);
    } catch (err) {
      if (err instanceof OfflineCacheError) {
        setProducts([]);
        setTotal(0);
        setTotalPages(1);
        setOfflineNoCache(true);
        setFromCache(false);
      } else {
        console.error('Error cargando productos POS:', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset to page 1 when search changes, then load
  const searchRef = useRef(searchTerm);
  useEffect(() => {
    const isNewSearch = searchRef.current !== searchTerm;
    searchRef.current = searchTerm;
    const nextPage = isNewSearch ? 1 : page;
    if (isNewSearch) setPage(1);
    const timer = setTimeout(() => loadProducts(nextPage, searchTerm), 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, page]);

  useCrossTabSync('inventory', () => {
    loadProducts(page, searchTerm);
  });

  const goToPage = (p: number) => {
    setPage(p);
    gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
    <div className="flex h-full min-h-0 flex-col" ref={gridTopRef}>
      {/* Buscador — Estética consistente con el Header */}
      <div className="flex-shrink-0 sticky top-0 z-20 pt-2 pb-3 bg-background/90 backdrop-blur-md">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Buscar por nombre, SKU o categoría..."
            className="w-full h-12 md:h-14 pl-11 pr-4 bg-card border-2 border-border rounded-2xl text-sm md:text-base font-bold text-foreground placeholder:text-muted-foreground/60 transition-all focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 shadow-sm"
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
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar pr-0.5">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-border border-t-primary animate-spin" />
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em]">Sincronizando Catálogo...</p>
        </div>
      ) : offlineNoCache ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-fadeIn">
          <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mb-6">
            <WifiOff className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-black text-foreground tracking-tight">Sin Conexión</h3>
          <p className="text-sm font-medium text-muted-foreground mt-2 max-w-xs mx-auto">
            No encontramos productos guardados localmente. Conéctate para actualizar el catálogo.
          </p>
          <button
            onClick={() => loadProducts(page, searchTerm)}
            className="mt-6 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg"
          >
            Reintentar Conexión
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground animate-fadeIn">
          <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mb-6">
            <Package className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">No hay coincidencias</p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 text-xs font-bold text-foreground underline underline-offset-4 decoration-border hover:text-primary hover:decoration-primary transition-all"
            >
              Ver todos los productos
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-1.5 md:gap-4 animate-fadeIn pb-6">
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
                  "card-premium group relative flex flex-col text-left border-none transition-all duration-300 active:scale-[0.98]",
                  "p-2.5 md:p-5",
                  inCart && "ring-2 ring-primary",
                  outOfStock && "opacity-60 cursor-not-allowed grayscale"
                )}
              >
                {/* Badges Superior */}
                <div className="absolute top-2 right-2 md:top-4 md:right-4 flex flex-col items-end gap-1.5 md:gap-2 z-10">
                  {inCart && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 md:px-2 md:py-1 bg-primary text-primary-foreground rounded-lg shadow-xl animate-slideUp">
                      <ShoppingCart className="w-2.5 h-2.5 md:w-3 md:h-3" />
                      <span className="text-[9px] md:text-[10px] font-black">{cartQty}</span>
                    </div>
                  )}
                  {hasTiers && !inCart && !outOfStock && (
                    <div className="px-2 py-0.5 bg-primary text-primary-foreground text-[8px] md:text-[9px] font-black uppercase tracking-tighter rounded-lg shadow-md">
                      Oferta
                    </div>
                  )}
                  {outOfStock && (
                    <div className="px-2 py-0.5 bg-rose-500 text-white text-[8px] md:text-[9px] font-black uppercase tracking-tighter rounded-lg shadow-md">
                      Agotado
                    </div>
                  )}
                </div>

                {/* Categoría y SKU */}
                <div className="flex items-center gap-2 mb-1 md:mb-3">
                  <span className="text-[7px] md:text-[9px] font-black text-muted-foreground uppercase tracking-[0.18em] bg-muted px-1.5 md:px-2 py-0.5 rounded-md">
                    {product.category || 'General'}
                  </span>
                </div>

                {/* Info Principal */}
                <div className="space-y-0.5 md:space-y-1 mb-2.5 md:mb-6">
                  <h4 className="text-[12px] md:text-sm font-black text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-1 md:line-clamp-2">
                    {product.productName}
                  </h4>
                  {product.variantName && (
                    <p className="hidden md:block text-xs font-bold text-muted-foreground">{product.variantName}</p>
                  )}
                </div>

                {/* Footer Tarjeta */}
                <div className="mt-auto pt-2 md:pt-4 border-t border-border/60 flex items-end justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-col">
                      {hasTiers && maxPrice && maxPrice !== bestPrice && (
                        <span className="hidden md:block text-[10px] font-bold text-muted-foreground/70 line-through tracking-tight">
                          {formatPrice(maxPrice)}
                        </span>
                      )}
                      <span className={cn(
                        "font-black tracking-tight",
                        "text-sm md:text-lg",
                        hasTiers ? "text-primary" : "text-foreground"
                      )}>
                        {formatPrice(bestPrice)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        outOfStock ? "bg-rose-400" : product.stockTotal < 5 ? "bg-amber-400" : "bg-emerald-400"
                      )} />
                      <span className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-wide md:tracking-widest">
                        Stock: {product.stockTotal}
                      </span>
                    </div>
                  </div>

                  {/* Botón Acción */}
                  <div className={cn(
                    "w-8.5 h-8.5 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm flex-shrink-0",
                    inCart ? "bg-primary text-primary-foreground scale-110 shadow-xl" : "bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg"
                  )}>
                    <Plus className={cn("w-4.5 h-4.5 md:w-6 md:h-6 transition-transform duration-500", inCart && "rotate-90")} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      </div>

      {/* Paginación */}
      {!loading && !offlineNoCache && totalPages > 1 && (
        <div className="flex-shrink-0 flex items-center justify-between pt-2 pb-3 px-1 bg-background/90 backdrop-blur-md border-t border-border/80">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {total} productos · pág. {page}/{totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-card border-2 border-border text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-all"
              aria-label="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Números de página — máximo 5 visibles */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === 'ellipsis' ? (
                  <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-xs text-muted-foreground/70 font-bold">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => goToPage(item as number)}
                    className={cn(
                      'w-9 h-9 flex items-center justify-center rounded-xl text-xs font-black transition-all',
                      page === item
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-card border-2 border-border text-muted-foreground hover:border-primary hover:text-primary'
                    )}
                  >
                    {item}
                  </button>
                )
              )}

            <button
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-card border-2 border-border text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-all"
              aria-label="Página siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
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
