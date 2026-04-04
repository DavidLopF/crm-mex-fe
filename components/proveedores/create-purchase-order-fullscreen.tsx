'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Modal, Input } from '@/components/ui';
import {
  Search,
  Plus,
  Trash2,
  ShoppingCart,
  DollarSign,
  Package,
  FileText,
  ChevronLeft,
  ChevronRight,
  Truck,
  Calendar,
  StickyNote,
  Loader2,
  ChevronDown,
  ChevronUp,
  Percent,
  Layers,
  Info,
  History,
  ArrowRight,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useDebounce } from '@/lib/hooks';
import { useCompany } from '@/lib/company-context';
import {
  CreatePurchaseOrderDto,
  SupplierListItem,
  SupplierProductItem,
} from '@/services/suppliers';
import { getAllSuppliers, getSupplierProducts } from '@/services/suppliers/suppliers.service';
import {
  getOrderProducts,
  OrderProductItem,
  OrderProductsPaginatedResponse,
} from '@/services/orders';

interface CreatePurchaseOrderFullscreenProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dto: CreatePurchaseOrderDto) => void;
  submitting?: boolean;
}

interface LineaOC {
  key: number;
  producto: OrderProductItem;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
}

let itemCounter = 0;
const PRODUCTS_PER_PAGE = 6;

