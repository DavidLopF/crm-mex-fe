'use client';

import { useState } from 'react';
import { Modal, Button } from '@/components/ui';
import type { CreateWarehouseDto } from '@/services/warehouses';

interface CreateWarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateWarehouseDto) => void;
  submitting?: boolean;
}

export function CreateWarehouseModal({
  isOpen,
  onClose,
  onSave,
  submitting,
}: CreateWarehouseModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleClose = () => {
    setName('');
    setError('');
    onClose();
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('El nombre del almacén es requerido');
      return;
    }
    setError('');
    onSave({ name: name.trim() });
    setName('');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nuevo Almacén" size="sm">
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
            {submitting ? 'Guardando...' : 'Crear Almacén'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
