'use client';

/**
 * ─── Cierre de Caja Moderno ──────────────────────────────────────────────────
 *
 * Flujo guiado en 3 pasos (Stepper):
 *   1. Resumen del día  — totales calculados por el sistema
 *   2. Conciliación     — cajero declara su conteo físico
 *   3. Confirmación     — revisión de diferencias y cierre definitivo
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Banknote, CreditCard, RefreshCw,
  CheckCircle2, AlertTriangle, ArrowRight,
  Receipt, ClipboardCheck, Lock, Sparkles,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Stepper, StepperActions, type Step } from '@/components/ui/stepper';
import { cn } from '@/lib/utils';
import {
  getCashCloseSummary,
  createCashClose,
  type CashCloseSummaryDto,
} from '@/services/pos';
import { useGlobalToast } from '@/lib/hooks';

/* ─── Helpers ─── */

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { 
    style: 'currency', 
    currency: 'MXN',
    maximumFractionDigits: 0
  }).format(n);

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

/* ─── Types ─── */

interface DeclaredAmounts {
  efectivo: number;
  tarjeta: number;
  nequi: number;
  daviplata: number;
}

const ZERO_DECLARED: DeclaredAmounts = { efectivo: 0, tarjeta: 0, nequi: 0, daviplata: 0 };

/* ─── Step 1: Resumen del día ─── */

interface SummaryStepProps {
  summary: CashCloseSummaryDto | null;
  loading: boolean;
  onRefresh: () => void;
  periodFrom: string;
  periodTo: string;
}

function SummaryStep({ summary, loading, onRefresh, periodFrom, periodTo }: SummaryStepProps) {
  const items = summary
    ? [
        { label: 'Efectivo', icon: <Banknote className="w-4 h-4" />, value: summary.totalEfectivo, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Tarjeta', icon: <CreditCard className="w-4 h-4" />, value: summary.totalTarjeta, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Nequi', icon: <NequiIcon className="w-4 h-4" />, value: summary.totalNequi, color: 'text-pink-600', bg: 'bg-pink-50' },
        { label: 'Daviplata', icon: <DaviplataIcon className="w-4 h-4" />, value: summary.totalDaviplata, color: 'text-red-600', bg: 'bg-red-50' },
      ]
    : [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Period */}
      <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
        <div>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Período de cierre</p>
          <p className="text-sm font-black text-zinc-900 mt-0.5">
            {periodFrom} <span className="text-zinc-300 mx-1">→</span> {periodTo || 'hoy'}
          </p>
        </div>
        <button 
          onClick={onRefresh}
          className="p-2.5 rounded-xl bg-white border border-zinc-200 text-zinc-400 hover:text-primary hover:border-primary transition-all shadow-sm active:scale-95"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-zinc-50 animate-pulse" />
          ))}
        </div>
      ) : summary ? (
        <>
          {/* Total highlight */}
          <div className="relative overflow-hidden px-6 py-8 rounded-[2rem] bg-primary text-primary-foreground shadow-xl shadow-primary/20 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700" />
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Total ventas del período</p>
              <p className="text-4xl font-black tracking-tighter mt-1">{fmt(summary.totalSales)}</p>
            </div>
            <Receipt className="absolute bottom-4 right-6 w-12 h-12 opacity-10" />
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <div key={item.label} className="flex flex-col gap-2 p-4 rounded-2xl bg-white border border-zinc-100 hover:shadow-md transition-all group">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110", item.bg)}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{item.label}</p>
                  <p className={cn('text-base font-black', item.color)}>{fmt(item.value)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-50 rounded-xl border border-zinc-100">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              {summary.salesCount ?? 0} transacciones analizadas
            </p>
          </div>
        </>
      ) : (
        <div className="py-12 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-3xl bg-zinc-50 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-black text-zinc-900 uppercase tracking-tight">Sin Datos</p>
            <p className="text-xs font-medium text-zinc-400">No se pudo cargar el resumen del período</p>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh} className="rounded-xl">Reintentar</Button>
        </div>
      )}
    </div>
  );
}

