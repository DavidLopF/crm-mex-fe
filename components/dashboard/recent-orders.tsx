import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { PedidoReciente, EstadoPedido } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface RecentOrdersProps {
  pedidos: PedidoReciente[];
}

const estadoVariants: Record<EstadoPedido, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  borrador: 'default',
  pendiente: 'warning',
  confirmado: 'success',
  cancelado: 'danger',
};

const estadoLabels: Record<EstadoPedido, string> = {
  borrador: 'Borrador',
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
};

export function RecentOrders({ pedidos }: RecentOrdersProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Pedidos Recientes</CardTitle>
        <a href="/pedidos" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Ver todos
        </a>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Pedido
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Cliente
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Total
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Estado
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pedidos.map((pedido) => (
                <tr key={pedido.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-blue-600">{pedido.numero}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{pedido.clienteNombre}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(pedido.total)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={estadoVariants[pedido.estado]}>
                      {estadoLabels[pedido.estado]}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{formatDateTime(pedido.fecha)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
