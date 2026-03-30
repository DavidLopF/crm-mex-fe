import { get, post, put, patch, getRaw } from '@/services/http-client';
import type {
  CompanyListItem,
  CompanyDetail,
  CreateCompanyDto,
  UpdateCompanyDto,
  CompanyUser,
  CreateCompanyUserDto,
  PaginatedResult,
} from './super-admin.types';

const BASE = '/api/super-admin';

// ─── Empresas ─────────────────────────────────────────────────────────────────

export async function listCompanies(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PaginatedResult<CompanyListItem>> {
  return getRaw<PaginatedResult<CompanyListItem>>(`${BASE}/companies`, params as Record<string, unknown>);
}

export async function getCompany(id: number): Promise<CompanyDetail> {
  return get<CompanyDetail>(`${BASE}/companies/${id}`);
}

export async function createCompany(dto: CreateCompanyDto): Promise<CompanyDetail> {
  return post<CompanyDetail>(`${BASE}/companies`, dto);
}

export async function updateCompany(id: number, dto: UpdateCompanyDto): Promise<CompanyDetail> {
  return put<CompanyDetail>(`${BASE}/companies/${id}`, dto);
}

export async function toggleCompanyStatus(id: number): Promise<{ isActive: boolean; companyName: string }> {
  return patch<{ isActive: boolean; companyName: string }>(`${BASE}/companies/${id}/toggle`);
}

// ─── Usuarios de empresa ──────────────────────────────────────────────────────

export async function listCompanyUsers(
  companyId: number,
  params?: { page?: number; limit?: number },
): Promise<PaginatedResult<CompanyUser>> {
  return getRaw<PaginatedResult<CompanyUser>>(
    `${BASE}/companies/${companyId}/users`,
    params as Record<string, unknown>,
  );
}

export async function createCompanyUser(
  companyId: number,
  dto: CreateCompanyUserDto,
): Promise<CompanyUser> {
  return post<CompanyUser>(`${BASE}/companies/${companyId}/users`, dto);
}

export async function toggleUserStatus(userId: number): Promise<{ id: number; isActive: boolean }> {
  return patch<{ id: number; isActive: boolean }>(`${BASE}/users/${userId}/toggle`);
}
