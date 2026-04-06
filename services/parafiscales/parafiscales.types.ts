// ─── Tipos de entidad ─────────────────────────────────────────────────────────

export type TipoParafiscal = 'BANCO' | 'FONDO' | 'SOCIO';

export const TIPOS_PARAFISCAL: TipoParafiscal[] = ['BANCO', 'FONDO', 'SOCIO'];

export const TIPO_LABEL: Record<TipoParafiscal, string> = {
  BANCO: 'Banco',
  FONDO: 'Fondo',
  SOCIO: 'Socio',
};

// ─── Entidad ──────────────────────────────────────────────────────────────────

export interface Parafiscal {
  id:         number;
  tipo:       TipoParafiscal;
  nombre:     string;
  documento:  string | null;
  tipoDoc:    string | null;
  nitDv:      string | null;
  telefono:   string | null;
  email:      string | null;
  notas:      string | null;
  isActive:   boolean;
  createdAt:  string;
  updatedAt:  string;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateParafiscalDto {
  tipo:       TipoParafiscal;
  nombre:     string;
  documento?: string;
  tipoDoc?:   string;
  nitDv?:     string;
  telefono?:  string;
  email?:     string;
  notas?:     string;
}

export interface UpdateParafiscalDto extends Partial<CreateParafiscalDto> {
  isActive?: boolean;
}

// ─── Filtros y respuesta paginada ─────────────────────────────────────────────

export interface ParafiscalFilters {
  page?:   number;
  limit?:  number;
  search?: string;
  tipo?:   TipoParafiscal;
}

export interface PaginatedParafiscales {
  items:      Parafiscal[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}
