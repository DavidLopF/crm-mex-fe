'use client';

import { Modal } from '@/components/ui';
import { Calendar, Warehouse, User, Package } from 'lucide-react';
import type { PartialReceipt } from '@/services/receptions';
import { formatDateTime } from '@/lib/utils';

interface ReceptionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: PartialReceipt | null;
}

export function ReceptionDetailModal({ isOpen, onClose, receipt }: ReceptionDetailModalProps) {
  if (!receipt) return null;

  const totalUnits = receipt.items.reduce((s, i) => s + i.qtyReceived, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle de Recepción" size="lg">
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 font-mono">{receipt.code}</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Recepción parcial</p>
          </div>
          <div className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-semibold">
            {totalUnits} unidades
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 bg-zinc-50 rounded-lg p-3 border border-zinc-200">
            <Calendar className="w-4 h-4 text-zinc-400 flex-shrink-0" />
            <div>
              <span className="text-[10px] text-zinc-400 block">Fecha de Recepción</span>
              <span className="text-sm font-medium text-zinc-900">
                {formatDateTime(receipt.receivedDate)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-zinc-50 rounded-lg p-3 border border-zinc-200">
            <Warehouse className="w-4 h-4 text-zinc-400 flex-shrink-0" />
            <div>
              <span className="text-[10px] text-zinc-400 block">Almacén</span>
              <span className="text-sm font-medium text-zinc-900">
                {receipt.warehouse?.name || `Almacén #${receipt.warehouseId}`}
              </span>
            </div>
          </div>
          {receipt.receivedBy && (
            <div className="flex items-center gap-3 bg-zinc-50 rounded-lg p-3 border border-zinc-200">
              <User className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-400 block">Recibido por</span>
                <span className="text-sm font-medium text-zinc-900">
                  {receipt.receivedBy.fullName}
                </span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 bg-zinc-50 rounded-lg p-3 border border-zinc-200">
            <Package className="w-4 h-4 text-zinc-400 flex-shrink-0" />
            <div>
              <span className="text-[10px] text-zinc-400 block">Artículos recibidos</span>
              <span className="text-sm font-medium text-zinc-900">
                {receipt.items.length} líneas · {totalUnits} unidades
              </span>
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="bg-zinc-50 rounded-lg border border-zinc-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-100/50">
                <th className="text-left text-[10px] font-medium text-zinc-500 uppercase tracking-wider px-4 py-2.5">
                  Producto
                </th>
                <th className="text-left text-[10px] font-medium text-zinc-500 uppercase tracking-wider px-4 py-2.5">
                  SKU
                </th>
                <th className="text-center text-[10px] font-medium text-zinc-500 uppercase tracking-wider px-4 py-2.5">
                  Qty Recibida
                </th>
                <th className="text-left text-[10px] font-medium text-zinc-500 uppercase tracking-wider px-4 py-2.5">
                  Notas
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {receipt.items.map((item) => {
                const productName = item.purchaseOrderItem?.variant?.product?.name
                  || item.purchaseOrderItem?.description
                  || `Item #${item.purchaseOrderItemId}`;
                const sku = item.purchaseOrderItem?.variant?.sku || '—';
                return (
                  <tr key={item.id} className="bg-white">
                    <td className="px-4 py-2.5">
                      <span className="text-sm font-medium text-zinc-900">{productName}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-mono text-zinc-500">{sku}</span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="text-sm font-bold text-zinc-900">{item.qtyReceived}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs text-zinc-500">{item.notes || '—'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Notes */}
        {receipt.notes && (
          <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-200">
            <h5 className="text-xs font-semibold text-zinc-600 mb-1">Notas</h5>
            <p className="text-sm text-zinc-700 whitespace-pre-line">{receipt.notes}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
