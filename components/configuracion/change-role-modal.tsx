'use client';

import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import type { UserDetail, Role } from '@/services/users';
import { getAllRoles } from '@/services/users';

interface ChangeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: number, roleId: number) => void;
  user: UserDetail | null;
  submitting?: boolean;
}

export function ChangeRoleModal({ isOpen, onClose, onSave, user, submitting }: ChangeRoleModalProps) {
  const [roleId, setRoleId] = useState<number | ''>('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [lastUserId, setLastUserId] = useState<number | null>(null);

  // Sync state when user changes
  if (user && user.id !== lastUserId) {
    setRoleId(user.role.id);
    setLastUserId(user.id);
  }

  useEffect(() => {
    if (isOpen) {
      loadRoles();
    }
  }, [isOpen]);

  const loadRoles = async () => {
    setLoadingRoles(true);
    try {
      const allRoles = await getAllRoles();
      setRoles(allRoles.filter(r => r.isActive));
    } catch (err) {
      console.error('Error al cargar roles:', err);
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = () => {
    if (!user || roleId === '' || roleId === user.role.id) return;
    onSave(user.id, roleId as number);
  };

  const hasChanged = user && roleId !== '' && roleId !== user.role.id;
  const selectedRole = roles.find(r => r.id === roleId);

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Cambiar Rol" size="md">
      <div className="space-y-5">
        {/* Info del usuario */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Usuario:</span>
              <span className="text-sm text-gray-900 font-semibold">{user.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Rol actual:</span>
              <span className="inline-flex items-center gap-1.5 text-sm text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full font-medium">
                <Shield className="w-3 h-3" />
                {user.role.name}
              </span>
            </div>
          </div>
        </div>

        {/* Selector de nuevo rol */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nuevo rol <span className="text-red-500">*</span>
          </label>
          {loadingRoles ? (
            <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-400">
              Cargando roles...
            </div>
          ) : (
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Seleccionar rol...</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}{role.id === user.role.id ? ' (actual)' : ''}
                </option>
              ))}
            </select>
          )}
          {selectedRole?.description && (
            <p className="mt-1 text-xs text-gray-500">{selectedRole.description}</p>
          )}
        </div>

        {/* Preview del cambio */}
        {hasChanged && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800 text-center">
              El rol de <strong>{user.name}</strong> cambiará de{' '}
              <strong>{user.role.name}</strong> a{' '}
              <strong>{selectedRole?.name}</strong>
            </p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex items-center gap-3 pt-2">
          <Button variant="outline" onClick={handleClose} className="flex-1" disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            disabled={!hasChanged || submitting}
          >
            {submitting ? 'Cambiando...' : 'Cambiar Rol'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
