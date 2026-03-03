'use client';

import { useState } from 'react';
import { Search, Plus, Eye, Trash2, ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, Button } from '@/components/ui';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
  PURCHASE_ORDER_STATUS_LABELS,
  PURCHASE_ORDER_STATUS_COLORS,
  CreatePurchaseOrderDto,
} from '@/services/suppliers';
import { getPurchaseOrderById } from '@/services/suppliers/suppliers.service';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { PurchaseOrderDetailModal } from './purchase-order-detail-modal';
import { CreatePurchaseOrderModal } from './create-purchase-order-modal';
import { DeletePurchaseOrderModal } from './delete-purchase-order-modal';

interface PurchaseOrderTableProps {
  orders: PurchaseOrder[];
  onOrderCreate?: (data: CreatePurchaseOrderDto) => void;
  onOrderDelete?: (id: number) => void;
  // Server-driven controlled props
  externalSearch?: string;
  onSearchChange?: (value: string) => void;
  externalPage?: number;
  onPageChange?: (page: number) => void;
  externalItemsPerPage?: number;
  onItemsPerPageChange?: (limit: number) => void;
  externalStatusFilter?: PurchaseOrderStatus | 'all';
  onStatusFilterChange?: (filter: PurchaseOrderStatus | 'all') => void;
  totalItems?: number;
  submitting?: boolean;
  canCreate?: boolean;
  canDelete?: boolean;
}

const STATUS_TABS: Array<{ value: PurchaseOrderStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'draft', label: 'Borrador' },
  { value: 'sent', label: 'Enviadas' },
  { value: 'confirmed', label: 'Confirmadas' },
  { value: 'partial', label: 'Parciales' },
  { value: 'received', label: 'Recibidas' },
  { value: 'cancelled', label: 'Canceladas' },
];

export function PurchaseOrderTable({
  orders,
  onOrderCreate,
  onOrderDelete,
  externalSearch,
  onSearchChange,
  externalPage,
  onPageChange,
  externalItemsPerPage,
  onItemsPerPageChange,
  externalStatusFilter,
  onStatusFilterChange,
  totalItems,
  submitting,
  canCreate = true,
  canDelete = true,
}: PurchaseOrderTableProps) {
  const [internalSearch, setInternalSearch] = useState('');
  const [internalPage, setInternalPage] = useState(1);
  const [internalStatusFilter, setInternalStatusFilter] = useState<PurchaseOrderStatus | 'all'>('all');

  // Modal states
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const itemsPerPage = 10;

  const isControlledSearch = typeof externalSearch === 'string' && typeof onSearchChange === 'function';
  const searchTerm = isControlledSearch ? externalSearch! : internalSearch;

  const isControlledPage = typeof externalPage === 'number' && typeof onPageChange === 'function';
  const currentPage = isControlledPage ? externalPage! : internalPage;

  const isControlledStatusFilter = typeof externalStatusFilter === 'string' && typeof onStatusFilterChange === 'function';
  const statusFilter = isControlledStatusFilter ? externalStatusFilter! : internalStatusFilter;

  const effectiveItemsPerPage = externalItemsPerPage ?? itemsPerPage;

  // Guard: asegurar que orders siempre sea un array
  const safeOrders = Array.isArray(orders) ? orders : [];

  const filteredOrders = isControlledStatusFilter
    ? safeOrders
    : safeOrders.filter(o => statusFilter === 'all' || o.status === statusFilter);

  const totalPages = Math.ceil(
    (externalItemsPerPage ? (totalItems ?? filteredOrders.length) : filteredOrders.length) / effectiveItemsPerPage
  );

  const currentOrders = externalItemsPerPage
    ? filteredOrders
    : filteredOrders.slice((currentPage - 1) * effectiveItemsPerPage, currentPage * effectiveItemsPerPage);

  const handleViewOrder = async (order: PurchaseOrder) => {
    try {
      setLoadingDetail(true);
      const full = await getPurchaseOrderById(order.id);
      setSelectedOrder(full);
      setIsDetailModalOpen(true);
    } catch {
      setSelectedOrder(order);
      setIsDetailModalOpen(true);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDeleteClick = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setIsDeleteModalOpen(true);
  };

  const handleCreate = (data: CreatePurchaseOrderDto) => {
    if (onOrderCreate) onOrderCreate(data);
    setIsCreateModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (selectedOrder && onOrderDelete) onOrderDelete(selectedOrder.id);
    setIsDeleteModalOpen(false);
    setSelectedOrder(null);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    if (isControlledPage && onPageChange) {
      onPageChange(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código o proveedor..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => {
                if (isControlledSearch && onSearchChange) {
                  onSearchChange(e.target.value);
                } else {
                  setInternalSearch(e.target.value);
                }
              }}
            />
          </div>
        </div>

        {canCreate && (
          <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nueva Orden
          </Button>
        )}
      </div>

      {/* Filtros de estado */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              if (isControlledStatusFilter && onStatusFilterChange) {
                onStatusFilterChange(tab.value);
              } else {
                setInternalStatusFilter(tab.value);
              }
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              statusFilter === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-4">
                  Código
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-4">
                  Proveedor
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-4">
                  Estado
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-4">
                  Artículos
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-4">
                  Total
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-4">
                  Fecha
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-4">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No se encontraron órdenes de compra</p>
                    <p className="text-gray-400 text-sm mt-1">Intenta cambiar los filtros de búsqueda</p>
                  </td>
                </tr>
              ) : (
                currentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono font-semibold text-primary">
                        {order.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {order.supplierName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${PURCHASE_ORDER_STATUS_COLORS[order.status]}`}>
                        {PURCHASE_ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{order.items.length}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(order.total)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {formatDateTime(order.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalle"
                          disabled={loadingDetail}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canDelete && order.status !== 'received' && order.status !== 'cancelled' && (
                          <button
                            onClick={() => handleDeleteClick(order)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Cancelar orden"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Mostrando {((currentPage - 1) * effectiveItemsPerPage) + 1} a{' '}
            {Math.min(currentPage * effectiveItemsPerPage, totalItems ?? filteredOrders.length)} de{' '}
            {totalItems ?? filteredOrders.length} órdenes
          </p>
          <div className="flex items-center gap-2">
            {/* Items por página */}
            <select
              className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={effectiveItemsPerPage}
              onChange={(e) => {
                const newLimit = Number(e.target.value);
                if (onItemsPerPageChange) onItemsPerPageChange(newLimit);
              }}
            >
              {[5, 10, 20, 50].map((v) => (
                <option key={v} value={v}>{v} / pág</option>
              ))}
            </select>

            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-primary text-white'
                      : 'hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Modals */}
      <PurchaseOrderDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => { setIsDetailModalOpen(false); setSelectedOrder(null); }}
        order={selectedOrder}
      />
      <CreatePurchaseOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreate}
        submitting={submitting}
      />
      <DeletePurchaseOrderModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setSelectedOrder(null); }}
        onConfirm={handleConfirmDelete}
        order={selectedOrder}
        submitting={submitting}
      />
    </div>
  );
}
