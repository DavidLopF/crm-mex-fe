'use client';

import { useEffect, useState } from 'react';
import { ClientTable, ClientTableSkeleton, ClientStats } from '@/components/clientes';
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
  getClientStatistics,
  ClientDetail,
  ClientStatistics,
  CreateClientDto,
  UpdateClientDto,
} from '@/services/clients';
import { useDebounce, useToast } from '@/lib/hooks';
import { ToastContainer } from '@/components/ui';

export default function ClientesPage() {
  const [clients, setClients] = useState<ClientDetail[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statistics, setStatistics] = useState<ClientStatistics | undefined>(undefined);

  const toast = useToast();
  const debouncedSearch = useDebounce(search, 500);

  const load = async (p = page, q = search, l = limit, filter = statusFilter) => {
    setLoading(true);
    
    try {
      // Mapear el filtro de estado a los parámetros del backend
      const filters: { page: number; limit: number; search: string; active?: boolean; inactive?: boolean } = {
        page: p,
        limit: l,
        search: q,
      };

      // Solo agregar active/inactive si hay un filtro específico
      if (filter === 'active') {
        filters.active = true;
        filters.inactive = false;
      } else if (filter === 'inactive') {
        filters.active = false;
        filters.inactive = true;
      }
      // Si filter === 'all', no agregamos active ni inactive

      const res = await getClients(filters);
      setClients(res.items);
      setTotal(res.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error al cargar clientes:', errorMessage);
      toast.error('Error al cargar los clientes. Verifica que el servidor esté en ejecución.');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await getClientStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  };

  // Cargar estadísticas solo una vez al montar
  useEffect(() => {
    loadStatistics();
  }, []);

  useEffect(() => {
    load(page, debouncedSearch, limit, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, limit, statusFilter]);

  const handleClientCreate = async (data: CreateClientDto) => {
    setSubmitting(true);
    try {
      await createClient(data);
      toast.success(`Cliente "${data.name}" creado exitosamente`);
      // Recargar la lista y estadísticas
      await load(page, debouncedSearch, limit, statusFilter);
      loadStatistics();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast.error(`Error al crear el cliente: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClientUpdate = async (id: number, data: UpdateClientDto) => {
    setSubmitting(true);
    try {
      const updated = await updateClient(id, data);
      setClients(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
      toast.success('Cliente actualizado exitosamente');
      loadStatistics();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast.error(`Error al actualizar el cliente: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClientDelete = async (id: number) => {
    setSubmitting(true);
    try {
      await deleteClient(id);
      toast.success('Cliente eliminado exitosamente');
      // Recargar la lista y estadísticas
      await load(page, debouncedSearch, limit, statusFilter);
      loadStatistics();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast.error(`Error al eliminar el cliente: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="p-6">
      {/* Toast notifications */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
            <p className="text-gray-500">Gestión de clientes y relaciones</p>
          </div>
        </div>

        <ClientStats statistics={statistics} />

        {loading ? (
          <ClientTableSkeleton rows={limit} />
        ) : (
          <ClientTable
            clients={clients}
            onClientCreate={handleClientCreate}
            onClientUpdate={handleClientUpdate}
            onClientDelete={handleClientDelete}
            externalSearch={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            externalPage={page}
            onPageChange={(p) => setPage(p)}
            externalItemsPerPage={limit}
            onItemsPerPageChange={(l) => { setLimit(l); setPage(1); }}
            externalStatusFilter={statusFilter}
            onStatusFilterChange={(filter) => { setStatusFilter(filter); setPage(1); }}
            totalItems={total}
            submitting={submitting}
          />
        )}
      </div>
    </main>
  );
}