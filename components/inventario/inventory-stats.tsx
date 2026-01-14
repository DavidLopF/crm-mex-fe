import { Package, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import { StatCard } from '@/components/dashboard';
import { Producto } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface InventoryStatsProps {
  productos: Producto[];
}

export function InventoryStats({ productos }: InventoryStatsProps) {
  const totalProductos = productos.length;
  const stockTotal = productos.reduce((sum, p) => sum + p.stockTotal, 0);
  const productosStockBajo = productos.filter(p => p.stockTotal <= 10).length;
  const valorInventario = productos.reduce((sum, p) => sum + (p.precio * p.stockTotal), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Productos"
        value={totalProductos}
        icon={Package}
        iconClassName="bg-blue-100 text-blue-600"
      />
      <StatCard
        title="Stock Total"
        value={stockTotal}
        icon={TrendingUp}
        iconClassName="bg-green-100 text-green-600"
      />
      <StatCard
        title="Stock Bajo"
        value={productosStockBajo}
        icon={AlertTriangle}
        iconClassName="bg-amber-100 text-amber-600"
      />
      <StatCard
        title="Valor Inventario"
        value={formatCurrency(valorInventario)}
        icon={DollarSign}
        iconClassName="bg-emerald-100 text-emerald-600"
      />
    </div>
  );
}