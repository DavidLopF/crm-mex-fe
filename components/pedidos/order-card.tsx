'use client';

import { Calendar, User, Package, FileText } from 'lucide-react';
import { Badge } from '@/components/ui';
import { Pedido } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface OrderCardProps {
  pedido: Pedido;
  onClick: () => void;
  onDragStart?: (pedido: Pedido) => void;
}

const estadoColors = {
  cotizado: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'default' as const },
  transmitido: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'default' as const },
  en_curso: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'warning' as const },
  enviado: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', badge: 'default' as const },
  pagado: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'success' as const },
  cancelado: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'danger' as const },
};

export function OrderCard({ pedido, onClick, onDragStart }: OrderCardProps) {
  const colors = estadoColors[pedido.estado];
  const cantidadTotal = pedido.lineas.reduce((sum, linea) => sum + linea.cantidad, 0);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(pedido));
    if (onDragStart) {
      onDragStart(pedido);
    }
  };

  return (
    <div
      draggable
      onClick={onClick}
      onDragStart={handleDragStart}
      className={`p-4 rounded-lg border-2 ${colors.border} ${colors.bg} hover:shadow-md transition-all cursor-move group h-[320px] w-full flex flex-col active:opacity-50`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 flex-shrink-0">
        <div>
          <p className="font-mono text-sm font-semibold text-gray-900">{pedido.numero}</p>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDateTime(pedido.createdAt)}
          </p>
        </div>
        
        {!pedido.transmitido && pedido.estado === 'cotizado' && (
          <Badge variant="warning" className="text-xs">
            Editable
          </Badge>
        )}
      </div>

      {/* Cliente */}
      <div className="mb-3 pb-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <User className="w-3 h-3 text-gray-500" />
          <p className="text-sm font-medium text-gray-900 truncate">{pedido.clienteNombre}</p>
        </div>
        {pedido.clienteEmail && (
          <p className="text-xs text-gray-500 ml-5 truncate">{pedido.clienteEmail}</p>
        )}
      </div>

      {/* Productos */}
      <div className="mb-3 flex-1 overflow-y-auto min-h-0">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span className="flex items-center gap-1">
            <Package className="w-3 h-3" />
            {pedido.lineas.length} {pedido.lineas.length === 1 ? 'producto' : 'productos'}
          </span>
          <span>{cantidadTotal} unidades</span>
        </div>
        
        <div className="space-y-1">
          {pedido.lineas.slice(0, 2).map((linea) => (
            <div key={linea.id} className="text-xs text-gray-700">
              <span className="font-medium">{linea.cantidad}x</span> {linea.productoNombre}
            </div>
          ))}
          {pedido.lineas.length > 2 && (
            <p className="text-xs text-gray-500 italic">
              +{pedido.lineas.length - 2} más...
            </p>
          )}
        </div>
      </div>

      {/* Total */}
      <div className={`flex items-center justify-between pt-3 border-t border-gray-200 flex-shrink-0`}>
        <span className="text-xs font-medium text-gray-600">Total:</span>
        <span className={`text-base font-bold ${colors.text}`}>
          {formatCurrency(pedido.total)}
        </span>
      </div>

      {/* Notas */}
      {pedido.notas && (
        <div className="mt-2 pt-2 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-start gap-1">
            <FileText className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-600 line-clamp-2">{pedido.notas}</p>
          </div>
        </div>
      )}

      {/* Indicador de hover */}
      <div className="mt-3 pt-2 border-t border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <p className="text-xs text-gray-500 text-center">Click para ver detalles</p>
      </div>
    </div>
  );
}
