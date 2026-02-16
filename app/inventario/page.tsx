'use client';

import { useEffect, useState } from 'react';
import { InventoryTable, InventoryTableSkeleton, InventoryStats } from '@/components/inventario';
import { Producto } from '@/types';
import { getProducts, PaginatedProductsDto, getStadistics, ProductStatistics } from '@/services/products';
import { useDebounce, useToast } from '@/lib/hooks';
import { ToastContainer } from '@/components/ui';

export default function InventarioPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [search, setSearch] = useState<string>('');
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<ProductStatistics | undefined>(undefined);
  
  // Toast notifications
  const toast = useToast();

  // Debounce para la búsqueda - espera 500ms después de que el usuario deje de escribir
  const debouncedSearch = useDebounce(search, 500);

  const load = async (p = page, q = search, l = limit) => {
    setLoading(true);
    try {
      const filters = { page: p, limit: l, search: q };
      const res: PaginatedProductsDto = await getProducts(filters);
      setProductos(res.items);
      setTotal(res.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error al cargar productos:', errorMessage);
      toast.error('Error al cargar los productos. Verifica que el servidor esté en ejecución.');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await getStadistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
      toast.error('No se pudieron cargar las estadísticas del inventario.');
    }
  };

  // Cargar estadísticas solo una vez al montar
  useEffect(() => {
    loadStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load(page, debouncedSearch, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, limit]);

  const handleProductUpdate = (updatedProduct: Producto) => {
    setProductos(prev => 
      prev.map(p => p.id === updatedProduct.id ? updatedProduct : p)
    );
    toast.success('Producto actualizado exitosamente');
  };

  const handleProductCreate = (newProduct: Omit<Producto, 'id' | 'createdAt' | 'updatedAt'>) => {
    const producto: Producto = {
      ...newProduct,
      id: `prod-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProductos(prev => [producto, ...prev]);
    loadStatistics(); // Recargar estadísticas
    toast.success(`Producto "${newProduct.nombre}" creado exitosamente`);
  };

  const handleProductDelete = (productoId: string) => {
    setProductos(prev => prev.filter(p => p.id !== productoId));
    loadStatistics(); // Recargar estadísticas
    toast.success('Producto eliminado exitosamente');
  };

  return (
    <main className="p-6">
      {/* Toast notifications */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
            <p className="text-gray-500">Gestión de productos y control de stock</p>
          </div>
        </div>
        
        <InventoryStats statistics={statistics} />
        <div>
          {loading ? (
            <InventoryTableSkeleton rows={limit} />
          ) : (
            <InventoryTable 
              productos={productos} 
              onProductUpdate={handleProductUpdate}
              onProductCreate={handleProductCreate}
              onProductDelete={handleProductDelete}
              onError={toast.error}
              onSuccess={toast.success}
              externalSearch={search}
              onSearchChange={(v) => { setSearch(v); setPage(1); }}
              externalPage={page}
              onPageChange={(p) => setPage(p)}
              externalItemsPerPage={limit}
              onItemsPerPageChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
              totalItems={total}
            />
          )}
        </div>
      </div>
    </main>
  );
}