'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Search, Plus, Edit, Eye, Package, ChevronLeft, ChevronRight, FileSpreadsheet, DollarSign, Layers, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { getCategories } from '@/services/products';
import type { CategoryDto } from '@/services/products';
import { Card, Button, Badge } from '@/components/ui';
import { ProductDetailModal } from './product-detail-modal';
import { CreateProductModal } from './create-product-modal';
import { BulkPriceUpdateModal } from './bulk-price-update-modal';
import { BulkImportModal } from './bulk-import-modal';
import { BulkPriceTiersModal } from './bulk-price-tiers-modal';
import { Producto } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { getProductById, bulkPriceUpdate, bulkImportProducts, bulkPriceTiers } from '@/services/products';
import type { ApiProductDetail, BulkPriceUpdateRow, BulkImportRow, BulkPriceTierRow } from '@/services/products';

interface InventoryTableProps {
  productos: Producto[];
  onProductUpdate?: (producto: Producto) => void;
  onProductCreate?: (producto: Omit<Producto, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
  // optional controlled props for server-driven mode
  externalSearch?: string;
  onSearchChange?: (value: string) => void;
  externalPage?: number;
  onPageChange?: (page: number) => void;
  externalItemsPerPage?: number;
  onItemsPerPageChange?: (limit: number) => void;
  totalItems?: number;
  // Permission flags
  canCreate?: boolean;
  canEdit?: boolean;
  onNeedsRefresh?: () => void;
  // Sort & category (server-driven)
  externalCategoryId?: number;
  onCategoryChange?: (id: number | undefined) => void;
  externalSortBy?: 'name' | 'price' | 'stock';
  externalSortDir?: 'asc' | 'desc';
  onSortChange?: (field: 'name' | 'price' | 'stock', dir: 'asc' | 'desc') => void;
}

export function InventoryTable({
  productos,
  onProductUpdate,
  onProductCreate,
  onError,
  onSuccess,
  externalSearch,
  onSearchChange,
  externalPage,
  onPageChange,
  externalItemsPerPage,
  onItemsPerPageChange,
  totalItems,
  canCreate = true,
  canEdit = true,
  onNeedsRefresh,
  externalCategoryId,
  onCategoryChange,
  externalSortBy,
  externalSortDir = 'asc',
  onSortChange,
}: InventoryTableProps) {
  const [internalSearch, setInternalSearch] = useState('');
  const [internalPage, setInternalPage] = useState(1);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const [apiCategories, setApiCategories] = useState<CategoryDto[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [selectedProductRaw, setSelectedProductRaw] = useState<ApiProductDetail | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [isBulkPriceTiersModalOpen, setIsBulkPriceTiersModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setIsActionsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    getCategories()
      .then(setApiCategories)
      .catch(() => { /* silencioso — fallback a sin categorías */ });
  }, []);

  const isControlledSearch = typeof externalSearch === 'string' && typeof onSearchChange === 'function';
  const searchTerm = isControlledSearch ? externalSearch! : internalSearch;

  const isControlledPage = typeof externalPage === 'number' && typeof onPageChange === 'function';
  const currentPage = isControlledPage ? externalPage! : internalPage;

  const effectiveItemsPerPage = externalItemsPerPage ?? itemsPerPage;

  // En modo server-driven los productos ya vienen filtrados, ordenados y paginados
  const filteredProducts = productos;

  const totalPages = Math.ceil((externalItemsPerPage ? (totalItems ?? filteredProducts.length) : filteredProducts.length) / effectiveItemsPerPage);
  
  // Si estamos en modo server-driven (externalItemsPerPage definido), no hacemos slice local
  // porque el backend ya nos mandó solo los items de la página actual
  const currentProducts = externalItemsPerPage 
    ? filteredProducts 
    : filteredProducts.slice((currentPage - 1) * effectiveItemsPerPage, currentPage * effectiveItemsPerPage);

  const handleSort = (field: 'name' | 'price' | 'stock') => {
    if (!onSortChange) return;
    const newDir = externalSortBy === field && externalSortDir === 'asc' ? 'desc' : 'asc';
    onSortChange(field, newDir);
  };

  const SortIcon = ({ field }: { field: 'name' | 'price' | 'stock' }) => {
    if (externalSortBy !== field) return <ArrowUpDown className="w-3 h-3 text-zinc-400" />;
    return externalSortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 text-blue-500" />
      : <ArrowDown className="w-3 h-3 text-blue-500" />;
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { variant: 'danger' as const, label: 'Agotado' };
    if (stock <= 10) return { variant: 'warning' as const, label: 'Stock Bajo' };
    return { variant: 'success' as const, label: 'En Stock' };
  };

  const handleViewProduct = async (producto: Producto) => {
    setLoadingDetail(true);
    try {
      // Cargar el detalle completo desde el backend
      const { producto: detalle, raw } = await getProductById(producto.id);
      setSelectedProduct(detalle);
      setSelectedProductRaw(raw);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Error cargando detalle del producto:', error);
      // Fallback: usar el producto de la lista si falla
      setSelectedProduct(producto);
      setSelectedProductRaw(null);
      setIsDetailModalOpen(true);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleEditProduct = async (producto: Producto) => {
    setLoadingDetail(true);
    try {
      // Cargar el detalle completo desde el backend para editar
      const { producto: detalle, raw } = await getProductById(producto.id);
      setSelectedProduct(detalle);
      setSelectedProductRaw(raw);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Error cargando detalle del producto:', error);
      // Fallback: usar el producto de la lista si falla
      setSelectedProduct(producto);
      setSelectedProductRaw(null);
      setIsDetailModalOpen(true);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleProductUpdate = (updatedProduct: Producto) => {
    if (onProductUpdate) {
      onProductUpdate(updatedProduct);
    }
    setIsDetailModalOpen(false);
    setSelectedProduct(null);
  };

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedProduct(null);
  };

  const handleCreateProduct = (newProduct: Omit<Producto, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (onProductCreate) {
      onProductCreate(newProduct);
    }
    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-3">
      {/* ── Fila 1: Búsqueda + Acciones ─────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => {
              if (isControlledSearch && onSearchChange) {
                onSearchChange(e.target.value);
              } else {
                setInternalSearch(e.target.value);
              }
            }}
          />
        </div>

        {/* Acciones bulk — dropdown */}
        {canCreate && (
          <div className="relative flex-shrink-0" ref={actionsRef}>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 whitespace-nowrap"
              onClick={() => setIsActionsOpen(v => !v)}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Herramientas
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isActionsOpen ? 'rotate-180' : ''}`} />
            </Button>

            {isActionsOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-zinc-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                <button
                  onClick={() => { setIsBulkPriceModalOpen(true); setIsActionsOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  <DollarSign className="w-4 h-4 text-zinc-400" />
                  Cambio de Precios
                </button>
                <button
                  onClick={() => { setIsBulkPriceTiersModalOpen(true); setIsActionsOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-zinc-400" />
                  Precios Mayoreo
                </button>
                <div className="h-px bg-zinc-100 my-1" />
                <button
                  onClick={() => { setIsBulkImportModalOpen(true); setIsActionsOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  Importar Excel
                </button>
              </div>
            )}
          </div>
        )}

        {canCreate && (
          <Button className="flex items-center gap-2 flex-shrink-0" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </Button>
        )}
      </div>

      {/* ── Fila 2: Filtros de categoría + Sort ─────────────────────── */}

      {/* ── MÓVIL: selects compactos (< sm) ─────────────────────────── */}
      <div className="flex gap-2 sm:hidden">
        {/* Categoría */}
        <div className="relative flex-1 min-w-0">
          <select
            value={externalCategoryId ?? ''}
            onChange={(e) => onCategoryChange?.(e.target.value === '' ? undefined : Number(e.target.value))}
            className={`w-full h-9 pl-3 pr-8 text-xs border rounded-lg bg-white appearance-none cursor-pointer font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${
              externalCategoryId !== undefined
                ? 'border-primary text-primary'
                : 'border-zinc-200 text-zinc-600'
            }`}
          >
            <option value="">Todas las categorías</option>
            {apiCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
        </div>

        {/* Ordenar */}
        {onSortChange && (
          <div className="relative flex-shrink-0">
            <select
              value={externalSortBy ? `${externalSortBy}_${externalSortDir}` : ''}
              onChange={(e) => {
                if (!e.target.value) { onSortChange('name', 'asc'); return; }
                const [f, d] = e.target.value.split('_') as ['name' | 'price' | 'stock', 'asc' | 'desc'];
                onSortChange(f, d);
              }}
              className={`h-9 pl-3 pr-8 text-xs border rounded-lg bg-white appearance-none cursor-pointer font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${
                externalSortBy
                  ? 'border-primary text-primary'
                  : 'border-zinc-200 text-zinc-600'
              }`}
            >
              <option value="">Ordenar</option>
              <option value="name_asc">Nombre A→Z</option>
              <option value="name_desc">Nombre Z→A</option>
              <option value="price_asc">Precio ↑</option>
              <option value="price_desc">Precio ↓</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          </div>
        )}
      </div>

      {/* ── DESKTOP: pills para categoría + sort (>= sm) ─────────────── */}
      <div className="hidden sm:flex items-center gap-3">
        {/* Category pills — desde API, scrollable */}
        <div className="flex-1 min-w-0 overflow-x-auto scrollbar-none">
          <div className="flex gap-1 bg-zinc-100 rounded-lg p-1 w-max min-w-full">
            <button
              onClick={() => onCategoryChange?.(undefined)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                externalCategoryId === undefined
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              Todas
            </button>
            {apiCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onCategoryChange?.(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  externalCategoryId === cat.id
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Sort — server-side */}
        {onSortChange && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs text-zinc-400">Ordenar:</span>
            <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-1">
              {([
                { field: 'name',  label: 'Nombre' },
                { field: 'stock', label: 'Stock'  },
                { field: 'price', label: 'Precio' },
              ] as const).map(({ field, label }) => (
                <button
                  key={field}
                  onClick={() => handleSort(field)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    externalSortBy === field
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  {label}
                  <SortIcon field={field} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th
                  className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-6 py-4 cursor-pointer select-none hover:text-zinc-700"
                  onClick={() => handleSort('name')}
                >
                  <span className="flex items-center gap-1">Producto <SortIcon field="name" /></span>
                </th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-6 py-4">
                  SKU
                </th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-6 py-4">
                  Categoría
                </th>
                <th
                  className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-6 py-4 cursor-pointer select-none hover:text-zinc-700"
                  onClick={() => handleSort('stock')}
                >
                  <span className="flex items-center gap-1">Stock <SortIcon field="stock" /></span>
                </th>
                <th
                  className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-6 py-4 cursor-pointer select-none hover:text-zinc-700"
                  onClick={() => handleSort('price')}
                >
                  <span className="flex items-center gap-1">Precio <SortIcon field="price" /></span>
                </th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-6 py-4">
                  Estado
                </th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-6 py-4">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {currentProducts.map((producto) => {
                const stockStatus = getStockStatus(producto.stockTotal);
                
                return (
                  <tr key={producto.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-100 flex-shrink-0">
                          {producto.imageUrl ? (
                            <Image
                              src={producto.imageUrl}
                              alt={producto.nombre}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                              <Package className="w-5 h-5 text-blue-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-900">{producto.nombre}</p>
                          <p className="text-xs text-zinc-500 line-clamp-1">{producto.descripcion}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-600 font-mono">{producto.sku}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-900">{producto.categoria}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-900">
                          {producto.stockTotal}
                        </span>
                        <Badge variant={stockStatus.variant} className="text-xs">
                          {stockStatus.label}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-zinc-900">
                        {formatCurrency(producto.precio)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={producto.activo ? 'success' : 'default'}>
                        {producto.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleViewProduct(producto)}
                          className="p-2 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-50"
                          title="Ver detalle"
                          disabled={loadingDetail}
                        >
                          <Eye className="w-4 h-4 text-zinc-500" />
                        </button>
                        {canEdit && (
                        <button
                          onClick={() => handleEditProduct(producto)}
                          className="p-2 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-50"
                          title="Editar producto"
                          disabled={loadingDetail}
                        >
                          <Edit className="w-4 h-4 text-zinc-500" />
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100">
          <p className="text-sm text-zinc-500">
            Mostrando {((currentPage - 1) * effectiveItemsPerPage) + 1} a{' '}
            {Math.min(currentPage * effectiveItemsPerPage, totalItems ?? filteredProducts.length)} de{' '}
            {totalItems ?? filteredProducts.length} productos
          </p>
          <div className="flex items-center gap-2">
            {/* Items per page */}
            <select
              className="text-sm border border-zinc-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={effectiveItemsPerPage}
              onChange={(e) => {
                const newLimit = Number(e.target.value);
                if (onItemsPerPageChange) {
                  onItemsPerPageChange(newLimit);
                }
              }}
            >
              {[5, 10, 20, 50].map((v) => (
                <option key={v} value={v}>{v} / pág</option>
              ))}
            </select>

            <button
              onClick={() => {
                const next = Math.max(currentPage - 1, 1);
                if (isControlledPage && onPageChange) onPageChange(next);
                else setInternalPage(next);
              }}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
              
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => {
                    if (isControlledPage && onPageChange) onPageChange(pageNum);
                    else setInternalPage(pageNum);
                  }}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-primary text-white'
                      : 'hover:bg-zinc-50 text-zinc-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => {
                const next = Math.min(currentPage + 1, totalPages);
                if (isControlledPage && onPageChange) onPageChange(next);
                else setInternalPage(next);
              }}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      <ProductDetailModal
        producto={selectedProduct}
        rawDetail={selectedProductRaw}
        isOpen={isDetailModalOpen}
        onClose={handleCloseModal}
        onEdit={handleProductUpdate}
        onError={onError}
        onSuccess={onSuccess}
      />

      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateProduct}
        onError={onError}
      />

      <BulkPriceUpdateModal
        isOpen={isBulkPriceModalOpen}
        onClose={() => setIsBulkPriceModalOpen(false)}
        onConfirm={async (rows: BulkPriceUpdateRow[]) => {
          const result = await bulkPriceUpdate(rows);
          if (result.updated > 0) {
            onSuccess?.(`${result.updated} precio(s) actualizados correctamente`);
            onNeedsRefresh?.();
          }
          return result;
        }}
      />

      <BulkImportModal
        isOpen={isBulkImportModalOpen}
        onClose={() => setIsBulkImportModalOpen(false)}
        onConfirm={async (rows: BulkImportRow[]) => {
          const result = await bulkImportProducts(rows);
          if (result.created > 0) {
            onSuccess?.(`${result.created} producto(s) importados correctamente.`);
            onNeedsRefresh?.();
          }
          return result;
        }}
      />

      <BulkPriceTiersModal
        isOpen={isBulkPriceTiersModalOpen}
        onClose={() => setIsBulkPriceTiersModalOpen(false)}
        onConfirm={async (rows: BulkPriceTierRow[]) => {
          const result = await bulkPriceTiers(rows);
          if (result.updatedSkus > 0) {
            onSuccess?.(
              `${result.updatedSkus} SKU(s) actualizados con ${result.tiersCreated} tier(s) de mayoreo.`,
            );
            onNeedsRefresh?.();
          }
          return result;
        }}
      />
    </div>
  );
}