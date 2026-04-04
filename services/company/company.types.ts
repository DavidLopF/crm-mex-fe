// ── Configuración de la empresa ─────────────────────────────────────

export interface CompanySettings {
  id?: number;
  companyName: string;
  primaryColor: string;   // Color principal (sidebar activo, botones, iconos)
  accentColor: string;    // Color de acento (fondos de avatares, badges)
  logoUrl?: string | null; // URL pública del logo en S3 (opcional)
  updatedAt?: string;
  /** Tasa IVA por defecto (0.0–1.0). Ej: 0.19 = 19 %. Proviene de Company. */
  defaultIvaRate?: number;
  /** Moneda por defecto. Ej: "COP". Proviene de Company. */
  defaultCurrency?: string;
}

export interface UpdateCompanySettingsDto {
  companyName?: string;
  primaryColor?: string;
  accentColor?: string;
  logoUrl?: string | null; // null = eliminar el logo actual
}

/** Valores por defecto */
export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  companyName: 'CRM',
  primaryColor: '#2563eb',  // blue-600
  accentColor: '#3b82f6',   // blue-500
};
