'use client';

import { useEffect, useState } from 'react';
import { Package, ShoppingCart, Building2 } from 'lucide-react';
import { InventarioTab, PedidosTab, ComprasTab } from '@/components/dashboard';
import { PermissionGuard } from '@/components/layout';
import { getDashboard, getDashboardCompras, DashboardSummary, DashboardComprasSummary } from '@/services/dashboard';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

function getGreeting(firstName: string): string {
  const hour = new Date().getHours();
  const saludo = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  return firstName ? `${saludo}, ${firstName}` : saludo;
}

function todayLabel(): string {
  return new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
}

type TabId = 'inventario' | 'pedidos' | 'compras';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'inventario', label: 'Inventario', icon: Package },
  { id: 'pedidos', label: 'Pedidos', icon: ShoppingCart },
  { id: 'compras', label: 'Compras & Proveedores', icon: Building2 },
];

export default function DashboardPage() {
  const { fullName } = useAuth();
  const firstName = fullName?.split(' ')[0] ?? '';
  const [activeTab, setActiveTab] = useState<TabId>('inventario');

  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const [comprasData, setComprasData] = useState<DashboardComprasSummary | null>(null);
  const [comprasLoading, setComprasLoading] = useState(false);
  const [comprasFetched, setComprasFetched] = useState(false);

  useEffect(() => {
    getDashboard()
      .then(setDashboardData)
      .catch(console.error)
      .finally(() => setDashboardLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab !== 'compras' || comprasFetched) return;
    setComprasLoading(true);
    getDashboardCompras()
      .then((data) => {
        setComprasData(data);
        setComprasFetched(true);
      })
      .catch(console.error)
      .finally(() => setComprasLoading(false));
  }, [activeTab, comprasFetched]);

  return (
    <PermissionGuard moduleCode="DASHBOARD">
      <main className="px-6 py-8">
        <div className="space-y-6">
          {/* ── Header ── */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">{getGreeting(firstName)}</h1>
              <p className="mt-0.5 text-sm text-zinc-400 capitalize">{todayLabel()}</p>
            </div>
          </div>

          {/* ── Pill Tabs ── */}
          <div className="inline-flex items-center gap-1 rounded-md bg-zinc-100 p-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-all duration-150',
                  activeTab === id
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700',
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* ── Tab content ── */}
          {activeTab === 'inventario' && dashboardData && (
            <InventarioTab data={dashboardData} loading={dashboardLoading} />
          )}
          {activeTab === 'inventario' && dashboardLoading && (
            <InventarioTab
              data={{
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
              }}
              loading
            />
          )}

          {activeTab === 'pedidos' && dashboardData && (
            <PedidosTab data={dashboardData} loading={dashboardLoading} />
          )}
          {activeTab === 'pedidos' && dashboardLoading && (
            <PedidosTab
              data={{
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
              }}
              loading
            />
          )}

          {activeTab === 'compras' && (
            <ComprasTab
              data={comprasData}
              loading={comprasLoading}
            />
          )}
        </div>
      </main>
    </PermissionGuard>
  );
}
