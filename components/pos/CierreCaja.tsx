'use client';

import { useState, useCallback } from 'react';
import {
  Banknote, CreditCard, Calculator,
  CheckCircle, AlertCircle, ChevronDown, ChevronUp, History, RefreshCw,
} from 'lucide-react';

/** Ícono Nequi — círculo rosa con "N" blanca (colores de marca) */
function NequiIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="#DA0081" />
      <text x="10" y="14.5" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial, sans-serif">N</text>
    </svg>
  );
}

/** Ícono Daviplata — círculo rojo con "D" blanca (colores de marca) */
function DaviplataIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="#DA3B24" />
      <text x="10" y="14.5" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial, sans-serif">D</text>
    </svg>
  );
}
import { Card, Button } from '@/components/ui';
import {
  getCashCloseSummary, createCashClose,
  getCashCloseHistory,
  type CashCloseSummaryDto,
  type CashCloseResponseDto,
} from '@/services/pos';
import { useGlobalToast } from '@/lib/hooks';

// ─── helpers ───────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

const fmtDate = (s: string) =>
  new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(s));

function todayStr() {
  // Fecha LOCAL del dispositivo (no UTC) para evitar que a partir de las
  // 7 pm (UTC-5) el sistema calcule el día siguiente como "hoy".
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Muestra la diferencia con color semáforo: verde = exacto/sobrante, rojo = faltante */
function DiffCell({ diff }: { diff: number }) {
  if (diff === 0) return <span className="text-zinc-400 text-sm">—</span>;
  const positive = diff > 0;
  return (
    <span className={`text-sm font-semibold ${positive ? 'text-green-600' : 'text-red-600'}`}>
      {positive ? '+' : ''}{fmt(diff)}
    </span>
  );
}

// ─── Sub-componente: fila de conciliación por medio de pago ────────────────
interface ReconcileRowProps {
  icon: React.ReactNode;
  label: string;
  calculated: number;
  declared: number;
  onDeclaredChange: (val: number) => void;
}

function ReconcileRow({ icon, label, calculated, declared, onDeclaredChange }: ReconcileRowProps) {
  const diff = declared - calculated;
  return (
    <div className="grid grid-cols-4 gap-3 items-center py-3 border-b border-zinc-100 last:border-0">
      <div className="flex items-center gap-2 col-span-1">
        <span className="text-zinc-500">{icon}</span>
        <span className="text-sm font-medium text-zinc-700">{label}</span>
      </div>
      <div className="text-right text-sm font-semibold text-zinc-800">{fmt(calculated)}</div>
      <div>
        <input
          type="number"
          min={0}
          step="0.01"
          value={declared === 0 ? '' : declared}
          placeholder="0.00"
          onChange={(e) => onDeclaredChange(parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-1.5 text-sm border border-zinc-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>
      <div className="text-right">
        <DiffCell diff={diff} />
      </div>
    </div>
  );
}

// ─── Sub-componente: historial de cierres ─────────────────────────────────
function HistoryPanel() {
  const [closes, setCloses] = useState<CashCloseResponseDto[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async (p = 1) => {
    try {
      setLoading(true);
      const res = await getCashCloseHistory(p, 5);
      setCloses(res.data);
      setTotal(res.total);
      setPage(p);
    } catch { /* silenciar */ }
    finally { setLoading(false); }
  }, []);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && closes.length === 0) load(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / 5));

  return (
    <Card className="p-4">
      <button
        className="w-full flex items-center justify-between"
        onClick={toggle}
      >
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-semibold text-zinc-700">Historial de cierres</span>
          {total > 0 && (
            <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">{total}</span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
      </button>

      {expanded && (
        <div className="mt-3">
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : closes.length === 0 ? (
            <p className="text-center text-sm text-zinc-400 py-4">Sin cierres registrados</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-500 uppercase tracking-wide">
                      <th className="text-left py-2 px-2">Período</th>
                      <th className="text-left py-2 px-2">Cajero</th>
                      <th className="text-right py-2 px-2">Total</th>
                      <th className="text-right py-2 px-2">Efectivo</th>
                      <th className="text-right py-2 px-2">Tarjeta</th>
                      <th className="text-right py-2 px-2">Nequi</th>
                      <th className="text-right py-2 px-2">Daviplata</th>
                      <th className="text-right py-2 px-2">Diff.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {closes.map((c) => {
                      const totalDiff = c.diffEfectivo + c.diffTarjeta + c.diffNequi + c.diffDaviplata;
                      const hasIssue  = totalDiff < -0.01;
                      return (
                        <tr key={c.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                          <td className="py-2 px-2 text-zinc-500 whitespace-nowrap">
                            {fmtDate(c.periodFrom).split(',')[0]} – {fmtDate(c.periodTo).split(',')[0]}
                          </td>
                          <td className="py-2 px-2 text-zinc-600">{c.closedByName}</td>
                          <td className="py-2 px-2 text-right font-semibold">{fmt(c.totalSales)}</td>
                          <td className="py-2 px-2 text-right text-emerald-700">{fmt(c.totalEfectivo)}</td>
                          <td className="py-2 px-2 text-right text-blue-700">{fmt(c.totalTarjeta)}</td>
                          <td className="py-2 px-2 text-right text-pink-700">{fmt(c.totalNequi)}</td>
                          <td className="py-2 px-2 text-right text-red-700">{fmt(c.totalDaviplata)}</td>
                          <td className="py-2 px-2 text-right">
                            <span className={`font-semibold ${hasIssue ? 'text-red-600' : 'text-green-600'}`}>
                              {totalDiff === 0 ? '—' : `${totalDiff > 0 ? '+' : ''}${fmt(totalDiff)}`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mini paginación */}
              {totalPages > 1 && (
                <div className="flex justify-end gap-1 mt-2">
                  <button
                    onClick={() => load(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-2 py-1 text-xs rounded bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40"
                  >‹</button>
                  <span className="px-2 py-1 text-xs text-zinc-500">{page}/{totalPages}</span>
                  <button
                    onClick={() => load(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-2 py-1 text-xs rounded bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40"
                  >›</button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────

export function CierreCaja() {
  const toast = useGlobalToast();
  const today = todayStr();

  const [from, setFrom]       = useState(today);
  const [to, setTo]           = useState(today);
  const [summary, setSummary] = useState<CashCloseSummaryDto | null>(null);
  const [loadingSum, setLoadingSum] = useState(false);

  const [declaredEfectivo,  setDeclaredEfectivo]  = useState(0);
  const [declaredTarjeta,   setDeclaredTarjeta]   = useState(0);
  const [declaredNequi,     setDeclaredNequi]     = useState(0);
  const [declaredDaviplata, setDeclaredDaviplata] = useState(0);
  const [notes, setNotes]   = useState('');
  const [saving, setSaving] = useState(false);

  // Cálculos derivados
  const calculated = summary ?? { totalEfectivo: 0, totalTarjeta: 0, totalNequi: 0, totalDaviplata: 0, totalSales: 0, salesCount: 0 };
  const totalDeclared = declaredEfectivo + declaredTarjeta + declaredNequi + declaredDaviplata;
  const totalDiff     = totalDeclared - calculated.totalSales;

  const loadSummary = async () => {
    if (!from || !to) return;
    try {
      setLoadingSum(true);
      const res = await getCashCloseSummary(from, to);
      setSummary(res);
      // Pre-llenar con los montos calculados como punto de partida
      setDeclaredEfectivo(res.totalEfectivo);
      setDeclaredTarjeta(res.totalTarjeta);
      setDeclaredNequi(res.totalNequi);
      setDeclaredDaviplata(res.totalDaviplata);
    } catch (err) {
      toast.error('No se pudo cargar el resumen', { title: 'Error' });
    } finally {
      setLoadingSum(false);
    }
  };

  const handleSave = async () => {
    if (!summary) return;
    try {
      setSaving(true);
      await createCashClose({
        periodFrom: from,
        periodTo:   to,
        declaredEfectivo,
        declaredTarjeta,
        declaredNequi,
        declaredDaviplata,
        notes: notes || undefined,
      });
      toast.success('Cierre de caja registrado correctamente', { title: '✅ Caja cerrada' });
      // Limpiar formulario
      setSummary(null);
      setDeclaredEfectivo(0);
      setDeclaredTarjeta(0);
      setDeclaredNequi(0);
      setDeclaredDaviplata(0);
      setNotes('');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Error al guardar el cierre',
        { title: 'No se pudo guardar' },
      );
    } finally {
      setSaving(false);
    }
  };

  const hasDifference = Math.abs(totalDiff) > 0.01;

  return (
    <div className="space-y-4">
      {/* ── Header + selector de período ── */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1">
            <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary" />
              Cierre de Caja
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Concilia lo vendido con el dinero físico en caja
            </p>
          </div>

          {/* Período */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-zinc-500">Desde</label>
              <input
                type="date"
                value={from}
                max={to}
                onChange={(e) => { setFrom(e.target.value); setSummary(null); }}
                className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-zinc-500">Hasta</label>
              <input
                type="date"
                value={to}
                min={from}
                max={today}
                onChange={(e) => { setTo(e.target.value); setSummary(null); }}
                className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div className="flex flex-col justify-end">
              <Button
                onClick={loadSummary}
                disabled={loadingSum}
                className="h-9 px-4 flex items-center gap-2 text-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingSum ? 'animate-spin' : ''}`} />
                {loadingSum ? 'Calculando...' : 'Calcular'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Sin datos aún ── */}
      {!summary && !loadingSum && (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
          <Calculator className="w-12 h-12 opacity-20 mb-3" />
          <p className="text-sm">Selecciona un período y presiona <strong>Calcular</strong></p>
        </div>
      )}

      {/* ── Resumen general ── */}
      {summary && (
        <>
          {/* KPIs del período */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-4">
              <p className="text-xs text-zinc-500 uppercase font-medium mb-1">Ventas incluidas</p>
              <p className="text-2xl font-bold text-zinc-900 tracking-tight">{summary.salesCount}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-zinc-500 uppercase font-medium mb-1">Total ventas</p>
              <p className="text-xl font-semibold text-zinc-900 tracking-tight">{fmt(summary.totalSales)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-zinc-500 uppercase font-medium mb-1">Total declarado</p>
              <p className="text-xl font-semibold text-zinc-900 tracking-tight">{fmt(totalDeclared)}</p>
            </Card>
            <Card className={`p-4 ${hasDifference ? 'border-2 border-red-200 bg-red-50/40' : 'border-2 border-green-200 bg-green-50/40'}`}>
              <p className="text-xs text-zinc-500 uppercase font-medium mb-1">Diferencia total</p>
              <div className="flex items-center gap-2">
                {hasDifference
                  ? <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  : <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                }
                <p className={`text-xl font-bold ${hasDifference ? 'text-red-600' : 'text-green-600'}`}>
                  {totalDiff === 0 ? 'Cuadrado' : `${totalDiff > 0 ? '+' : ''}${fmt(totalDiff)}`}
                </p>
              </div>
            </Card>
          </div>

          {/* Tabla de conciliación por medio de pago */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-zinc-700 mb-3">Conciliación por medio de pago</h3>

            {/* Encabezados */}
            <div className="grid grid-cols-4 gap-3 pb-2 border-b border-zinc-200 text-xs font-medium text-zinc-500 uppercase tracking-wide">
              <div>Medio</div>
              <div className="text-right">Sistema</div>
              <div className="text-right">Declarado</div>
              <div className="text-right">Diferencia</div>
            </div>

            <ReconcileRow
              icon={<Banknote className="w-4 h-4 text-emerald-600" />}
              label="Efectivo"
              calculated={summary.totalEfectivo}
              declared={declaredEfectivo}
              onDeclaredChange={setDeclaredEfectivo}
            />
            <ReconcileRow
              icon={<CreditCard className="w-4 h-4 text-blue-600" />}
              label="Tarjeta"
              calculated={summary.totalTarjeta}
              declared={declaredTarjeta}
              onDeclaredChange={setDeclaredTarjeta}
            />
            <ReconcileRow
              icon={<NequiIcon className="w-4 h-4" />}
              label="Nequi"
              calculated={summary.totalNequi}
              declared={declaredNequi}
              onDeclaredChange={setDeclaredNequi}
            />
            <ReconcileRow
              icon={<DaviplataIcon className="w-4 h-4" />}
              label="Daviplata"
              calculated={summary.totalDaviplata}
              declared={declaredDaviplata}
              onDeclaredChange={setDeclaredDaviplata}
            />

            {/* Totales */}
            <div className="grid grid-cols-4 gap-3 items-center pt-3 border-t-2 border-zinc-200 mt-1">
              <div className="text-sm font-bold text-zinc-700">Total</div>
              <div className="text-right text-sm font-bold text-zinc-900">{fmt(summary.totalSales)}</div>
              <div className="text-right text-sm font-bold text-zinc-900">{fmt(totalDeclared)}</div>
              <div className="text-right">
                <DiffCell diff={totalDiff} />
              </div>
            </div>
          </Card>

          {/* Notas y botón guardar */}
          <Card className="p-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1">
                Notas del cierre (opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Observaciones, incidencias, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />
            </div>

            {/* Alerta de diferencia */}
            {hasDifference && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Hay una diferencia de <strong>{fmt(Math.abs(totalDiff))}</strong> entre el sistema y lo declarado.
                  Puedes registrar el cierre de todas formas — quedará registrada la diferencia.
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Registrar cierre de caja'}
              </Button>
            </div>
          </Card>
        </>
      )}

      {/* ── Historial ── */}
      <HistoryPanel />
    </div>
  );
}
