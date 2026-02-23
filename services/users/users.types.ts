// ── Rol ────────────────────────────────────────────────────────────
export interface Role {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  usersCount?: number;
}

// ── Usuario completo ───────────────────────────────────────────────
export interface UserDetail {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  role: Role;
  createdAt: string;
  updatedAt?: string;
}

// ── Filtros para GET /api/users (paginado) ─────────────────────────
export interface UserFiltersDto {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: number;
  active?: boolean;
}

// ── Respuesta paginada de usuarios ─────────────────────────────────
export interface PaginatedUsersDto {
  items: UserDetail[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── DTO para crear un usuario ──────────────────────────────────────
export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  roleId: number;
}

// ── DTO para actualizar un usuario ─────────────────────────────────
export interface UpdateUserDto {
  name?: string;
  email?: string;
  isActive?: boolean;
}

// ── DTO para cambiar el rol de un usuario ──────────────────────────
export interface ChangeUserRoleDto {
  roleId: number;
}

// ── DTO para cambiar la contraseña de un usuario ───────────────────
export interface ChangePasswordDto {
  password: string;
}

// ── Filtros para GET /api/roles ────────────────────────────────────
export interface RoleFiltersDto {
  page?: number;
  limit?: number;
  search?: string;
}

// ── Respuesta paginada de roles ────────────────────────────────────
export interface PaginatedRolesDto {
  items: Role[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── DTO para crear un rol ──────────────────────────────────────────
export interface CreateRoleDto {
  name: string;
  description?: string;
}

// ── DTO para actualizar un rol ─────────────────────────────────────
export interface UpdateRoleDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}
