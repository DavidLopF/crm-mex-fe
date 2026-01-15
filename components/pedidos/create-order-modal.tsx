'use client';

import { useState, useMemo } from 'react';
import { Modal, Card, Button, Select } from '@/components/ui';
import { 
  Search, 
  Plus, 
  Trash2, 
  ShoppingCart, 
  DollarSign,
  History,
  Package,
  FileText,
  Download,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Pedido, Producto } from '@/types';
import { clientesRecientes, productosInventario, historialPreciosClientes } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pedido: Partial<Pedido>) => void;
}

interface LineaCarrito {
  id: string;
  producto: Producto;
  variacion?: { id: string; nombre: string; precio: number };
  cantidad: number;
  precioUnitario: number;
  precioOriginal: number;
  subtotal: number;
  usandoPrecioHistorico: boolean;
}

let carritoCounter = 0;

export function CreateOrderModal({ isOpen, onClose, onSave }: CreateOrderModalProps) {
  const [clienteId, setClienteId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [carrito, setCarrito] = useState<LineaCarrito[]>([]);
  const [notas, setNotas] = useState('');
  const [mostrarHistorico, setMostrarHistorico] = useState<string | null>(null);
  const [clienteSectionOpen, setClienteSectionOpen] = useState(true);
  const [productosSectionOpen, setProductosSectionOpen] = useState(true);

  const clienteSeleccionado = clientesRecientes.find(c => c.id === clienteId);

  // Filtrar productos por búsqueda
  const productosFiltrados = useMemo(() => {
    if (!searchTerm) return productosInventario.slice(0, 10);
    const term = searchTerm.toLowerCase();
    return productosInventario.filter(p => 
      p.nombre.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      p.categoria.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  // Obtener historial de precios para un producto y cliente
  const obtenerHistorialPrecios = (productoId: string) => {
    if (!clienteId) return [];
    return historialPreciosClientes.filter(
      h => h.productoId === productoId && h.clienteId === clienteId
    ).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  };

  // Agregar producto al carrito
  const agregarAlCarrito = (
    producto: Producto, 
    variacion?: { id: string; nombre: string; precio: number },
    precioPersonalizado?: number
  ) => {
    const historial = obtenerHistorialPrecios(producto.id);
    const precioHistorico = historial.length > 0 ? historial[0].precio : null;
    const precioBase = variacion ? variacion.precio : producto.precio;
    
    let precioFinal = precioBase;
    let usandoHistorico = false;

    if (precioPersonalizado) {
      precioFinal = precioPersonalizado;
    } else if (precioHistorico && clienteId) {
      precioFinal = precioHistorico;
      usandoHistorico = true;
    }

    carritoCounter++;
    const nuevaLinea: LineaCarrito = {
      id: `${producto.id}-${variacion?.id || 'base'}-${carritoCounter}`,
      producto,
      variacion,
      cantidad: 1,
      precioUnitario: precioFinal,
      precioOriginal: precioBase,
      subtotal: precioFinal,
      usandoPrecioHistorico: usandoHistorico,
    };

    setCarrito([...carrito, nuevaLinea]);
    setMostrarHistorico(null);
  };

  // Actualizar cantidad
  const actualizarCantidad = (lineaId: string, cantidad: number) => {
    if (cantidad < 1) return;
    setCarrito(carrito.map(linea => 
      linea.id === lineaId 
        ? { ...linea, cantidad, subtotal: linea.precioUnitario * cantidad }
        : linea
    ));
  };

  // Actualizar precio unitario
  const actualizarPrecio = (lineaId: string, precio: number) => {
    if (precio < 0) return;
    setCarrito(carrito.map(linea => 
      linea.id === lineaId 
        ? { 
            ...linea, 
            precioUnitario: precio, 
            subtotal: precio * linea.cantidad,
            usandoPrecioHistorico: false 
          }
        : linea
    ));
  };

  // Eliminar del carrito
  const eliminarDelCarrito = (lineaId: string) => {
    setCarrito(carrito.filter(linea => linea.id !== lineaId));
  };

  // Calcular totales
  const subtotal = carrito.reduce((sum, linea) => sum + linea.subtotal, 0);
  const total = subtotal;

  const handleGuardar = () => {
    if (!clienteId || carrito.length === 0) return;

    const cliente = clientesRecientes.find(c => c.id === clienteId);
    if (!cliente) return;

    const pedidoId = Math.floor(Math.random() * 10000);
    const pedidoNumero = `PED-2026-${String(pedidoId).padStart(4, '0')}`;

    const nuevoPedido: Partial<Pedido> = {
      numero: pedidoNumero,
      estado: 'cotizado',
      clienteId: cliente.id,
      clienteNombre: cliente.nombre,
      clienteEmail: cliente.email,
      clienteTelefono: cliente.telefono,
      lineas: carrito.map((linea, index) => ({
        id: `linea-${index}`,
        productoId: linea.producto.id,
        productoNombre: linea.producto.nombre,
        variacionId: linea.variacion?.id || '',
        variacionNombre: linea.variacion?.nombre || '',
        cantidad: linea.cantidad,
        precioUnitario: linea.precioUnitario,
        subtotal: linea.subtotal,
      })),
      subtotal,
      total,
      notas,
      transmitido: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    onSave(nuevoPedido);
    handleClose();
  };

  const handleClose = () => {
    setClienteId('');
    setSearchTerm('');
    setCarrito([]);
    setNotas('');
    setMostrarHistorico(null);
    onClose();
  };

  const handleDescargarPDF = () => {
    // TODO: Implementar generación de PDF
    console.log('Descargar PDF', { cliente: clienteSeleccionado, carrito, total });
    alert('Funcionalidad de PDF en desarrollo');
  };

  const handleDescargarExcel = () => {
    // TODO: Implementar generación de Excel
    console.log('Descargar Excel', { cliente: clienteSeleccionado, carrito, total });
    alert('Funcionalidad de Excel en desarrollo');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl" title="Crear Nuevo Pedido">
      <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] gap-6 p-6">
        {/* Panel Izquierdo - Productos */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Selector de Cliente */}
          <Card className="mb-4">
            <button
              onClick={() => setClienteSectionOpen(!clienteSectionOpen)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-sm font-semibold text-gray-900">Seleccionar Cliente</h3>
              {clienteSectionOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            
            {clienteSectionOpen && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="mt-3">
                  <Select
                    value={clienteId}
                    onChange={(e) => {
                      setClienteId(e.target.value);
                      setCarrito([]); // Limpiar carrito al cambiar cliente
                    }}
                  >
                    <option value="">Seleccione un cliente...</option>
                    {clientesRecientes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} - {c.email}
                      </option>
                    ))}
                  </Select>
                  {clienteSeleccionado && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">{clienteSeleccionado.nombre}</p>
                      <p className="text-xs text-blue-700 mt-1">{clienteSeleccionado.telefono}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Buscador de Productos */}
          <Card className={productosSectionOpen ? "flex-1 flex flex-col min-h-0" : "flex flex-col"}>
            <button
              onClick={() => setProductosSectionOpen(!productosSectionOpen)}
              className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              <h3 className="text-sm font-semibold text-gray-900">Agregar Productos</h3>
              {productosSectionOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {productosSectionOpen && (
              <>
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="relative mt-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar productos por nombre, SKU o categoría..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      disabled={!clienteId}
                    />
                  </div>
                </div>

                {/* Lista de Productos */}
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
                  {!clienteId ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      Selecciona un cliente para comenzar
                    </div>
                  ) : productosFiltrados.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No se encontraron productos
                    </div>
                  ) : (
                    productosFiltrados.map((producto) => {
                  const historial = obtenerHistorialPrecios(producto.id);
                  const mostrandoHistorico = mostrarHistorico === producto.id;

                  return (
                    <Card key={producto.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        {/* Imagen del producto */}
                        <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden relative">
                          {producto.imagen ? (
                            <Image
                              src={producto.imagen}
                              alt={producto.nombre}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Info del producto */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 truncate">{producto.nombre}</h4>
                          </div>
                          <p className="text-xs text-gray-500">SKU: {producto.sku} • {producto.categoria}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-sm font-semibold text-gray-900">
                              {formatCurrency(producto.precio)}
                            </span>
                            {historial.length > 0 && (
                              <button
                                onClick={() => setMostrarHistorico(
                                  mostrandoHistorico ? null : producto.id
                                )}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                              >
                                <History className="w-3 h-3" />
                                Ver historial ({historial.length})
                              </button>
                            )}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => agregarAlCarrito(producto)}
                          className="flex items-center gap-1 flex-shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                          Agregar
                        </Button>
                      </div>

                      {/* Historial de precios */}
                      {mostrandoHistorico && historial.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg space-y-2">
                          <p className="text-xs font-semibold text-blue-900 mb-2">
                            Precios anteriores:
                          </p>
                          {historial.slice(0, 3).map((h) => (
                            <button
                              key={h.id}
                              onClick={() => agregarAlCarrito(producto, undefined, h.precio)}
                              className="w-full flex items-center justify-between p-2 bg-white rounded hover:bg-blue-100 transition-colors"
                            >
                              <span className="text-xs text-gray-600">
                                {new Date(h.fecha).toLocaleDateString('es-MX')}
                              </span>
                              <span className="text-sm font-semibold text-blue-700">
                                {formatCurrency(h.precio)}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Variaciones */}
                      {producto.variaciones && producto.variaciones.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs font-medium text-gray-700 mb-2">Variaciones:</p>
                          <div className="flex flex-wrap gap-2">
                            {producto.variaciones.map((variacion) => {
                              if (!variacion.precio) return null;
                              const precio = variacion.precio as number;
                              return (
                                <button
                                  key={variacion.id}
                                  onClick={() => agregarAlCarrito(producto, {
                                    id: variacion.id,
                                    nombre: variacion.nombre,
                                    precio: precio
                                  })}
                                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs transition-colors"
                                >
                                  {variacion.nombre} - {formatCurrency(precio)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </Card>
                    );
                  })
                )}
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Panel Derecho - Carrito */}
        <div className="w-full lg:w-[420px] flex flex-col">
          <Card className="flex-1 flex flex-col">
            {/* Header Carrito */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-semibold text-gray-900">
                  Carrito ({carrito.length})
                </h3>
              </div>
            </div>

            {/* Items del Carrito */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {carrito.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">El carrito está vacío</p>
                  <p className="text-xs text-gray-400 mt-1">Agrega productos para continuar</p>
                </div>
              ) : (
                carrito.map((linea) => (
                  <div key={linea.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-3 mb-2">
                      {/* Imagen del producto en carrito */}
                      <div className="w-12 h-12 flex-shrink-0 bg-gray-200 rounded overflow-hidden relative">
                        {linea.producto.imagen ? (
                          <Image
                            src={linea.producto.imagen}
                            alt={linea.producto.nombre}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {linea.producto.nombre}
                            </p>
                            {linea.variacion && (
                              <p className="text-xs text-gray-600">{linea.variacion.nombre}</p>
                            )}
                            {linea.usandoPrecioHistorico && (
                              <span className="inline-flex items-center gap-1 text-xs text-blue-600 mt-1">
                                <History className="w-3 h-3" />
                                Precio histórico
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => eliminarDelCarrito(linea.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">Cantidad</label>
                        <input
                          type="number"
                          min="1"
                          value={linea.cantidad}
                          onChange={(e) => actualizarCantidad(linea.id, parseInt(e.target.value))}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">Precio Unit.</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={linea.precioUnitario}
                            onChange={(e) => actualizarPrecio(linea.id, parseFloat(e.target.value))}
                            className="w-full pl-5 pr-2 py-1 border border-gray-200 rounded text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-600">Subtotal:</span>
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(linea.subtotal)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Notas */}
            <div className="p-4 border-t border-gray-200">
              <label className="text-xs font-medium text-gray-700 block mb-2">
                Notas del pedido (opcional)
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Agrega notas o instrucciones especiales..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            {/* Totales */}
            <div className="p-4 border-t border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="pt-2 border-t border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-gray-200 space-y-3">
              {/* Botones de Descarga */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleDescargarPDF}
                  disabled={!clienteId || carrito.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 text-sm"
                >
                  <FileText className="w-4 h-4" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDescargarExcel}
                  disabled={!clienteId || carrito.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </Button>
              </div>

              {/* Botones principales */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  onClick={handleGuardar}
                  disabled={!clienteId || carrito.length === 0}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Crear Cotización
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Modal>
  );
}
