'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Modal } from '@/components/ui';
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
  ChevronLeft,
  ChevronRight,
  Warehouse,
  X,
  User,
  Loader2,
  ArrowRight,
  StickyNote,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useDebounce } from '@/lib/hooks';
import { useCompany } from '@/lib/company-context';
import { 
  getOrderProducts, 
  OrderProductItem, 
  CreateOrderDto,
} from '@/services/orders';
import { 
  getAllClients, 
  getClientPriceHistory, 
  ClientListItem, 
  PriceHistoryItem,
} from '@/services/clients';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dto: CreateOrderDto) => void;
}

interface LineaCarrito {
  id: string;
  producto: OrderProductItem;
  cantidad: number | '';
  precioUnitario: number | '';
  precioLista: number;
  subtotal: number;
  usandoPrecioHistorico: boolean;
}

let carritoCounter = 0;
const PRODUCTS_PER_PAGE = 6;

export function CreateOrderModal({ isOpen, onClose, onSave }: CreateOrderModalProps) {
  const { settings } = useCompany();
  const primary = settings.primaryColor;
  const primaryBg = primary + '10';
  const primaryBgMid = primary + '20';

  // ── Estado principal ──
  const [clienteId, setClienteId] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [carrito, setCarrito] = useState<LineaCarrito[]>([]);
  const [notas, setNotas] = useState('');

  // ── Clientes ──
  const [clientes, setClientes] = useState<ClientListItem[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);

  // ── Productos ──
  const [productos, setProductos] = useState<OrderProductItem[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // ── Historial de precios ──
  const [expandedHistorial, setExpandedHistorial] = useState<number | null>(null);
  const [historialPrecios, setHistorialPrecios] = useState<PriceHistoryItem[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 400);
  const clienteSeleccionado = clientes.find(c => c.id === clienteId);

  // ── Cargar clientes ──
  useEffect(() => {
    if (isOpen) {
      setLoadingClientes(true);
      getAllClients()
        .then(setClientes)
        .catch(() => console.error('Error clientes'))
        .finally(() => setLoadingClientes(false));
    }
  }, [isOpen]);

  // ── Cargar productos ──
  const loadProductos = useCallback(async (page: number, search: string) => {
    setLoadingProductos(true);
    try {
      const response = await getOrderProducts({
        page,
        limit: PRODUCTS_PER_PAGE,
        search: search || undefined,
        stockStatus: search ? 'all' : 'in-stock',
      });
      setProductos(response.items);
      setTotalPages(response.totalPages);
      setTotalProducts(response.total);
      setCurrentPage(response.page);
    } catch {
      setProductos([]);
    } finally {
      setLoadingProductos(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      loadProductos(1, debouncedSearch);
    }
  }, [debouncedSearch, isOpen, loadProductos]);

  const toggleHistorial = async (variantId: number) => {
    if (expandedHistorial === variantId) {
      setExpandedHistorial(null);
      setHistorialPrecios([]);
      return;
    }
    if (!clienteId) return;
    setExpandedHistorial(variantId);
    setLoadingHistorial(true);
    try {
      const data = await getClientPriceHistory(clienteId, variantId);
      setHistorialPrecios(data);
    } catch {
      setHistorialPrecios([]);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const handlePrevPage = () => { if (currentPage > 1) loadProductos(currentPage - 1, debouncedSearch); };
  const handleNextPage = () => { if (currentPage < totalPages) loadProductos(currentPage + 1, debouncedSearch); };

  const agregarAlCarrito = (producto: OrderProductItem, precioPersonalizado?: number) => {
    const precioBase = producto.price;
    const precioFinal = precioPersonalizado ?? precioBase;

    setCarrito(prev => {
      const idx = prev.findIndex(l => l.producto.id === producto.id && l.precioUnitario === precioFinal);
      if (idx !== -1) {
        return prev.map((l, i) => i === idx ? {
          ...l,
          cantidad: (typeof l.cantidad === 'number' ? l.cantidad : 0) + 1,
          subtotal: (precioFinal) * ((typeof l.cantidad === 'number' ? l.cantidad : 0) + 1)
        } : l);
      }
      carritoCounter++;
      return [...prev, {
        id: `${producto.id}-${carritoCounter}`,
        producto,
        cantidad: 1,
        precioUnitario: precioFinal,
        precioLista: precioBase,
        subtotal: precioFinal,
        usandoPrecioHistorico: precioPersonalizado !== undefined,
      }];
    });
    setExpandedHistorial(null);
  };

  const actualizarCantidad = (lineaId: string, val: string) => {
    const cantidad = val === '' ? '' : parseInt(val);
    setCarrito(prev => prev.map(l => l.id === lineaId ? {
      ...l,
      cantidad,
      subtotal: (typeof l.precioUnitario === 'number' ? l.precioUnitario : 0) * (typeof cantidad === 'number' ? cantidad : 0)
    } : l));
  };

  const actualizarPrecio = (lineaId: string, val: string) => {
    const precioUnitario = val === '' ? '' : parseFloat(val);
    setCarrito(prev => prev.map(l => l.id === lineaId ? {
      ...l,
      precioUnitario,
      subtotal: (typeof precioUnitario === 'number' ? precioUnitario : 0) * (typeof l.cantidad === 'number' ? l.cantidad : 0),
      usandoPrecioHistorico: false,
    } : l));
  };

  const eliminarDelCarrito = (lineaId: string) => setCarrito(prev => prev.filter(l => l.id !== lineaId));

  const subtotal = carrito.reduce((sum, l) => sum + l.subtotal, 0);
  const totalUnidades = carrito.reduce((sum, l) => sum + (typeof l.cantidad === 'number' ? l.cantidad : 0), 0);

  const canSave = clienteId !== '' && carrito.length > 0 && carrito.every(l => typeof l.cantidad === 'number' && l.cantidad > 0 && typeof l.precioUnitario === 'number');

  const handleGuardar = () => {
    if (!canSave) return;
    onSave({
      clientId: clienteId as number,
      items: carrito.map(l => ({
        variantId: l.producto.id,
        qty: l.cantidad as number,
        unitPrice: l.precioUnitario as number,
        listPrice: l.precioLista,
        description: l.producto.variantName ? `${l.producto.name} - ${l.producto.variantName}` : l.producto.name,
      })),
      currency: 'MXN',
    });
    handleClose();
  };

  const handleClose = () => {
    setClienteId(''); setSearchTerm(''); setCarrito([]); setNotas('');
    setExpandedHistorial(null); setHistorialPrecios([]); setProductos([]);
    setCurrentPage(1); onClose();
  };

  const getStockBadge = (status: string) => {
    switch (status) {
      case 'in_stock': return <span className="text-[10px] font-bold text-green-600 uppercase">Stock</span>;
      case 'low_stock': return <span className="text-[10px] font-bold text-amber-600 uppercase">Bajo</span>;
      case 'out_of_stock': return <span className="text-[10px] font-bold text-red-600 uppercase">Agotado</span>;
      default: return null;
    }
  };

  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Crear Nuevo Pedido" 
      size="full"
      className="max-w-[95vw] h-[90vh]"
    >
      <div className="flex h-[calc(90vh-120px)] -mx-6 -mb-6 border-t border-zinc-100">
        {/* Columna 1: Catálogo */}
        <aside className="w-[320px] flex-shrink-0 border-r border-zinc-200 flex flex-col bg-zinc-50/30">
          <div className="p-4 space-y-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Cliente</label>
              <select
                value={clienteId}
                onChange={(e) => { setClienteId(e.target.value ? Number(e.target.value) : ''); setCarrito([]); setExpandedHistorial(null); }}
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': primaryBgMid } as React.CSSProperties}
              >
                <option value="">Seleccionar cliente...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar SKU o nombre..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': primaryBgMid } as React.CSSProperties}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={!clienteId}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 scrollbar-thin">
            {!clienteId ? (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                <User className="w-8 h-8 mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Seleccione cliente</p>
              </div>
            ) : loadingProductos ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-zinc-300" /></div>
            ) : (
              productos.map(p => {
                const inCart = carrito.some(l => l.producto.id === p.id);
                return (
                  <div key={p.id} className="space-y-2">
                    <div 
                      onClick={() => p.stock > 0 && agregarAlCarrito(p)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${inCart ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-100 hover:border-zinc-300'} ${p.stock <= 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold truncate">{p.name}</p>
                        {!inCart && getStockBadge(p.stockStatus)}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[11px] font-black">{formatCurrency(p.price)}</span>
                        <span className="text-[9px] font-bold text-zinc-400">Stock: {p.stock}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => toggleHistorial(p.id)}
                      className="text-[9px] font-bold uppercase tracking-tighter flex items-center gap-1 px-1 hover:opacity-70 transition-opacity"
                      style={{ color: primary }}
                    >
                      <History className="w-2.5 h-2.5" />
                      {expandedHistorial === p.id ? 'Ocultar historial' : 'Ver historial'}
                    </button>

                    {expandedHistorial === p.id && (
                      <div className="p-2 rounded-lg space-y-1 animate-in slide-in-from-top-1" style={{ backgroundColor: primaryBg }}>
                        {loadingHistorial ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 
                         historialPrecios.length === 0 ? <p className="text-[9px] text-center font-bold text-zinc-400">SIN HISTORIAL</p> :
                         historialPrecios.slice(0, 3).map(h => (
                           <button
                             key={h.orderId}
                             onClick={() => agregarAlCarrito(p, h.unitPrice)}
                             className="w-full flex items-center justify-between p-1.5 bg-white rounded-md text-[10px] font-bold hover:scale-[1.02] transition-transform"
                           >
                             <span className="text-zinc-500">{new Date(h.orderDate).toLocaleDateString()}</span>
                             <span style={{ color: primary }}>{formatCurrency(h.unitPrice)}</span>
                           </button>
                         ))
                        }
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          {clienteId && totalProducts > 0 && (
            <div className="p-3 border-t border-zinc-100 bg-white flex items-center justify-between">
              <button onClick={handlePrevPage} disabled={currentPage === 1} className="p-1 disabled:opacity-20"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-[10px] font-bold">{currentPage}/{totalPages}</span>
              <button onClick={handleNextPage} disabled={currentPage === totalPages} className="p-1 disabled:opacity-20"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </aside>

        {/* Columna 2: Construcción */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {carrito.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20">
                <ShoppingCart className="w-12 h-12 mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest">Pedido vacío</p>
              </div>
            ) : (
              carrito.map(linea => (
                <div key={linea.id} className="flex items-center gap-4 p-3 bg-zinc-50/50 rounded-2xl border border-zinc-100 hover:bg-white transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-zinc-900 truncate">{linea.producto.name}</p>
                      {linea.usandoPrecioHistorico && <span title="Precio histórico aplicado"><History className="w-3 h-3 text-amber-500" /></span>}
                    </div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">{linea.producto.sku}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-20">
                      <input 
                        type="number" 
                        value={linea.cantidad} 
                        onChange={e => actualizarCantidad(linea.id, e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs font-bold text-center focus:ring-1"
                        style={{'--tw-ring-color': primary} as any}
                      />
                    </div>
                    <div className="w-24">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400">$</span>
                        <input 
                          type="number" 
                          value={linea.precioUnitario} 
                          onChange={e => actualizarPrecio(linea.id, e.target.value)}
                          className="w-full bg-white border border-zinc-200 rounded-lg pl-4 pr-2 py-1 text-xs font-bold text-right focus:ring-1"
                          style={{'--tw-ring-color': primary} as any}
                        />
                      </div>
                    </div>
                    <div className="w-24 text-right">
                      <p className="text-xs font-black">{formatCurrency(linea.subtotal)}</p>
                    </div>
                    <button onClick={() => eliminarDelCarrito(linea.id)} className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-6 border-t border-zinc-100 bg-zinc-50/20">
            <div className="max-w-md space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <StickyNote className="w-3 h-3" /> Notas del Pedido
              </label>
              <textarea 
                value={notas} onChange={e => setNotas(e.target.value)} 
                className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-xs min-h-[80px] focus:ring-1"
                style={{'--tw-ring-color': primary} as any}
                placeholder="Instrucciones de entrega, referencias..."
              />
            </div>
          </div>
        </main>

        {/* Columna 3: Confirmación */}
        <aside className="w-[280px] flex-shrink-0 border-l border-zinc-200 bg-zinc-50/50 flex flex-col p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest border-b border-zinc-200 pb-2">Resumen</h3>
            
            <div className="space-y-3">
              <div className="bg-white p-3 rounded-xl border border-zinc-100 shadow-sm">
                <p className="text-[9px] font-black text-zinc-400 uppercase mb-1">Cliente</p>
                <p className="text-xs font-bold text-zinc-900 truncate">{clienteSeleccionado?.name || 'No seleccionado'}</p>
              </div>
              
              <div className="space-y-2 px-1">
                <div className="flex justify-between text-[11px] font-bold text-zinc-500">
                  <span>Items</span>
                  <span className="text-zinc-900">{carrito.length}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-zinc-500">
                  <span>Unidades</span>
                  <span className="text-zinc-900">{totalUnidades}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-9 text-[10px] font-bold uppercase tracking-tighter gap-1.5" disabled={carrito.length === 0}>
                <FileText className="w-3 h-3" /> PDF
              </Button>
              <Button variant="outline" className="flex-1 h-9 text-[10px] font-bold uppercase tracking-tighter gap-1.5" disabled={carrito.length === 0}>
                <Download className="w-3 h-3" /> Excel
              </Button>
            </div>

            <div className="text-right">
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Pedido</p>
              <p className="text-3xl font-black text-zinc-900 tabular-nums">{formatCurrency(subtotal)}</p>
            </div>
            
            <Button
              onClick={handleGuardar}
              disabled={!canSave}
              className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all group"
            >
              <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
              Crear Cotización
            </Button>
          </div>
        </aside>
      </div>
    </Modal>
  );
}
