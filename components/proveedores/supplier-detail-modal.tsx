'use client';

import { Truck, Calendar, DollarSign, Mail, Phone, MapPin, User } from 'lucide-react';
import { Modal, Badge } from '@/components/ui';
import { SupplierDetail } from '@/services/suppliers';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface SupplierDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: SupplierDetail | null;
}

export function SupplierDetailModal({ isOpen, onClose, supplier }: SupplierDetailModalProps) {
  if (!supplier) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle del Proveedor" size="lg">
      <div className="space-y-6">
        {/* Header con avatar e info principal */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Truck className="w-8 h-8 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">{supplier.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={supplier.isActive ? 'success' : 'danger'}>
                {supplier.isActive ? 'Activo' : 'Inactivo'}
              </Badge>
              {supplier.rfc && (
                <span className="text-sm text-gray-500 font-mono">{supplier.rfc}</span>
              )}
            </div>
          </div>
        </div>

        {/* Estadísticas del proveedor */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Total Compras</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{formatCurrency(supplier.totalPurchases)}</p>
          </div>
        </div>

        {/* Información de contacto */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Información de Contacto</h4>
          <div className="space-y-3">
            {supplier.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-xs text-gray-500 block">Email</span>
                  <span className="text-sm font-medium text-gray-900">{supplier.email}</span>
                </div>
              </div>
            )}
            {supplier.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-xs text-gray-500 block">Teléfono</span>
                  <span className="text-sm font-medium text-gray-900">{supplier.phone}</span>
                </div>
              </div>
            )}
            {(supplier.address || supplier.city || supplier.state) && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-xs text-gray-500 block">Dirección</span>
                  <span className="text-sm font-medium text-gray-900">
                    {[supplier.address, supplier.city, supplier.state, supplier.zipCode]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Persona de contacto */}
        {(supplier.contactName || supplier.contactPhone || supplier.contactEmail) && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Persona de Contacto</h4>
            <div className="space-y-3">
              {supplier.contactName && (
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-xs text-gray-500 block">Nombre</span>
                    <span className="text-sm font-medium text-gray-900">{supplier.contactName}</span>
                  </div>
                </div>
              )}
              {supplier.contactPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-xs text-gray-500 block">Teléfono</span>
                    <span className="text-sm font-medium text-gray-900">{supplier.contactPhone}</span>
                  </div>
                </div>
              )}
              {supplier.contactEmail && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-xs text-gray-500 block">Email</span>
                    <span className="text-sm font-medium text-gray-900">{supplier.contactEmail}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fechas */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Información del Registro</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-xs text-gray-500 block">Fecha de Registro</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDateTime(supplier.createdAt)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-xs text-gray-500 block">Última Actualización</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDateTime(supplier.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notas */}
        {supplier.notes && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Notas</h4>
            <p className="text-sm text-gray-600 whitespace-pre-line">{supplier.notes}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
