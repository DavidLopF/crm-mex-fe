'use client';

import { useState } from 'react';
import { InventoryTable, InventoryStats } from '@/components/inventario';
import { productosInventario, clientesRecientes, historialPreciosClientes } from '@/lib/mock-data';
import { Producto } from '@/types';

export default function InventarioPage() {
  const [productos, setProductos] = useState<Producto[]>(productosInventario);

  const handleProductUpdate = (updatedProduct: Producto) => {
    setProductos(prev => 
      prev.map(p => p.id === updatedProduct.id ? updatedProduct : p)
    );
  };

  const handleProductCreate = (newProduct: Omit<Producto, 'id' | 'createdAt' | 'updatedAt'>) => {
    const producto: Producto = {
      ...newProduct,
      id: `prod-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProductos(prev => [producto, ...prev]);
  };

  const handleProductDelete = (productoId: string) => {
    setProductos(prev => prev.filter(p => p.id !== productoId));
  };

  return (
    <main className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
            <p className="text-gray-500">Gestión de productos y control de stock</p>
          </div>
        </div>
        
        <InventoryStats productos={productos} />
        <InventoryTable 
          productos={productos} 
          onProductUpdate={handleProductUpdate}
          onProductCreate={handleProductCreate}
          onProductDelete={handleProductDelete}
          clientes={clientesRecientes}
          historialPrecios={historialPreciosClientes}
        />
      </div>
    </main>
  );
}