'use client';

import { useState, useEffect } from 'react';
import { Plus, Filter, Search } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { OrdersKanban, OrderDetailModal, CreateOrderModal } from '@/components/pedidos';
import { Pedido, EstadoPedido } from '@/types';
import { getOrders, OrderStatus } from '@/services';

// Mapeo de estados del backend a estados del frontend
const mapEstadoBackendToFrontend = (statusCode: string): EstadoPedido => {
  const mapping: Record<string, EstadoPedido> = {
    'COTIZADO': 'cotizado',
    'TRANSMITIDO': 'transmitido',
    'EN_CURSO': 'en_curso',
    'ENVIADO': 'enviado',
    'CANCELADO': 'cancelado',
  };
  return mapping[statusCode] || 'cotizado';
};

// Convertir respuesta del backend a estructura Pedido
const mapOrdersToPedidos = (orderStatuses: OrderStatus[]): Pedido[] => {
  const pedidos: Pedido[] = [];
  
  orderStatuses.forEach(status => {
    status.orders.forEach(order => {
      const pedido: Pedido = {
        id: String(order.id),
        numero: order.code,
        clienteId: String(order.client.id),
        clienteNombre: order.client.name,
        clienteEmail: '',
        clienteTelefono: '',
        estado: mapEstadoBackendToFrontend(status.statusCode),
        lineas: order.items.map(item => ({
          id: String(item.id),
          productoId: String(item.variantId),
          variacionId: String(item.variantId),
          productoNombre: item.description,
          variacionNombre: item.variant.variantName,
          cantidad: item.qty,
          precioUnitario: parseFloat(item.unitPrice),
          subtotal: parseFloat(item.lineTotal),
        })),
        subtotal: parseFloat(order.total),
        impuestos: 0,
        total: parseFloat(order.total),
        notas: '',
        transmitido: status.statusCode !== 'COTIZADO',
        usuarioId: '1',
        createdAt: new Date(order.createdAt),
        updatedAt: new Date(order.createdAt),
      };
      pedidos.push(pedido);
    });
  });
  
  return pedidos;
};

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Cargar pedidos desde el backend
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const orderStatuses = await getOrders();
      const pedidosMapeados = mapOrdersToPedidos(orderStatuses);
      setPedidos(pedidosMapeados);
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = (pedido: Pedido) => {
    setSelectedOrder(pedido);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedOrder(null);
  };

  const handleCreateOrder = (nuevoPedido: Partial<Pedido>) => {
    const pedidoCompleto: Pedido = {
      ...nuevoPedido,
      id: `pedido-${Date.now()}`,
    } as Pedido;

    setPedidos([pedidoCompleto, ...pedidos]);
    console.log('Pedido creado:', pedidoCompleto);
    // TODO: Aquí harías la llamada al API para crear el pedido
  };

  const handleOrderUpdate = (pedido: Pedido, nuevoEstado: EstadoPedido) => {
    setPedidos(prevPedidos =>
      prevPedidos.map(p =>
        p.id === pedido.id
          ? { 
              ...p, 
              estado: nuevoEstado,
              // Si se mueve de cotizado a transmitido, marcar como transmitido
              transmitido: nuevoEstado === 'transmitido' ? true : p.transmitido
            }
          : p
      )
    );
    
    // TODO: Aquí harías la llamada al API para actualizar el estado
    console.log(`Pedido ${pedido.numero} movido a ${nuevoEstado}`);
  };

  const filteredPedidos = pedidos.filter(pedido => 
    pedido.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pedido.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estadísticas
  const stats = {
    total: pedidos.length,
    cotizados: pedidos.filter(p => p.estado === 'cotizado').length,
    enProceso: pedidos.filter(p => ['transmitido', 'en_curso', 'enviado'].includes(p.estado)).length,
    enviados: pedidos.filter(p => p.estado === 'enviado').length,
    cancelados: pedidos.filter(p => p.estado === 'cancelado').length,
    totalVentas: pedidos
      .filter(p => p.estado === 'enviado')
      .reduce((sum, p) => sum + p.total, 0),
  };

  return (
    <main className="h-[calc(100vh-4rem)] flex flex-col p-6">
      <div className="space-y-4 mb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
            <p className="text-gray-500">Gestión de pedidos con tablero Kanban</p>
          </div>
          
          <Button className="flex items-center gap-2" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Nuevo Pedido
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card className="p-4">
            <p className="text-xs text-gray-500 mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-blue-600 mb-1">Cotizados</p>
            <p className="text-2xl font-bold text-blue-600">{stats.cotizados}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-orange-600 mb-1">En Proceso</p>
            <p className="text-2xl font-bold text-orange-600">{stats.enProceso}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-cyan-600 mb-1">Enviados</p>
            <p className="text-2xl font-bold text-cyan-600">{stats.enviados}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-red-600 mb-1">Cancelados</p>
            <p className="text-2xl font-bold text-red-600">{stats.cancelados}</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número de pedido o cliente..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Separador */}
      <div className="border-t border-gray-200 mb-6"></div>

      {/* Kanban Board */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-sm text-gray-500">Cargando pedidos...</p>
            </div>
          </div>
        ) : (
          <OrdersKanban
            pedidos={filteredPedidos}
            onOrderClick={handleOrderClick}
            onOrderUpdate={handleOrderUpdate}
          />
        )}
      </div>

      {/* Modal de Detalle */}
      <OrderDetailModal
        pedido={selectedOrder}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        onEdit={(pedido) => {
          console.log('Edit order:', pedido);
          // TODO: Abrir modal de edición
        }}
      />

      {/* Modal de Creación */}
      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateOrder}
      />
    </main>
  );
}