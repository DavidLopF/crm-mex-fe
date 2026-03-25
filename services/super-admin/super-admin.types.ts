// ─── Empresa (Tenant) ─────────────────────────────────────────────────────────

export interface CompanyListItem {
  id: number;
  nit: string;
  nitDv: string;
  companyName: string;
  tradeName: string | null;
  email: string | null;
  phone: string | null;
  defaultIvaRate: number;   // 0.19 = 19 %
  defaultCurrency: string;  // "COP", "USD", etc.
  isActive: boolean;
  createdAt: string;
  userCount: number;
}

export interface CompanyDetail extends CompanyListItem {
  address: string | null;
  cityCode: string | null;
  cityName: string | null;
  departmentCode: string | null;
  departmentName: string | null;
  website: string | null;
  taxRegime: string | null;
  taxLiability: string | null;
  logoUrl: string | null;
  updatedAt: string;
  stats: {
    users: number;
    clients: number;
    products: number;
    sales: number;
  };
}

export interface CreateCompanyDto {
  nit: string;
  nitDv: string;
  companyName: string;
  tradeName?: string;
  address?: string;
  cityCode?: string;
  cityName?: string;
  departmentCode?: string;
  departmentName?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxRegime?: string;
  taxLiability?: string;
  /** 0.0–1.0  (ej. 0.19 = 19 %) */
  defaultIvaRate?: number;
  /** "COP", "USD", etc. */
  defaultCurrency?: string;
  logoUrl?: string;
}

export type UpdateCompanyDto = Partial<CreateCompanyDto> & { isActive?: boolean };

// ─── Usuarios de empresa ──────────────────────────────────────────────────────

export interface CompanyUser {
  id: number;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  roles: { code: string; name: string }[];
}

export interface CreateCompanyUserDto {
  email: string;
  fullName: string;
  password: string;
  /** Código de rol — default: "ADMIN" */
  roleCode?: string;
}

// ─── Respuestas genéricas ─────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}
