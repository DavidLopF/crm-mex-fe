'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Edit2, Package, DollarSign, Tag, Calendar, Plus, Minus } from 'lucide-react';
import { Modal, Button, Badge, Card, CardContent } from '@/components/ui';
import { Producto } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface ProductDetailModalProps {
  producto: Producto | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (producto: Producto) => void;
}

export function ProductDetailModal({ producto, isOpen, onClose, onEdit }: ProductDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState<Producto | null>(null);

  if (!producto) return null;

  const handleEditToggle = () => {
    if (isEditing) {
      setEditedProduct(null);
    } else {
      setEditedProduct({ ...producto });
    }
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    if (editedProduct && onEdit) {
      onEdit(editedProduct);
    }
    setIsEditing(false);
    setEditedProduct(null);
  };

  const handleVariationStockChange = (variationId: string, newStock: number) => {
    if (!editedProduct) return;
    
    const updatedVariations = editedProduct.variaciones.map(v =>
      v.id === variationId ? { ...v, stock: Math.max(0, newStock) } : v
    );
    
    const newStockTotal = updatedVariations.reduce((sum, v) => sum + v.stock, 0);
    
    setEditedProduct({
      ...editedProduct,
      variaciones: updatedVariations,
      stockTotal: newStockTotal
    });
  };

  const currentProduct = isEditing && editedProduct ? editedProduct : producto;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Producto' : 'Detalle del Producto'}
      size="xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Imagen del producto */}
        <div className="lg:col-span-1">
          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-4">
            {currentProduct.imagen ? (
              <Image
                src={currentProduct.imagen}
                alt={currentProduct.nombre}
                width={400}
                height={400}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <Package className="w-16 h-16 text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">SKU</span>
              <span className="text-sm font-mono text-gray-900">{currentProduct.sku}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Categoría</span>
              <span className="text-sm text-gray-900">{currentProduct.categoria}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Estado</span>
              <Badge variant={currentProduct.activo ? 'success' : 'default'}>
                {currentProduct.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Información del producto */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            {isEditing ? (
              <input
                type="text"
                value={editedProduct?.nombre || ''}
                onChange={(e) => setEditedProduct(prev => prev ? { ...prev, nombre: e.target.value } : null)}
                className="text-2xl font-bold text-gray-900 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <h2 className="text-2xl font-bold text-gray-900">{currentProduct.nombre}</h2>
            )}
            
            {isEditing ? (
              <textarea
                value={editedProduct?.descripcion || ''}
                onChange={(e) => setEditedProduct(prev => prev ? { ...prev, descripcion: e.target.value } : null)}
                rows={3}
                className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="mt-2 text-gray-600">{currentProduct.descripcion}</p>
            )}
          </div>

          {/* Precios */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Precio de Venta</span>
                </div>
                {isEditing ? (
                  <input
                    type="number"
                    value={editedProduct?.precio || 0}
                    onChange={(e) => setEditedProduct(prev => prev ? { ...prev, precio: parseFloat(e.target.value) || 0 } : null)}
                    className="text-2xl font-bold text-green-600 w-full border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                  />
                ) : (
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(currentProduct.precio)}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Costo</span>
                </div>
                {isEditing ? (
                  <input
                    type="number"
                    value={editedProduct?.costo || 0}
                    onChange={(e) => setEditedProduct(prev => prev ? { ...prev, costo: parseFloat(e.target.value) || 0 } : null)}
                    className="text-2xl font-bold text-blue-600 w-full border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                  />
                ) : (
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(currentProduct.costo)}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Variaciones */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Variaciones y Stock</h3>
            <div className="space-y-3">
              {currentProduct.variaciones.map((variacion) => (
                <Card key={variacion.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="font-medium text-gray-900">
                          {variacion.nombre}: {variacion.valor}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleVariationStockChange(variacion.id, variacion.stock - 1)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Minus className="w-4 h-4 text-gray-600" />
                            </button>
                            <input
                              type="number"
                              value={variacion.stock}
                              onChange={(e) => handleVariationStockChange(variacion.id, parseInt(e.target.value) || 0)}
                              className="w-16 text-center border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              min="0"
                            />
                            <button
                              onClick={() => handleVariationStockChange(variacion.id, variacion.stock + 1)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Plus className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-lg font-semibold text-gray-900">
                            {variacion.stock} unidades
                          </span>
                        )}
                        
                        <Badge 
                          variant={
                            variacion.stock === 0 ? 'danger' : 
                            variacion.stock <= 5 ? 'warning' : 'success'
                          }
                        >
                          {variacion.stock === 0 ? 'Agotado' : 
                           variacion.stock <= 5 ? 'Stock Bajo' : 'Disponible'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Stock total */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-gray-700">Stock Total</span>
                </div>
                <span className="text-2xl font-bold text-purple-600">
                  {currentProduct.stockTotal} unidades
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Creado: {formatDateTime(currentProduct.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Actualizado: {formatDateTime(currentProduct.updatedAt)}</span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            {isEditing ? (
              <>
                <Button onClick={handleSave}>
                  Guardar Cambios
                </Button>
                <Button variant="outline" onClick={handleEditToggle}>
                  Cancelar
                </Button>
              </>
            ) : (
              <Button onClick={handleEditToggle} className="flex items-center gap-2">
                <Edit2 className="w-4 h-4" />
                Editar Producto
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}