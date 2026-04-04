'use client';

import { useState, useCallback } from 'react';
import {
  Minus, Plus, Trash2, Search, Banknote, CreditCard, Save, Loader2,
} from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { updateSale, getPosProducts, type SaleResponseDto, type PaymentMethod } from '@/services/pos';
import type { PosProductDto } from '@/services/pos';
import { useGlobalToast } from '@/lib/hooks';
import { broadcastInvalidation } from '@/lib/cross-tab-sync';
import { useCompany } from '@/lib/company-context';

// ── Íconos de medios de pago (reutilizados de Cart.tsx) ──

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
  { value: 'EFECTIVO',  label: 'Efectivo',  icon: <Banknote className="w-4 h-4" /> },
  { value: 'TARJETA',   label: 'Tarjeta',   icon: <CreditCard className="w-4 h-4" /> },
  { value: 'NEQUI',     label: 'Nequi',     icon: <NequiIcon className="w-4 h-4" /> },
  { value: 'DAVIPLATA', label: 'Daviplata', icon: <DaviplataIcon className="w-4 h-4" /> },
];

// ── Tipos locales ──

interface EditItem {
  variantId: number;
  sku: string;
  productName: string;
  variantName: string | null;
  qty: number;
  unitPrice: number;
  appliedTierLabel: string | null;
}

interface Props {
  sale: SaleResponseDto;
  onClose: () => void;
  onSaved: (updated: SaleResponseDto) => void;
}

