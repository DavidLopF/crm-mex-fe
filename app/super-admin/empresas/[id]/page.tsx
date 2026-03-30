'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, Users, ToggleLeft, ToggleRight, BarChart3 } from 'lucide-react';
import { CompanyForm, type CompanyFormValues } from '@/components/super-admin/company-form';
import { getCompany, updateCompany, toggleCompanyStatus } from '@/services/super-admin';
import type { CompanyDetail } from '@/services/super-admin';
import { useToast } from '@/lib/hooks/use-toast';
import { ToastContainer } from '@/components/ui';
import { cn } from '@/lib/utils';

export default function EditarEmpresaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const companyId = Number(params.id);

  const [company, setCompany]       = useState<CompanyDetail | null>(null);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isNaN(companyId)) {
      router.replace('/super-admin');
      return;
    }
    loadCompany();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  async function loadCompany() {
    setLoading(true);
    try {
      const data = await getCompany(companyId);
      setCompany(data);
    } catch (err) {
      toast.error('No se pudo cargar la empresa');
      console.error(err);
      router.replace('/super-admin');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (data: CompanyFormValues) => {
    setSubmitting(true);
    try {
      const updated = await updateCompany(companyId, data);
      setCompany(prev => prev ? { ...prev, ...updated, stats: updated.stats || prev.stats } : updated);
      toast.success('Empresa actualizada exitosamente');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error al actualizar: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!company) return;
    setSubmitting(true);
    try {
      const res = await toggleCompanyStatus(companyId);
      setCompany((prev) => prev ? { ...prev, isActive: res.isActive } : prev);
      toast.success(
        `Empresa ${res.isActive ? 'activada' : 'desactivada'} exitosamente`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error al cambiar estado: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="p-6">
        <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!company) return null;

  return (
    <main className="p-6">
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Breadcrumb + Header */}
        <div>
          <Link
            href="/super-admin"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al panel
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center overflow-hidden">
                {company.logoUrl ? (
                  <img src={company.logoUrl} alt={company.companyName} className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{company.companyName}</h1>
                <p className="text-sm text-gray-500">NIT {company.nit}-{company.nitDv}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-semibold',
                  company.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                )}
              >
                {company.isActive ? 'Activa' : 'Inactiva'}
              </span>
              <button
                onClick={handleToggleStatus}
                disabled={submitting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                {company.isActive ? (
                  <><ToggleRight className="w-4 h-4 text-green-500" /> Desactivar</>
                ) : (
                  <><ToggleLeft className="w-4 h-4 text-gray-400" /> Activar</>
                )}
              </button>
              <Link
                href={`/super-admin/empresas/${companyId}/usuarios`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <Users className="w-4 h-4" />
                Ver Usuarios
              </Link>
            </div>
          </div>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Usuarios', value: company.stats?.users ?? 0, icon: Users },
            { label: 'Clientes', value: company.stats?.clients ?? 0, icon: Users },
            { label: 'Productos', value: company.stats?.products ?? 0, icon: BarChart3 },
            { label: 'Ventas', value: company.stats?.sales ?? 0, icon: BarChart3 },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-6">Editar información</h2>
          <CompanyForm
            initialData={company}
            onSubmit={handleSubmit}
            submitting={submitting}
            submitLabel="Guardar cambios"
          />
        </div>
      </div>
    </main>
  );
}
