'use client';

/**
 * ─── Módulo Tipo: Ventas ────────────────────────────────────────────────────
 *
 * PLANTILLA REUTILIZABLE — Sirve de base para:
 *   • Ventas / Órdenes
 *   • Órdenes de Compra (Proveedores)
 *   • Remisiones / Facturas
 *
 * Características:
 *   ✓ DataTable con multi-select y bulk actions
 *   ✓ Filtros tipo Pill por estado
 *   ✓ Quick actions al hover en fila
 *   ✓ KPI cards en la parte superior
 *   ✓ Modal de creación rápida
 *   ✓ Export a Excel
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useMemo } from 'react';
import {
  Plus,
  Download,
  Eye,
  Pencil,
  Trash2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { DataTable, type DataTableColumn, type BulkAction } from '@/components/ui/data-table';
import { PillFilter, type FilterOption } from '@/components/ui/pill-filter';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/* ─── Types ─── */

type SaleStatus = 'pendiente' | 'confirmada' | 'enviada' | 'cancelada' | 'completada';

interface Sale {
  id: string;
  folio: string;
  cliente: string;
  fecha: string;
  monto: number;
  estado: SaleStatus;
  items: number;
}

/* ─── Demo data ─── */

const DEMO_SALES: Sale[] = [
  { id: '1', folio: 'VTA-001', cliente: 'Distribuidora Norte', fecha: '2026-03-27', monto: 45800, estado: 'confirmada', items: 12 },
  { id: '2', folio: 'VTA-002', cliente: 'Comercial del Pacífico', fecha: '2026-03-26', monto: 12300, estado: 'pendiente', items: 4 },
  { id: '3', folio: 'VTA-003', cliente: 'Grupo Alimentos SA', fecha: '2026-03-26', monto: 89200, estado: 'enviada', items: 28 },
  { id: '4', folio: 'VTA-004', cliente: 'Abarrotes López', fecha: '2026-03-25', monto: 5400, estado: 'completada', items: 6 },
  { id: '5', folio: 'VTA-005', cliente: 'SuperCenter Oriente', fecha: '2026-03-25', monto: 34000, estado: 'cancelada', items: 9 },
  { id: '6', folio: 'VTA-006', cliente: 'Mayoreo El Éxito', fecha: '2026-03-24', monto: 67000, estado: 'confirmada', items: 18 },
  { id: '7', folio: 'VTA-007', cliente: 'Tiendas del Valle', fecha: '2026-03-24', monto: 21500, estado: 'pendiente', items: 7 },
];

/* ─── Status config ─── */