export function EditSaleModal({ sale, onClose, onSaved }: Props) {
  const toast = useGlobalToast();
  const { settings } = useCompany();
  const ivaRate = settings?.defaultIvaRate ?? 0.19;

  // ── Estado editable del modal ──
  // (No usa el store de POS para no contaminar el carrito activo)
  const [items, setItems] = useState<EditItem[]>(() =>
    sale.items.map((i) => ({
      variantId: i.variantId,
      sku: i.sku,
      productName: i.productName,
      variantName: i.variantName,
      qty: i.qty,
      unitPrice: i.unitPrice,
      appliedTierLabel: i.appliedTierLabel,
    }))
  );

  const [clientId, setClientId]   = useState<number | null>(sale.clientId);
  const [clientName, setClientName] = useState<string | null>(sale.clientName);
  const [notes, setNotes]         = useState(sale.notes ?? '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(sale.paymentMethod);
  const [includesIva, setIncludesIva]     = useState(sale.taxRate > 0);

  // ── Búsqueda de producto para agregar ──
  const [search, setSearch]           = useState('');
  const [searchResults, setSearchResults] = useState<PosProductDto[]>([]);
  const [searching, setSearching]     = useState(false);
  const [showSearch, setShowSearch]   = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // ── Calcular totales ──
  const subtotal  = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const taxAmount = includesIva ? Math.round(subtotal * ivaRate * 100) / 100 : 0;
  const total     = subtotal + taxAmount;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(price);

  // ── Modificar items ──

  const updateQty = (variantId: number, newQty: number) => {
    if (newQty <= 0) {
      setItems((prev) => prev.filter((i) => i.variantId !== variantId));
    } else {
      setItems((prev) =>
        prev.map((i) => i.variantId === variantId ? { ...i, qty: newQty } : i)
      );
    }
  };

  const updateUnitPrice = (variantId: number, raw: string) => {
    const price = parseFloat(raw);
    if (!isNaN(price) && price > 0) {
      setItems((prev) =>
        prev.map((i) => i.variantId === variantId ? { ...i, unitPrice: price, appliedTierLabel: null } : i)
      );
    }
  };

  const removeItem = (variantId: number) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  };

  // ── Búsqueda y adición de productos ──

  const handleSearch = useCallback(async (query: string) => {
    setSearch(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await getPosProducts(query.trim());
      setSearchResults(results.slice(0, 10));
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const addProduct = (product: PosProductDto) => {
    const existing = items.find((i) => i.variantId === product.variantId);
    if (existing) {
      updateQty(product.variantId, existing.qty + 1);
    } else {
      setItems((prev) => [
        ...prev,
        {
          variantId: product.variantId,
          sku: product.sku,
          productName: product.productName,
          variantName: product.variantName,
          qty: 1,
          unitPrice: product.defaultPrice,
          appliedTierLabel: null,
        },
      ]);
    }
    setSearch('');
    setSearchResults([]);
    setShowSearch(false);
  };

  // ── Guardar ──

  const handleSave = async () => {
    if (items.length === 0) {
      toast.error('La venta debe tener al menos un producto', { title: 'Sin productos' });
      return;
    }
    try {
      setSubmitting(true);
      const updated = await updateSale(sale.id, {
        clientId,
        clientName,
        notes: notes || null,
        paymentMethod,
        includesIva,
        items: items.map((i) => ({
          variantId: i.variantId,
          qty: i.qty,
          unitPrice: i.unitPrice,
        })),
      });
      broadcastInvalidation(['pos-sales', 'pos-dashboard']);
      toast.success('Los cambios fueron guardados', {
        title: '✅ Venta actualizada',
        code: updated.code,
        duration: 5000,
      });
      onSaved(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar', { title: 'No se pudo guardar' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} size="lg">
      <div className="flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">Editar Venta</h2>
            <p className="text-sm text-zinc-500 font-mono">{sale.code}</p>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* Lista de items */}
          <div className="px-6 py-4 space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-700">Productos</h3>
              <button
                type="button"
                onClick={() => setShowSearch((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-primary font-medium px-3 py-1.5 rounded-lg border border-primary/30 hover:bg-primary/5 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                Agregar producto
              </button>
            </div>

            {/* Buscador de productos */}
            {showSearch && (
              <div className="relative mb-3">
                <div className="flex items-center gap-2 px-3 py-2 border border-zinc-200 rounded-xl bg-white focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary">
                  <Search className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Buscar producto o SKU..."
                    className="flex-1 text-sm bg-transparent outline-none"
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                  {searching && <Loader2 className="w-4 h-4 text-zinc-400 animate-spin flex-shrink-0" />}
                </div>
                {searchResults.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden">
                    {searchResults.map((p) => (
                      <button
                        key={p.variantId}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addProduct(p)}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-zinc-50 text-left border-b border-zinc-50 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-zinc-900">{p.productName}</p>
                          {p.variantName && <p className="text-xs text-zinc-400">{p.variantName}</p>}
                          <p className="text-xs text-zinc-400">SKU: {p.sku}</p>
                        </div>
                        <p className="text-sm font-semibold text-primary ml-4">{formatPrice(p.defaultPrice)}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {items.length === 0 && (
              <p className="text-sm text-zinc-400 text-center py-6">
                No hay productos. Agrega al menos uno.
              </p>
            )}

            {items.map((item) => (
              <div
                key={item.variantId}
                className="flex items-start gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100"
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 leading-snug">{item.productName}</p>
                  {item.variantName && <p className="text-xs text-zinc-400 mt-0.5">{item.variantName}</p>}
                  {/* Precio editable */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-xs text-zinc-500">$</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      className="w-24 text-xs font-semibold text-zinc-800 border border-zinc-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary/40"
                      value={item.unitPrice}
                      onChange={(e) => updateUnitPrice(item.variantId, e.target.value)}
                    />
                    <span className="text-xs text-zinc-400">c/u</span>
                    {item.appliedTierLabel && (
                      <span className="text-[11px] text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-medium">
                        {item.appliedTierLabel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Controles de cantidad */}
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-0.5">
                    <button
                      className="w-8 h-8 flex items-center justify-center rounded-l-xl border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 transition-colors"
                      onClick={() => updateQty(item.variantId, item.qty - 1)}
                      aria-label="Reducir"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 h-8 text-center text-sm font-bold border-y border-zinc-200 flex items-center justify-center bg-white">
                      {item.qty}
                    </span>
                    <button
                      className="w-8 h-8 flex items-center justify-center rounded-r-xl border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 transition-colors"
                      onClick={() => updateQty(item.variantId, item.qty + 1)}
                      aria-label="Aumentar"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-900">
                      {formatPrice(item.unitPrice * item.qty)}
                    </span>
                    <button
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      onClick={() => removeItem(item.variantId)}
                      aria-label="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cliente y notas */}
          <div className="px-6 pb-4 space-y-2.5 border-t border-zinc-100 pt-4">
            <h3 className="text-sm font-semibold text-zinc-700 mb-2">Cliente y notas</h3>
            {/* ClientSelector adaptado al modal (lee desde el store, pero lo usamos en modo controlado) */}
            <_EditClientSelector
              clientId={clientId}
              clientName={clientName}
              onChange={(id, name) => { setClientId(id); setClientName(name); }}
            />
            <input
              type="text"
              placeholder="Notas (opcional)"
              className="w-full px-4 py-3 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* ── Footer: IVA + Totales + Acciones ── */}
        <div className="flex-shrink-0 px-6 py-4 border-t-2 border-zinc-100 bg-zinc-50/80 space-y-3">

          {/* Medio de pago */}
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1.5">Medio de pago</p>
            <div className="grid grid-cols-4 gap-1.5">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.value}
                  type="button"
                  onClick={() => setPaymentMethod(pm.value)}
                  className={`
                    flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 text-xs font-medium transition-all
                    ${paymentMethod === pm.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300'
                    }
                  `}
                >
                  {pm.icon}
                  <span>{pm.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* IVA toggle */}
          <button
            type="button"
            onClick={() => setIncludesIva((v) => !v)}
            className={`
              w-full flex items-center justify-between px-4 py-2.5 rounded-xl border-2 transition-all
              ${includesIva ? 'border-primary bg-primary/5 text-primary' : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300'}
            `}
          >
            <span className="text-sm font-medium">Incluye IVA ({(ivaRate * 100).toFixed(0)}%)</span>
            <span className={`w-10 h-5 flex items-center rounded-full transition-colors flex-shrink-0 ml-2 ${includesIva ? 'bg-primary' : 'bg-zinc-300'}`}>
              <span className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${includesIva ? 'translate-x-5' : 'translate-x-0'}`} />
            </span>
          </button>

          {/* Totales */}
          <div className="space-y-1">
            {includesIva && (
              <>
                <div className="flex items-center justify-between text-sm text-zinc-500">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-green-700">
                  <span>IVA {(ivaRate * 100).toFixed(0)}%</span>
                  <span>+ {formatPrice(taxAmount)}</span>
                </div>
                <div className="border-t border-zinc-200 pt-1" />
              </>
            )}
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-zinc-500">Total a cobrar</span>
              <span className="text-2xl font-bold text-zinc-900 tracking-tight">{formatPrice(total)}</span>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-2">
            <Button
              className="flex-1 h-12 text-sm font-semibold flex items-center justify-center gap-2 rounded-2xl"
              onClick={handleSave}
              disabled={submitting || items.length === 0}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
              ) : (
                <><Save className="w-4 h-4" /> Guardar cambios</>
              )}
            </Button>
            <Button
              className="px-5 h-12 rounded-2xl bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════
// Selector de cliente controlado (no usa el store global de POS)
// ═══════════════════════════════════════════════════

import { useRef, useEffect } from 'react';
import { User, UserCheck, X as XIcon } from 'lucide-react';
import { getClients, createClient } from '@/services/clients';

interface EditClientSelectorProps {
  clientId: number | null;
  clientName: string | null;
  onChange: (id: number | null, name: string | null) => void;
}

function _EditClientSelector({ clientId, clientName, onChange }: EditClientSelectorProps) {
  const [open, setOpen]           = useState(false);
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading]     = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newName, setNewName]     = useState('');
  const [newDoc, setNewDoc]       = useState('');
  const [creating, setCreating]   = useState(false);
  const [createError, setCreateError] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchClients = async (q?: string) => {
    setLoading(true);
    try {
      const res = await getClients({ search: q?.trim() || undefined, limit: 20, active: true });
      setResults((res.items ?? []).map((c) => ({ id: c.id, name: c.name })));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const search = (q: string) => {
    setQuery(q);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      fetchClients(q);
      setInitialLoaded(true);
    }, 250);
  };

  useEffect(() => {
    if (!open) return;
    if (query.trim().length === 0 && !initialLoaded) {
      fetchClients();
      setInitialLoaded(true);
    }
  }, [open, query, initialLoaded]);

  const selectClient = (id: number, name: string) => {
    onChange(id, name);
    setOpen(false);
    setQuery('');
    setResults([]);
    setInitialLoaded(false);
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (query.trim() && !clientId) {
        onChange(null, query.trim());
      }
      setOpen(false);
    }, 150);
  };

  const handleCreate = async () => {
    if (!newName.trim()) { setCreateError('El nombre es requerido'); return; }
    setCreating(true);
    setCreateError('');
    try {
      const created = await createClient({ name: newName.trim(), document: newDoc.trim() || undefined });
      selectClient(created.id, created.name);
      setCreatingNew(false);
      setNewName(''); setNewDoc('');
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Error al crear cliente');
    } finally { setCreating(false); }
  };

  const clear = () => { onChange(null, null); setQuery(''); setResults([]); };

  // ── Si hay clientId, mostrar chip ──
  if (clientId && clientName) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
        <UserCheck className="w-4 h-4 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-900 truncate">{clientName}</p>
          <p className="text-xs text-zinc-400">#{clientId}</p>
        </div>
        <button onClick={clear} className="p-1 rounded-lg hover:bg-primary/10 text-zinc-400 hover:text-primary">
          <XIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ── Si hay nombre libre, mostrar chip ──
  if (!clientId && clientName) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl">
        <User className="w-4 h-4 text-zinc-400 flex-shrink-0" />
        <p className="flex-1 text-sm text-zinc-700 truncate">{clientName}</p>
        <button onClick={clear} className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400">
          <XIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ── Combobox de búsqueda ──
  return (
    <div className="relative">
      {!creatingNew ? (
        <>
          <div className="flex items-center gap-2 px-3 py-2.5 border border-zinc-200 rounded-xl bg-white focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all">
            <Search className="w-4 h-4 text-zinc-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Buscar cliente o nombre libre..."
              className="flex-1 text-sm bg-transparent outline-none text-zinc-700 placeholder:text-zinc-400"
              value={query}
              onChange={(e) => search(e.target.value)}
              onFocus={() => setOpen(true)}
              onBlur={handleBlur}
            />
            {loading && <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin" />}
          </div>
          {open && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
              {results.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectClient(c.id, c.name)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 text-left border-b border-zinc-50 last:border-0"
                >
                  <User className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                  <span className="text-sm text-zinc-700">{c.name}</span>
                </button>
              ))}
              {!loading && results.length === 0 && (
                <div className="px-4 py-2.5 text-sm text-zinc-400">Sin clientes para mostrar.</div>
              )}
              {query.trim().length >= 1 && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { setCreatingNew(true); setNewName(query.trim()); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 text-left text-primary text-sm font-medium border-t border-zinc-100"
                >
                  <span>+ Crear cliente &quot;{query.trim()}&quot;</span>
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="p-3 border border-primary/30 rounded-xl bg-primary/5 space-y-2">
          <p className="text-xs font-semibold text-primary">Nuevo cliente</p>
          <input
            autoFocus
            type="text"
            placeholder="Nombre *"
            className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-primary/30"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Documento / NIT (opcional)"
            className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-primary/30"
            value={newDoc}
            onChange={(e) => setNewDoc(e.target.value)}
          />
          {createError && <p className="text-xs text-red-500">{createError}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="flex-1 py-1.5 text-xs font-semibold text-white bg-primary rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {creating ? 'Creando...' : 'Crear'}
            </button>
            <button
              type="button"
              onClick={() => { setCreatingNew(false); setNewName(''); setNewDoc(''); setCreateError(''); }}
              className="px-3 py-1.5 text-xs text-zinc-500 bg-zinc-100 rounded-lg hover:bg-zinc-200"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
