'use client';

import { useEffect, useState, useCallback } from 'react';
import { Warehouse } from 'lucide-react';
import {
  WarehouseTable,
  WarehouseTableSkeleton,
  WarehouseStatsBar,
} from '@/components/almacenes';
import {
  getWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from '@/services/warehouses';
import type {
  Warehouse as WarehouseType,
  CreateWarehouseDto,
  UpdateWarehouseDto,
} from '@/services/warehouses';
import { useDebounce, useToast } from '@/lib/hooks';

export default function AlmacenesPage() {
  // ── Estado local ───────────────────────────────────────────────
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();
  const debouncedSearch = useDebounce(search, 400);

  // ── Carga de datos ─────────────────────────────────────────────
  const load = useCallback(
    async (p = page, q = debouncedSearch, sf = statusFilter) => {
      setLoading(true);
      try {
        const active =
          sf === 'active' ? true : sf === 'inactive' ? false : undefined;

        const res = await getWarehouses({ page: p, limit, search: q || undefined, active });
        setWarehouses(res.warehouses);
        setTotal(res.pagination.total);
      } catch {
        toast.error('Error al cargar los almacenes');
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [limit],
  );

  useEffect(() => {
    load(page, debouncedSearch, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, statusFilter]);

  // ── Handlers ───────────────────────────────────────────────────
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilterChange = (filter: 'all' | 'active' | 'inactive') => {
    setStatusFilter(filter);
    setPage(1);
  };

  const handleCreate = async (data: CreateWarehouseDto) => {
    setSubmitting(true);
    try {
      const created = await createWarehouse(data);
      setWarehouses((prev) => [created, ...prev]);
      setTotal((t) => t + 1);
      toast.success(`Almacén "${created.name}" creado exitosamente`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear el almacén';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id: number, data: UpdateWarehouseDto) => {
    setSubmitting(true);
    try {
      const updated = await updateWarehouse(id, data);
      setWarehouses((prev) => prev.map((w) => (w.id === id ? updated : w)));
      toast.success(`Almacén "${updated.name}" actualizado exitosamente`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar el almacén';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setSubmitting(true);
    try {
      await deleteWarehouse(id);
      // Reload para reflejar el cambio de isActive en la tabla
      await load(page, debouncedSearch, statusFilter);
      toast.success('Almacén desactivado exitosamente');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al desactivar el almacén';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Warehouse className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Almacenes</h1>
          <p className="text-sm text-gray-500">
            Gestiona los almacenes y bodegas de tu operación
          </p>
        </div>
      </div>

      {/* Tabla */}
      {loading && warehouses.length === 0 ? (
        <WarehouseTableSkeleton />
      ) : (
        <WarehouseTable
          warehouses={warehouses}
          onWarehouseCreate={handleCreate}
          onWarehouseUpdate={handleUpdate}
          onWarehouseDelete={handleDelete}
          externalSearch={search}
          onSearchChange={handleSearchChange}
          externalPage={page}
          onPageChange={setPage}
          externalStatusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          totalItems={total}
          itemsPerPage={limit}
          submitting={submitting}
        />
      )}
    </div>
  );
}
