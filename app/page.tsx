'use client';

import { useEffect, useState } from 'react';
import { DollarSign, ShoppingCart, Users, AlertTriangle, ChevronDown, ChevronUp, Calendar, Truck } from 'lucide-react';
import {
  StatCard,
  SalesChart,
  OrdersPipeline,
  TopProducts,
  LowStockAlert,
  RecentOrders,
  ComprasTab,
} from '@/components/dashboard';
import { PermissionGuard } from '@/components/layout';
import { getDashboard, getDashboardCompras, DashboardSummary, DashboardComprasSummary } from '@/services/dashboard';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency, cn } from '@/lib/utils';

function getGreeting(firstName: string): string {
  const hour = new Date().getHours();
  const saludo = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  return firstName ? `${saludo}, ${firstName}` : saludo;
}

function todayLabel(): string {
  return new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
}

const EMPTY: DashboardSummary = {
  salesMonth: { value: 0, changePercent: null },
  pendingOrders: 0,
  totalProducts: 0,
  totalClients: { value: 0, changePercent: null },
  salesToday: 0,
  ordersToday: 0,
  newClientsMonth: 0,
  lowStockCount: 0,
  salesChart: [],
  topProducts: [],
  recentOrders: [],
  lowStock: [],
};

export default function DashboardPage() {
  const { fullName } = useAuth();
  const firstName = fullName?.split(' ')[0] ?? '';

  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const [comprasData, setComprasData] = useState<DashboardComprasSummary | null>(null);
  const [comprasLoading, setComprasLoading] = useState(false);
  const [comprasExpanded, setComprasExpanded] = useState(false);
  const [comprasFetched, setComprasFetched] = useState(false);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function handleToggleCompras() {
    setComprasExpanded((prev) => !prev);
    if (!comprasFetched) {
      setComprasLoading(true);
      getDashboardCompras()
        .then((d) => {
          setComprasData(d);
          setComprasFetched(true);
        })
        .catch(console.error)
        .finally(() => setComprasLoading(false));
    }
  }

  const d = data ?? EMPTY;

  return (
    <PermissionGuard moduleCode="DASHBOARD">
      <main className="px-6 md:px-10 py-10 space-y-12 animate-fadeIn">

        {/* ── Welcome Header ── */}
        <div className="relative overflow-hidden rounded-3xl bg-zinc-900 px-8 py-10 shadow-2xl">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                {getGreeting(firstName)}
              </h1>
              <div className="flex items-center gap-2 text-zinc-400">
                <Calendar className="w-4 h-4" />
                <p className="text-sm font-medium capitalize">{todayLabel()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Ventas Hoy</p>
                <p className="text-xl font-bold text-white">{loading ? '...' : formatCurrency(d.salesToday)}</p>
              </div>
              <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Pedidos</p>
                <p className="text-xl font-bold text-white">{loading ? '...' : d.ordersToday}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── KPI Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Ingresos del Mes"
            value={loading ? '...' : formatCurrency(d.salesMonth.value)}
            icon={DollarSign}
            trend={
              d.salesMonth.changePercent != null
                ? { value: d.salesMonth.changePercent, isPositive: d.salesMonth.changePercent >= 0 }
                : undefined
            }
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <StatCard
            title="Pedidos en Curso"
            value={loading ? '...' : d.pendingOrders}
            icon={ShoppingCart}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            title="Clientes Activos"
            value={loading ? '...' : d.totalClients.value}
            icon={Users}
            trend={
              d.totalClients.changePercent != null
                ? { value: d.totalClients.changePercent, isPositive: d.totalClients.changePercent >= 0 }
                : undefined
            }
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
          />
          <StatCard
            title="Alertas de Stock"
            value={loading ? '...' : d.lowStockCount}
            icon={AlertTriangle}
            iconBg={!loading && d.lowStockCount > 0 ? 'bg-rose-50' : 'bg-zinc-50'}
            iconColor={!loading && d.lowStockCount > 0 ? 'text-rose-600' : 'text-zinc-400'}
            sparklineColor={!loading && d.lowStockCount > 0 ? '#f43f5e' : '#a1a1aa'}
          />
        </div>

        {/* ── Main Content Sections ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          
          {/* Ventas Trend */}
          <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Tendencia de Ventas</h2>
              <button className="text-xs font-bold text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-widest">Ver reporte completo</button>
            </div>
            <SalesChart data={d.salesChart} />
          </div>

          {/* Orders Pipeline */}
          <div className="space-y-4">
             <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Pipeline de Pedidos</h2>
             <OrdersPipeline pedidos={d.recentOrders} pendingTotal={d.pendingOrders} />
          </div>

          {/* Top Products */}
          <div className="xl:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Productos Destacados</h2>
            <TopProducts productos={d.topProducts} />
          </div>

          {/* Low Stock */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Alertas de Inventario</h2>
            <LowStockAlert productos={d.lowStock} />
          </div>

        </div>

        {/* ── Recent Activity ── */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Actividad Reciente</h2>
          </div>
          <RecentOrders pedidos={d.recentOrders} />
        </section>

        {/* ── Secondary Sections ── */}
        <section className="pt-4">
          <button
            onClick={handleToggleCompras}
            className={cn(
              "w-full flex items-center justify-between px-6 py-4 rounded-2xl border border-zinc-200 transition-all duration-300",
              comprasExpanded ? "bg-zinc-900 text-white shadow-xl" : "bg-white text-zinc-500 hover:bg-zinc-50 shadow-sm"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                comprasExpanded ? "bg-white/10" : "bg-zinc-100"
              )}>
                <Truck className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold uppercase tracking-widest">Módulo de Compras & Proveedores</span>
            </div>
            {comprasExpanded
              ? <ChevronUp className="w-5 h-5" />
              : <ChevronDown className="w-5 h-5" />
            }
          </button>
          {comprasExpanded && (
            <div className="mt-8 animate-slideUp">
              <ComprasTab data={comprasData} loading={comprasLoading} />
            </div>
          )}
        </section>

      </main>
    </PermissionGuard>
  );
}
