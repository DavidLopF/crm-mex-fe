import { InventoryTable, InventoryStats } from '@/components/inventario';
import { productosInventario } from '@/lib/mock-data';

export default function InventarioPage() {
  return (
    <main className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
            <p className="text-gray-500">Gestión de productos y control de stock</p>
          </div>
        </div>
        
        <InventoryStats productos={productosInventario} />
        <InventoryTable productos={productosInventario} />
      </div>
    </main>
  );
}