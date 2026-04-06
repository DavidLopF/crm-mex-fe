'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  Filter,
  X,
  ChevronDown,
} from 'lucide-react';
import { getKardex, getVariantesParaKardex } from '@/services/reports';
import type { KardexData, KardexMovimiento, VarianteOption } from '@/services/reports';
import { useCompany } from '@/lib/company-context';
import { KardexMovimientosChart } from '@/components/charts';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(isoString: string): string {
  return formatDateTime(isoString);
}

function variantLabel(v: VarianteOption): string {
  return v.variantName
    ? `${v.product.name} – ${v.variantName}`
    : v.product.name;
}

// ─── Fila de movimiento ───────────────────────────────────────────────────────

function MovimientoRow({ mov }: { mov: KardexMovimiento }) {
  const isEntrada = mov.tipo === 'ENTRADA';
  return (
    <tr className="hover:bg-zinc-50 transition-colors">
      <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
        {formatDate(mov.fecha)}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
            isEntrada ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          }`}
        >
          {isEntrada ? (
            <ArrowUpCircle className="w-3 h-3" />
          ) : (
            <ArrowDownCircle className="w-3 h-3" />
          )}
          {mov.tipo}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-zinc-700">{mov.concepto}</td>
      <td className="px-4 py-3 text-sm font-mono text-zinc-600">{mov.referencia}</td>
      <td className="px-4 py-3 text-sm text-zinc-500">{mov.almacen ?? '—'}</td>
      <td
        className={`px-4 py-3 text-right text-sm font-semibold ${
          isEntrada ? 'text-green-700' : 'text-red-600'
        }`}
      >
        {isEntrada ? '+' : '-'}
        {formatNumber(mov.qty)}
      </td>
      <td className="px-4 py-3 text-right text-sm text-zinc-600">
        {mov.costo === null ? '—' : formatCurrency(mov.costo)}
      </td>
      <td className="px-4 py-3 text-right text-sm font-bold text-zinc-900">
        {formatNumber(mov.saldo)}
      </td>
    </tr>
  );
}

// ─── ProductSelector ──────────────────────────────────────────────────────────

/**
 * Selector de producto rediseñado:
 * - Muestra la lista inmediatamente al cargar (sin necesidad de click)
 * - Filtra en tiempo real con búsqueda
 * - Muestra el producto seleccionado con opción de limpiar
 */
function ProductSelector({
  selected,
  onSelect,
  primaryColor,
}: {
  selected: VarianteOption | null;
  onSelect: (v: VarianteOption | null) => void;
  primaryColor: string;
}) {
  const [search, setSearch] = useState('');
  const [variantes, setVariantes] = useState<VarianteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cargar variantes (sin debounce en el mount inicial, con debounce en búsqueda)
  useEffect(() => {
    let cancelled = false;
    const delay = search === '' ? 0 : 300; // sin delay en mount

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await getVariantesParaKardex(search || undefined);
        if (!cancelled) setVariantes(data);
      } catch {
        if (!cancelled) setVariantes([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredVariantes = search
    ? variantes.filter(
        (v) =>
          v.product.name.toLowerCase().includes(search.toLowerCase()) ||
          v.sku.toLowerCase().includes(search.toLowerCase()) ||
          (v.variantName?.toLowerCase() ?? '').includes(search.toLowerCase()),
      )
    : variantes;

  // ── Si hay un producto seleccionado ──────────────────────────────────────
  if (selected) {
    return (
      <div
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 text-sm"
        style={{ borderColor: primaryColor + '40', backgroundColor: primaryColor + '08' }}
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-zinc-900 truncate">{variantLabel(selected)}</p>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">SKU: {selected.sku}</p>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="p-1 rounded-md hover:bg-zinc-200 transition-colors flex-shrink-0"
          title="Cambiar producto"
        >
          <X className="w-4 h-4 text-zinc-500" />
        </button>
      </div>
    );
  }

  // ── Selector con lista visible ────────────────────────────────────────────
  return (
    <div ref={containerRef} className="relative">
      {/* Input de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar producto por nombre o SKU..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full pl-9 pr-8 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent"
          style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          autoFocus
        />
        <ChevronDown
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Lista desplegable — siempre visible al abrir */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden">
          {loading && (
            <div className="px-4 py-3 text-xs text-zinc-400 text-center">
              Cargando productos...
            </div>
          )}

          {!loading && filteredVariantes.length === 0 && (
            <div className="px-4 py-3 text-xs text-zinc-400 text-center">
              {search ? `Sin resultados para "${search}"` : 'No hay productos disponibles'}
            </div>
          )}

          {!loading && filteredVariantes.length > 0 && (
            <ul className="max-h-64 overflow-y-auto divide-y divide-zinc-50">
              {filteredVariantes.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      // mousedown antes del blur para evitar que se cierre primero
                      e.preventDefault();
                      onSelect(v);
                      setOpen(false);
                      setSearch('');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-zinc-900">
                        {v.product.name}
                      </span>
                      {v.variantName && (
                        <span className="text-zinc-500"> — {v.variantName}</span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-400 font-mono flex-shrink-0">
                      {v.sku}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function KardexReport() {
  const { settings } = useCompany();
  const primaryColor = settings.primaryColor;

  const [selectedVariant, setSelectedVariant] = useState<VarianteOption | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [kardex, setKardex] = useState<KardexData | null>(null);
  const [loadingKardex, setLoadingKardex] = useState(false);
  const [kardexError, setKardexError] = useState<string | null>(null);

  // ── Cargar kardex cuando hay variante o cambian los filtros de fecha ──────
  const fetchKardex = useCallback(async () => {
    if (!selectedVariant) {
      setKardex(null);
      return;
    }
    setLoadingKardex(true);
    setKardexError(null);
    try {
      const data = await getKardex({
        variantId: selectedVariant.id,
        from: from || undefined,
        to: to || undefined,
      });
      setKardex(data);
    } catch (err) {
      setKardexError('No se pudo cargar el kardex. Intenta nuevamente.');
      console.error(err);
    } finally {
      setLoadingKardex(false);
    }
  }, [selectedVariant, from, to]);

  useEffect(() => {
    fetchKardex();
  }, [fetchKardex]);

  function handleSelectVariant(v: VarianteOption | null) {
    setSelectedVariant(v);
    if (!v) setKardex(null);
  }

  return (
    <div className="space-y-5">
      {/* Panel de filtros */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 space-y-3">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
          Seleccionar producto
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Selector */}
          <div className="flex-1">
            <ProductSelector
              selected={selectedVariant}
              onSelect={handleSelectVariant}
              primaryColor={primaryColor}
            />
          </div>

          {/* Filtro desde */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-400 flex-shrink-0" />
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="text-sm border border-zinc-200 rounded-lg px-3 py-2.5 focus:outline-none"
              title="Desde"
              disabled={!selectedVariant}
            />
          </div>

          {/* Filtro hasta */}
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="text-sm border border-zinc-200 rounded-lg px-3 py-2.5 focus:outline-none disabled:opacity-50"
            title="Hasta"
            disabled={!selectedVariant}
          />
        </div>
      </div>

      {/* Cargando kardex */}
      {selectedVariant && loadingKardex && (
        <div className="bg-white rounded-xl border border-zinc-200 flex items-center justify-center py-16 text-zinc-400 text-sm">
          Cargando movimientos...
        </div>
      )}

      {/* Error */}
      {selectedVariant && !loadingKardex && kardexError && (
        <div className="bg-white rounded-xl border border-zinc-200 flex items-center justify-center py-16 text-red-500 text-sm">
          {kardexError}
        </div>
      )}

      {/* Resultado del kardex */}
      {selectedVariant && !loadingKardex && !kardexError && kardex && (
        <>
          {/* Info variante + resumen + stock */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Info del producto */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 p-4">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                Producto
              </h3>
              <p className="text-base font-bold text-zinc-900">
                {kardex.variante.productName}
              </p>
              {kardex.variante.variantName && (
                <p className="text-sm text-zinc-500 mt-0.5">
                  {kardex.variante.variantName}
                </p>
              )}
              <p className="text-xs text-zinc-400 mt-1 font-mono">
                SKU: {kardex.variante.sku}
              </p>
              {kardex.variante.categoryName && (
                <p className="text-xs text-zinc-400 mt-0.5">
                  Categoría: {kardex.variante.categoryName}
                </p>
              )}
              {/* Stock actual inline */}
              {kardex.stockActual.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {kardex.stockActual.map((s) => (
                    <div
                      key={s.almacen}
                      className="text-xs rounded-lg border border-zinc-100 px-3 py-1.5 bg-zinc-50 flex items-center gap-2"
                    >
                      <span className="font-medium text-zinc-600">{s.almacen}:</span>
                      <span
                        className="font-bold"
                        style={{ color: primaryColor }}
                      >
                        {formatNumber(s.qtyDisponible)} disp.
                      </span>
                      {s.qtyReservada > 0 && (
                        <span className="text-zinc-400">
                          / {formatNumber(s.qtyReservada)} res.
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resumen de movimientos */}
            <div className="bg-white rounded-xl border border-zinc-200 p-4">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                Resumen del período
              </h3>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-sm text-green-700">
                    <ArrowUpCircle className="w-4 h-4" />
                    <span className="font-medium">Entradas</span>
                  </div>
                  <span className="text-sm font-bold text-green-700">
                    +{formatNumber(kardex.resumen.totalEntradas)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-sm text-red-600">
                    <ArrowDownCircle className="w-4 h-4" />
                    <span className="font-medium">Salidas</span>
                  </div>
                  <span className="text-sm font-bold text-red-600">
                    -{formatNumber(kardex.resumen.totalSalidas)}
                  </span>
                </div>
                <div
                  className="flex justify-between items-center pt-2.5 border-t border-zinc-100"
                >
                  <span className="text-sm font-semibold text-zinc-700">
                    Saldo final
                  </span>
                  <span
                    className="text-base font-bold"
                    style={{ color: primaryColor }}
                  >
                    {formatNumber(kardex.resumen.saldoFinal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico de evolución del stock */}
          {kardex.movimientos.length > 0 && (
            <KardexMovimientosChart
              movimientos={kardex.movimientos}
              primaryColor={primaryColor}
            />
          )}

          {/* Tabla de movimientos */}
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-700">
                Movimientos
              </h3>
              <span className="text-xs text-zinc-400 bg-white border border-zinc-200 rounded-full px-2 py-0.5">
                {kardex.movimientos.length} registros
              </span>
            </div>

            {kardex.movimientos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-2 text-zinc-400">
                <p className="text-sm">No hay movimientos en el período seleccionado.</p>
                {(from || to) && (
                  <p className="text-xs">Prueba ampliando el rango de fechas.</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      {['Fecha', 'Tipo', 'Concepto', 'Referencia', 'Almacén', 'Cantidad', 'Costo/Precio', 'Saldo'].map(
                        (h) => (
                          <th
                            key={h}
                            className={`px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide ${
                              ['Cantidad', 'Costo/Precio', 'Saldo'].includes(h)
                                ? 'text-right'
                                : 'text-left'
                            }`}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {kardex.movimientos.map((mov, idx) => (
                      <MovimientoRow key={idx} mov={mov} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
