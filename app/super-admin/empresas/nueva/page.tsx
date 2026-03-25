'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2 } from 'lucide-react';
import { CompanyForm, type CompanyFormValues } from '@/components/super-admin/company-form';
import { createCompany } from '@/services/super-admin';
import { useToast } from '@/lib/hooks/use-toast';
import { ToastContainer } from '@/components/ui';

export default function NuevaEmpresaPage() {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: CompanyFormValues) => {
    setSubmitting(true);
    try {
      const created = await createCompany(data);
      toast.success(`Empresa "${created.companyName}" creada exitosamente`);
      // Redirigir a la página de edición de la empresa recién creada
      router.push(`/super-admin/empresas/${created.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error al crear la empresa: ${msg}`);
      setSubmitting(false);
    }
  };

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

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nueva Empresa</h1>
              <p className="text-sm text-gray-500">Registrar un nuevo tenant en el sistema</p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <CompanyForm
            onSubmit={handleSubmit}
            submitting={submitting}
            submitLabel="Crear Empresa"
          />
        </div>
      </div>
    </main>
  );
}
