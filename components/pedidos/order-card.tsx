'use client';

import { Calendar, User, Package, FileText } from 'lucide-react';
import { Badge } from '@/components/ui';
import { Pedido } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { ChangeStatusMenu } from './change-status-menu';
import { OrderStatusCode } from '@/services/orders';

interface OrderCardProps {
  pedido: Pedido;
  onClick: () => void;
  onStatusChange?: (orderId: string, newStatusCode: OrderStatusCode) => Promise<void>;
}

const estadoColors = {
  cotizado: { bg: 'bg-blue-50 dark:bg-blue-950/25', border: 'border-blue-200 dark:border-blue-900/60', text: 'text-blue-700 dark:text-blue-300', badge: 'default' as const, dot: 'bg-blue-500', label: 'Cotizado' },
  transmitido: { bg: 'bg-purple-50 dark:bg-purple-950/25', border: 'border-purple-200 dark:border-purple-900/60', text: 'text-purple-700 dark:text-purple-300', badge: 'default' as const, dot: 'bg-purple-500', label: 'Transmitido' },
  en_curso: { bg: 'bg-orange-50 dark:bg-orange-950/25', border: 'border-orange-200 dark:border-orange-900/60', text: 'text-orange-700 dark:text-orange-300', badge: 'warning' as const, dot: 'bg-orange-500', label: 'En Curso' },
  enviado: { bg: 'bg-cyan-50 dark:bg-cyan-950/25', border: 'border-cyan-200 dark:border-cyan-900/60', text: 'text-cyan-700 dark:text-cyan-300', badge: 'default' as const, dot: 'bg-cyan-500', label: 'Enviado' },
  pagado: { bg: 'bg-green-50 dark:bg-green-950/25', border: 'border-green-200 dark:border-green-900/60', text: 'text-green-700 dark:text-green-300', badge: 'success' as const, dot: 'bg-green-500', label: 'Pagado' },
  cancelado: { bg: 'bg-red-50 dark:bg-red-950/25', border: 'border-red-200 dark:border-red-900/60', text: 'text-red-700 dark:text-red-300', badge: 'danger' as const, dot: 'bg-red-500', label: 'Cancelado' },
};

export function OrderCard({ pedido, onClick, onStatusChange }: OrderCardProps) {
  const colors = estadoColors[pedido.estado];
  const cantidadTotal = pedido.lineas.reduce((sum, linea) => sum + linea.cantidad, 0);

  // Mapeo de estado del frontend al código del backend
  const getStatusCodeFromEstado = (estado: string): string => {
    const mapping: Record<string, string> = {
      'cotizado': 'COTIZADO',
      'transmitido': 'TRANSMITIDO',
      'en_curso': 'EN_CURSO',
      'enviado': 'ENVIADO',
      'cancelado': 'CANCELADO',
    };
    return mapping[estado] || 'COTIZADO';
  };

  const handleStatusChange = async (newStatusCode: OrderStatusCode) => {
    if (onStatusChange) {
      await onStatusChange(pedido.id, newStatusCode);
    }
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border ${colors.border} ${colors.bg} hover:shadow-md transition-all cursor-pointer group w-full flex flex-col`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">{pedido.numero}</p>
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${colors.text} ${colors.bg} border ${colors.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
              {colors.label}
            </span>
          </div>
          <p className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <Calendar className="w-3 h-3" />
            {formatDateTime(pedido.createdAt)}
          </p>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          {!pedido.transmitido && pedido.estado === 'cotizado' && (
            <Badge variant="warning" className="text-xs">
              Editable
            </Badge>
          )}
          
          {onStatusChange && (
            <ChangeStatusMenu
              currentStatusCode={getStatusCodeFromEstado(pedido.estado)}
              onChangeStatus={handleStatusChange}
            />
          )}
        </div>
      </div>

      {/* Cliente */}
      <div className="mb-3 border-b border-zinc-200 pb-3 flex-shrink-0 dark:border-zinc-800">
        <div className="flex items-center gap-2 mb-1">
          <User className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{pedido.clienteNombre}</p>
        </div>
        {pedido.clienteEmail && (
          <p className="ml-5 truncate text-xs text-zinc-500 dark:text-zinc-400">{pedido.clienteEmail}</p>
        )}
      </div>

      {/* Productos */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300">
          <span className="flex items-center gap-1">
            <Package className="w-3 h-3" />
            {pedido.lineas.length} {pedido.lineas.length === 1 ? 'producto' : 'productos'}
          </span>
          <span>{cantidadTotal} unidades</span>
        </div>
        
        <div className="space-y-1">
          {pedido.lineas.slice(0, 2).map((linea) => (
            <div key={linea.id} className="text-xs text-zinc-700 dark:text-zinc-200">
              <span className="font-medium">{linea.cantidad}x</span> {linea.productoNombre}
            </div>
          ))}
          {pedido.lineas.length > 2 && (
            <p className="text-xs italic text-zinc-500 dark:text-zinc-400">
              +{pedido.lineas.length - 2} más...
            </p>
          )}
        </div>
      </div>

      {/* Total */}
      <div className={`flex items-center justify-between pt-3 border-t border-zinc-200 flex-shrink-0 dark:border-zinc-800`}>
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Total:</span>
        <span className={`text-base font-bold ${colors.text}`}>
          {formatCurrency(pedido.total)}
        </span>
      </div>

      {/* Notas */}
      {pedido.notas && (
        <div className="mt-2 border-t border-zinc-200 pt-2 flex-shrink-0 dark:border-zinc-800">
          <div className="flex items-start gap-1">
            <FileText className="mt-0.5 h-3 w-3 flex-shrink-0 text-zinc-400 dark:text-zinc-500" />
            <p className="line-clamp-2 text-xs text-zinc-600 dark:text-zinc-300">{pedido.notas}</p>
          </div>
        </div>
      )}
    </div>
  );
}
