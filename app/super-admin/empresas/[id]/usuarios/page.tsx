'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Users, ToggleLeft, ToggleRight,
  ChevronLeft, ChevronRight, UserCheck, UserX,
} from 'lucide-react';
import { CreateCompanyUserModal } from '@/components/super-admin/create-company-user-modal';
import {
  getCompany,
  listCompanyUsers,
  createCompanyUser,
  toggleUserStatus,
} from '@/services/super-admin';
import type { CompanyDetail, CompanyUser, CreateCompanyUserDto } from '@/services/super-admin';
import { useToast } from '@/lib/hooks/use-toast';
import { ToastContainer } from '@/components/ui';
import { cn } from '@/lib/utils';

const LIMIT = 10;

export default function UsuariosEmpresaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const companyId = Number(params.id);

  const [company, setCompany]       = useState<CompanyDetail | null>(null);
  const [users, setUsers]           = useState<CompanyUser[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal]   = useState(false);

  useEffect(() => {
    if (isNaN(companyId)) {
      router.replace('/super-admin');
      return;
    }
    loadCompany();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  useEffect(() => {
    if (company) loadUsers(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company, page]);

  async function loadCompany() {
    try {
      const data = await getCompany(companyId);
      setCompany(data);
    } catch {
      toast.error('No se pudo cargar la empresa');
      router.replace('/super-admin');
    }
  }

  const loadUsers = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await listCompanyUsers(companyId, { page: p, limit: LIMIT });
      setUsers(res?.data || []);
      setTotal(res?.total || 0);
    } catch (err) {
      toast.error('Error al cargar los usuarios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const handleCreateUser = async (data: CreateCompanyUserDto) => {
    setSubmitting(true);
    try {
      await createCompanyUser(companyId, data);
      toast.success(`Usuario "${data.fullName}" creado exitosamente`);
      setShowModal(false);
      await loadUsers(page);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error al crear usuario: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleUser = async (userId: number, fullName: string) => {
    setSubmitting(true);
    try {
      const res = await toggleUserStatus(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === res.id ? { ...u, isActive: res.isActive } : u))
      );
      toast.success(`Usuario "${fullName}" ${res.isActive ? 'activado' : 'desactivado'}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error al cambiar estado: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const start = (page - 1) * LIMIT + 1;
  const end = Math.min(page * LIMIT, total);

  return (
    <main className="p-6">
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

      <CreateCompanyUserModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateUser}
        submitting={submitting}
      />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb + Header */}
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/super-admin" className="hover:text-gray-700 transition-colors">
              Panel
            </Link>
            <span>/</span>
            {company && (
              <Link
                href={`/super-admin/empresas/${companyId}`}
                className="hover:text-gray-700 transition-colors"
              >
                {company.companyName}
              </Link>
            )}
            <span>/</span>
            <span className="text-gray-700 font-medium">Usuarios</span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Usuarios{company ? ` — ${company.companyName}` : ''}
                </h1>
                <p className="text-sm text-gray-500">
                  {total} usuario{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/super-admin/empresas/${companyId}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver a empresa
              </Link>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nuevo Usuario
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de usuarios */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Usuario</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Correo</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Roles</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Creado</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 font-medium">No hay usuarios registrados</p>
                      <p className="text-gray-400 text-xs mt-1">
                        Crea el primer usuario para esta empresa
                      </p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-purple-600 text-xs font-semibold">
                                {user.fullName.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className="font-medium text-gray-900">{user.fullName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{user.email}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((r) => (
                            <span
                              key={r.code}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700"
                            >
                              {r.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
                            user.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-600'
                          )}
                        >
                          {user.isActive ? (
                            <><UserCheck className="w-3 h-3" /> Activo</>
                          ) : (
                            <><UserX className="w-3 h-3" /> Inactivo</>
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-xs">
                        {new Date(user.createdAt).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleToggleUser(user.id, user.fullName)}
                          disabled={submitting}
                          className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            user.isActive
                              ? 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                              : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                          )}
                          title={user.isActive ? 'Desactivar usuario' : 'Activar usuario'}
                        >
                          {user.isActive ? (
                            <ToggleRight className="w-4 h-4" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {total > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
              <span>
                {start}–{end} de {total} usuario{total !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1 || loading}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-medium text-gray-700">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages || loading}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
