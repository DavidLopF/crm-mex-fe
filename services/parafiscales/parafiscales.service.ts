import { get, post, put, del, getPaginated } from '@/services/http-client';
import {
  Parafiscal,
  CreateParafiscalDto,
  UpdateParafiscalDto,
  ParafiscalFilters,
  PaginatedParafiscales,
} from './parafiscales.types';

const BASE_PATH = '/api/parafiscales';

/** GET /api/parafiscales — lista paginada */
export async function getParafiscales(filters: ParafiscalFilters = {}): Promise<PaginatedParafiscales> {
  const params: Record<string, unknown> = {
    page:   filters.page  ?? 1,
    limit:  filters.limit ?? 10,
    search: filters.search || undefined,
    tipo:   filters.tipo  || undefined,
  };

  const response = await getPaginated<Parafiscal[]>(BASE_PATH, params);
  return {
    items:      response.data,
    total:      response.pagination.total,
    page:       response.pagination.page,
    limit:      response.pagination.limit,
    totalPages: response.pagination.totalPages ?? 1,
  };
}

/** GET /api/parafiscales/:id */
export async function getParafiscalById(id: number): Promise<Parafiscal> {
  return get<Parafiscal>(`${BASE_PATH}/${id}`);
}

/** POST /api/parafiscales */
export async function createParafiscal(data: CreateParafiscalDto): Promise<Parafiscal> {
  return post<Parafiscal>(BASE_PATH, data);
}

/** PUT /api/parafiscales/:id */
export async function updateParafiscal(id: number, data: UpdateParafiscalDto): Promise<Parafiscal> {
  return put<Parafiscal>(`${BASE_PATH}/${id}`, data);
}

/** DELETE /api/parafiscales/:id — soft delete en backend */
export async function deleteParafiscal(id: number): Promise<void> {
  return del<void>(`${BASE_PATH}/${id}`);
}
