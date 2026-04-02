'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Search, Plus, Edit, Eye, Package, ChevronLeft, ChevronRight, FileSpreadsheet, DollarSign, Layers } from 'lucide-react';
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
}: InventoryTableProps) {
  const [internalSearch, setInternalSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [internalPage, setInternalPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [selectedProductRaw, setSelectedProductRaw] = useState<ApiProductDetail | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [isBulkPriceTiersModalOpen, setIsBulkPriceTiersModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const itemsPerPage = 10;

  const isControlledSearch = typeof externalSearch === 'string' && typeof onSearchChange === 'function';
  const searchTerm = isControlledSearch ? externalSearch! : internalSearch;

  const isControlledPage = typeof externalPage === 'number' && typeof onPageChange === 'function';
  const currentPage = isControlledPage ? externalPage! : internalPage;

  const effectiveItemsPerPage = externalItemsPerPage ?? itemsPerPage;

  const categories = ['Todas', ...Array.from(new Set(productos.map(p => p.categoria)))];

  const filteredProducts = productos.filter(producto => {
    const matchesSearch = !searchTerm || producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         producto.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || selectedCategory === 'Todas' || producto.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil((externalItemsPerPage ? (totalItems ?? filteredProducts.length) : filteredProducts.length) / effectiveItemsPerPage);
  
  // Si estamos en modo server-driven (externalItemsPerPage definido), no hacemos slice local
  // porque el backend ya nos mandó solo los items de la página actual
  const currentProducts = externalItemsPerPage 
    ? filteredProducts 
    : filteredProducts.slice((currentPage - 1) * effectiveItemsPerPage, currentPage * effectiveItemsPerPage);

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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar productos por nombre o SKU..."
              className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm text-zinc-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
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
          
          <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
            {categories.slice(0, 6).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category === 'Todas' ? '' : category)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  (selectedCategory === '' && category === 'Todas') || selectedCategory === category
                    ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canCreate && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 whitespace-nowrap"
                onClick={() => setIsBulkPriceModalOpen(true)}
              >
                <DollarSign className="w-4 h-4" />
                Cambio de Precios
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 whitespace-nowrap"
                onClick={() => setIsBulkPriceTiersModalOpen(true)}
              >
                <Layers className="w-4 h-4" />
                Precios Mayoreo
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 whitespace-nowrap"
                onClick={() => setIsBulkImportModalOpen(true)}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Importar Excel
              </Button>
              <Button className="flex items-center gap-2" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4" />
                Nuevo Producto
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Producto
                </th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-6 py-4">
                  SKU
                </th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-6 py-4">
                  Categoría
                </th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-6 py-4">
                  Stock
                </th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-6 py-4">
                  Precio
                </th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-6 py-4">
                  Estado
                </th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-6 py-4">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {currentProducts.map((producto) => {
                const stockStatus = getStockStatus(producto.stockTotal);
                
                return (
                  <tr key={producto.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-100 flex-shrink-0 dark:bg-zinc-800">
                          {producto.imageUrl ? (
                            <Image
                              src={producto.imageUrl}
                              alt={producto.nombre}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/40">
                              <Package className="w-5 h-5 text-blue-400 dark:text-blue-300" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{producto.nombre}</p>
                          <p className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">{producto.descripcion}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-zinc-600 dark:text-zinc-300">{producto.sku}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-900 dark:text-zinc-100">{producto.categoria}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {producto.stockTotal}
                        </span>
                        <Badge variant={stockStatus.variant} className="text-xs">
                          {stockStatus.label}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
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
                          className="rounded-lg p-2 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800"
                          title="Ver detalle"
                          disabled={loadingDetail}
                        >
                          <Eye className="h-4 w-4 text-zinc-500 dark:text-zinc-300" />
                        </button>
                        {canEdit && (
                        <button
                          onClick={() => handleEditProduct(producto)}
                          className="rounded-lg p-2 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800"
                          title="Editar producto"
                          disabled={loadingDetail}
                        >
                          <Edit className="h-4 w-4 text-zinc-500 dark:text-zinc-300" />
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

        <div className="flex items-center justify-between border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Mostrando {((currentPage - 1) * effectiveItemsPerPage) + 1} a{' '}
            {Math.min(currentPage * effectiveItemsPerPage, totalItems ?? filteredProducts.length)} de{' '}
            {totalItems ?? filteredProducts.length} productos
          </p>
          <div className="flex items-center gap-2">
            {/* Items per page */}
            <select
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
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
              className="rounded-lg border border-zinc-200 p-2 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
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
                      : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800'
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
              className="rounded-lg border border-zinc-200 p-2 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
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