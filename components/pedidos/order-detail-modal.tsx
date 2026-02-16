'use client';

import { useState } from 'react';
import { Modal, Badge, Button } from '@/components/ui';
import { Pedido } from '@/types';
import { 
  X, 
  User, 
  Calendar, 
  Package, 
  FileText, 
  Truck,
  CreditCard,
  Edit,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Receipt,
  Hash,
  Building2,
  Printer,
  Download,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface OrderDetailModalProps {
  pedido: Pedido | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (pedido: Pedido) => void;
}

interface EstadoConfigItem {
  label: string;
  color: string;
  textColor: string;
  icon: typeof FileText;
  step: number;
}

const estadoConfig: Record<string, EstadoConfigItem> = {
  cotizado: { 
    label: 'Cotizado', 
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    icon: FileText,
    step: 1
  },
  transmitido: { 
    label: 'Transmitido', 
    color: 'bg-purple-500',
    textColor: 'text-purple-700',
    icon: Truck,
    step: 2
  },
  en_curso: { 
    label: 'En Curso', 
    color: 'bg-amber-500',
    textColor: 'text-amber-700',
    icon: Package,
    step: 3
  },
  enviado: { 
    label: 'Enviado', 
    color: 'bg-cyan-500',
    textColor: 'text-cyan-700',
    icon: Truck,
    step: 4
  },
  pagado: { 
    label: 'Pagado', 
    color: 'bg-green-500',
    textColor: 'text-green-700',
    icon: CreditCard,
    step: 5
  },
  cancelado: { 
    label: 'Cancelado', 
    color: 'bg-red-500',
    textColor: 'text-red-700',
    icon: X,
    step: -1
  },
};

const pasos = ['cotizado', 'transmitido', 'en_curso', 'enviado'] as const;

export function OrderDetailModal({ pedido, isOpen, onClose, onEdit }: OrderDetailModalProps) {
  const [isProductsOpen, setIsProductsOpen] = useState(true);
  const [isClientOpen, setIsClientOpen] = useState(true);
  const [isInfoOpen, setIsInfoOpen] = useState(true);
  
  if (!pedido) return null;

  const config = estadoConfig[pedido.estado];
  const IconEstado = config.icon;
  const isEditable = pedido.estado === 'cotizado' && !pedido.transmitido;
  const cantidadTotal = pedido.lineas.reduce((sum, linea) => sum + linea.cantidad, 0);
  const isCancelled = pedido.estado === 'cancelado';

  const handleEdit = () => {
    if (onEdit) {
      onEdit(pedido);
    }
  };

  const getRingColor = (paso: string) => {
    const colors: Record<string, string> = {
      cotizado: 'ring-blue-500',
      transmitido: 'ring-purple-500',
      en_curso: 'ring-amber-500',
      enviado: 'ring-cyan-500',
    };
    return colors[paso] || 'ring-gray-500';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full" title="">
      <div className="flex flex-col max-h-[90vh]">
        <div className={`relative px-8 py-6 ${isCancelled ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}>
          <div className="flex items-start justify-between pr-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Receipt className="w-6 h-6 text-white/80" />
                <h2 className="text-2xl font-bold text-white">{pedido.numero}</h2>
              </div>
              <div className="flex items-center gap-4 text-white/80 text-sm">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatDateTime(pedido.createdAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  {pedido.clienteNombre}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
              <IconEstado className="w-4 h-4 text-white" />
              <span className="font-semibold text-white text-sm">{config.label}</span>
            </div>
          </div>
        </div>

        {!isCancelled && (
          <div className="px-8 py-5 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center">
              {pasos.map((paso, index) => {
                const pasoConfig = estadoConfig[paso];
                const isActive = pasoConfig.step <= config.step;
                const isCurrent = paso === pedido.estado;
                const PasoIcon = pasoConfig.icon;
                
                const circleClass = isCurrent 
                  ? pasoConfig.color + ' text-white ring-4 ring-offset-2 ring-opacity-30 ' + getRingColor(paso)
                  : isActive 
                    ? pasoConfig.color + ' text-white'
                    : 'bg-gray-200 text-gray-400';
                
                return (
                  <div key={paso} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center min-w-[70px]">
                      <div className={'w-10 h-10 rounded-full flex items-center justify-center transition-all ' + circleClass}>
                        {isActive && !isCurrent ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <PasoIcon className="w-5 h-5" />
                        )}
                      </div>
                      <span className={'text-xs mt-2 font-medium ' + (isCurrent ? pasoConfig.textColor : isActive ? 'text-gray-700' : 'text-gray-400')}>
                        {pasoConfig.label}
                      </span>
                    </div>
                    
                    {index < pasos.length - 1 && (
                      <div className={'flex-1 h-1 rounded ' + (estadoConfig[pasos[index + 1]].step <= config.step ? 'bg-green-400' : 'bg-gray-200')} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="px-8 py-3 bg-red-50 border-b border-red-200">
            <div className="flex items-center gap-2 text-red-700">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">Este pedido ha sido cancelado</span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Package className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Productos</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{pedido.lineas.length}</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <Hash className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Unidades</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">{cantidadTotal}</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200 col-span-2">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <Receipt className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Total del Pedido</span>
              </div>
              <p className="text-3xl font-bold text-green-900">{formatCurrency(pedido.total)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button 
              onClick={() => setIsClientOpen(!isClientOpen)}
              className="w-full px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Cliente
              </h3>
              {isClientOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            {isClientOpen && (
              <div className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                    {pedido.clienteNombre.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{pedido.clienteNombre}</p>
                    <p className="text-sm text-gray-500">Cliente registrado</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button 
              onClick={() => setIsProductsOpen(!isProductsOpen)}
              className="w-full px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                Detalle de Productos
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs">
                  {pedido.lineas.length} {pedido.lineas.length === 1 ? 'item' : 'items'}
                </Badge>
                {isProductsOpen ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>
            </button>
            
            {isProductsOpen && (
              <>
                <div className="divide-y divide-gray-100">
                  {pedido.lineas.map((linea, index) => (
                <div key={linea.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-500 flex-shrink-0">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{linea.productoNombre}</p>
                      {linea.variacionNombre && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-xs text-gray-600 mt-1">
                          {linea.variacionNombre}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">{formatCurrency(linea.precioUnitario)}</span>
                        <span>x</span>
                        <span className="font-medium">{linea.cantidad}</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        {formatCurrency(linea.subtotal)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="px-4 py-4 bg-gradient-to-r from-gray-800 to-gray-900">
              <div className="flex items-center justify-between">
                <div className="text-gray-300">
                  <p className="text-sm">Subtotal</p>
                  <p className="text-xs text-gray-400 mt-0.5">{cantidadTotal} unidades</p>
                </div>
                <p className="text-2xl font-bold text-white">{formatCurrency(pedido.total)}</p>
              </div>
            </div>
              </>
            )}
          </div>

          {pedido.notas && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
              <h3 className="font-semibold text-amber-900 flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-amber-600" />
                Notas del Pedido
              </h3>
              <p className="text-sm text-amber-800 whitespace-pre-wrap">{pedido.notas}</p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button 
              onClick={() => setIsInfoOpen(!isInfoOpen)}
              className="w-full px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                Información del Pedido
              </h3>
              {isInfoOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            {isInfoOpen && (
              <div className="grid grid-cols-2 gap-4 p-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase">Ultima actualizacion</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{formatDateTime(pedido.updatedAt)}</p>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <Truck className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase">Transmision</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {pedido.transmitido ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-green-700">Transmitido</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-600">Pendiente</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Imprimir
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            {isEditable && (
              <Button onClick={handleEdit} className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Editar Pedido
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );

}