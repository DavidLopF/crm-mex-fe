'use client';

import { Modal, Button } from '@/components/ui';
import { Trash2 } from 'lucide-react';
import { Parafiscal, TIPO_LABEL } from '@/services/parafiscales';

interface DeleteParafiscalModalProps {
  isOpen:      boolean;
  onClose:     () => void;
  onConfirm:   () => void;
  item:        Parafiscal | null;
  submitting?: boolean;
}

export function DeleteParafiscalModal({ isOpen, onClose, onConfirm, item, submitting }: DeleteParafiscalModalProps) {
  if (!item) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Eliminar Parafiscal" size="sm">
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <Trash2 className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <p className="text-zinc-700 font-medium">
              ¿Eliminar <span className="font-bold text-zinc-900">{item.nombre}</span>?
            </p>
            <p className="text-sm text-zinc-500 mt-1">
              Tipo: {TIPO_LABEL[item.tipo]}
              {item.documento && ` · NIT/Doc: ${item.documento}${item.nitDv ? `-${item.nitDv}` : ''}`}
            </p>
            <p className="text-xs text-zinc-400 mt-3">
              El registro quedará marcado como eliminado y no se mostrará en el sistema.
              Esta acción no se puede deshacer.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={submitting}
            className="bg-red-600 hover:bg-red-700 text-white border-red-600"
          >
            {submitting ? 'Eliminando…' : 'Sí, eliminar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
