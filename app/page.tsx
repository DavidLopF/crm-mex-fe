'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package, ShoppingCart, Users, DollarSign, TrendingUp, AlertTriangle,
  Calendar, BarChart3, Receipt, FileCheck, ClipboardList,
} from 'lucide-react';
import { StatCard, SalesChart, RecentOrders, TopProducts, LowStockAlert } from '@/components/dashboard';
import { formatCurrency } from '@/lib/utils';
import { PermissionGuard } from '@/components/layout';
import { getDashboard, type DashboardSummary } from '@/services/dashboard';
import { getPosDashboard, type PosDashboardDto } from '@/services/pos';
import { getInvoices, type InvoiceListItem, type DianStatus } from '@/services/facturacion';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui';

// ── Tipos de tabs ─────────────────────────────────────────────────────────────

type Tab = 'resumen' | 'pos' | 'pedidos' | 'facturacion';

const TABS: { id: Tab; label: string; icon: typeof BarChart3 }[] = [
  { id: 'resumen',     label: 'Resumen',          icon: BarChart3     },
  { id: 'pos',         label: 'Ventas POS',        icon: ShoppingCart  },
  { id: 'pedidos',     label: 'Pedidos',           icon: ClipboardList },
  { id: 'facturacion', label: 'Facturación DIAN',  icon: Receipt       },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayLabel(): string {
  return new Date().toLocaleDateString('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

const fmtCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

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

// ── Skeleton de card ──────────────────────────────────────────────────────────

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

// ── Componente principal ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab]   = useState<Tab>('resumen');
  const [crm, setCrm]               = useState<DashboardSummary | null>(null);
  const [pos, setPos]               = useState<PosDashboardDto | null>(null);
  const [invoices, setInvoices]     = useState<InvoiceListItem[]>([]);
  const [loadingCrm, setLoadingCrm] = useState(true);
  const [loadingPos, setLoadingPos] = useState(true);
  const [loadingFe, setLoadingFe]   = useState(false);
  const [feLoaded, setFeLoaded]     = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/login'); return; }

    getDashboard()
      .then(setCrm)
      .catch(console.error)
      .finally(() => setLoadingCrm(false));

    getPosDashboard()
      .then(setPos)
      .catch(console.error)
      .finally(() => setLoadingPos(false));
  }, [isAuthenticated, router]);

  // Carga lazy — FE solo cuando se abre esa pestaña
  useEffect(() => {
    if (activeTab !== 'facturacion' || feLoaded) return;
    setLoadingFe(true);
    getInvoices({ limit: 10, page: 1 })
      .then((res) => setInvoices(res.data))
      .catch(console.error)
      .finally(() => { setLoadingFe(false); setFeLoaded(true); });
  }, [activeTab, feLoaded]);

  if (!isAuthenticated) return null;

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
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
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
              RESUMEN
          ════════════════════════════════════════════════════════════ */}
          {activeTab === 'resumen' && (
            <div className="space-y-6">
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
                        icon={ShoppingCart}
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

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <SalesChart data={crm?.salesChart ?? []} />
                <TopProducts productos={crm?.topProducts ?? []} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <RecentOrders pedidos={crm?.recentOrders ?? []} />
                </div>
                <LowStockAlert productos={crm?.lowStock ?? []} />
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              VENTAS POS
          ════════════════════════════════════════════════════════════ */}
          {activeTab === 'pos' && (
            <div className="space-y-6">
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

              <Card className="p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Top Productos Vendidos Hoy</h2>
                {loadingPos ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
                    ))}
                  </div>
                ) : (pos?.topProductsToday.length ?? 0) === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No hay ventas registradas hoy.</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs uppercase text-gray-400 border-b border-gray-100">
                        <th className="text-left pb-2">Producto</th>
                        <th className="text-center pb-2 w-20">Unidades</th>
                        <th className="text-right pb-2 w-36">Ingresos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pos?.topProductsToday.map((p, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
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
                )}
              </Card>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              PEDIDOS
          ════════════════════════════════════════════════════════════ */}
          {activeTab === 'pedidos' && (
            <div className="space-y-6">
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
              <RecentOrders pedidos={crm?.recentOrders ?? []} />
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              FACTURACIÓN DIAN
          ════════════════════════════════════════════════════════════ */}
          {activeTab === 'facturacion' && (
            <div className="space-y-6">
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
                        value={invoices.filter((f) => f.status === 'APPROVED').length}
                        icon={FileCheck}
                        iconClassName="bg-green-100 text-green-600"
                      />
                      <StatCard
                        title="Pendientes / Error"
                        value={invoices.filter((f) => f.status !== 'APPROVED').length}
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

              <Card className="p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Facturas Recientes</h2>
                {loadingFe ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
                    ))}
                  </div>
                ) : invoices.length === 0 ? (
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
                            <td className="py-2.5 pr-3 text-gray-900 max-w-[180px] truncate">
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
            </div>
          )}

        </div>
      </main>
    </PermissionGuard>
  );
}