const STATUS_CONFIG: Record<SaleStatus, { label: string; badge: 'default' | 'success' | 'warning' | 'danger' | 'info'; color: string }> = {
  pendiente:  { label: 'Pendiente',  badge: 'warning', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  confirmada: { label: 'Confirmada', badge: 'info',    color: 'bg-blue-100 text-blue-800 border-blue-200' },
  enviada:    { label: 'Enviada',    badge: 'default', color: 'bg-zinc-100 text-zinc-800 border-zinc-200' },
  completada: { label: 'Completada', badge: 'success', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  cancelada:  { label: 'Cancelada',  badge: 'danger',  color: 'bg-red-100 text-red-800 border-red-200' },
};

const PILL_OPTIONS: FilterOption<SaleStatus>[] = Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({
  value: value as SaleStatus,
  label: cfg.label,
  color: `${cfg.color} border shadow-none`,
}));

/* ─── KPI card ─── */

interface KpiCardProps {
  title: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
  highlight?: boolean;
}

function KpiCard({ title, value, sub, icon: Icon, trend, highlight }: KpiCardProps) {
  return (
    <Card className={cn(
      'group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
      highlight && 'ring-1 ring-zinc-900/10'
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1.5 tracking-tight">{value}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                {trend.isPositive
                  ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                <span className={cn('text-xs font-semibold', trend.isPositive ? 'text-emerald-600' : 'text-red-500')}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
                <span className="text-xs text-zinc-400">vs ayer</span>
              </div>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0 group-hover:bg-zinc-200 transition-colors ring-1 ring-inset ring-zinc-900/5">
            <Icon className="w-5 h-5 text-zinc-700" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Quick action button ─── */

function QAction({
  icon: Icon, label, onClick, danger,
}: { icon: React.ElementType; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn(
        'p-1.5 rounded-md transition-colors',
        danger
          ? 'text-zinc-400 hover:text-red-600 hover:bg-red-50'
          : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
      )}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}

/* ─── Main component ─── */

export function SalesModule() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SaleStatus | 'all'>('all');
  const [selected, setSelected] = useState<(string | number)[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* Derived data */
  const filtered = useMemo(() => {
    let rows = DEMO_SALES;
    if (statusFilter !== 'all') rows = rows.filter((r) => r.estado === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        r.folio.toLowerCase().includes(q) ||
        r.cliente.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [search, statusFilter]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  /* Pill filter options with count */
  const pillOptions = useMemo((): FilterOption<SaleStatus>[] =>
    PILL_OPTIONS.map((opt) => ({
      ...opt,
      count: DEMO_SALES.filter((r) => r.estado === opt.value).length,
    })), []);

  /* Columns */
  const columns: DataTableColumn<Sale>[] = [
    {
      key: 'folio',
      header: 'Folio',
      width: 'w-28',
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded">
          {row.folio}
        </span>
      ),
    },
    {
      key: 'cliente',
      header: 'Cliente',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="text-sm font-medium text-zinc-900">{row.cliente}</p>
        </div>
      ),
    },
    {
      key: 'fecha',
      header: 'Fecha',
      sortable: true,
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-zinc-500">
          {new Date(row.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'items',
      header: 'Artículos',
      width: 'w-20',
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-zinc-500 tabular-nums">{row.items} uds.</span>
      ),
    },
    {
      key: 'monto',
      header: 'Total',
      sortable: true,
      width: 'w-32',
      cell: (row) => (
        <span className="text-sm font-semibold text-zinc-900 tabular-nums">
          {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(row.monto)}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      width: 'w-28',
      cell: (row) => {
        const cfg = STATUS_CONFIG[row.estado];
        return (
          <Badge variant={cfg.badge}>{cfg.label}</Badge>
        );
      },
    },
  ];

  /* Bulk actions */
  const bulkActions: BulkAction<Sale>[] = [
    {
      label: 'Exportar',
      icon: Download,
      onClick: (rows) => console.log('Export', rows),
    },
    {
      label: 'Eliminar',
      icon: Trash2,
      variant: 'danger',
      onClick: (rows) => console.log('Delete', rows),
    },
  ];

  /* Totals */
  const totalMonto = DEMO_SALES.reduce((s, r) => s + r.monto, 0);
  const pendientes = DEMO_SALES.filter((r) => r.estado === 'pendiente').length;

  return (
    <div className="p-6 space-y-6">

      {/* ─── Page header ─── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Ventas</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Gestiona tus órdenes de venta y seguimiento de clientes</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-9 px-3 rounded-lg border border-zinc-200 bg-white text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar
          </button>
          <button
            type="button"
            className="h-9 px-4 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 active:bg-zinc-950 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva venta
          </button>
        </div>
      </div>

      {/* ─── KPI grid ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Ingresos del mes"
          value={new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(totalMonto)}
          sub="Total acumulado"
          icon={DollarSign}
          trend={{ value: 12.4, isPositive: true }}
          highlight
        />
        <KpiCard
          title="Órdenes totales"
          value={String(DEMO_SALES.length)}
          sub="Este mes"
          icon={ShoppingCart}
          trend={{ value: 3.1, isPositive: true }}
        />
        <KpiCard
          title="Pendientes"
          value={String(pendientes)}
          sub="Por confirmar"
          icon={Clock}
        />
        <KpiCard
          title="Completadas"
          value={String(DEMO_SALES.filter((r) => r.estado === 'completada').length)}
          sub="Este mes"
          icon={CheckCircle2}
          trend={{ value: 8.7, isPositive: true }}
        />
      </div>

      {/* ─── Filters + Table ─── */}
      <div className="space-y-3">
        {/* Pill filters */}
        <PillFilter
          options={pillOptions}
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v as SaleStatus | 'all'); setPage(1); }}
          allLabel="Todas"
        />

        {/* DataTable */}
        <DataTable
          columns={columns}
          data={paginated}
          searchValue={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Buscar por folio o cliente…"
          total={filtered.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
          selectable
          selectedIds={selected}
          onSelectionChange={setSelected}
          bulkActions={bulkActions}
          rowActions={(row) => (
            <>
              <QAction icon={Eye}    label="Ver detalle"  onClick={() => console.log('view', row.id)} />
              <QAction icon={Pencil} label="Editar"       onClick={() => console.log('edit', row.id)} />
              <QAction icon={Trash2} label="Eliminar"     onClick={() => console.log('del', row.id)}  danger />
            </>
          )}
          headerSlot={
            <button
              type="button"
              className="h-8 p-2 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 transition-colors"
              title="Recargar"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          }
        />
      </div>
    </div>
  );
}
