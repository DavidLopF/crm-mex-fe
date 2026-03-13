'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Save, Search, Tag, ChevronDown, ChevronUp,
  Loader2, PackageSearch,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { PermissionGuard } from '@/components/layout';
import { useGlobalToast } from '@/lib/hooks';
import { getPosProducts, upsertVariantTiers } from '@/services/pos';
import type { PosProductDto, PriceTierDto } from '@/services/pos';

// ── Tipos locales ─────────────────────────────────────────────────

interface TierRow {
  /** id del tier existente (undefined si es nuevo) */
  id?: number;
  minQty: string;
  price: string;
  tierLabel: string;
}

interface ProductState {
  expanded: boolean;
  tiers: TierRow[];
  saving: boolean;
  dirty: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(price);

function tiersFromDto(tiers: PriceTierDto[]): TierRow[] {
  return tiers.map((t) => ({
    id: t.id,
    minQty: t.minQty.toString(),
    price: t.price.toString(),
    tierLabel: t.tierLabel,
  }));
}

// ── Componente de fila de tier editable ──────────────────────────

interface TierRowEditorProps {
  tier: TierRow;
  index: number;
  onChange: (idx: number, field: keyof TierRow, value: string) => void;
  onRemove: (idx: number) => void;
}

function TierRowEditor({ tier, index, onChange, onRemove }: TierRowEditorProps) {
  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
      {/* Cantidad mínima */}
      <div className="flex-none w-24">
        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">
          Desde (pzas)
        </label>
        <input
          type="number"
          min={1}
          value={tier.minQty}
          onChange={(e) => onChange(index, 'minQty', e.target.value)}
          className="w-full text-sm font-semibold border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-primary"
        />
      </div>

      {/* Precio */}
      <div className="flex-none w-28">
        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">
          Precio unit.
        </label>
        <input
          type="number"
          min={0}
          step={0.01}
          value={tier.price}
          onChange={(e) => onChange(index, 'price', e.target.value)}
          className="w-full text-sm font-semibold border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-primary"
        />
      </div>

      {/* Etiqueta */}
      <div className="flex-1 min-w-0">
        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">
          Etiqueta
        </label>
        <input
          type="text"
          placeholder="Ej. Por docena"
          value={tier.tierLabel}
          onChange={(e) => onChange(index, 'tierLabel', e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-primary"
        />
      </div>

      {/* Eliminar */}
      <button
        onClick={() => onRemove(index)}
        className="flex-none mt-4 w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
        aria-label="Eliminar tier"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Componente de tarjeta de producto ────────────────────────────

interface ProductCardProps {
  product: PosProductDto;
  state: ProductState;
  onToggle: (variantId: number) => void;
  onTierChange: (variantId: number, idx: number, field: keyof TierRow, value: string) => void;
  onTierRemove: (variantId: number, idx: number) => void;
  onTierAdd: (variantId: number) => void;
  onSave: (variantId: number) => void;
}

function ProductCard({
  product, state, onToggle, onTierChange, onTierRemove, onTierAdd, onSave,
}: ProductCardProps) {
  const hasTiers = state.tiers.length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header del producto */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
        onClick={() => onToggle(product.variantId)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="font-semibold text-gray-900 text-sm">{product.productName}</p>
            {product.variantName && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {product.variantName}
              </span>
            )}
            <span className="text-xs text-gray-400 font-mono">{product.sku}</span>
          </div>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-xs text-gray-500">
              Precio base: <strong>{formatPrice(product.defaultPrice)}</strong>
            </span>
            {hasTiers ? (
              <span className="text-xs text-primary font-medium flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {state.tiers.length} tier{state.tiers.length !== 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-xs text-gray-400">Sin tiers configurados</span>
            )}
            {state.dirty && (
              <span className="text-xs text-amber-600 font-medium">• Cambios sin guardar</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
          {state.saving && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
          {state.expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Contenido expandido */}
      {state.expanded && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/60 space-y-3">
          {/* Lista de tiers */}
          {state.tiers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">
              No hay tiers de precio. Agrega uno abajo.
            </p>
          ) : (
            <div className="space-y-2">
              {state.tiers.map((tier, idx) => (
                <TierRowEditor
                  key={idx}
                  tier={tier}
                  index={idx}
                  onChange={(i, field, val) => onTierChange(product.variantId, i, field, val)}
                  onRemove={(i) => onTierRemove(product.variantId, i)}
                />
              ))}
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onTierAdd(product.variantId)}
              className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
            >
              <Plus className="w-4 h-4" />
              Agregar tier
            </button>

            <div className="flex-1" />

            <Button
              className="flex items-center gap-1.5 h-9 px-4 text-sm rounded-xl"
              onClick={() => onSave(product.variantId)}
              disabled={state.saving || !state.dirty}
            >
              {state.saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar
            </Button>
          </div>

          {/* Hint de precio base */}
          <p className="text-xs text-gray-400">
            Precio base del producto: {formatPrice(product.defaultPrice)} — se aplica cuando
            ningún tier coincide con la cantidad.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────

export default function PreciosPage() {
  const toast = useGlobalToast();
  const [products, setProducts] = useState<PosProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [states, setStates] = useState<Record<number, ProductState>>({});

  // Carga inicial de productos con tiers incluidos
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPosProducts();
      setProducts(data);

      // Inicializar estado por variante
      const initial: Record<number, ProductState> = {};
      for (const p of data) {
        initial[p.variantId] = {
          expanded: false,
          tiers: tiersFromDto(p.priceTiers),
          saving: false,
          dirty: false,
        };
      }
      setStates(initial);
    } catch {
      toast.error('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filtrado por búsqueda
  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.productName.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.variantName ?? '').toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  // ── Handlers ──

  const toggle = (variantId: number) => {
    setStates((prev) => ({
      ...prev,
      [variantId]: { ...prev[variantId], expanded: !prev[variantId].expanded },
    }));
  };

  const changeTier = (
    variantId: number,
    idx: number,
    field: keyof TierRow,
    value: string,
  ) => {
    setStates((prev) => {
      const rows = [...prev[variantId].tiers];
      rows[idx] = { ...rows[idx], [field]: value };
      return { ...prev, [variantId]: { ...prev[variantId], tiers: rows, dirty: true } };
    });
  };

  const removeTier = (variantId: number, idx: number) => {
    setStates((prev) => {
      const rows = prev[variantId].tiers.filter((_, i) => i !== idx);
      return { ...prev, [variantId]: { ...prev[variantId], tiers: rows, dirty: true } };
    });
  };

  const addTier = (variantId: number) => {
    setStates((prev) => {
      const existing = prev[variantId].tiers;
      // Sugerir minQty siguiente
      const maxQty = existing.reduce((m, t) => Math.max(m, parseInt(t.minQty, 10) || 0), 0);
      const newRow: TierRow = {
        minQty: maxQty > 0 ? (maxQty + 6).toString() : '',
        price: '',
        tierLabel: '',
      };
      return {
        ...prev,
        [variantId]: {
          ...prev[variantId],
          tiers: [...existing, newRow],
          dirty: true,
          expanded: true,
        },
      };
    });
  };

  const saveTiers = async (variantId: number) => {
    const state = states[variantId];
    if (!state) return;
    const product = products.find((p) => p.variantId === variantId);

    // Validar
    for (const t of state.tiers) {
      const minQtyNumber = parseInt(t.minQty, 10);
      const priceNumber = parseFloat(t.price);

      if (!t.tierLabel.trim()) {
        toast.error('Todos los tiers deben tener una etiqueta', { title: 'Validación' });
        return;
      }
      if (!Number.isFinite(minQtyNumber) || minQtyNumber < 1) {
        toast.error('La cantidad mínima debe ser al menos 1', { title: 'Validación' });
        return;
      }
      if (!Number.isFinite(priceNumber) || priceNumber < 0) {
        toast.error('El precio no puede ser negativo', { title: 'Validación' });
        return;
      }
    }

    // Verificar minQty únicos
    const qtys = state.tiers.map((t) => parseInt(t.minQty, 10));
    if (new Set(qtys).size !== qtys.length) {
      toast.error('Dos tiers no pueden tener la misma cantidad mínima', { title: 'Validación' });
      return;
    }

    setStates((prev) => ({
      ...prev,
      [variantId]: { ...prev[variantId], saving: true },
    }));

    try {
      const parsedTiers = state.tiers
        .map((t) => ({
          minQty: parseInt(t.minQty, 10),
          price: parseFloat(t.price),
          tierLabel: t.tierLabel,
        }))
        .sort((a, b) => a.minQty - b.minQty)
        .map((t, i) => ({ ...t, sortOrder: i }));

      const saved = await upsertVariantTiers(variantId, parsedTiers);

      setStates((prev) => ({
        ...prev,
        [variantId]: {
          ...prev[variantId],
          tiers: tiersFromDto(saved),
          saving: false,
          dirty: false,
        },
      }));

      // Actualizar también los tiers en products (para el conteo del header)
      setProducts((prev) =>
        prev.map((p) =>
          p.variantId === variantId ? { ...p, priceTiers: saved } : p,
        ),
      );

      toast.success(
        `${saved.length} tier${saved.length !== 1 ? 's' : ''} configurado${saved.length !== 1 ? 's' : ''}`,
        {
          title: '💰 Precios actualizados',
          code: product?.sku,
          duration: 5000,
        },
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar', {
        title: 'Error al guardar',
      });
      setStates((prev) => ({
        ...prev,
        [variantId]: { ...prev[variantId], saving: false },
      }));
    }
  };

  // ── Render ──

  return (
    <PermissionGuard moduleCode="POS">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Precios por Volumen</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configura tiers de precio para cada producto. A mayor cantidad, menor precio unitario.
          </p>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, SKU o categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {/* Lista de productos */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">Cargando productos...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <PackageSearch className="w-12 h-12 opacity-40" />
            <p className="text-sm font-medium">
              {search ? 'Sin resultados para la búsqueda' : 'No hay productos disponibles'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((product) => (
              <ProductCard
                key={product.variantId}
                product={product}
                state={states[product.variantId] ?? {
                  expanded: false,
                  tiers: [],
                  saving: false,
                  dirty: false,
                }}
                onToggle={toggle}
                onTierChange={changeTier}
                onTierRemove={removeTier}
                onTierAdd={addTier}
                onSave={saveTiers}
              />
            ))}
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
