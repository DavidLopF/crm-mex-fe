import { Package, ShoppingCart, Users, DollarSign, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';
import { StatCard, SalesChart, RecentOrders, TopProducts, LowStockAlert } from '@/components/dashboard';
import { dashboardStats, ventasUltimos7Dias, topProductos, pedidosRecientes, productosStockBajo } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  return (
    <main className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500">Bienvenido al panel de control de CRM Mex</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>14 de enero de 2026</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Ventas del Mes"
            value={formatCurrency(dashboardStats.ventasMes)}
            icon={DollarSign}
            trend={{ value: 12.5, isPositive: true }}
            iconClassName="bg-green-100 text-green-600"
          />
          <StatCard
            title="Pedidos Pendientes"
            value={dashboardStats.pedidosPendientes}
            icon={ShoppingCart}
            iconClassName="bg-amber-100 text-amber-600"
          />
          <StatCard
            title="Total Productos"
            value={dashboardStats.totalProductos}
            icon={Package}
            iconClassName="bg-blue-100 text-blue-600"
          />
          <StatCard
            title="Total Clientes"
            value={dashboardStats.totalClientes}
            icon={Users}
            trend={{ value: 8.2, isPositive: true }}
            iconClassName="bg-purple-100 text-purple-600"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Ventas Hoy"
            value={formatCurrency(dashboardStats.ventasHoy)}
            icon={TrendingUp}
            iconClassName="bg-emerald-100 text-emerald-600"
          />
          <StatCard
            title="Pedidos Hoy"
            value={dashboardStats.pedidosHoy}
            icon={ShoppingCart}
            iconClassName="bg-indigo-100 text-indigo-600"
          />
          <StatCard
            title="Clientes Nuevos (Mes)"
            value={dashboardStats.clientesNuevosMes}
            icon={Users}
            iconClassName="bg-pink-100 text-pink-600"
          />
          <StatCard
            title="Stock Bajo"
            value={dashboardStats.productosStockBajo}
            icon={AlertTriangle}
            iconClassName="bg-red-100 text-red-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SalesChart data={ventasUltimos7Dias} />
          <TopProducts productos={topProductos} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentOrders pedidos={pedidosRecientes} />
          </div>
          <LowStockAlert productos={productosStockBajo} />
        </div>
      </div>
    </main>
  );
}
