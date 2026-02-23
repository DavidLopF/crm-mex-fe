import { get, post, put, del, getPaginated } from '@/services/http-client';
import {
  Role,
  UserDetail,
  UserFiltersDto,
  PaginatedUsersDto,
  CreateUserDto,
  UpdateUserDto,
  ChangeUserRoleDto,
  ChangePasswordDto,
  RoleFiltersDto,
  PaginatedRolesDto,
  CreateRoleDto,
  UpdateRoleDto,
} from './users.types';

// ═══════════════════════════════════════════════════════════════════
// ROLES
// ═══════════════════════════════════════════════════════════════════

const ROLES_PATH = '/api/roles';

/**
 * Obtener lista paginada de roles
 * GET /api/roles?page=1&limit=10&search=...
 */
export async function getRoles(filters: RoleFiltersDto = {}): Promise<PaginatedRolesDto> {
  try {
    const params: Record<string, unknown> = {
      page: filters.page,
      limit: filters.limit,
      search: filters.search,
    };

    const response = await getPaginated<Role[]>(ROLES_PATH, params);

    return {
      items: response.data,
      total: response.pagination.total,
      page: response.pagination.page,
      limit: response.pagination.limit,
      totalPages: response.pagination.totalPages,
    };
  } catch (err) {
    console.error('Error al obtener roles:', err);
    throw err;
  }
}

/**
 * Obtener todos los roles (para selects)
 * GET /api/roles/all
 */
export async function getAllRoles(): Promise<Role[]> {
  try {
    return await get<Role[]>(`${ROLES_PATH}/all`);
  } catch (err) {
    console.error('Error al obtener roles:', err);
    throw err;
  }
}

/**
 * Obtener un rol por ID
 * GET /api/roles/:id
 */
export async function getRoleById(id: number | string): Promise<Role> {
  try {
    return await get<Role>(`${ROLES_PATH}/${id}`);
  } catch (err) {
    console.error('Error al obtener rol:', err);
    throw err;
  }
}

/**
 * Crear un nuevo rol
 * POST /api/roles
 */
export async function createRole(data: CreateRoleDto): Promise<Role> {
  try {
    return await post<Role>(ROLES_PATH, data);
  } catch (err) {
    console.error('Error al crear rol:', err);
    throw err;
  }
}

/**
 * Actualizar un rol
 * PUT /api/roles/:id
 */
export async function updateRole(id: number | string, data: UpdateRoleDto): Promise<Role> {
  try {
    return await put<Role>(`${ROLES_PATH}/${id}`, data);
  } catch (err) {
    console.error('Error al actualizar rol:', err);
    throw err;
  }
}

/**
 * Eliminar un rol
 * DELETE /api/roles/:id
 */
export async function deleteRole(id: number | string): Promise<void> {
  try {
    await del<void>(`${ROLES_PATH}/${id}`);
  } catch (err) {
    console.error('Error al eliminar rol:', err);
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════════
// USUARIOS
// ═══════════════════════════════════════════════════════════════════

const USERS_PATH = '/api/users';

/**
 * Obtener lista paginada de usuarios
 * GET /api/users?page=1&limit=10&search=...&roleId=1&active=true
 */
export async function getUsers(filters: UserFiltersDto = {}): Promise<PaginatedUsersDto> {
  try {
    const params: Record<string, unknown> = {
      page: filters.page,
      limit: filters.limit,
      search: filters.search,
      roleId: filters.roleId,
    };

    if (filters.active !== undefined) {
      params.active = filters.active;
    }

    const response = await getPaginated<UserDetail[]>(USERS_PATH, params);

    return {
      items: response.data,
      total: response.pagination.total,
      page: response.pagination.page,
      limit: response.pagination.limit,
      totalPages: response.pagination.totalPages,
    };
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    throw err;
  }
}

/**
 * Obtener un usuario por ID
 * GET /api/users/:id
 */
export async function getUserById(id: number | string): Promise<UserDetail> {
  try {
    return await get<UserDetail>(`${USERS_PATH}/${id}`);
  } catch (err) {
    console.error('Error al obtener usuario:', err);
    throw err;
  }
}

/**
 * Crear un nuevo usuario
 * POST /api/users
 */
export async function createUser(data: CreateUserDto): Promise<UserDetail> {
  try {
    return await post<UserDetail>(USERS_PATH, data);
  } catch (err) {
    console.error('Error al crear usuario:', err);
    throw err;
  }
}

/**
 * Actualizar un usuario
 * PUT /api/users/:id
 */
export async function updateUser(id: number | string, data: UpdateUserDto): Promise<UserDetail> {
  try {
    return await put<UserDetail>(`${USERS_PATH}/${id}`, data);
  } catch (err) {
    console.error('Error al actualizar usuario:', err);
    throw err;
  }
}

/**
 * Cambiar el rol de un usuario
 * PUT /api/users/:id/role
 */
export async function changeUserRole(id: number | string, data: ChangeUserRoleDto): Promise<UserDetail> {
  try {
    return await put<UserDetail>(`${USERS_PATH}/${id}/role`, data);
  } catch (err) {
    console.error('Error al cambiar rol del usuario:', err);
    throw err;
  }
}

/**
 * Cambiar la contraseña de un usuario
 * PUT /api/users/:id/password
 */
export async function changeUserPassword(id: number | string, data: ChangePasswordDto): Promise<void> {
  try {
    await put<void>(`${USERS_PATH}/${id}/password`, data);
  } catch (err) {
    console.error('Error al cambiar contraseña:', err);
    throw err;
  }
}

/**
 * Eliminar un usuario
 * DELETE /api/users/:id
 */
export async function deleteUser(id: number | string): Promise<void> {
  try {
    await del<void>(`${USERS_PATH}/${id}`);
  } catch (err) {
    console.error('Error al eliminar usuario:', err);
    throw err;
  }
}
