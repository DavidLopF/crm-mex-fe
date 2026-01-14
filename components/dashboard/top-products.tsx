import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { TopProducto } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface TopProductsProps {
  productos: TopProducto[];
}

export function TopProducts({ productos }: TopProductsProps) {
  const maxVendidos = Math.max(...productos.map(p => p.vendidos));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Productos Más Vendidos</CardTitle>
        <a href="/inventario" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Ver todos
        </a>
      </CardHeader>
      <CardContent className="space-y-4">
        {productos.map((producto, index) => (
          <div key={producto.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                  {index + 1}
                </span>
                <span className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                  {producto.nombre}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{formatCurrency(producto.ingresos)}</p>
                <p className="text-xs text-gray-500">{producto.vendidos} vendidos</p>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${(producto.vendidos / maxVendidos) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