/* ─── Step 2: Conciliación ─── */

interface ReconciliationStepProps {
  summary: CashCloseSummaryDto;
  declared: DeclaredAmounts;
  onChange: (key: keyof DeclaredAmounts, val: number) => void;
}

interface ReconcileRowProps {
  icon: React.ReactNode;
  label: string;
  calculated: number;
  declared: number;
  onDeclaredChange: (val: number) => void;
  color?: string;
}

function ReconcileRow({ icon, label, calculated, declared, onDeclaredChange, color }: ReconcileRowProps) {
  const diff = declared - calculated;
  const hasDiff = Math.abs(diff) > 0.01;

  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_80px] gap-4 items-center py-4 group">
      <div className="flex items-center gap-3">
        <div className={cn("w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors", color)}>
          {icon}
        </div>
        <span className="text-xs font-black text-zinc-900 uppercase tracking-tight">{label}</span>
      </div>

      <div className="text-right">
        <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Sistema</p>
        <p className="text-xs font-black text-zinc-500 tabular-nums">{fmt(calculated)}</p>
      </div>

      <div className="relative group/input">
        <input
          type="number"
          min={0}
          step="0.01"
          value={declared === 0 ? '' : declared}
          placeholder="0.00"
          onChange={(e) => onDeclaredChange(parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 text-sm font-black bg-zinc-50 border-2 border-zinc-100 rounded-xl text-right focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 tabular-nums transition-all"
        />
      </div>

      <div className="text-right">
        {hasDiff ? (
          <span className={cn('text-xs font-black tabular-nums border px-2 py-1 rounded-lg shadow-sm', 
            diff > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
          )}>
            {diff > 0 ? '+' : ''}{fmt(diff)}
          </span>
        ) : (
          <div className="flex justify-end">
            <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReconciliationStep({ summary, declared, onChange }: ReconciliationStepProps) {
  const rows: Array<{
    key: keyof DeclaredAmounts;
    label: string;
    calculated: number;
    icon: React.ReactNode;
    color: string;
  }> = [
    { key: 'efectivo',  label: 'Efectivo',   calculated: summary.totalEfectivo,   icon: <Banknote className="w-4 h-4" />,        color: 'text-emerald-600' },
    { key: 'tarjeta',   label: 'Tarjeta',    calculated: summary.totalTarjeta,    icon: <CreditCard className="w-4 h-4" />,       color: 'text-blue-600' },
    { key: 'nequi',     label: 'Nequi',      calculated: summary.totalNequi,      icon: <NequiIcon className="w-4 h-4" />,        color: 'text-pink-600' },
    { key: 'daviplata', label: 'Daviplata',  calculated: summary.totalDaviplata,  icon: <DaviplataIcon className="w-4 h-4" />,   color: 'text-red-600' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-start gap-3 p-4 bg-primary/[0.03] border border-primary/10 rounded-2xl">
        <Info className="w-4 h-4 text-primary mt-0.5" />
        <p className="text-xs font-medium text-zinc-500 leading-relaxed">
          Ingresa el monto físico contado. El sistema calculará automáticamente cualquier diferencia para tu reporte final.
        </p>
      </div>

      <div className="divide-y divide-zinc-100">
        {rows.map((row) => (
          <ReconcileRow
            key={row.key}
            icon={row.icon}
            label={row.label}
            calculated={row.calculated}
            declared={declared[row.key]}
            onDeclaredChange={(v) => onChange(row.key, v)}
            color={row.color}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Step 3: Confirmación ─── */

interface ConfirmStepProps {
  summary: CashCloseSummaryDto;
  declared: DeclaredAmounts;
  notes: string;
  onNotesChange: (v: string) => void;
}

function ConfirmStep({ summary, declared, notes, onNotesChange }: ConfirmStepProps) {
  const rows = [
    { label: 'Efectivo',  calculated: summary.totalEfectivo,  declared: declared.efectivo },
    { label: 'Tarjeta',   calculated: summary.totalTarjeta,   declared: declared.tarjeta },
    { label: 'Nequi',     calculated: summary.totalNequi,     declared: declared.nequi },
    { label: 'Daviplata', calculated: summary.totalDaviplata, declared: declared.daviplata },
  ];

  const totalDiff = rows.reduce((s, r) => s + (r.declared - r.calculated), 0);
  const hasFaltante = totalDiff < -0.01;
  const totalDecl = Object.values(declared).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Diff summary banner */}
      <div className={cn(
        'flex items-center gap-4 px-5 py-4 rounded-2xl border-2 shadow-sm transition-all',
        Math.abs(totalDiff) < 0.01
          ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
          : hasFaltante
            ? 'bg-rose-50 border-rose-100 text-rose-700'
            : 'bg-amber-50 border-amber-100 text-amber-700'
      )}>
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm",
          Math.abs(totalDiff) < 0.01 ? "bg-emerald-500 text-white" : hasFaltante ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
        )}>
          {Math.abs(totalDiff) < 0.01 ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
        </div>
        <div className="flex-1">
          <p className="text-xs font-black uppercase tracking-widest">
            {Math.abs(totalDiff) < 0.01 ? 'Caja Cuadrada' : hasFaltante ? 'Faltante en Caja' : 'Sobrante en Caja'}
          </p>
          <p className="text-sm font-bold opacity-80 mt-0.5">
            {Math.abs(totalDiff) < 0.01 
              ? 'Todo coincide perfectamente. Puedes proceder con el cierre.'
              : hasFaltante
                ? `Hay un faltante de ${fmt(Math.abs(totalDiff))}. Verifica antes de cerrar.`
                : `Hay un sobrante de ${fmt(totalDiff)}. Verifica tus ingresos.`}
          </p>
        </div>
      </div>

      {/* Summary table */}
      <div className="rounded-2xl border-2 border-zinc-100 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-50 border-b-2 border-zinc-100">
              <th className="text-left px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Medio</th>
              <th className="text-right px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Sistema</th>
              <th className="text-right px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Declarado</th>
              <th className="text-right px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Dif.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {rows.map((r) => {
              const diff = r.declared - r.calculated;
              return (
                <tr key={r.label} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-4 py-3 text-xs font-black text-zinc-900 uppercase tracking-tight">{r.label}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs font-bold text-zinc-400">{fmt(r.calculated)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs font-black text-zinc-900">{fmt(r.declared)}</td>
                  <td className={cn('px-4 py-3 text-right tabular-nums text-xs font-black',
                    Math.abs(diff) < 0.01 ? 'text-zinc-200' : diff > 0 ? 'text-emerald-600' : 'text-rose-600'
                  )}>
                    {Math.abs(diff) < 0.01 ? '—' : `${diff > 0 ? '+' : ''}${fmt(diff)}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-zinc-900 text-white">
              <td className="px-4 py-4 text-xs font-black uppercase tracking-widest">Total</td>
              <td className="px-4 py-4 text-right font-black opacity-40 text-xs">{fmt(summary.totalSales)}</td>
              <td className="px-4 py-4 text-right font-black text-sm">{fmt(totalDecl)}</td>
              <td className={cn('px-4 py-4 text-right font-black text-sm', 
                Math.abs(totalDiff) < 0.01 ? 'text-emerald-400' : totalDiff > 0 ? 'text-amber-400' : 'text-rose-400'
              )}>
                {Math.abs(totalDiff) < 0.01 ? '✓' : `${totalDiff > 0 ? '+' : ''}${fmt(totalDiff)}`}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
          Notas del cierre <span className="opacity-40 font-bold">(opcional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          placeholder="Ej: Se encontró un billete en mal estado o hubo una devolución fuera de sistema..."
          className="w-full px-4 py-3 text-sm font-bold bg-white border-2 border-zinc-100 rounded-2xl resize-none focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm placeholder:text-zinc-300"
        />
      </div>
    </div>
  );
}

/* ─── Main Component ─── */

const STEPS: Step[] = [
  { id: 'resumen',        label: 'Resumen',       description: 'Totales del día' },
  { id: 'conciliacion',   label: 'Conciliación',  description: 'Conteo físico' },
  { id: 'confirmacion',   label: 'Confirmar',     description: 'Cerrar caja' },
];

interface CierreCajaModernoProps {
  onClose?: () => void;
}

export function CierreCajaModerno({ onClose }: CierreCajaModernoProps) {
  const toast = useGlobalToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState<CashCloseSummaryDto | null>(null);
  const [declared, setDeclared] = useState<DeclaredAmounts>(ZERO_DECLARED);
  const [notes, setNotes] = useState('');

  // Se usa la fecha LOCAL del dispositivo (no UTC) para que el cierre del
  // día corresponda al día que el cajero está viviendo, independientemente
  // de la diferencia horaria con UTC (p.ej. a las 11 pm hora local, UTC
  // ya puede ser el día siguiente y .toISOString() devolvería una fecha
  // incorrecta que no encontraría ventas del período real).
  const today = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();
  const [periodFrom] = useState(today);
  const [periodTo] = useState('');

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCashCloseSummary(periodFrom, periodTo || periodFrom);
      setSummary(res);
      // Pre-fill declared with calculated values
      setDeclared({
        efectivo: res.totalEfectivo,
        tarjeta: res.totalTarjeta,
        nequi: res.totalNequi,
        daviplata: res.totalDaviplata,
      });
    } catch {
      toast.error('No se pudo cargar el resumen del día');
    } finally {
      setLoading(false);
    }
  }, [periodFrom, periodTo, toast]);

  // Carga el resumen automáticamente al abrir el componente
  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleDeclaredChange = (key: keyof DeclaredAmounts, val: number) => {
    setDeclared((prev) => ({ ...prev, [key]: val }));
  };

  const handleNext = () => {
    if (step === 0 && !summary) {
      toast.error('Carga el resumen antes de continuar');
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleFinish = async () => {
    if (!summary) return;
    setSubmitting(true);
    try {
      await createCashClose({
        periodFrom,
        periodTo: periodTo || periodFrom,
        declaredEfectivo:  declared.efectivo,
        declaredTarjeta:   declared.tarjeta,
        declaredNequi:     declared.nequi,
        declaredDaviplata: declared.daviplata,
        notes,
      });
      toast.success('Cierre de caja registrado exitosamente', {
        title: '✅ Caja Cerrada',
        duration: 5000
      });
      onClose?.();
      setStep(0);
      setSummary(null);
    } catch {
      toast.error('Error al registrar el cierre de caja');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card-premium bg-white border-zinc-100 overflow-hidden shadow-2xl animate-slideUp">
      <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-zinc-900 tracking-tight uppercase">Cierre de Caja</h3>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{today}</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="mt-8">
          <Stepper steps={STEPS} currentStep={step} />
        </div>
      </div>

      <div className="p-6">
        {/* Step content */}
        <div className="min-h-[320px]">
          {step === 0 && (
            <SummaryStep
              summary={summary}
              loading={loading}
              onRefresh={loadSummary}
              periodFrom={periodFrom}
              periodTo={periodTo}
            />
          )}
          {step === 1 && summary && (
            <ReconciliationStep
              summary={summary}
              declared={declared}
              onChange={handleDeclaredChange}
            />
          )}
          {step === 2 && summary && (
            <ConfirmStep
              summary={summary}
              declared={declared}
              notes={notes}
              onNotesChange={setNotes}
            />
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 pt-6 border-t border-zinc-100">
          <StepperActions
            steps={STEPS}
            currentStep={step}
            onBack={() => setStep((s) => Math.max(s - 1, 0))}
            onNext={handleNext}
            onFinish={handleFinish}
            finishLabel="Cerrar Caja Definitivo"
            isLoading={submitting}
            canNext={step === 0 ? !!summary && !loading : true}
          />
        </div>
      </div>
    </div>
  );
}
