'use client';

import { Calendar, Truck, Package } from 'lucide-react';
import { Modal } from '@/components/ui';
import {
  PurchaseOrder,
  PURCHASE_ORDER_STATUS_LABELS,
  PURCHASE_ORDER_STATUS_COLORS,
} from '@/services/suppliers';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface PurchaseOrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PurchaseOrder | null;
}

export function PurchaseOrderDetailModal({ isOpen, onClose, order }: PurchaseOrderDetailModalProps) {
  if (!order) return null;

  const statusLabel = PURCHASE_ORDER_STATUS_LABELS[order.status];
  const statusColor = PURCHASE_ORDER_STATUS_COLORS[order.status];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle de Orden de Compra" size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{order.code}</h3>
            <p className="text-sm text-gray-500 mt-1">Proveedor: {order.supplierName}</p>
          </div>
          <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${statusColor}`}>
            {statusLabel}
          </span>
        </div>

        {/* Resumen financiero */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
            <p className="text-xs text-gray-500 mb-1">Subtotal</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(order.subtotal)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
            <p className="text-xs text-gray-500 mb-1">IVA</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(order.tax)}</p>
          </div>
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20 text-center">
            <p className="text-xs text-primary mb-1">Total</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(order.total)}</p>
          </div>
        </div>

        {/* Fechas */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Fechas</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <span className="text-xs text-gray-500 block">Fecha de Creación</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDateTime(order.createdAt)}
                </span>
              </div>
            </div>
            {order.expectedDeliveryDate && (
              <div className="flex items-center gap-3">
                <Truck className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <span className="text-xs text-gray-500 block">Entrega Esperada</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDateTime(order.expectedDeliveryDate)}
                  </span>
                </div>
              </div>
            )}
            {order.receivedDate && (
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-green-500 flex-shrink-0" />
                <div>
                  <span className="text-xs text-gray-500 block">Fecha de Recepción</span>
                  <span className="text-sm font-medium text-green-700">
                    {formatDateTime(order.receivedDate)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Artículos */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Artículos ({order.items.length})
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg p-3 border border-gray-200 flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {item.description ?? `Variante #${item.variantId}`}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {item.qty} × {formatCurrency(item.unitCost)}
                    </span>
                  </div>
                  {item.qtyReceived > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      Recibidos: {item.qtyReceived} / {item.qty}
                    </p>
                  )}
                </div>
                <p className="text-sm font-bold text-gray-900">{formatCurrency(item.lineTotal)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Notas */}
        {order.notes && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Notas</h4>
            <p className="text-sm text-gray-600 whitespace-pre-line">{order.notes}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
