'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck } from 'lucide-react';
import { CompanyStats, CompanyTable } from '@/components/super-admin';
import { listCompanies, toggleCompanyStatus } from '@/services/super-admin';
import type { CompanyListItem } from '@/services/super-admin';
import { useToast } from '@/lib/hooks/use-toast';
import { ToastContainer } from '@/components/ui';
import { useDebounce } from '@/lib/hooks';

const LIMIT = 10;

export default function SuperAdminPage() {
  const toast = useToast();

  const [companies, setCompanies]   = useState<CompanyListItem[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const load = useCallback(async (p = 1, q = '') => {
    setLoading(true);
    try {
      const res = await listCompanies({ page: p, limit: LIMIT, search: q });
      setCompanies(res?.data || []);
      setTotal(res?.total || 0);
    } catch (err) {
      toast.error('Error al cargar las empresas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load(page, debouncedSearch);
  }, [page, debouncedSearch, load]);

  // Reiniciar a página 1 cuando cambia la búsqueda
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleToggleStatus = async (id: number, name: string) => {
    setSubmitting(true);
    try {
      const res = await toggleCompanyStatus(id);
      toast.success(
        `"${name}" ${res.isActive ? 'activada' : 'desactivada'} exitosamente`
      );
      await load(page, debouncedSearch);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error al cambiar estado: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="p-6">
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel Super Admin</h1>
            <p className="text-sm text-gray-500">Gestión de empresas y tenants del sistema</p>
          </div>
        </div>

        {/* Stats */}
        <CompanyStats companies={companies} total={total} />

        {/* Table */}
        <CompanyTable
          companies={companies}
          total={total}
          page={page}
          limit={LIMIT}
          search={search}
          onSearchChange={(v) => setSearch(v)}
          onPageChange={setPage}
          onToggleStatus={handleToggleStatus}
          loading={loading}
          submitting={submitting}
        />
      </div>
    </main>
  );
}
