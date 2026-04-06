'use client';

import { useState } from 'react';
import {
  Search, Plus, Edit, Trash2, Building2,
  ChevronLeft, ChevronRight, Landmark, Banknote, Users,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import {
  Parafiscal,
  CreateParafiscalDto,
  UpdateParafiscalDto,
  TipoParafiscal,
  TIPOS_PARAFISCAL,
  TIPO_LABEL,
} from '@/services/parafiscales';
import { formatDate } from '@/lib/utils';
import { CreateParafiscalModal } from './create-parafiscal-modal';
import { EditParafiscalModal } from './edit-parafiscal-modal';
import { DeleteParafiscalModal } from './delete-parafiscal-modal';

// ─── Icono por tipo ────────────────────────────────────────────────────────────

const TIPO_ICON: Record<TipoParafiscal, React.ElementType> = {
  BANCO: Banknote,
  FONDO: Landmark,
  SOCIO: Users,
};

const TIPO_COLOR: Record<TipoParafiscal, string> = {
  BANCO: 'text-blue-600 bg-blue-50',
  FONDO: 'text-emerald-600 bg-emerald-50',
  SOCIO: 'text-violet-600 bg-violet-50',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface ParafiscalTableProps {
  items:        Parafiscal[];
  totalItems?:  number;
  submitting?:  boolean;

  // Búsqueda controlada
  externalSearch?:   string;
  onSearchChange?:   (v: string) => void;

  // Paginación controlada
  externalPage?:     number;
  onPageChange?:     (p: number) => void;
  externalLimit?:    number;
  onLimitChange?:    (l: number) => void;

  // Filtro tipo controlado
  externalTipo?:     TipoParafiscal | 'all';
  onTipoChange?:     (t: TipoParafiscal | 'all') => void;

  // CRUD handlers
  onItemCreate?: (data: CreateParafiscalDto) => void;
  onItemUpdate?: (id: number, data: UpdateParafiscalDto) => void;
  onItemDelete?: (id: number) => void;
}

// ─── Componente ────────────────────────────────────────────────────────────────

export function ParafiscalTable({
  items,
  totalItems,
  submitting,
  externalSearch,
  onSearchChange,
  externalPage,
  onPageChange,
  externalLimit,
  onLimitChange,
  externalTipo,
  onTipoChange,
  onItemCreate,
  onItemUpdate,
  onItemDelete,
}: ParafiscalTableProps) {

  // ── Modals ──
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen,   setIsEditOpen]   = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected,     setSelected]     = useState<Parafiscal | null>(null);

  // ── Controlled vs internal state ──
  const [internalSearch, setInternalSearch] = useState('');
  const [internalPage,   setInternalPage]   = useState(1);
  const [internalLimit,  setInternalLimit]  = useState(10);
  const [internalTipo,   setInternalTipo]   = useState<TipoParafiscal | 'all'>('all');

  const isCtrlSearch = typeof externalSearch === 'string' && typeof onSearchChange === 'function';
  const isCtrlPage   = typeof externalPage   === 'number' && typeof onPageChange   === 'function';
  const isCtrlLimit  = typeof externalLimit  === 'number' && typeof onLimitChange  === 'function';
  const isCtrlTipo   = typeof externalTipo   === 'string' && typeof onTipoChange   === 'function';

  const search     = isCtrlSearch ? externalSearch! : internalSearch;
  const page       = isCtrlPage   ? externalPage!   : internalPage;
  const limit      = isCtrlLimit  ? externalLimit!   : internalLimit;
  const tipoFilter = isCtrlTipo   ? externalTipo!   : internalTipo;

  const total      = totalItems ?? items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // ── Helpers ──
  const setSearch = (v: string) => isCtrlSearch ? onSearchChange!(v) : setInternalSearch(v);
  const setPage   = (p: number) => isCtrlPage   ? onPageChange!(p)   : setInternalPage(p);
  const setLimit  = (l: number) => {
    if (isCtrlLimit) onLimitChange!(l); else setInternalLimit(l);
    if (isCtrlPage)  onPageChange!(1);  else setInternalPage(1);
  };
  const setTipo   = (t: TipoParafiscal | 'all') => {
    if (isCtrlTipo) onTipoChange!(t); else setInternalTipo(t);
    if (isCtrlPage) onPageChange!(1); else setInternalPage(1);
  };

  const handlePageChange = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  // ── CRUD handlers ──
  const handleCreate = (data: CreateParafiscalDto) => {
    onItemCreate?.(data);
    setIsCreateOpen(false);
  };

  const handleUpdate = (id: number, data: UpdateParafiscalDto) => {
    onItemUpdate?.(id, data);
    setIsEditOpen(false);
    setSelected(null);
  };

  const handleConfirmDelete = () => {
    if (selected) onItemDelete?.(selected.id);
    setIsDeleteOpen(false);
    setSelected(null);
  };

  const getInitials = (name: string) =>
    name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-4">

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">

        {/* Búsqueda */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o documento…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filtro tipo */}
        <div className="flex gap-1 bg-zinc-100 rounded-lg p-1 flex-wrap">
          {(['all', ...TIPOS_PARAFISCAL] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTipo(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                tipoFilter === t
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {t === 'all' ? 'Todos' : TIPO_LABEL[t]}
            </button>
          ))}
        </div>

        <Button className="flex items-center gap-2 shrink-0" onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nuevo</span>
        </Button>
      </div>

      {/* ── Tabla ───────────────────────────────────────────────────────────── */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                {['Entidad', 'Tipo', 'Documento', 'Contacto', 'Estado', 'Acciones'].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-6 py-4"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Building2 className="w-8 h-8 text-zinc-300" />
                      <p className="text-sm text-zinc-500">No se encontraron registros</p>
                      {search && (
                        <p className="text-xs text-zinc-400">Intenta con otros términos de búsqueda</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const Icon = TIPO_ICON[item.tipo];
                  const colorClass = TIPO_COLOR[item.tipo];
                  return (
                    <tr key={item.id} className="hover:bg-zinc-50 transition-colors">

                      {/* Entidad */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-zinc-900">{item.nombre}</p>
                            <p className="text-xs text-zinc-400">{formatDate(new Date(item.createdAt))}</p>
                          </div>
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}>
                          {TIPO_LABEL[item.tipo]}
                        </span>
                      </td>

                      {/* Documento */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-zinc-700 font-mono">
                          {item.documento
                            ? `${item.documento}${item.nitDv ? `-${item.nitDv}` : ''}`
                            : '—'}
                        </span>
                      </td>

                      {/* Contacto */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-zinc-600">
                          {item.telefono && <p>{item.telefono}</p>}
                          {item.email    && <p className="text-xs text-zinc-400 truncate max-w-[160px]">{item.email}</p>}
                          {!item.telefono && !item.email && <span className="text-zinc-300">—</span>}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4">
                        <Badge variant={item.isActive ? 'success' : 'danger'}>
                          {item.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setSelected(item); setIsEditOpen(true); }}
                            className="p-2 hover:bg-amber-50 rounded-lg transition-colors text-zinc-400 hover:text-amber-600"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setSelected(item); setIsDeleteOpen(true); }}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-zinc-400 hover:text-red-600"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Paginación ────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-zinc-100">
          <p className="text-sm text-zinc-500 order-2 sm:order-1">
            Mostrando {total === 0 ? 0 : (page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total} registros
          </p>
          <div className="flex items-center gap-2 order-1 sm:order-2">
            {/* Límite */}
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="text-sm border border-zinc-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[5, 10, 20, 50].map((v) => (
                <option key={v} value={v}>{v} / pág</option>
              ))}
            </select>

            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let n: number;
              if (totalPages <= 5)           n = i + 1;
              else if (page <= 3)            n = i + 1;
              else if (page >= totalPages - 2) n = totalPages - 4 + i;
              else                           n = page - 2 + i;
              return (
                <button
                  key={n}
                  onClick={() => handlePageChange(n)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    page === n ? 'bg-primary text-white' : 'hover:bg-zinc-50 text-zinc-600'
                  }`}
                >
                  {n}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <CreateParafiscalModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={handleCreate}
        submitting={submitting}
      />

      <EditParafiscalModal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setSelected(null); }}
        onSave={handleUpdate}
        item={selected}
        submitting={submitting}
      />

      <DeleteParafiscalModal
        isOpen={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setSelected(null); }}
        onConfirm={handleConfirmDelete}
        item={selected}
        submitting={submitting}
      />
    </div>
  );
}
