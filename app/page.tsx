'use client';

import { useEffect, useState } from 'react';
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';
import { StatCard, SalesChart, RecentOrders, TopProducts, LowStockAlert } from '@/components/dashboard';
import { formatCurrency } from '@/lib/utils';
import { PermissionGuard } from '@/components/layout';
import { getDashboard, DashboardSummary } from '@/services/dashboard';

function todayLabel(): string {
  return new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = data;

  return (
    <PermissionGuard moduleCode="DASHBOARD">
    <main className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500">Bienvenido al panel de control de CRM</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>{todayLabel()}</span>
          </div>
        </div>

        {/* ── Fila 1: métricas principales ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Ventas del Mes"
            value={loading ? '...' : formatCurrency(stats?.salesMonth.value ?? 0)}
            icon={DollarSign}
            trend={stats?.salesMonth.changePercent != null ? { value: stats.salesMonth.changePercent, isPositive: stats.salesMonth.changePercent >= 0 } : undefined}
            iconClassName="bg-green-100 text-green-600"
          />
          <StatCard
            title="Pedidos Pendientes"
            value={loading ? '...' : (stats?.pendingOrders ?? 0)}
            icon={ShoppingCart}
            iconClassName="bg-amber-100 text-amber-600"
          />
          <StatCard
            title="Total Productos"
            value={loading ? '...' : (stats?.totalProducts ?? 0)}
            icon={Package}
            iconClassName="bg-blue-100 text-blue-600"
          />
          <StatCard
            title="Total Clientes"
            value={loading ? '...' : (stats?.totalClients.value ?? 0)}
            icon={Users}
            trend={stats?.totalClients.changePercent != null ? { value: stats.totalClients.changePercent, isPositive: stats.totalClients.changePercent >= 0 } : undefined}
            iconClassName="bg-purple-100 text-purple-600"
          />
        </div>

        {/* ── Fila 2: métricas secundarias ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Ventas Hoy"
            value={loading ? '...' : formatCurrency(stats?.salesToday ?? 0)}
            icon={TrendingUp}
            iconClassName="bg-emerald-100 text-emerald-600"
          />
          <StatCard
            title="Pedidos Hoy"
            value={loading ? '...' : (stats?.ordersToday ?? 0)}
            icon={ShoppingCart}
            iconClassName="bg-indigo-100 text-indigo-600"
          />
          <StatCard
            title="Clientes Nuevos (Mes)"
            value={loading ? '...' : (stats?.newClientsMonth ?? 0)}
            icon={Users}
            iconClassName="bg-pink-100 text-pink-600"
          />
          <StatCard
            title="Stock Bajo"
            value={loading ? '...' : (stats?.lowStockCount ?? 0)}
            icon={AlertTriangle}
            iconClassName="bg-red-100 text-red-600"
          />
        </div>

        {/* ── Gráfica + top productos ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SalesChart data={data?.salesChart ?? []} />
          <TopProducts productos={data?.topProducts ?? []} />
        </div>

        {/* ── Pedidos recientes + stock bajo ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentOrders pedidos={data?.recentOrders ?? []} />
          </div>
          <LowStockAlert productos={data?.lowStock ?? []} />
        </div>
      </div>
    </main>
    </PermissionGuard>
  );
}
