'use client';

import * as React from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Download,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Column definition ─── */

export type SortDirection = 'asc' | 'desc' | null;

export interface DataTableColumn<T> {
  key: keyof T | string;
  header: string;
  /** Custom cell render. Receives row and the raw value */
  cell?: (row: T, value: unknown) => React.ReactNode;
  /** Enable sorting on this column */
  sortable?: boolean;
  /** Class for <th> and <td> */
  className?: string;
  /** Don't include this column in compact/mobile view */
  hideOnMobile?: boolean;
  /** Width hint e.g. 'w-12' or 'w-40' */
  width?: string;
}

/* ─── Bulk action ─── */

export interface BulkAction<T> {
  label: string;
  icon?: React.ElementType;
  variant?: 'default' | 'danger';
  onClick: (rows: T[]) => void;
}

/* ─── Props ─── */

export interface DataTableProps<T extends { id: string | number }> {
  columns: DataTableColumn<T>[];
  data: T[];

  /* Search */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  /* Sorting */
  sortKey?: string;
  sortDir?: SortDirection;
  onSort?: (key: string) => void;

  /* Pagination */
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];

  /* Selection */
  selectable?: boolean;
  selectedIds?: (string | number)[];
  onSelectionChange?: (ids: (string | number)[]) => void;
  bulkActions?: BulkAction<T>[];

  /* State */
  loading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;

  /* Header slot — rendered right of search (filters, export, etc.) */
  headerSlot?: React.ReactNode;

  /** Per-row quick actions rendered on hover */
  rowActions?: (row: T) => React.ReactNode;

  className?: string;
}

/* ─── Helper: get nested value ─── */

function getValue<T>(row: T, key: string): unknown {
  return (key as string).split('.').reduce((acc: unknown, k) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[k];
    return undefined;
  }, row as unknown);
}

/* ─── SortIcon ─── */

function SortIcon({ dir }: { dir: SortDirection }) {
  if (dir === 'asc') return <ChevronUp className="w-3.5 h-3.5" />;
  if (dir === 'desc') return <ChevronDown className="w-3.5 h-3.5" />;
  return <ChevronsUpDown className="w-3.5 h-3.5 opacity-30" />;
}

/* ─── Skeleton row ─── */

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-zinc-100 dark:border-zinc-800">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-zinc-100 animate-pulse dark:bg-zinc-800" style={{ width: `${60 + (i * 11) % 30}%` }} />
        </td>
      ))}
    </tr>
  );
}

/* ─── Main DataTable ─── */

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Buscar…',
  sortKey,
  sortDir,
  onSort,
  page = 1,
  pageSize = 10,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  bulkActions = [],
  loading = false,
  emptyMessage = 'Sin resultados',
  emptyDescription = 'No hay registros que coincidan con los filtros actuales.',
  headerSlot,
  rowActions,
  className,
}: DataTableProps<T>) {
  const totalPages = total !== undefined ? Math.ceil(total / pageSize) : 1;
  const hasSelection = selectedIds.length > 0;
  const allSelected = data.length > 0 && data.every((r) => selectedIds.includes(r.id));
  const someSelected = !allSelected && hasSelection;

  const toggleRow = (id: string | number) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((x) => x !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map((r) => r.id));
    }
  };

  const selectedRows = data.filter((r) => selectedIds.includes(r.id));

  return (
    <div className={cn('flex flex-col gap-0 overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900', className)}>

      {/* ─── Toolbar ─── */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2 flex-1 min-w-0">

          {/* Bulk actions bar */}
          {hasSelection ? (
            <div className="flex items-center gap-2 animate-fadeIn">
              <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                {selectedIds.length} seleccionados
              </span>
              {bulkActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => action.onClick(selectedRows)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                      action.variant === 'danger'
                        ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'
                    )}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    {action.label}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Search */
            onSearchChange && (
              <div className="relative max-w-xs w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-8 w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/15 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:bg-zinc-900 dark:focus:ring-zinc-100/15"
                />
              </div>
            )
          )}
        </div>

        {/* Header slot (filters, export, create buttons) */}
        {headerSlot && <div className="flex items-center gap-2">{headerSlot}</div>}
      </div>

      {/* ─── Table ─── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-900/80">
              {selectable && (
                <th className="w-10 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleAll}
                    className="h-4 w-4 cursor-pointer rounded border-zinc-300 accent-zinc-900 dark:border-zinc-600 dark:accent-zinc-100"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    'select-none whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400',
                    col.sortable && 'cursor-pointer transition-colors hover:text-zinc-900 dark:hover:text-zinc-100',
                    col.hideOnMobile && 'hidden md:table-cell',
                    col.width,
                    col.className
                  )}
                  onClick={() => col.sortable && onSort?.(String(col.key))}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <SortIcon dir={sortKey === String(col.key) ? sortDir ?? null : null} />
                    )}
                  </div>
                </th>
              ))}
              {rowActions && <th className="w-10 px-4 py-3" />}
            </tr>
          </thead>

          <tbody>
            {loading
              ? Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
                  <SkeletonRow key={i} cols={(selectable ? 1 : 0) + columns.length + (rowActions ? 1 : 0)} />
                ))
              : data.length === 0
              ? (
                <tr>
                  <td
                    colSpan={(selectable ? 1 : 0) + columns.length + (rowActions ? 1 : 0)}
                    className="px-4 py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <Search className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                      </div>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{emptyMessage}</p>
                      <p className="max-w-xs text-xs text-zinc-400 dark:text-zinc-500">{emptyDescription}</p>
                    </div>
                  </td>
                </tr>
              )
              : data.map((row) => {
                  const isSelected = selectedIds.includes(row.id);
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        'group border-b border-zinc-100 transition-colors last:border-0 dark:border-zinc-800',
                        isSelected ? 'bg-zinc-50 dark:bg-zinc-800/70' : 'hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40'
                      )}
                    >
                      {selectable && (
                        <td className="w-10 px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRow(row.id)}
                            className="h-4 w-4 cursor-pointer rounded border-zinc-300 accent-zinc-900 dark:border-zinc-600 dark:accent-zinc-100"
                          />
                        </td>
                      )}

                      {columns.map((col) => {
                        const raw = getValue(row, String(col.key));
                        return (
                          <td
                            key={String(col.key)}
                            className={cn(
                              'align-middle px-4 py-3 text-zinc-700 dark:text-zinc-200',
                              col.hideOnMobile && 'hidden md:table-cell',
                              col.className
                            )}
                          >
                            {col.cell ? col.cell(row, raw) : String(raw ?? '—')}
                          </td>
                        );
                      })}

                      {/* Quick actions — visible on hover */}
                      {rowActions && (
                        <td className="w-10 px-3 py-3 align-middle">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {rowActions(row)}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* ─── Pagination ─── */}
      {(onPageChange || onPageSizeChange) && (
        <div className="flex items-center justify-between gap-4 border-t border-zinc-100 bg-zinc-50/40 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            {total !== undefined && (
              <span>
                {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} de {total}
              </span>
            )}
            {onPageSizeChange && (
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="h-7 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:focus:ring-zinc-100/15"
              >
                {pageSizeOptions.map((s) => (
                  <option key={s} value={s}>{s} por página</option>
                ))}
              </select>
            )}
          </div>

          {onPageChange && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:pointer-events-none disabled:opacity-30 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                Pág. {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:pointer-events-none disabled:opacity-30 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
