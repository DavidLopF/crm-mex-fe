'use client';

import { useState, useEffect } from 'react';
import { Modal, Button } from '@/components/ui';
import type { Warehouse, UpdateWarehouseDto } from '@/services/warehouses';

interface EditWarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, data: UpdateWarehouseDto) => void;
  warehouse: Warehouse | null;
  submitting?: boolean;
}

export function EditWarehouseModal({
  isOpen,
  onClose,
  onSave,
  warehouse,
  submitting,
}: EditWarehouseModalProps) {
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');

  // Sincronizar con el warehouse seleccionado
  useEffect(() => {
    if (warehouse) {
      setName(warehouse.name);
      setIsActive(warehouse.isActive);
      setError('');
    }
  }, [warehouse]);

  const handleClose = () => {
    setError('');
    onClose();
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('El nombre del almacén es requerido');
      return;
    }
    if (!warehouse) return;
    setError('');
    onSave(warehouse.id, {
      name: name.trim(),
      isActive,
    });
  };

  if (!warehouse) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Editar Almacén" size="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Almacén <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Ej: Bodega Central, Almacén Norte..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>

        {/* Toggle de estado */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <p className="text-sm font-medium text-gray-700">Estado</p>
            <p className="text-xs text-gray-500">
              {isActive ? 'El almacén está activo' : 'El almacén está inactivo'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={() => setIsActive((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isActive ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            disabled={submitting || !name.trim()}
          >
            {submitting ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
