import { create } from 'zustand';
import type { Parafiscal, TipoParafiscal } from '@/services/parafiscales';

// ══════════════════════════════════════════════════════════════════════
// ── Parafiscales Store (Zustand) ──────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════

interface ParafiscalesState {
  // ── Data ──
  items:  Parafiscal[];
  total:  number;
  page:   number;
  limit:  number;
  search: string;
  tipoFilter: TipoParafiscal | 'all';

  // ── Loading flags ──
  loading:    boolean;
  submitting: boolean;

  // ── Setters ──
  setItems:      (items: Parafiscal[], total?: number) => void;
  setLoading:    (v: boolean)                          => void;
  setSubmitting: (v: boolean)                          => void;
  setPage:       (p: number)                           => void;
  setLimit:      (l: number)                           => void;
  setSearch:     (s: string)                           => void;
  setTipoFilter: (f: TipoParafiscal | 'all')           => void;

  // ── Granular mutations ──
  upsertItem: (item: Parafiscal)                    => void;
  removeItem: (id: number)                          => void;
  patchItem:  (id: number, patch: Partial<Parafiscal>) => void;
}

export const useParafiscalesStore = create<ParafiscalesState>((set) => ({
  items:      [],
  total:      0,
  page:       1,
  limit:      10,
  search:     '',
  tipoFilter: 'all',
  loading:    false,
  submitting: false,

  setItems:      (items, total)   => set((s) => ({ items, total: total ?? s.total })),
  setLoading:    (loading)        => set({ loading }),
  setSubmitting: (submitting)     => set({ submitting }),
  setPage:       (page)           => set({ page }),
  setLimit:      (limit)          => set({ limit, page: 1 }),
  setSearch:     (search)         => set({ search, page: 1 }),
  setTipoFilter: (tipoFilter)     => set({ tipoFilter, page: 1 }),

  upsertItem: (item) =>
    set((s) => {
      const idx = s.items.findIndex((i) => i.id === item.id);
      if (idx === -1) return { items: [item, ...s.items], total: s.total + 1 };
      const copy = [...s.items];
      copy[idx] = { ...copy[idx], ...item };
      return { items: copy };
    }),

  removeItem: (id) =>
    set((s) => ({
      items: s.items.filter((i) => i.id !== id),
      total: Math.max(0, s.total - 1),
    })),

  patchItem: (id, patch) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    })),
}));
