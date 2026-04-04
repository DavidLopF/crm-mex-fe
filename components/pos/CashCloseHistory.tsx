'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  History, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Calendar, 
  User, 
  DollarSign,
  AlertCircle,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { 
  getCashCloseHistory, 
  type CashCloseResponseDto 
} from '@/services/pos';
import { cn } from '@/lib/utils';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { 
    style: 'currency', 
    currency: 'MXN',
    maximumFractionDigits: 0 
  }).format(n);

const fmtDate = (s: string) =>
  new Intl.DateTimeFormat('es-MX', { 
    dateStyle: 'medium', 
    timeStyle: 'short' 
  }).format(new Date(s));

export function CashCloseHistory() {
  const [closes, setCloses] = useState<CashCloseResponseDto[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(false);
  const limit = 10;

  const load = useCallback(async (p = 1) => {
    try {
      setLoading(true);
      const res = await getCashCloseHistory(p, limit);
      setCloses(res.data);
      setTotal(res.total);
      setPage(p);
    } catch (err) {
      console.error('Error cargando historial de cierres:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="card-premium p-6 bg-white space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
            <History className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Historial de Cierres</h3>
        </div>
        <span className="text-[10px] font-black bg-zinc-100 text-zinc-500 px-2.5 py-1 rounded-lg uppercase tracking-tighter">
          {total} registros
        </span>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-zinc-100 border-t-primary animate-spin" />
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Cargando Historial...</p>
        </div>
      ) : closes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-300">
          <FileText className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm font-bold uppercase tracking-widest">No hay cierres registrados</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-100">
                  <th className="text-left pb-4 px-2">Período</th>
                  <th className="text-left pb-4 px-2">Cajero</th>
                  <th className="text-right pb-4 px-2">Total Ventas</th>
                  <th className="text-right pb-4 px-2">Efectivo</th>
                  <th className="text-right pb-4 px-2">Digital</th>
                  <th className="text-center pb-4 px-2">Diferencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {closes.map((c) => {
                  const totalDiff = c.diffEfectivo + c.diffTarjeta + c.diffNequi + c.diffDaviplata;
                  const digitalTotal = c.totalTarjeta + c.totalNequi + c.totalDaviplata;
                  const hasIssue  = Math.abs(totalDiff) > 0.01;
                  
                  return (
                    <tr key={c.id} className="group hover:bg-zinc-50/50 transition-colors">
                      <td className="py-4 px-2">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-zinc-900 uppercase tracking-tight">
                            {new Date(c.periodFrom).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-400">
                            {new Date(c.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                            {c.closedByName[0]}
                          </div>
                          <span className="text-xs font-bold text-zinc-600 uppercase tracking-tight">{c.closedByName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <span className="text-sm font-black text-zinc-900 tabular-nums">{fmt(c.totalSales)}</span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <span className="text-xs font-bold text-emerald-600 tabular-nums">{fmt(c.totalEfectivo)}</span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <span className="text-xs font-bold text-blue-600 tabular-nums">{fmt(digitalTotal)}</span>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border",
                          !hasIssue 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : totalDiff > 0 
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : 'bg-rose-50 text-rose-700 border-rose-100'
                        )}>
                          {!hasIssue ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {Math.abs(totalDiff) < 0.01 ? 'Cuadrado' : `${totalDiff > 0 ? '+' : ''}${fmt(totalDiff)}`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              Página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => load(page - 1)}
                disabled={page === 1 || loading}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-50 text-zinc-400 hover:text-primary hover:bg-zinc-100 disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => load(page + 1)}
                disabled={page === totalPages || loading}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-50 text-zinc-400 hover:text-primary hover:bg-zinc-100 disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
