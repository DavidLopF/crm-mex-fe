'use client';

import { Modal, Card, Badge, Button } from '@/components/ui';
import { Pedido } from '@/types';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Package, 
  FileText, 
  DollarSign,
  Truck,
  CreditCard,
  Edit
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface OrderDetailModalProps {
  pedido: Pedido | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (pedido: Pedido) => void;
}

const estadoConfig = {
  cotizado: { 
    label: 'Cotizado', 
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: FileText 
  },
  transmitido: { 
    label: 'Transmitido', 
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: Truck 
  },
  en_curso: { 
    label: 'En Curso', 
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: Package 
  },
  enviado: { 
    label: 'Enviado', 
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    icon: Truck 
  },
  pagado: { 
    label: 'Pagado', 
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: CreditCard 
  },
  cancelado: { 
    label: 'Cancelado', 
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: X 
  },
};

export function OrderDetailModal({ pedido, isOpen, onClose, onEdit }: OrderDetailModalProps) {
  if (!pedido) return null;

  const config = estadoConfig[pedido.estado];
  const IconEstado = config.icon;
  const isEditable = pedido.estado === 'cotizado' && !pedido.transmitido;
  const cantidadTotal = pedido.lineas.reduce((sum, linea) => sum + linea.cantidad, 0);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(pedido);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title="">
      {/* Header */}
      <div className="flex items-start justify-between p-6 border-b border-gray-200">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-gray-900">{pedido.numero}</h2>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 ${config.color}`}>
              <IconEstado className="w-4 h-4" />
              <span className="font-semibold text-sm">{config.label}</span>
            </div>
            {isEditable && (
              <Badge variant="warning" className="text-xs">
                Editable
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>Creado: {formatDateTime(pedido.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditable && (
            <Button
              variant="outline"
              onClick={handleEdit}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Editar
            </Button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Cliente Info */}
        <Card className="p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Información del Cliente
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Nombre</label>
              <p className="text-sm font-medium text-gray-900 mt-1">{pedido.clienteNombre}</p>
            </div>
            {pedido.clienteEmail && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  Email
                </label>
                <p className="text-sm text-gray-900 mt-1">{pedido.clienteEmail}</p>
              </div>
            )}
            {pedido.clienteTelefono && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  Teléfono
                </label>
                <p className="text-sm text-gray-900 mt-1">{pedido.clienteTelefono}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Productos */}
        <Card className="p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-600" />
            Productos ({pedido.lineas.length})
          </h3>
          
          <div className="space-y-3">
            {pedido.lineas.map((linea) => (
              <div
                key={linea.id}
                className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{linea.productoNombre}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(linea.precioUnitario)} × {linea.cantidad}
                      </p>
                      <p className="text-xs text-gray-500">c/u</p>
                    </div>
                  </div>
                  {linea.variacionNombre && (
                    <p className="text-xs text-gray-600 mt-1">
                      Variación: {linea.variacionNombre}
                    </p>
                  )}
                </div>
                <div className="ml-4 text-right">
                  <p className="text-base font-bold text-gray-900">
                    {formatCurrency(linea.subtotal)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Resumen de productos */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Total de productos:</span>
              <span className="font-semibold">{pedido.lineas.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600 mt-1">
              <span>Total de unidades:</span>
              <span className="font-semibold">{cantidadTotal}</span>
            </div>
          </div>
        </Card>

        {/* Totales */}
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Resumen Financiero
          </h3>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(pedido.subtotal)}
              </span>
            </div>
            <div className="pt-2 border-t border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(pedido.total)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Notas */}
        {pedido.notas && (
          <Card className="p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-600" />
              Notas
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{pedido.notas}</p>
          </Card>
        )}

        {/* Información adicional */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Estado de Transmisión</h4>
            <div className="flex items-center gap-2">
              {pedido.transmitido ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-900">Transmitido</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-sm text-gray-900">No transmitido</span>
                </>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Última Actualización</h4>
            <p className="text-sm text-gray-900">{formatDateTime(pedido.updatedAt)}</p>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
        {isEditable && (
          <Button onClick={handleEdit} className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Editar Pedido
          </Button>
        )}
      </div>
    </Modal>
  );
}
