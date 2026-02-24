'use client';

import { useEffect, useState } from 'react';
import { Users, Shield, Building2 } from 'lucide-react';
import { RolesTable, UsersTable, ConfigTableSkeleton, CompanySettingsForm } from '@/components/configuracion';
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  changeUserRole,
} from '@/services/users';
import type {
  Role,
  UserDetail,
  CreateRoleDto,
  UpdateRoleDto,
  CreateUserDto,
  UpdateUserDto,
} from '@/services/users';
import { useDebounce, useToast } from '@/lib/hooks';
import { ToastContainer } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useCompany } from '@/lib/company-context';
import type { UpdateCompanySettingsDto } from '@/services/company';
import { updateCompanySettings } from '@/services/company';

type Tab = 'users' | 'roles' | 'company';

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<Tab>('users');

  // ─── Roles state ───────────────────────────────────────────────
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesPage, setRolesPage] = useState(1);
  const [rolesSearch, setRolesSearch] = useState('');
  const [rolesTotal, setRolesTotal] = useState<number | undefined>(undefined);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // ─── Users state ───────────────────────────────────────────────
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersStatusFilter, setUsersStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [usersTotal, setUsersTotal] = useState<number | undefined>(undefined);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const debouncedRolesSearch = useDebounce(rolesSearch, 500);
  const debouncedUsersSearch = useDebounce(usersSearch, 500);

  const LIMIT = 10;

  // ═══════════════════════════════════════════════════════════════
  // ROLES CRUD
  // ═══════════════════════════════════════════════════════════════

  const loadRoles = async (p = rolesPage, q = rolesSearch) => {
    setLoadingRoles(true);
    try {
      const res = await getRoles({ page: p, limit: LIMIT, search: q });
      setRoles(res.items);
      setRolesTotal(res.total);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Error al cargar roles:', msg);
      toast.error('Error al cargar los roles.');
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'roles') {
      loadRoles(rolesPage, debouncedRolesSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, rolesPage, debouncedRolesSearch]);

  const handleRoleCreate = async (data: CreateRoleDto) => {
    setSubmitting(true);
    try {
      await createRole(data);
      toast.success(`Rol "${data.name}" creado exitosamente`);
      await loadRoles(rolesPage, debouncedRolesSearch);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error al crear el rol: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleUpdate = async (id: number, data: UpdateRoleDto) => {
    setSubmitting(true);
    try {
      const updated = await updateRole(id, data);
      setRoles(prev => prev.map(r => (r.id === id ? { ...r, ...updated } : r)));
      toast.success('Rol actualizado exitosamente');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error al actualizar el rol: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleDelete = async (id: number) => {
    setSubmitting(true);
    try {
      await deleteRole(id);
      toast.success('Rol eliminado exitosamente');
      await loadRoles(rolesPage, debouncedRolesSearch);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error al eliminar el rol: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // USERS CRUD
  // ═══════════════════════════════════════════════════════════════

  const loadUsers = async (p = usersPage, q = usersSearch, filter = usersStatusFilter) => {
    setLoadingUsers(true);
    try {
      const params: { page: number; limit: number; search: string; active?: boolean } = {
        page: p,
        limit: LIMIT,
        search: q,
      };

      if (filter === 'active') params.active = true;
      else if (filter === 'inactive') params.active = false;

      const res = await getUsers(params);
      setUsers(res.items);
      setUsersTotal(res.total);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Error al cargar usuarios:', msg);
      toast.error('Error al cargar los usuarios.');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers(usersPage, debouncedUsersSearch, usersStatusFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, usersPage, debouncedUsersSearch, usersStatusFilter]);

  const handleUserCreate = async (data: CreateUserDto) => {
    setSubmitting(true);
    try {
      await createUser(data);
      toast.success(`Usuario "${data.fullName}" creado exitosamente`);
      await loadUsers(usersPage, debouncedUsersSearch, usersStatusFilter);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error al crear el usuario: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUserUpdate = async (id: number, data: UpdateUserDto) => {
    setSubmitting(true);
    try {
      const updated = await updateUser(id, data);
      setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...updated } : u)));
      toast.success('Usuario actualizado exitosamente');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error al actualizar el usuario: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUserDelete = async (id: number) => {
    setSubmitting(true);
    try {
      await deleteUser(id);
      toast.success('Usuario eliminado exitosamente');
      await loadUsers(usersPage, debouncedUsersSearch, usersStatusFilter);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error al eliminar el usuario: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUserRoleChange = async (userId: number, roleId: number) => {
    setSubmitting(true);
    try {
      const updated = await changeUserRole(userId, { roleId });
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, ...updated } : u)));
      toast.success('Rol del usuario actualizado exitosamente');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error al cambiar el rol: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // COMPANY SETTINGS
  // ═══════════════════════════════════════════════════════════════

  const { settings: companySettings, updateSettings: applyCompanySettings } = useCompany();

  const handleCompanySettingsSave = async (data: UpdateCompanySettingsDto) => {
    setSubmitting(true);
    try {
      const updated = await updateCompanySettings(data);
      applyCompanySettings(updated);
      toast.success('Configuración de empresa actualizada exitosamente');
    } catch {
      // Si falla la API, igual aplicamos localmente
      applyCompanySettings({ ...companySettings, ...data });
      toast.success('Configuración aplicada localmente');
    } finally {
      setSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: 'users', label: 'Usuarios', icon: Users },
    { key: 'roles', label: 'Roles', icon: Shield },
    { key: 'company', label: 'Empresa', icon: Building2 },
  ];

  return (
    <main className="p-6">
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
            <p className="text-gray-500">Gestión de usuarios, roles y permisos del sistema</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'users' && (
          loadingUsers ? (
            <ConfigTableSkeleton rows={LIMIT} columns={6} />
          ) : (
            <UsersTable
              users={users}
              onUserCreate={handleUserCreate}
              onUserUpdate={handleUserUpdate}
              onUserDelete={handleUserDelete}
              onUserRoleChange={handleUserRoleChange}
              externalSearch={usersSearch}
              onSearchChange={(v) => { setUsersSearch(v); setUsersPage(1); }}
              externalPage={usersPage}
              onPageChange={(p) => setUsersPage(p)}
              externalStatusFilter={usersStatusFilter}
              onStatusFilterChange={(f) => { setUsersStatusFilter(f); setUsersPage(1); }}
              totalItems={usersTotal}
              itemsPerPage={LIMIT}
              submitting={submitting}
            />
          )
        )}

        {activeTab === 'roles' && (
          loadingRoles ? (
            <ConfigTableSkeleton rows={LIMIT} columns={6} />
          ) : (
            <RolesTable
              roles={roles}
              onRoleCreate={handleRoleCreate}
              onRoleUpdate={handleRoleUpdate}
              onRoleDelete={handleRoleDelete}
              externalSearch={rolesSearch}
              onSearchChange={(v) => { setRolesSearch(v); setRolesPage(1); }}
              externalPage={rolesPage}
              onPageChange={(p) => setRolesPage(p)}
              totalItems={rolesTotal}
              itemsPerPage={LIMIT}
              submitting={submitting}
            />
          )
        )}

        {activeTab === 'company' && (
          <CompanySettingsForm
            settings={companySettings}
            onSave={handleCompanySettingsSave}
            submitting={submitting}
          />
        )}
      </div>
    </main>
  );
}