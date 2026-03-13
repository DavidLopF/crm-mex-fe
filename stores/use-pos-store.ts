import { create } from 'zustand';
import type { PriceTierDto, PosProductDto, SaleResponseDto, PaymentMethod } from '@/services/pos';

// ══════════════════════════════════════════════════════════════════════
// ── POS Store (Zustand) ─────────────────────────────────────────────
// Estado global del Punto de Venta: carrito, última venta, búsqueda.
// ══════════════════════════════════════════════════════════════════════

export interface CartItem {
  variantId: number;
  sku: string;
  productName: string;
  variantName: string | null;
  qty: number;
  unitPrice: number;
  appliedTierLabel: string | null;
  lineTotal: number;
  priceTiers: PriceTierDto[];
  defaultPrice: number;
  stockTotal: number;
  /** true = el producto siempre debe venderse con IVA (16%); el toggle en el POS se bloquea ON */
  requiresIva: boolean;
}

interface PosState {
  // ── Cart ──
  cart: CartItem[];
  searchTerm: string;
  clientName: string;
  clientId: number | null;
  notes: string;
  paymentMethod: PaymentMethod;

  // ── Última venta (para imprimir remisión) ──
  lastSale: SaleResponseDto | null;

  // ── Loading ──
  loading: boolean;

  // ── Actions ──
  addToCart: (product: PosProductDto, qty: number) => void;
  updateQty: (variantId: number, qty: number) => void;
  removeFromCart: (variantId: number) => void;
  clearCart: () => void;
  setSearchTerm: (s: string) => void;
  setClientName: (name: string) => void;
  setClientId: (id: number | null) => void;
  setNotes: (notes: string) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setLastSale: (sale: SaleResponseDto | null) => void;
  setLoading: (v: boolean) => void;

  // ── Computed-like helpers ──
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

/**
 * Aplica el tier correcto: el mayor minQty que sea ≤ qty.
 * Si no hay tier, devuelve defaultPrice.
 */
function resolveTier(
  qty: number,
  tiers: PriceTierDto[],
  defaultPrice: number
): { unitPrice: number; tierLabel: string | null } {
  const sorted = [...tiers].sort((a, b) => b.minQty - a.minQty);
  for (const tier of sorted) {
    if (qty >= tier.minQty) {
      return { unitPrice: tier.price, tierLabel: tier.tierLabel };
    }
  }
  return { unitPrice: defaultPrice, tierLabel: null };
}

export const usePosStore = create<PosState>((set, get) => ({
  cart: [],
  searchTerm: '',
  clientName: '',
  clientId: null,
  notes: '',
  paymentMethod: 'EFECTIVO',
  lastSale: null,
  loading: false,

  addToCart: (product, qty) => {
    set((state) => {
      const existing = state.cart.find((i) => i.variantId === product.variantId);

      if (existing) {
        // Incrementar qty y recalcular
        const newQty = existing.qty + qty;
        const { unitPrice, tierLabel } = resolveTier(
          newQty,
          existing.priceTiers,
          existing.defaultPrice
        );
        return {
          cart: state.cart.map((i) =>
            i.variantId === product.variantId
              ? {
                  ...i,
                  qty: newQty,
                  unitPrice,
                  appliedTierLabel: tierLabel,
                  lineTotal: unitPrice * newQty,
                }
              : i
          ),
        };
      }

      // Nuevo item
      const { unitPrice, tierLabel } = resolveTier(
        qty,
        product.priceTiers,
        product.defaultPrice
      );
      const newItem: CartItem = {
        variantId: product.variantId,
        sku: product.sku,
        productName: product.productName,
        variantName: product.variantName,
        qty,
        unitPrice,
        appliedTierLabel: tierLabel,
        lineTotal: unitPrice * qty,
        priceTiers: product.priceTiers,
        defaultPrice: product.defaultPrice,
        stockTotal: product.stockTotal,
        requiresIva: product.requiresIva ?? false,
      };

      return { cart: [...state.cart, newItem] };
    });
  },

  updateQty: (variantId, qty) => {
    if (qty <= 0) {
      get().removeFromCart(variantId);
      return;
    }

    set((state) => ({
      cart: state.cart.map((i) => {
        if (i.variantId !== variantId) return i;
        const { unitPrice, tierLabel } = resolveTier(
          qty,
          i.priceTiers,
          i.defaultPrice
        );
        return {
          ...i,
          qty,
          unitPrice,
          appliedTierLabel: tierLabel,
          lineTotal: unitPrice * qty,
        };
      }),
    }));
  },

  removeFromCart: (variantId) => {
    set((state) => ({
      cart: state.cart.filter((i) => i.variantId !== variantId),
    }));
  },

  clearCart: () => {
    set({ cart: [], clientName: '', clientId: null, notes: '', paymentMethod: 'EFECTIVO' });
  },

  setSearchTerm: (s) => set({ searchTerm: s }),
  setClientName: (name) => set({ clientName: name }),
  setClientId: (id) => set({ clientId: id }),
  setNotes: (notes) => set({ notes }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setLastSale: (sale) => set({ lastSale: sale }),
  setLoading: (v) => set({ loading: v }),

  getCartTotal: () => get().cart.reduce((sum, i) => sum + i.lineTotal, 0),
  getCartItemCount: () => get().cart.reduce((sum, i) => sum + i.qty, 0),
}));
