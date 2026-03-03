'use client';

import { useEffect, useState } from 'react';
import { Truck, ClipboardList } from 'lucide-react';
import {
  SupplierTable,
  SupplierTableSkeleton,
  SupplierStats,
  PurchaseOrderTable,
  PurchaseOrderTableSkeleton,
  PurchaseOrderStats,
} from '@/components/proveedores';
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierStatistics,
  getPurchaseOrders,
  createPurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrderStatistics,
} from '@/services/suppliers';
import type {
  SupplierDetail,
  SupplierStatistics,
  CreateSupplierDto,
  UpdateSupplierDto,
  PurchaseOrder,
  PurchaseOrderStatistics as POStats,
  CreatePurchaseOrderDto,
  PurchaseOrderStatus,
} from '@/services/suppliers';
import { useDebounce, useToast } from '@/lib/hooks';
import { ToastContainer } from '@/components/ui';
import { PermissionGuard } from '@/components/layout';

type ActiveTab = 'suppliers' | 'purchase-orders';

export default function ProveedoresPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('suppliers');

  // ── Suppliers state ──
  const [suppliers, setSuppliers] = useState<SupplierDetail[]>([]);
  const [supplierPage, setSupplierPage] = useState(1);
  const [supplierLimit, setSupplierLimit] = useState(10);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierStatusFilter, setSupplierStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [supplierTotal, setSupplierTotal] = useState<number | undefined>(undefined);
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [supplierStats, setSupplierStats] = useState<SupplierStatistics | undefined>(undefined);

  // ── Purchase orders state ──
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [orderPage, setOrderPage] = useState(1);
  const [orderLimit, setOrderLimit] = useState(10);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<PurchaseOrderStatus | 'all'>('all');
  const [orderTotal, setOrderTotal] = useState<number | undefined>(undefined);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderStats, setOrderStats] = useState<POStats | undefined>(undefined);

  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const debouncedSupplierSearch = useDebounce(supplierSearch, 500);
  const debouncedOrderSearch = useDebounce(orderSearch, 500);

  // ── Load suppliers ──
  const loadSuppliers = async (
    p = supplierPage,
    q = supplierSearch,
    l = supplierLimit,
    filter = supplierStatusFilter
  ) => {
    setSupplierLoading(true);
    try {
      const filters: { page: number; limit: number; search: string; active?: boolean; inactive?: boolean } = {
        page: p,
        limit: l,
        search: q,
      };
      if (filter === 'active') {
        filters.active = true;
        filters.inactive = false;
      } else if (filter === 'inactive') {
        filters.active = false;
        filters.inactive = true;
      }
      const res = await getSuppliers(filters);
      setSuppliers(res.items);
      setSupplierTotal(res.total);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Error al cargar proveedores:', msg);
      toast.error('Error al cargar los proveedores.');
    } finally {
      setSupplierLoading(false);
    }
  };

  const loadSupplierStats = async () => {
    try {
      const stats = await getSupplierStatistics();
      setSupplierStats(stats);
    } catch (err) {
      console.error('Error cargando estadísticas de proveedores:', err);
    }
  };

  // ── Load purchase orders ──
  const loadOrders = async (
    p = orderPage,
    q = orderSearch,
    l = orderLimit,
    status = orderStatusFilter
  ) => {
    setOrderLoading(true);
    try {
      const res = await getPurchaseOrders({
        page: p,
        limit: l,
        search: q,
        status: status,
      });
      setOrders(res.items);
      setOrderTotal(res.total);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Error al cargar órdenes de compra:', msg);
      toast.error('Error al cargar las órdenes de compra.');
    } finally {
      setOrderLoading(false);
    }
  };

  const loadOrderStats = async () => {
    try {
      const stats = await getPurchaseOrderStatistics();
      setOrderStats(stats);
    } catch (err) {
      console.error('Error cargando estadísticas de órdenes:', err);
    }
  };

  // ── Effects ──
  useEffect(() => {
    loadSupplierStats();
    loadOrderStats();
  }, []);

  useEffect(() => {
    loadSuppliers(supplierPage, debouncedSupplierSearch, supplierLimit, supplierStatusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierPage, debouncedSupplierSearch, supplierLimit, supplierStatusFilter]);

  useEffect(() => {
    loadOrders(orderPage, debouncedOrderSearch, orderLimit, orderStatusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderPage, debouncedOrderSearch, orderLimit, orderStatusFilter]);

  // ── Supplier handlers ──
  const handleSupplierCreate = async (data: CreateSupplierDto) => {
    setSubmitting(true);
    try {
      await createSupplier(data);
      toast.success(`Proveedor "${data.name}" creado exitosamente`);
      await loadSuppliers(supplierPage, debouncedSupplierSearch, supplierLimit, supplierStatusFilter);
      loadSupplierStats();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error al crear el proveedor: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSupplierUpdate = async (id: number, data: UpdateSupplierDto) => {
    setSubmitting(true);
    try {
      const updated = await updateSupplier(id, data);
      setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
      toast.success('Proveedor actualizado exitosamente');
      loadSupplierStats();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error al actualizar el proveedor: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSupplierDelete = async (id: number) => {
    setSubmitting(true);
    try {
      await deleteSupplier(id);
      toast.success('Proveedor eliminado exitosamente');
      await loadSuppliers(supplierPage, debouncedSupplierSearch, supplierLimit, supplierStatusFilter);
      loadSupplierStats();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error al eliminar el proveedor: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Purchase order handlers ──
  const handleOrderCreate = async (data: CreatePurchaseOrderDto) => {
    setSubmitting(true);
    try {
      await createPurchaseOrder(data);
      toast.success('Orden de compra creada exitosamente');
      await loadOrders(orderPage, debouncedOrderSearch, orderLimit, orderStatusFilter);
      loadOrderStats();
      loadSupplierStats();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error al crear la orden de compra: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOrderDelete = async (id: number) => {
    setSubmitting(true);
    try {
      await deletePurchaseOrder(id);
      toast.success('Orden de compra cancelada exitosamente');
      await loadOrders(orderPage, debouncedOrderSearch, orderLimit, orderStatusFilter);
      loadOrderStats();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error al cancelar la orden de compra: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PermissionGuard moduleCode="PROVEEDORES">
      <main className="p-6">
        <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
              <p className="text-gray-500">Gestión de proveedores y órdenes de compra</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'suppliers'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Truck className="w-4 h-4" />
              Proveedores
            </button>
            <button
              onClick={() => setActiveTab('purchase-orders')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'purchase-orders'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              Órdenes de Compra
            </button>
          </div>

          {/* Content */}
          {activeTab === 'suppliers' && (
            <>
              <SupplierStats statistics={supplierStats} />
              {supplierLoading ? (
                <SupplierTableSkeleton rows={supplierLimit} />
              ) : (
                <SupplierTable
                  suppliers={suppliers}
                  onSupplierCreate={handleSupplierCreate}
                  onSupplierUpdate={handleSupplierUpdate}
                  onSupplierDelete={handleSupplierDelete}
                  externalSearch={supplierSearch}
                  onSearchChange={(v) => { setSupplierSearch(v); setSupplierPage(1); }}
                  externalPage={supplierPage}
                  onPageChange={(p) => setSupplierPage(p)}
                  externalItemsPerPage={supplierLimit}
                  onItemsPerPageChange={(l) => { setSupplierLimit(l); setSupplierPage(1); }}
                  externalStatusFilter={supplierStatusFilter}
                  onStatusFilterChange={(f) => { setSupplierStatusFilter(f); setSupplierPage(1); }}
                  totalItems={supplierTotal}
                  submitting={submitting}
                />
              )}
            </>
          )}

          {activeTab === 'purchase-orders' && (
            <>
              <PurchaseOrderStats statistics={orderStats} />
              {orderLoading ? (
                <PurchaseOrderTableSkeleton rows={orderLimit} />
              ) : (
                <PurchaseOrderTable
                  orders={orders}
                  onOrderCreate={handleOrderCreate}
                  onOrderDelete={handleOrderDelete}
                  externalSearch={orderSearch}
                  onSearchChange={(v) => { setOrderSearch(v); setOrderPage(1); }}
                  externalPage={orderPage}
                  onPageChange={(p) => setOrderPage(p)}
                  externalItemsPerPage={orderLimit}
                  onItemsPerPageChange={(l) => { setOrderLimit(l); setOrderPage(1); }}
                  externalStatusFilter={orderStatusFilter}
                  onStatusFilterChange={(f) => { setOrderStatusFilter(f); setOrderPage(1); }}
                  totalItems={orderTotal}
                  submitting={submitting}
                />
              )}
            </>
          )}
        </div>
      </main>
    </PermissionGuard>
  );
}
