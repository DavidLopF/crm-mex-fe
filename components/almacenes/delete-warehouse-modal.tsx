'use client';

import { AlertTriangle } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import type { Warehouse } from '@/services/warehouses';

interface DeleteWarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  warehouse: Warehouse | null;
  submitting?: boolean;
}

export function DeleteWarehouseModal({
  isOpen,
  onClose,
  onConfirm,
  warehouse,
  submitting,
}: DeleteWarehouseModalProps) {
  if (!warehouse) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Desactivar Almacén" size="md">
      <div className="space-y-4">
        {/* Icono de advertencia */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
        </div>

        {/* Mensaje */}
        <div className="text-center">
          <h3 className="text-base font-semibold text-zinc-900 mb-2">
            ¿Desactivar este almacén?
          </h3>
          <p className="text-zinc-600 text-sm">
            El almacén será desactivado. El stock y las recepciones asociadas se conservarán.
          </p>
        </div>

        {/* Info del almacén */}
        <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-700">Nombre:</span>
            <span className="text-sm font-semibold text-zinc-900">{warehouse.name}</span>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800 text-center">
            ⚠️ Los registros de stock e historial de recepciones no serán eliminados.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            className="flex-1"
            disabled={submitting}
          >
            {submitting ? 'Desactivando...' : 'Desactivar Almacén'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
