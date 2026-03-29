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

import { useState, useCallback } from 'react';
import {
  Banknote, CreditCard, RefreshCw,
  CheckCircle2, AlertTriangle, ArrowRight,
  Receipt, ClipboardCheck, Lock,
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
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

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
        { label: 'Efectivo', icon: <Banknote className="w-4 h-4" />, value: summary.totalEfectivo, color: 'text-emerald-700' },
        { label: 'Tarjeta', icon: <CreditCard className="w-4 h-4" />, value: summary.totalTarjeta, color: 'text-blue-700' },
        { label: 'Nequi', icon: <NequiIcon className="w-4 h-4" />, value: summary.totalNequi, color: 'text-pink-700' },
        { label: 'Daviplata', icon: <DaviplataIcon className="w-4 h-4" />, value: summary.totalDaviplata, color: 'text-red-700' },
      ]
    : [];

  return (
    <div className="space-y-5">
      {/* Period */}
      <div className="flex items-center justify-between text-sm">
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Período de cierre</p>
          <p className="font-semibold text-zinc-900 mt-0.5">
            {periodFrom} → {periodTo || <span className="text-zinc-400">hoy</span>}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} className="gap-1.5">
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Actualizar
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-zinc-100 animate-pulse" />
          ))}
        </div>
      ) : summary ? (
        <>
          {/* Total highlight */}
          <div className="flex items-center justify-between px-5 py-4 rounded-xl bg-zinc-900 text-white">
            <div>
              <p className="text-xs font-medium text-zinc-400">Total ventas del período</p>
              <p className="text-2xl font-bold tracking-tight mt-0.5">{fmt(summary.totalSales)}</p>
            </div>
            <Receipt className="w-7 h-7 text-zinc-500" />
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-4 rounded-xl border border-zinc-200/80 bg-white hover:shadow-sm transition-shadow">
                <span className={cn('flex-shrink-0', item.color)}>{item.icon}</span>
                <div>
                  <p className="text-xs text-zinc-500">{item.label}</p>
                  <p className={cn('text-base font-bold', item.color)}>{fmt(item.value)}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-zinc-400 text-center">
            {summary.salesCount ?? 0} transacciones registradas
          </p>
        </>
      ) : (
        <div className="py-10 flex flex-col items-center gap-2 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
          <p className="text-sm font-medium text-zinc-700">No se pudo cargar el resumen</p>
          <Button variant="outline" size="sm" onClick={onRefresh}>Reintentar</Button>
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
    <div className="grid grid-cols-[1fr_1fr_1fr_80px] gap-3 items-center py-3.5 border-b border-zinc-100 last:border-0">
      <div className="flex items-center gap-2">
        <span className={cn('flex-shrink-0', color)}>{icon}</span>
        <span className="text-sm font-medium text-zinc-700">{label}</span>
      </div>

      <div className="text-right">
        <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Sistema</p>
        <p className="text-sm font-semibold text-zinc-900 tabular-nums">{fmt(calculated)}</p>
      </div>

      <div>
        <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Declarado</p>
        <input
          type="number"
          min={0}
          step="0.01"
          value={declared === 0 ? '' : declared}
          placeholder="0.00"
          onChange={(e) => onDeclaredChange(parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-1.5 text-sm font-semibold border border-zinc-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-400 tabular-nums"
        />
      </div>

      <div className="text-right">
        {hasDiff ? (
          <span className={cn('text-sm font-bold tabular-nums', diff > 0 ? 'text-emerald-600' : 'text-red-600')}>
            {diff > 0 ? '+' : ''}{fmt(diff)}
          </span>
        ) : (
          <div className="flex justify-end">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
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
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">
        Ingresa el monto físico contado por cada medio de pago. El sistema calculará automáticamente las diferencias.
      </p>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_1fr_1fr_80px] gap-3 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-0">
        <span>Medio de pago</span>
        <span className="text-right">Sistema</span>
        <span>Tu conteo</span>
        <span className="text-right">Diferencia</span>
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

  return (
    <div className="space-y-5">
      {/* Diff summary banner */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium',
        hasFaltante
          ? 'bg-red-50 border-red-200 text-red-700'
          : 'bg-emerald-50 border-emerald-200 text-emerald-700'
      )}>
        {hasFaltante
          ? <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
        {hasFaltante
          ? `Faltante detectado: ${fmt(Math.abs(totalDiff))}. El cierre quedará registrado con esta diferencia.`
          : totalDiff > 0.01
            ? `Sobrante de ${fmt(totalDiff)}. Revisa antes de confirmar.`
            : 'Todo cuadra perfectamente. Listo para cerrar.'
        }
      </div>

      {/* Summary table */}
      <div className="rounded-xl border border-zinc-200/80 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-100">
              <th className="text-left px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Medio</th>
              <th className="text-right px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Sistema</th>
              <th className="text-right px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Declarado</th>
              <th className="text-right px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Dif.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const diff = r.declared - r.calculated;
              return (
                <tr key={r.label} className="border-b border-zinc-50 last:border-0">
                  <td className="px-4 py-2.5 font-medium text-zinc-700">{r.label}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-zinc-500">{fmt(r.calculated)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-zinc-900">{fmt(r.declared)}</td>
                  <td className={cn('px-4 py-2.5 text-right tabular-nums font-bold',
                    Math.abs(diff) < 0.01 ? 'text-zinc-300' : diff > 0 ? 'text-emerald-600' : 'text-red-600'
                  )}>
                    {Math.abs(diff) < 0.01 ? '—' : `${diff > 0 ? '+' : ''}${fmt(diff)}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-zinc-50 border-t border-zinc-200">
              <td className="px-4 py-2.5 font-bold text-zinc-900">Total</td>
              <td className="px-4 py-2.5 text-right font-bold text-zinc-900 tabular-nums">{fmt(summary.totalSales)}</td>
              <td className="px-4 py-2.5 text-right font-bold text-zinc-900 tabular-nums">{fmt(Object.values(declared).reduce((a, b) => a + b, 0))}</td>
              <td className={cn('px-4 py-2.5 text-right font-bold tabular-nums', hasFaltante ? 'text-red-600' : 'text-emerald-600')}>
                {Math.abs(totalDiff) < 0.01 ? '✓' : `${totalDiff > 0 ? '+' : ''}${fmt(totalDiff)}`}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-700">
          Notas del cierre <span className="text-zinc-400 font-normal">(opcional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={2}
          placeholder="Ej: Se encontró un billete falso de $200..."
          className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-400 placeholder:text-zinc-400"
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

  const today = new Date().toISOString().slice(0, 10);
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
      toast.success('Cierre de caja registrado exitosamente');
      onClose?.();
    } catch {
      toast.error('Error al registrar el cierre de caja');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto border-zinc-200/80">
      <CardHeader className="border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center flex-shrink-0">
            <Lock className="w-4 h-4 text-white" />
          </div>
          <div>
            <CardTitle>Cierre de Caja</CardTitle>
            <p className="text-xs text-zinc-400 mt-0.5">{today}</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="mt-5">
          <Stepper steps={STEPS} currentStep={step} />
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Step content */}
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

        {/* Actions */}
        <div className="mt-6">
          <StepperActions
            steps={STEPS}
            currentStep={step}
            onBack={() => setStep((s) => Math.max(s - 1, 0))}
            onNext={handleNext}
            onFinish={handleFinish}
            finishLabel="Cerrar Caja"
            isLoading={submitting}
            canNext={step === 0 ? !!summary && !loading : true}
          />
        </div>
      </CardContent>
    </Card>
  );
}