export function CreatePurchaseOrderFullscreen({
  isOpen,
  onClose,
  onSave,
  submitting,
}: CreatePurchaseOrderFullscreenProps) {
  const { settings } = useCompany();
  const primary = settings.primaryColor;
  const primaryBg = primary + '10';
  const primaryBgMid = primary + '20';

  // ── Estado principal ──
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [carrito, setCarrito] = useState<LineaOC[]>([]);
  const [notas, setNotas] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');

  // ── Costos de internación ──
  const [costosOpen, setCostosOpen] = useState(false);
  const [freightPct, setFreightPct] = useState(0);
  const [customsPct, setCustomsPct] = useState(0);
  const [taxPct, setTaxPct] = useState(0);
  const [handlingPct, setHandlingPct] = useState(0);
  const [otherPct, setOtherPct] = useState(0);

  // ── Proveedores ──
  const [suppliers, setSuppliers] = useState<SupplierListItem[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  // ── Productos ──
  const [productos, setProductos] = useState<OrderProductItem[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // ── Catálogo ──
  const [catalogoProveedor, setCatalogoProveedor] = useState<SupplierProductItem[]>([]);
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);
  const [showCatalogo, setShowCatalogo] = useState(true);

  const debouncedSearch = useDebounce(searchTerm, 400);

  const supplierSeleccionado = suppliers.find(s => s.id === supplierId);

  // ── Cargar proveedores ──
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoadingSuppliers(true);
    getAllSuppliers()
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data)
          ? data
          : Array.isArray((data as unknown as { suppliers: SupplierListItem[] }).suppliers)
            ? (data as unknown as { suppliers: SupplierListItem[] }).suppliers
            : [];
        setSuppliers(list);
      })
      .catch(() => { if (!cancelled) setSuppliers([]); })
      .finally(() => { if (!cancelled) setLoadingSuppliers(false); });
    return () => { cancelled = true; };
  }, [isOpen]);

  // ── Cargar catálogo ──
  useEffect(() => {
    if (!isOpen || !supplierId) {
      setCatalogoProveedor([]);
      return;
    }
    let cancelled = false;
    setLoadingCatalogo(true);
    getSupplierProducts(supplierId as number)
      .then((data) => {
        if (!cancelled) setCatalogoProveedor(data);
      })
      .catch(() => {
        if (!cancelled) setCatalogoProveedor([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCatalogo(false);
      });
    return () => { cancelled = true; };
  }, [isOpen, supplierId]);

  // ── Cargar productos ──
  const loadProductos = useCallback(async (page: number, search: string) => {
    setLoadingProductos(true);
    try {
      const response: OrderProductsPaginatedResponse = await getOrderProducts({
        page,
        limit: PRODUCTS_PER_PAGE,
        search: search || undefined,
        stockStatus: 'all',
      });
      setProductos(response.items);
      setTotalPages(response.totalPages);
      setTotalProducts(response.total);
      setCurrentPage(response.page);
    } catch {
      console.error('Error al cargar productos');
      setProductos([]);
    } finally {
      setLoadingProductos(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && supplierId) {
      setCurrentPage(1);
      loadProductos(1, debouncedSearch);
    }
  }, [debouncedSearch, isOpen, supplierId, loadProductos]);

  const handlePrevPage = () => { if (currentPage > 1) loadProductos(currentPage - 1, debouncedSearch); };
  const handleNextPage = () => { if (currentPage < totalPages) loadProductos(currentPage + 1, debouncedSearch); };

  const agregarAlCarrito = (producto: OrderProductItem) => {
    const existing = carrito.find(l => l.producto.id === producto.id);
    if (existing) {
      setCarrito(prev => prev.map(l => l.key === existing.key ? { ...l, cantidad: l.cantidad + 1, subtotal: l.costoUnitario * (l.cantidad + 1) } : l));
      return;
    }
    itemCounter++;
    setCarrito(prev => [...prev, { key: itemCounter, producto, cantidad: 1, costoUnitario: producto.price, subtotal: producto.price }]);
  };

  const agregarDesdeCatalogo = (sp: SupplierProductItem) => {
    const variant = sp.product.variants?.[0];
    const virtualProducto: OrderProductItem = {
      id: variant?.id ?? sp.productId,
      productId: sp.productId,
      name: sp.product.name,
      description: '',
      variantName: variant?.variantName ?? '',
      sku: variant?.sku ?? sp.supplierSku ?? '',
      barcode: '',
      category: sp.product.category?.name ?? '',
      stock: 0,
      stockStatus: 'in_stock',
      price: sp.supplierCost,
      currency: sp.currency || 'MXN',
      isActive: true,
      warehouses: [],
    };
    const existing = carrito.find(l => l.producto.id === virtualProducto.id);
    if (existing) {
      setCarrito(prev => prev.map(l => l.key === existing.key ? { ...l, cantidad: l.cantidad + 1, subtotal: l.costoUnitario * (l.cantidad + 1) } : l));
      return;
    }
    itemCounter++;
    setCarrito(prev => [...prev, { key: itemCounter, producto: virtualProducto, cantidad: sp.minOrderQty || 1, costoUnitario: sp.supplierCost, subtotal: sp.supplierCost * (sp.minOrderQty || 1) }]);
  };

  const actualizarCantidad = (key: number, cantidad: number) => {
    setCarrito(prev => prev.map(l => l.key === key ? { ...l, cantidad, subtotal: (l.costoUnitario || 0) * cantidad } : l));
  };

  const actualizarCosto = (key: number, costo: number) => {
    setCarrito(prev => prev.map(l => l.key === key ? { ...l, costoUnitario: costo, subtotal: costo * (l.cantidad || 0) } : l));
  };

  const eliminarDelCarrito = (key: number) => setCarrito(prev => prev.filter(l => l.key !== key));

  const subtotal = carrito.reduce((sum, l) => sum + l.subtotal, 0);
  const totalUnidades = carrito.reduce((sum, l) => sum + l.cantidad, 0);

  const totalPctSum = freightPct + customsPct + taxPct + handlingPct + otherPct;
  const landedMultiplier = 1 + totalPctSum / 100;
  const totalLandedCosts = subtotal * totalPctSum / 100;
  const grandTotal = subtotal + totalLandedCosts;

  const costFields = [
    { key: 'freightPct', label: 'Flete', icon: '🚛', value: freightPct, setter: setFreightPct },
    { key: 'customsPct', label: 'Aduana', icon: '🏛️', value: customsPct, setter: setCustomsPct },
    { key: 'taxPct', label: 'Impuestos', icon: '📋', value: taxPct, setter: setTaxPct },
    { key: 'handlingPct', label: 'Manejo', icon: '📦', value: handlingPct, setter: setHandlingPct },
    { key: 'otherPct', label: 'Otros', icon: '➕', value: otherPct, setter: setOtherPct },
  ];

  const handleGuardar = () => {
    if (!supplierId || carrito.length === 0) return;
    onSave({
      supplierId: supplierId as number,
      items: carrito.map(l => ({
        variantId: l.producto.id,
        qty: l.cantidad,
        unitCost: l.costoUnitario,
        description: l.producto.variantName ? `${l.producto.name} - ${l.producto.variantName}` : l.producto.name,
      })),
      notes: notas.trim() || undefined,
      expectedDeliveryDate: expectedDeliveryDate || undefined,
      ...(freightPct > 0 && { freightPct }),
      ...(customsPct > 0 && { customsPct }),
      ...(taxPct > 0 && { taxPct }),
      ...(handlingPct > 0 && { handlingPct }),
      ...(otherPct > 0 && { otherPct }),
    });
  };

  const handleClose = () => {
    setSupplierId('');
    setSearchTerm('');
    setCarrito([]);
    setNotas('');
    setExpectedDeliveryDate('');
    setProductos([]);
    setCurrentPage(1);
    setCatalogoProveedor([]);
    setFreightPct(0); setCustomsPct(0); setTaxPct(0); setHandlingPct(0); setOtherPct(0);
    itemCounter = 0;
    onClose();
  };

  const getStockBadge = (status: string) => {
    switch (status) {
      case 'in_stock': return <span className="text-[10px] font-bold text-green-600 uppercase">Stock</span>;
      case 'low_stock': return <span className="text-[10px] font-bold text-amber-600 uppercase">Bajo</span>;
      case 'out_of_stock': return <span className="text-[10px] font-bold text-red-600 uppercase">Agotado</span>;
      default: return null;
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Emitir Orden de Compra" 
      size="full"
      className="max-w-[95vw] h-[90vh]"
    >
      <div className="flex h-[calc(90vh-120px)] -mx-6 -mb-6 border-t border-zinc-100">
        {/* Columna 1: Catálogo */}
        <aside className="w-[320px] flex-shrink-0 border-r border-zinc-200 flex flex-col bg-zinc-50/30">
          <div className="p-4 space-y-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Proveedor</label>
              <select
                value={supplierId}
                onChange={(e) => { setSupplierId(e.target.value ? Number(e.target.value) : ''); setCarrito([]); setCatalogoProveedor([]); }}
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': primaryBgMid } as React.CSSProperties}
              >
                <option value="">Seleccionar...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
                disabled={!supplierId}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 scrollbar-thin">
            {!supplierId ? (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                <Truck className="w-8 h-8 mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Seleccione proveedor</p>
              </div>
            ) : (
              <>
                {catalogoProveedor.length > 0 && (
                  <section className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                      <Layers className="w-3 h-3 text-zinc-400" />
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Catálogo</span>
                    </div>
                    {catalogoProveedor.map(sp => {
                      const inCart = carrito.some(l => l.producto.id === (sp.product.variants?.[0]?.id ?? sp.productId));
                      return (
                        <div 
                          key={sp.id} 
                          onClick={() => agregarDesdeCatalogo(sp)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${inCart ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-100 hover:border-zinc-300'}`}
                        >
                          <p className="text-xs font-bold truncate">{sp.product.name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[11px] font-black" style={!inCart ? {color: primary} : {}}>{formatCurrency(sp.supplierCost)}</span>
                            <Plus className={`w-3 h-3 ${inCart ? 'rotate-45 text-zinc-500' : 'text-zinc-400'}`} />
                          </div>
                        </div>
                      );
                    })}
                  </section>
                )}
                
                <section className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <History className="w-3 h-3 text-zinc-400" />
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Inventario</span>
                  </div>
                  {loadingProductos ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto text-zinc-300" />
                  ) : productos.map(p => {
                    const inCart = carrito.some(l => l.producto.id === p.id);
                    return (
                      <div 
                        key={p.id} 
                        onClick={() => agregarAlCarrito(p)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${inCart ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-100 hover:border-zinc-300'}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold truncate">{p.name}</p>
                          {!inCart && getStockBadge(p.stockStatus)}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[11px] font-black">{formatCurrency(p.price)}</span>
                          <span className="text-[9px] font-bold text-zinc-400">S: {p.stock}</span>
                        </div>
                      </div>
                    );
                  })}
                </section>
              </>
            )}
          </div>
          
          {supplierId && totalProducts > 0 && (
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
                <p className="text-xs font-bold uppercase tracking-widest">Orden vacía</p>
              </div>
            ) : (
              carrito.map(linea => (
                <div key={linea.key} className="flex items-center gap-4 p-3 bg-zinc-50/50 rounded-2xl border border-zinc-100 hover:bg-white transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-zinc-900 truncate">{linea.producto.name}</p>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">{linea.producto.sku}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-20">
                      <input 
                        type="number" 
                        value={linea.cantidad} 
                        onChange={e => actualizarCantidad(linea.key, parseInt(e.target.value) || 1)}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs font-bold text-center focus:ring-1"
                        style={{'--tw-ring-color': primary} as any}
                      />
                    </div>
                    <div className="w-24">
                      <input 
                        type="number" 
                        value={linea.costoUnitario} 
                        onChange={e => actualizarCosto(linea.key, parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs font-bold text-right focus:ring-1"
                        style={{'--tw-ring-color': primary} as any}
                      />
                    </div>
                    <div className="w-24 text-right">
                      <p className="text-xs font-black">{formatCurrency(linea.subtotal)}</p>
                    </div>
                    <button onClick={() => eliminarDelCarrito(linea.key)} className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-6 border-t border-zinc-100 grid grid-cols-2 gap-6 bg-zinc-50/20">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <StickyNote className="w-3 h-3" /> Notas
              </label>
              <textarea 
                value={notas} onChange={e => setNotas(e.target.value)} 
                className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-xs min-h-[80px] focus:ring-1"
                style={{'--tw-ring-color': primary} as any}
                placeholder="Instrucciones..."
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Percent className="w-3 h-3" /> Costos Adicionales
                </label>
                <button onClick={() => setCostosOpen(!costosOpen)} className="text-[9px] font-black text-blue-600 uppercase hover:underline">
                  {costosOpen ? 'Cerrar' : 'Configurar'}
                </button>
              </div>
              {costosOpen ? (
                <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-zinc-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                  {costFields.map(f => (
                    <div key={f.key} className="flex items-center justify-between border-b border-zinc-50 pb-1">
                      <span className="text-[10px] font-bold text-zinc-500">{f.label}</span>
                      <div className="relative w-14">
                        <input type="number" value={f.value || ''} onChange={e => f.setter(parseFloat(e.target.value) || 0)} className="w-full p-1 bg-zinc-50 border-none rounded text-[10px] text-right font-bold" />
                        <span className="absolute right-1 top-1 text-[8px] text-zinc-400">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[80px] bg-white rounded-xl border-2 border-dashed border-zinc-100 flex items-center justify-center">
                  <p className="text-[10px] font-bold text-zinc-300 uppercase">Cargos: {totalPctSum.toFixed(1)}%</p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Columna 3: Confirmación */}
        <aside className="w-[280px] flex-shrink-0 border-l border-zinc-200 bg-zinc-50/50 flex flex-col p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest border-b border-zinc-200 pb-2">Resumen</h3>
            
            <div className="space-y-3">
              <div className="bg-white p-3 rounded-xl border border-zinc-100 shadow-sm">
                <p className="text-[9px] font-black text-zinc-400 uppercase mb-1">Entrega Estimada</p>
                <input type="date" value={expectedDeliveryDate} onChange={e => setExpectedDeliveryDate(e.target.value)} className="w-full text-xs font-bold bg-transparent border-none p-0 focus:ring-0" />
              </div>
              
              <div className="space-y-2 px-1">
                <div className="flex justify-between text-[11px] font-bold text-zinc-500">
                  <span>Subtotal</span>
                  <span className="text-zinc-900">{formatCurrency(subtotal)}</span>
                </div>
                {totalPctSum > 0 && (
                  <div className="flex justify-between text-[11px] font-bold text-blue-600">
                    <span>Adicionales ({totalPctSum.toFixed(1)}%)</span>
                    <span>{formatCurrency(totalLandedCosts)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-4">
            <div className="text-right">
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total OC</p>
              <p className="text-3xl font-black text-zinc-900 tabular-nums">{formatCurrency(grandTotal)}</p>
            </div>
            
            <Button
              onClick={handleGuardar}
              disabled={!supplierId || carrito.length === 0 || submitting}
              className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all group"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />}
              {submitting ? 'Emitiendo...' : 'Emitir Orden'}
            </Button>
          </div>
        </aside>
      </div>
    </Modal>
  );
}
