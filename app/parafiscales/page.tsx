'use client';

import { useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ParafiscalTable, ParafiscalTableSkeleton } from '@/components/parafiscales';
import {
  getParafiscales,
  createParafiscal,
  updateParafiscal,
  deleteParafiscal,
  CreateParafiscalDto,
  UpdateParafiscalDto,
  TipoParafiscal,
} from '@/services/parafiscales';
import { useParafiscalesStore } from '@/stores/use-parafiscales-store';
import { useDebounce, useToast } from '@/lib/hooks';
import { ToastContainer } from '@/components/ui';
import { Building2 } from 'lucide-react';

export default function ParafiscalesPage() {

  // ── Store ──
  const {
    items, total, page, limit, search, tipoFilter, loading, submitting,
  } = useParafiscalesStore(useShallow((s) => ({
    items:       s.items,
    total:       s.total,
    page:        s.page,
    limit:       s.limit,
    search:      s.search,
    tipoFilter:  s.tipoFilter,
    loading:     s.loading,
    submitting:  s.submitting,
  })));

  const setItems      = useParafiscalesStore((s) => s.setItems);
  const setLoading    = useParafiscalesStore((s) => s.setLoading);
  const setSubmitting = useParafiscalesStore((s) => s.setSubmitting);
  const setPage       = useParafiscalesStore((s) => s.setPage);
  const setLimit      = useParafiscalesStore((s) => s.setLimit);
  const setSearch     = useParafiscalesStore((s) => s.setSearch);
  const setTipoFilter = useParafiscalesStore((s) => s.setTipoFilter);
  const upsertItem    = useParafiscalesStore((s) => s.upsertItem);
  const removeItem    = useParafiscalesStore((s) => s.removeItem);
  const patchItem     = useParafiscalesStore((s) => s.patchItem);

  const toast          = useToast();
  const debouncedSearch = useDebounce(search, 400);

  // ── Carga de datos ──
  const load = useCallback(async (p = page, q = debouncedSearch, l = limit, tipo = tipoFilter) => {
    setLoading(true);
    try {
      const res = await getParafiscales({
        page:   p,
        limit:  l,
        search: q || undefined,
        tipo:   tipo !== 'all' ? tipo : undefined,
      });
      setItems(res.items, res.total);
    } catch (err) {
      toast.error('Error al cargar parafiscales. Verifica que el servidor esté en ejecución.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load(page, debouncedSearch, limit, tipoFilter);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, limit, tipoFilter]);

  // ── CRUD ──
  const handleCreate = async (data: CreateParafiscalDto) => {
    setSubmitting(true);
    try {
      const created = await createParafiscal(data);
      upsertItem(created);
      toast.success(`"${created.nombre}" creado correctamente`);
      await load(page, debouncedSearch, limit, tipoFilter);
    } catch (err) {
      toast.error(`Error al crear: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id: number, data: UpdateParafiscalDto) => {
    setSubmitting(true);
    try {
      const updated = await updateParafiscal(id, data);
      patchItem(id, updated);
      toast.success('Parafiscal actualizado correctamente');
    } catch (err) {
      toast.error(`Error al actualizar: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setSubmitting(true);
    try {
      await deleteParafiscal(id);
      removeItem(id);
      toast.success('Parafiscal eliminado correctamente');
    } catch (err) {
      toast.error(`Error al eliminar: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──
  return (
    <main className="p-4 sm:p-6">
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

      <div className="space-y-6">

        {/* Encabezado */}
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Parafiscales</h1>
            <p className="text-zinc-500 text-sm">Gestión de Bancos, Fondos y Socios</p>
          </div>
        </div>

        {/* Tabla o skeleton */}
        {loading ? (
          <ParafiscalTableSkeleton rows={limit} />
        ) : (
          <ParafiscalTable
            items={items}
            totalItems={total}
            submitting={submitting}

            externalSearch={search}
            onSearchChange={setSearch}

            externalPage={page}
            onPageChange={setPage}

            externalLimit={limit}
            onLimitChange={setLimit}

            externalTipo={tipoFilter}
            onTipoChange={(t) => setTipoFilter(t as TipoParafiscal | 'all')}

            onItemCreate={handleCreate}
            onItemUpdate={handleUpdate}
            onItemDelete={handleDelete}
          />
        )}
      </div>
    </main>
  );
}
