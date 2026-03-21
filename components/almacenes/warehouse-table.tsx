'use client';

import { useState } from 'react';
import { Search, Plus, Edit, Trash2, Warehouse, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import type { Warehouse as WarehouseType, CreateWarehouseDto, UpdateWarehouseDto } from '@/services/warehouses';
import { CreateWarehouseModal } from './create-warehouse-modal';
import { EditWarehouseModal } from './edit-warehouse-modal';
import { DeleteWarehouseModal } from './delete-warehouse-modal';

interface WarehouseTableProps {
  warehouses: WarehouseType[];
  onWarehouseCreate?: (data: CreateWarehouseDto) => void;
  onWarehouseUpdate?: (id: number, data: UpdateWarehouseDto) => void;
  onWarehouseDelete?: (id: number) => void;
  // Controlled props
  externalSearch?: string;
  onSearchChange?: (value: string) => void;
  externalPage?: number;
  onPageChange?: (page: number) => void;
  externalStatusFilter?: 'all' | 'active' | 'inactive';
  onStatusFilterChange?: (filter: 'all' | 'active' | 'inactive') => void;
  totalItems?: number;
  itemsPerPage?: number;
  submitting?: boolean;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function WarehouseTable({
  warehouses,
  onWarehouseCreate,
  onWarehouseUpdate,
  onWarehouseDelete,
  externalSearch,
  onSearchChange,
  externalPage,
  onPageChange,
  externalStatusFilter,
  onStatusFilterChange,
  totalItems,
  itemsPerPage = 10,
  submitting,
  canCreate = true,
  canEdit = true,
  canDelete = true,
}: WarehouseTableProps) {
  const [internalSearch, setInternalSearch] = useState('');
  const [internalPage, setInternalPage] = useState(1);
  const [internalStatusFilter, setInternalStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseType | null>(null);

  // Controlled vs uncontrolled
  const isControlledSearch = typeof externalSearch === 'string' && typeof onSearchChange === 'function';
  const searchTerm = isControlledSearch ? externalSearch! : internalSearch;

  const isControlledPage = typeof externalPage === 'number' && typeof onPageChange === 'function';
  const currentPage = isControlledPage ? externalPage! : internalPage;

  const isControlledStatus = typeof externalStatusFilter === 'string' && typeof onStatusFilterChange === 'function';
  const statusFilter = isControlledStatus ? externalStatusFilter! : internalStatusFilter;

  const safeWarehouses = Array.isArray(warehouses) ? warehouses : [];

  // Paginación calculada en modo uncontrolled
  const totalCount = totalItems ?? safeWarehouses.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  const handleSearchChange = (value: string) => {
    if (isControlledSearch) {
      onSearchChange!(value);
    } else {
      setInternalSearch(value);
      setInternalPage(1);
    }
  };

  const handlePageChange = (page: number) => {
    if (isControlledPage) {
      onPageChange!(page);
    } else {
      setInternalPage(page);
    }
  };

  const handleStatusChange = (filter: 'all' | 'active' | 'inactive') => {
    if (isControlledStatus) {
      onStatusFilterChange!(filter);
    } else {
      setInternalStatusFilter(filter);
      setInternalPage(1);
    }
  };

  const handleEdit = (warehouse: WarehouseType) => {
    setSelectedWarehouse(warehouse);
    setIsEditModalOpen(true);
  };

  const handleDelete = (warehouse: WarehouseType) => {
    setSelectedWarehouse(warehouse);
    setIsDeleteModalOpen(true);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  return (
    <>
      <Card className="overflow-hidden">
        {/* ── Toolbar ─────────────────────────────────────────────── */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Búsqueda */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar almacén..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Filtro estado */}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                {(['all', 'active', 'inactive'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => handleStatusChange(f)}
                    className={`px-3 py-1.5 font-medium transition-colors ${
                      statusFilter === f
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Inactivos'}
                  </button>
                ))}
              </div>

              {/* Botón crear */}
              {canCreate && (
                <Button
                  size="sm"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-1.5 whitespace-nowrap"
                  disabled={submitting}
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Almacén
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── Tabla ───────────────────────────────────────────────── */}
        <div className="overflow-x-auto">
          {safeWarehouses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Warehouse className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm font-medium">No se encontraron almacenes</p>
              {searchTerm && (
                <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Creado
                  </th>
                  {(canEdit || canDelete) && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {safeWarehouses.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Warehouse className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium text-gray-900">{w.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={w.isActive ? 'success' : 'default'}>
                        {w.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(w.createdAt)}</td>
                    {(canEdit || canDelete) && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {canEdit && (
                            <button
                              onClick={() => handleEdit(w)}
                              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && w.isActive && (
                            <button
                              onClick={() => handleDelete(w)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Desactivar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Paginación ───────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
            <span>
              {totalCount} almacén{totalCount !== 1 ? 'es' : ''} en total
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Modales ──────────────────────────────────────────────── */}
      <CreateWarehouseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={(data) => {
          onWarehouseCreate?.(data);
          setIsCreateModalOpen(false);
        }}
        submitting={submitting}
      />
      <EditWarehouseModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedWarehouse(null);
        }}
        onSave={(id, data) => {
          onWarehouseUpdate?.(id, data);
          setIsEditModalOpen(false);
          setSelectedWarehouse(null);
        }}
        warehouse={selectedWarehouse}
        submitting={submitting}
      />
      <DeleteWarehouseModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedWarehouse(null);
        }}
        onConfirm={() => {
          if (selectedWarehouse) {
            onWarehouseDelete?.(selectedWarehouse.id);
          }
          setIsDeleteModalOpen(false);
          setSelectedWarehouse(null);
        }}
        warehouse={selectedWarehouse}
        submitting={submitting}
      />
    </>
  );
}
