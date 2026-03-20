'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package, ShoppingCart, Users, DollarSign, TrendingUp, AlertTriangle,
  Calendar, BarChart3, Receipt, FileCheck, ClipboardList, Truck,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard';
import { PermissionGuard } from '@/components/layout';
import { formatCurrency } from '@/lib/utils';
import { Card } from '@/components/ui';
import {
  getDashboard,
  getDashboardCompras,
  type DashboardSummary,
  type ComprasDashboardSummary,
} from '@/services/dashboard';
import {
  getPosDashboard,
  getCashCloseSummary,
  type PosDashboardDto,
  type CashCloseSummaryDto,
} from '@/services/pos';
import { getInvoices, type InvoiceListItem, type DianStatus } from '@/services/facturacion';
import { useAuth } from '@/lib/auth-context';
import {
  SalesTrendChart,
  TopProductsChart,
  DonutChart,
  HorizontalBarChart,
} from '@/components/charts';

// ── Tipos de tabs ────────────────────────────────────────────────────────────

type Tab = 'resumen' | 'pos' | 'pedidos' | 'inventario' | 'compras' | 'facturacion';

const TABS: { id: Tab; label: string; icon: typeof BarChart3 }[] = [
  { id: 'resumen',     label: 'Resumen',          icon: BarChart3     },
  { id: 'pos',         label: 'Ventas POS',        icon: ShoppingCart  },
  { id: 'pedidos',     label: 'Pedidos',           icon: ClipboardList },
  { id: 'inventario',  label: 'Inventario',        icon: Package       },
  { id: 'compras',     label: 'Compras',           icon: Truck         },
  { id: 'facturacion', label: 'Facturación DIAN',  icon: Receipt       },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function todayLabel(): string {
  return new Date().toLocaleDateString('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

const fmtCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

function todayRange(): { from: string; to: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${day}`;
  return { from: today, to: today };
}

// ── Sub-componentes UI ───────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-gray-200 rounded w-24" />
          <div className="h-7 bg-gray-200 rounded w-32" />
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

function SkeletonChart({ height = 240 }: { height?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-40 mb-4" />
      <div className="bg-gray-100 rounded-lg" style={{ height }} />
    </div>
  );
}

function ChartCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={`p-5 ${className}`}>
      <h2 className="text-sm font-semibold text-gray-700 mb-4">{title}</h2>
      {children}
    </Card>
  );
}

function DianStatusBadge({ status }: { status: DianStatus }) {
  const map: Record<DianStatus, string> = {
    APPROVED: 'bg-green-100 text-green-800',
    PENDING:  'bg-yellow-100 text-yellow-800',
    REJECTED: 'bg-red-100 text-red-800',
    ERROR:    'bg-red-100 text-red-800',
  };
  const labels: Record<DianStatus, string> = {
    APPROVED: 'Aprobada',
    PENDING:  'Pendiente',
    REJECTED: 'Rechazada',
    ERROR:    'Error',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>
      {labels[status]}
    </span>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>('resumen');

  // ── Data state ──
  const [crm,           setCrm]           = useState<DashboardSummary | null>(null);
  const [pos,           setPos]           = useState<PosDashboardDto | null>(null);
  const [cashClose,     setCashClose]     = useState<CashCloseSummaryDto | null>(null);
  const [compras,       setCompras]       = useState<ComprasDashboardSummary | null>(null);
  const [invoices,      setInvoices]      = useState<InvoiceListItem[]>([]);

  // ── Loading state ──
  const [loadingCrm,    setLoadingCrm]    = useState(true);
  const [loadingPos,    setLoadingPos]    = useState(true);
  const [loadingCompras, setLoadingCompras] = useState(false);
  const [loadingFe,     setLoadingFe]     = useState(false);

  // ── Loaded flags (lazy) ──
  const [comprasLoaded, setComprasLoaded] = useState(false);
  const [feLoaded,      setFeLoaded]      = useState(false);

  // ── Carga inicial ──
  useEffect(() => {
    if (!isAuthenticated) { router.replace('/login'); return; }

    const range = todayRange();

    getDashboard()
      .then(setCrm)
      .catch(console.error)
      .finally(() => setLoadingCrm(false));

    Promise.all([
      getPosDashboard(),
      getCashCloseSummary(range.from, range.to),
    ])
      .then(([posData, cashData]) => {
        setPos(posData);
        setCashClose(cashData);
      })
      .catch(console.error)
      .finally(() => setLoadingPos(false));
  }, [isAuthenticated, router]);

  // ── Carga lazy — Compras ──
  useEffect(() => {
    if (activeTab !== 'compras' || comprasLoaded) return;
    setLoadingCompras(true);
    getDashboardCompras()
      .then(setCompras)
      .catch(console.error)
      .finally(() => { setLoadingCompras(false); setComprasLoaded(true); });
  }, [activeTab, comprasLoaded]);

  // ── Carga lazy — Facturación ──
  useEffect(() => {
    if (activeTab !== 'facturacion' || feLoaded) return;
    setLoadingFe(true);
    getInvoices({ limit: 20, page: 1 })
      .then((res) => {
        const normalized = Array.isArray((res as unknown as { data?: unknown }).data)
          ? (res as unknown as { data: InvoiceListItem[] }).data
          : Array.isArray(res)
            ? (res as unknown as InvoiceListItem[])
            : [];
        setInvoices(normalized);
      })
      .catch(console.error)
      .finally(() => { setLoadingFe(false); setFeLoaded(true); });
  }, [activeTab, feLoaded]);

  if (!isAuthenticated) return null;

  // ── Datos derivados ──

  // Medios de pago hoy
  const paymentSlices = [
    { name: 'Efectivo',   value: cashClose?.totalEfectivo  ?? 0, color: '#10B981' },
    { name: 'Tarjeta',    value: cashClose?.totalTarjeta   ?? 0, color: '#3B82F6' },
    { name: 'Nequi',      value: cashClose?.totalNequi     ?? 0, color: '#8B5CF6' },
    { name: 'Daviplata',  value: cashClose?.totalDaviplata ?? 0, color: '#F59E0B' },
  ].filter((s) => s.value > 0);

  // Low stock para HorizontalBarChart
  const lowStockItems = [...(crm?.lowStock ?? [])]
    .sort((a, b) => a.stockTotal - b.stockTotal)
    .slice(0, 10)
    .map((p) => ({
      label: p.nombre,
      value: p.stockTotal,
      color: p.stockTotal === 0 ? '#EF4444' : '#F59E0B',
    }));

  // Top productos POS hoy para TopProductsChart
  const topPosToday = (pos?.topProductsToday ?? []).map((p) => ({
    name: p.variantName ? `${p.productName} — ${p.variantName}` : p.productName,
    revenue: p.revenueTotal,
    qtySold: p.qtyTotal,
  }));

  // OC status para DonutChart
  const ocSlices = compras
    ? [
        { name: 'Borrador',   value: compras.poStats.draftOrders,     color: '#9CA3AF' },
        { name: 'Enviadas',   value: compras.poStats.sentOrders,      color: '#3B82F6' },
        { name: 'Confirmadas',value: compras.poStats.confirmedOrders, color: '#8B5CF6' },
        { name: 'Recibidas',  value: compras.poStats.receivedOrders,  color: '#10B981' },
        { name: 'Canceladas', value: compras.poStats.cancelledOrders, color: '#EF4444' },
      ].filter((s) => s.value > 0)
    : [];

  // DIAN status para DonutChart
  const dianApproved = invoices.filter((f) => f.status === 'APPROVED').length;
  const dianPending  = invoices.filter((f) => f.status === 'PENDING').length;
  const dianRejected = invoices.filter((f) => f.status === 'REJECTED' || f.status === 'ERROR').length;
  const dianSlices = [
    { name: 'Aprobadas',  value: dianApproved, color: '#10B981' },
    { name: 'Pendientes', value: dianPending,  color: '#F59E0B' },
    { name: 'Rechazadas', value: dianRejected, color: '#EF4444' },
  ].filter((s) => s.value > 0);

  return (
    <PermissionGuard moduleCode="DASHBOARD">
      <main className="p-6">
        <div className="space-y-6">

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-500 text-sm mt-0.5">Panel de control — CRM</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
              <Calendar className="w-4 h-4" />
              {todayLabel()}
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl flex-wrap">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* ════════════════════════════════════════════════════════════
              TAB: RESUMEN
          ════════════════════════════════════════════════════════════ */}
          {activeTab === 'resumen' && (
            <div className="space-y-6">
              {/* KPIs row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {loadingCrm
                  ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                  : (
                    <>
                      <StatCard
                        title="Ventas del Mes"
                        value={formatCurrency(crm?.salesMonth.value ?? 0)}
                        icon={DollarSign}
                        trend={crm?.salesMonth.changePercent != null
                          ? { value: crm.salesMonth.changePercent, isPositive: crm.salesMonth.changePercent >= 0 }
                          : undefined}
                        iconClassName="bg-green-100 text-green-600"
                      />
                      <StatCard
                        title="Pedidos Pendientes"
                        value={crm?.pendingOrders ?? 0}
                        icon={ShoppingCart}
                        iconClassName="bg-amber-100 text-amber-600"
                      />
                      <StatCard
                        title="Total Productos"
                        value={crm?.totalProducts ?? 0}
                        icon={Package}
                        iconClassName="bg-blue-100 text-blue-600"
                      />
                      <StatCard
                        title="Total Clientes"
                        value={crm?.totalClients.value ?? 0}
                        icon={Users}
                        trend={crm?.totalClients.changePercent != null
                          ? { value: crm.totalClients.changePercent, isPositive: crm.totalClients.changePercent >= 0 }
                          : undefined}
                        iconClassName="bg-purple-100 text-purple-600"
                      />
                    </>
                  )
                }
              </div>

              {/* KPIs row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {loadingCrm
                  ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                  : (
                    <>
                      <StatCard
                        title="Ventas Hoy"
                        value={formatCurrency(crm?.salesToday ?? 0)}
                        icon={TrendingUp}
                        iconClassName="bg-emerald-100 text-emerald-600"
                      />
                      <StatCard
                        title="Pedidos Hoy"
                        value={crm?.ordersToday ?? 0}
                        icon={ClipboardList}
                        iconClassName="bg-indigo-100 text-indigo-600"
                      />
                      <StatCard
                        title="Clientes Nuevos (Mes)"
                        value={crm?.newClientsMonth ?? 0}
                        icon={Users}
                        iconClassName="bg-pink-100 text-pink-600"
                      />
                      <StatCard
                        title="Stock Bajo"
                        value={crm?.lowStockCount ?? 0}
                        icon={AlertTriangle}
                        iconClassName="bg-red-100 text-red-600"
                      />
                    </>
                  )
                }
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {loadingCrm ? (
                  <>
                    <div className="lg:col-span-2"><SkeletonChart height={220} /></div>
                    <SkeletonChart height={220} />
                  </>
                ) : (
                  <>
                    <ChartCard title="Tendencia de Ventas — Últimos 30 días" className="lg:col-span-2">
                      <SalesTrendChart
                        data={crm?.salesChart ?? []}
                        color="#6366F1"
                      />
                    </ChartCard>
                    <ChartCard title="Top Productos por Ingresos">
                      <TopProductsChart
                        data={crm?.topProducts ?? []}
                        color="#6366F1"
                      />
                    </ChartCard>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              TAB: VENTAS POS
          ════════════════════════════════════════════════════════════ */}
          {activeTab === 'pos' && (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {loadingPos
                  ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                  : (
                    <>
                      <StatCard
                        title="Ventas Hoy (POS)"
                        value={pos?.todaySalesCount ?? 0}
                        icon={ShoppingCart}
                        iconClassName="bg-emerald-100 text-emerald-600"
                      />
                      <StatCard
                        title="Ingresos Hoy (POS)"
                        value={fmtCOP(pos?.todaySalesTotal ?? 0)}
                        icon={DollarSign}
                        iconClassName="bg-green-100 text-green-600"
                      />
                      <StatCard
                        title="Ventas del Mes (POS)"
                        value={pos?.monthSalesCount ?? 0}
                        icon={TrendingUp}
                        iconClassName="bg-blue-100 text-blue-600"
                      />
                      <StatCard
                        title="Ingresos del Mes (POS)"
                        value={fmtCOP(pos?.monthSalesTotal ?? 0)}
                        icon={BarChart3}
                        iconClassName="bg-indigo-100 text-indigo-600"
                      />
                    </>
                  )
                }
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {loadingPos ? (
                  <>
                    <SkeletonChart height={240} />
                    <SkeletonChart height={240} />
                  </>
                ) : (
                  <>
                    <ChartCard title="Medios de Pago — Hoy">
                      {paymentSlices.length === 0 ? (
                        <div className="flex items-center justify-center h-56 text-gray-400 text-sm">
                          Sin ventas registradas hoy
                        </div>
                      ) : (
                        <DonutChart
                          data={paymentSlices}
                          height={240}
                          formatValue={fmtCOP}
                        />
                      )}
                    </ChartCard>
                    <ChartCard title="Top Productos Vendidos Hoy">
                      {topPosToday.length === 0 ? (
                        <div className="flex items-center justify-center h-56 text-gray-400 text-sm">
                          Sin ventas registradas hoy
                        </div>
                      ) : (
                        <TopProductsChart
                          data={topPosToday}
                          color="#10B981"
                        />
                      )}
                    </ChartCard>
                  </>
                )}
              </div>

              {/* Top products table */}
              {!loadingPos && topPosToday.length > 0 && (
                <Card className="p-5">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">Detalle de Productos — Hoy</h2>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs uppercase text-gray-400 border-b border-gray-100">
                        <th className="text-left pb-2">#</th>
                        <th className="text-left pb-2">Producto</th>
                        <th className="text-center pb-2 w-20">Unidades</th>
                        <th className="text-right pb-2 w-36">Ingresos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pos?.topProductsToday.map((p, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-2.5 pr-3 text-gray-400 text-xs w-8">{i + 1}</td>
                          <td className="py-2.5">
                            <p className="font-medium text-gray-900">{p.productName}</p>
                            {p.variantName && (
                              <p className="text-xs text-gray-400">{p.variantName}</p>
                            )}
                          </td>
                          <td className="py-2.5 text-center text-gray-600">{p.qtyTotal}</td>
                          <td className="py-2.5 text-right font-semibold text-gray-900">
                            {fmtCOP(p.revenueTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              TAB: PEDIDOS
          ════════════════════════════════════════════════════════════ */}
          {activeTab === 'pedidos' && (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {loadingCrm
                  ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                  : (
                    <>
                      <StatCard
                        title="Ventas del Mes"
                        value={formatCurrency(crm?.salesMonth.value ?? 0)}
                        icon={DollarSign}
                        trend={crm?.salesMonth.changePercent != null
                          ? { value: crm.salesMonth.changePercent, isPositive: crm.salesMonth.changePercent >= 0 }
                          : undefined}
                        iconClassName="bg-green-100 text-green-600"
                      />
                      <StatCard
                        title="Pedidos Pendientes"
                        value={crm?.pendingOrders ?? 0}
                        icon={ClipboardList}
                        iconClassName="bg-amber-100 text-amber-600"
                      />
                      <StatCard
                        title="Pedidos Hoy"
                        value={crm?.ordersToday ?? 0}
                        icon={ShoppingCart}
                        iconClassName="bg-indigo-100 text-indigo-600"
                      />
                      <StatCard
                        title="Clientes Nuevos (Mes)"
                        value={crm?.newClientsMonth ?? 0}
                        icon={Users}
                        iconClassName="bg-pink-100 text-pink-600"
                      />
                    </>
                  )
                }
              </div>

              {/* Recent orders */}
              <Card className="p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Pedidos Recientes</h2>
                {loadingCrm ? (
                  <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
                    ))}
                  </div>
                ) : (crm?.recentOrders.length ?? 0) === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No hay pedidos registrados aún.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs uppercase text-gray-400 border-b border-gray-100">
                          <th className="text-left pb-2 pr-3">Código</th>
                          <th className="text-left pb-2 pr-3">Cliente</th>
                          <th className="text-right pb-2 pr-3 w-32">Total</th>
                          <th className="text-center pb-2 w-28">Estado</th>
                          <th className="text-left pb-2">Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {crm?.recentOrders.map((order) => (
                          <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="py-2.5 pr-3 font-mono text-xs text-gray-700">{order.code}</td>
                            <td className="py-2.5 pr-3 text-gray-900 max-w-[180px] truncate">{order.client}</td>
                            <td className="py-2.5 pr-3 text-right font-semibold text-gray-900">
                              {fmtCOP(order.total)}
                            </td>
                            <td className="py-2.5 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                order.statusCode === 'ENVIADO'    ? 'bg-blue-100 text-blue-800'   :
                                order.statusCode === 'CONFIRMADO' ? 'bg-green-100 text-green-800' :
                                order.statusCode === 'CANCELADO'  ? 'bg-red-100 text-red-800'     :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="py-2.5 text-gray-500 text-xs whitespace-nowrap">
                              {new Intl.DateTimeFormat('es-CO', { dateStyle: 'short' }).format(new Date(order.createdAt))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              TAB: INVENTARIO
          ════════════════════════════════════════════════════════════ */}
          {activeTab === 'inventario' && (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {loadingCrm
                  ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                  : (
                    <>
                      <StatCard
                        title="Total Productos"
                        value={crm?.totalProducts ?? 0}
                        icon={Package}
                        iconClassName="bg-blue-100 text-blue-600"
                      />
                      <StatCard
                        title="Productos con Stock Bajo"
                        value={crm?.lowStockCount ?? 0}
                        icon={AlertTriangle}
                        iconClassName="bg-red-100 text-red-600"
                      />
                      <StatCard
                        title="Top Producto (Mes)"
                        value={crm?.topProducts[0]?.name ?? '—'}
                        icon={TrendingUp}
                        iconClassName="bg-emerald-100 text-emerald-600"
                      />
                      <StatCard
                        title="Ingresos Top Producto"
                        value={crm?.topProducts[0] ? fmtCOP(crm.topProducts[0].revenue) : '—'}
                        icon={DollarSign}
                        iconClassName="bg-indigo-100 text-indigo-600"
                      />
                    </>
                  )
                }
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {loadingCrm ? (
                  <>
                    <SkeletonChart height={260} />
                    <SkeletonChart height={260} />
                  </>
                ) : (
                  <>
                    <ChartCard title="Productos con Stock Crítico">
                      {lowStockItems.length === 0 ? (
                        <div className="flex items-center justify-center h-56 text-gray-400 text-sm">
                          <div className="text-center">
                            <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p>Sin alertas de stock bajo 🎉</p>
                          </div>
                        </div>
                      ) : (
                        <HorizontalBarChart
                          data={lowStockItems}
                          defaultColor="#F59E0B"
                          height={Math.max(200, lowStockItems.length * 30)}
                          unit="uds."
                        />
                      )}
                    </ChartCard>
                    <ChartCard title="Top Productos por Ingresos (Mes)">
                      {(crm?.topProducts.length ?? 0) === 0 ? (
                        <div className="flex items-center justify-center h-56 text-gray-400 text-sm">
                          Sin datos de ventas del mes
                        </div>
                      ) : (
                        <TopProductsChart
                          data={crm?.topProducts ?? []}
                          color="#3B82F6"
                        />
                      )}
                    </ChartCard>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              TAB: COMPRAS
          ════════════════════════════════════════════════════════════ */}
          {activeTab === 'compras' && (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {loadingCompras
                  ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                  : compras
                    ? (
                      <>
                        <StatCard
                          title="Proveedores Activos"
                          value={compras.supplierStats.activeSuppliers}
                          icon={Truck}
                          iconClassName="bg-blue-100 text-blue-600"
                        />
                        <StatCard
                          title="Órdenes de Compra"
                          value={compras.poStats.totalOrders}
                          icon={ClipboardList}
                          iconClassName="bg-indigo-100 text-indigo-600"
                        />
                        <StatCard
                          title="OC Recibidas"
                          value={compras.poStats.receivedOrders}
                          icon={Package}
                          iconClassName="bg-green-100 text-green-600"
                        />
                        <StatCard
                          title="Total Comprado"
                          value={fmtCOP(compras.poStats.totalSpent)}
                          icon={DollarSign}
                          iconClassName="bg-emerald-100 text-emerald-600"
                        />
                      </>
                    )
                    : Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                }
              </div>

              {/* Charts + table */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {loadingCompras ? (
                  <>
                    <SkeletonChart height={240} />
                    <div className="lg:col-span-2"><SkeletonChart height={240} /></div>
                  </>
                ) : (
                  <>
                    <ChartCard title="Estado de Órdenes de Compra">
                      {ocSlices.length === 0 ? (
                        <div className="flex items-center justify-center h-56 text-gray-400 text-sm">
                          Sin órdenes de compra
                        </div>
                      ) : (
                        <DonutChart data={ocSlices} height={240} />
                      )}
                    </ChartCard>

                    <Card className="p-5 lg:col-span-2">
                      <h2 className="text-sm font-semibold text-gray-700 mb-4">Órdenes de Compra Recientes</h2>
                      {(compras?.recentOrders.length ?? 0) === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                          <Truck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">Sin órdenes de compra recientes.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-xs uppercase text-gray-400 border-b border-gray-100">
                                <th className="text-left pb-2 pr-3">Código</th>
                                <th className="text-left pb-2 pr-3">Proveedor</th>
                                <th className="text-right pb-2 pr-3 w-32">Total</th>
                                <th className="text-center pb-2 w-28">Estado</th>
                                <th className="text-left pb-2">Fecha</th>
                              </tr>
                            </thead>
                            <tbody>
                              {compras?.recentOrders.map((oc) => (
                                <tr key={oc.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                  <td className="py-2.5 pr-3 font-mono text-xs text-gray-700">{oc.code}</td>
                                  <td className="py-2.5 pr-3 text-gray-900 max-w-[160px] truncate">{oc.supplierName}</td>
                                  <td className="py-2.5 pr-3 text-right font-semibold text-gray-900">
                                    {fmtCOP(oc.total)}
                                  </td>
                                  <td className="py-2.5 text-center">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                      oc.status === 'RECIBIDA'   ? 'bg-green-100 text-green-800'  :
                                      oc.status === 'CONFIRMADA' ? 'bg-blue-100 text-blue-800'    :
                                      oc.status === 'ENVIADA'    ? 'bg-purple-100 text-purple-800' :
                                      oc.status === 'CANCELADA'  ? 'bg-red-100 text-red-800'      :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {oc.status}
                                    </span>
                                  </td>
                                  <td className="py-2.5 text-gray-500 text-xs whitespace-nowrap">
                                    {new Intl.DateTimeFormat('es-CO', { dateStyle: 'short' }).format(new Date(oc.createdAt))}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </Card>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              TAB: FACTURACIÓN DIAN
          ════════════════════════════════════════════════════════════ */}
          {activeTab === 'facturacion' && (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {loadingFe
                  ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                  : (
                    <>
                      <StatCard
                        title="Facturas Emitidas"
                        value={invoices.length}
                        icon={Receipt}
                        iconClassName="bg-emerald-100 text-emerald-600"
                      />
                      <StatCard
                        title="Aprobadas DIAN"
                        value={dianApproved}
                        icon={FileCheck}
                        iconClassName="bg-green-100 text-green-600"
                      />
                      <StatCard
                        title="Pendientes / Error"
                        value={dianPending + dianRejected}
                        icon={AlertTriangle}
                        iconClassName="bg-yellow-100 text-yellow-600"
                      />
                      <StatCard
                        title="Total Facturado"
                        value={fmtCOP(invoices.reduce((a, f) => a + Number(f.total), 0))}
                        icon={DollarSign}
                        iconClassName="bg-blue-100 text-blue-600"
                      />
                    </>
                  )
                }
              </div>

              {/* Charts + table */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {loadingFe ? (
                  <>
                    <SkeletonChart height={240} />
                    <div className="lg:col-span-2"><SkeletonChart height={240} /></div>
                  </>
                ) : (
                  <>
                    <ChartCard title="Estado DIAN">
                      {dianSlices.length === 0 ? (
                        <div className="flex items-center justify-center h-56 text-gray-400 text-sm">
                          Sin facturas electrónicas
                        </div>
                      ) : (
                        <DonutChart data={dianSlices} height={240} />
                      )}
                    </ChartCard>

                    <Card className="p-5 lg:col-span-2">
                      <h2 className="text-sm font-semibold text-gray-700 mb-4">Facturas Recientes</h2>
                      {invoices.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                          <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">No hay facturas electrónicas emitidas aún.</p>
                          <p className="text-xs mt-1 text-gray-400">
                            Genera una desde el módulo POS seleccionando una venta pagada.
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-xs uppercase text-gray-400 border-b border-gray-100">
                                <th className="text-left pb-2 pr-3">N° Documento</th>
                                <th className="text-left pb-2 pr-3">Receptor</th>
                                <th className="text-left pb-2 pr-3">NIT</th>
                                <th className="text-right pb-2 pr-3 w-32">Total</th>
                                <th className="text-center pb-2 w-28">Estado</th>
                                <th className="text-left pb-2">Fecha</th>
                              </tr>
                            </thead>
                            <tbody>
                              {invoices.map((inv) => (
                                <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                  <td className="py-2.5 pr-3 font-mono text-xs text-gray-700">
                                    {inv.prefix}{inv.number}
                                  </td>
                                  <td className="py-2.5 pr-3 text-gray-900 max-w-[160px] truncate">
                                    {inv.buyerName}
                                  </td>
                                  <td className="py-2.5 pr-3 text-gray-500 font-mono text-xs">
                                    {inv.buyerNit}
                                  </td>
                                  <td className="py-2.5 pr-3 text-right font-semibold text-gray-900">
                                    {fmtCOP(Number(inv.total))}
                                  </td>
                                  <td className="py-2.5 text-center">
                                    <DianStatusBadge status={inv.status} />
                                  </td>
                                  <td className="py-2.5 text-gray-500 text-xs whitespace-nowrap">
                                    {new Intl.DateTimeFormat('es-CO', { dateStyle: 'short' }).format(new Date(inv.issueDate))}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </Card>
                  </>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </PermissionGuard>
  );
}
