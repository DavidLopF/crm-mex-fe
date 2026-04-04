'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText, CheckCircle, XCircle, Clock, Download,
  ChevronRight, ChevronLeft, Loader2, AlertCircle, Receipt,
  Search, ChevronDown, User, UserCheck, X, MapPin,
  Building2, Mail, Phone, Home, ShieldCheck, Sparkles,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { getClients, getClientById } from '@/services/clients';
import type { ClientDetail } from '@/services/clients/clients.types';
import {
  emitInvoice, downloadInvoiceXml, downloadInvoiceZip, linkSaleToInvoice,
  type BuyerDto, type InvoiceLineDto, type CreateInvoiceFromSaleDto,
  type EmitInvoiceResult, type DianStatus,
} from '@/services/facturacion';
import type { SaleResponseDto } from '@/services/pos';
import { searchDaneCities, type DaneCity } from '@/lib/dane-cities';
import { cn } from '@/lib/utils';

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

function DianStatusBadge({ status }: { status: DianStatus }) {
  const map: Record<DianStatus, { label: string; cls: string; icon: typeof CheckCircle }> = {
    APPROVED: { label: 'Aprobada por DIAN',  cls: 'bg-emerald-50 text-emerald-600 border-emerald-100',   icon: CheckCircle },
    PENDING:  { label: 'Pendiente en DIAN',  cls: 'bg-amber-50 text-amber-600 border-amber-100', icon: Clock       },
    REJECTED: { label: 'Rechazada por DIAN', cls: 'bg-rose-50 text-rose-600 border-rose-100',       icon: XCircle     },
    ERROR:    { label: 'Error de envío',      cls: 'bg-rose-50 text-rose-600 border-rose-100',       icon: XCircle     },
  };
  const { label, cls, icon: Icon } = map[status] ?? map.ERROR;
  return (
    <span className={cn("inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm", cls)}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

function mapSaleToInvoiceLines(sale: SaleResponseDto): InvoiceLineDto[] {
  const taxRatePct = Math.round(sale.taxRate * 100);
  return sale.items.map((item) => {
    const lineBase  = item.lineTotal;
    const taxAmount = sale.taxAmount > 0 ? Math.round(lineBase * sale.taxRate) : 0;
    return {
      description:    item.productName + (item.variantName ? ` — ${item.variantName}` : ''),
      quantity:       item.qty,
      unitCode:       '94',
      unitPrice:      item.unitPrice,
      discountAmount: 0,
      taxes: taxAmount > 0
        ? [{ taxCode: '01' as const, taxRate: taxRatePct, taxAmount }]
        : [],
    };
  });
}

// ── ClientPickerCombobox ──────────────────────────────────────────────────────

interface ClientPickerProps {
  selectedName: string | null;
  onSelect: (client: ClientDetail) => void;
  onClear: () => void;
}

function ClientPickerCombobox({ selectedName, onSelect, onClear }: ClientPickerProps) {
  const [query, setQuery]         = useState('');
  const [options, setOptions]     = useState<ClientDetail[]>([]);
  const [isOpen, setIsOpen]       = useState(false);
  const [searching, setSearching] = useState(false);
  const containerRef              = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await getClients({ search: query || undefined, limit: 20, active: true });
        setOptions(res.items);
      } catch {
        setOptions([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, isOpen]);

  const handleOutsideClick = useCallback((e: MouseEvent) => {
    if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false);
  }, []);
  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [handleOutsideClick]);

  if (selectedName) {
    return (
      <div className="flex items-center gap-4 p-5 bg-primary text-primary-foreground rounded-2xl shadow-lg border border-primary animate-fadeIn">
        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0 shadow-inner">
          <UserCheck className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black truncate uppercase tracking-tight leading-none">{selectedName}</p>
          <p className="text-[10px] font-semibold text-white/80 uppercase tracking-[0.2em] mt-1.5">Cliente Vinculado</p>
        </div>
        <button type="button" onClick={onClear}
          className="p-2 rounded-xl hover:bg-white/15 text-white/80 hover:text-white transition-all active:scale-90">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
        <input
          type="text"
          placeholder="Buscar cliente por nombre o NIT..."
          className="w-full h-14 pl-11 pr-10 text-sm font-medium text-zinc-900 bg-white border-2 border-zinc-200 rounded-2xl placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          autoComplete="off"
        />
        <ChevronDown className={cn("absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 transition-transform duration-300", isOpen && "rotate-180")} />
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {searching ? (
              <div className="flex items-center justify-center gap-3 py-10 text-zinc-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-xs font-semibold uppercase tracking-widest">Buscando...</span>
              </div>
            ) : options.length === 0 ? (
              <div className="py-10 text-center px-4">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest leading-relaxed">
                  {query ? `No hay resultados para "${query}"` : 'Escribe para buscar clientes...'}
                </p>
              </div>
            ) : (
              options.map((c) => (
                <button key={c.id} type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { onSelect(c); setIsOpen(false); setQuery(''); }}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 text-left transition-all border-b border-zinc-50 last:border-0 group">
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors">
                    <User className="w-4 h-4 text-zinc-500 group-hover:text-primary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-zinc-900 group-hover:text-primary truncate uppercase tracking-tight transition-colors">{c.name}</p>
                    {c.document && <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">NIT: {c.document}</p>}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── CityPickerCombobox ────────────────────────────────────────────────────────

interface CityPickerProps {
  selectedCity: DaneCity | null;
  onSelect: (city: DaneCity) => void;
  onClear: () => void;
}

function CityPickerCombobox({ selectedCity, onSelect, onClear }: CityPickerProps) {
  const [query, setQuery]     = useState('');
  const [isOpen, setIsOpen]   = useState(false);
  const containerRef          = useRef<HTMLDivElement>(null);

  const results = searchDaneCities(query, 12);

  const handleOutsideClick = useCallback((e: MouseEvent) => {
    if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false);
  }, []);
  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [handleOutsideClick]);

  if (selectedCity) {
    return (
      <div className="flex items-center gap-4 p-5 bg-white border-2 border-emerald-100 rounded-2xl animate-fadeIn shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 shadow-sm">
          <MapPin className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-zinc-900 uppercase tracking-tight leading-none">{selectedCity.cityName}</p>
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1.5">
            {selectedCity.departmentName} · Cód. {selectedCity.cityCode}
          </p>
        </div>
        <button type="button" onClick={onClear}
          className="p-2 rounded-xl hover:bg-emerald-50 text-emerald-400 hover:text-emerald-600 transition-all active:scale-90">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative group">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
        <input
          type="text"
          placeholder="Buscar ciudad o municipio..."
          className="w-full h-14 pl-11 pr-10 text-sm font-medium text-zinc-900 bg-white border-2 border-zinc-200 rounded-2xl placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          autoComplete="off"
        />
        <ChevronDown className={cn("absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 transition-transform duration-300", isOpen && "rotate-180")} />
      </div>
      {isOpen && (
        <div className="absolute z-[90] w-full bottom-full mb-2 bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {results.length === 0 ? (
              <div className="py-10 text-center px-4">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Sin resultados para &quot;{query}&quot;</p>
              </div>
            ) : (
              results.map((city) => (
                <button key={city.cityCode} type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { onSelect(city); setIsOpen(false); setQuery(''); }}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 text-left transition-all border-b border-zinc-50 last:border-0 group">
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors">
                    <MapPin className="w-4 h-4 text-zinc-500 group-hover:text-primary-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-zinc-900 group-hover:text-primary uppercase tracking-tight transition-colors">{city.cityName}</p>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{city.departmentName} · {city.cityCode}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Form Types ────────────────────────────────────────────────────────────────

interface BuyerForm {
  name: string; nit: string; nitDv: string; email: string; phone: string;
  address: string; cityCode: string; cityName: string;
  departmentCode: string; departmentName: string;
}

const EMPTY_BUYER: BuyerForm = {
  name: '', nit: '', nitDv: '', email: '', phone: '',
  address: '', cityCode: '', cityName: '', departmentCode: '', departmentName: '',
};

interface Props {
  sale: SaleResponseDto;
  onClose: () => void;
  onSuccess?: (result: EmitInvoiceResult) => void;
}

type Step = 'buyer' | 'lines' | 'result';

const STEP_LABELS: Step[]               = ['buyer', 'lines', 'result'];
const STEP_TITLES: Record<Step, string> = {
  buyer:  'Receptor',
  lines:  'Impuestos',
  result: 'DIAN',
};

export function FacturacionElectronicaModal({ sale, onClose, onSuccess }: Props) {
  const [step, setStep]                   = useState<Step>('buyer');
  const [buyer, setBuyer]                 = useState<BuyerForm>(EMPTY_BUYER);
  const [selectedClientName, setSelectedClientName] = useState<string | null>(
    sale.clientName ?? null
  );
  const [selectedCity, setSelectedCity]   = useState<DaneCity | null>(null);
  const [lines, setLines]                 = useState<InvoiceLineDto[]>([]);
  const [loading, setLoading]             = useState(false);
  const [downloading, setDownloading]     = useState<'xml' | 'zip' | null>(null);
  const [error, setError]                 = useState<string | null>(null);
  const [result, setResult]               = useState<EmitInvoiceResult | null>(null);

  useEffect(() => {
    setLines(mapSaleToInvoiceLines(sale));
  }, [sale]);

  // Auto-cargar datos fiscales del cliente vinculado a la venta
  useEffect(() => {
    if (!sale.clientId) return;
    getClientById(sale.clientId)
      .then((client) => {
        setSelectedClientName(client.name);
        const clientEmail = client.email ?? '';
        setBuyer({
          name:           client.name,
          nit:            client.document ?? '',
          nitDv:          client.nitDv   ?? '',
          email:          clientEmail,
          phone:          client.phone   ?? '',
          address:        client.address ?? '',
          cityCode:       client.cityCode       ?? '',
          cityName:       client.cityName       ?? '',
          departmentCode: client.departmentCode ?? '',
          departmentName: client.departmentName ?? '',
        });
        if (client.cityCode) {
          const city = searchDaneCities(client.cityCode, 1).find(
            (c) => c.cityCode === client.cityCode,
          ) ?? null;
          setSelectedCity(city);
        }
      })
      .catch(() => {
        // Si falla la carga, deja el formulario vacío para llenado manual
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sale.clientId]);

  function patchBuyer(patch: Partial<BuyerForm>) {
    setBuyer((prev) => ({ ...prev, ...patch }));
  }

  function handleClientSelect(client: ClientDetail) {
    const clientEmail = client.email ?? '';

    setSelectedClientName(client.name);
    patchBuyer({
      name:           client.name,
      nit:            client.document ?? '',
      nitDv:          client.nitDv ?? '',
      email:          clientEmail,
      phone:          client.phone ?? '',
      address:        client.address ?? '',
      cityCode:       client.cityCode ?? '',
      cityName:       client.cityName ?? '',
      departmentCode: client.departmentCode ?? '',
      departmentName: client.departmentName ?? '',
    });

    if (client.cityCode) {
      const city = searchDaneCities(client.cityCode, 1).find(
        (c) => c.cityCode === client.cityCode,
      );
      if (city) setSelectedCity(city);
    }
  }

  function handleClientClear() {
    setSelectedClientName(null);
    setBuyer(EMPTY_BUYER);
    setSelectedCity(null);
  }

  function handleCitySelect(city: DaneCity) {
    setSelectedCity(city);
    patchBuyer({
      cityCode:       city.cityCode,
      cityName:       city.cityName,
      departmentCode: city.departmentCode,
      departmentName: city.departmentName,
    });
  }

  function handleCityClear() {
    setSelectedCity(null);
    patchBuyer({ cityCode: '', cityName: '', departmentCode: '', departmentName: '' });
  }

  function validateBuyer(): string | null {
    if (!buyer.name.trim())           return 'El nombre o razón social es requerido.';
    if (!buyer.nit.trim())            return 'El NIT del comprador es requerido.';
    if (!buyer.email.trim())          return 'El correo electrónico es requerido.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email))
                                      return 'El correo electrónico no es válido.';
    if (!buyer.address.trim())        return 'La dirección es requerida.';
    if (!buyer.cityCode.trim())       return 'Debes seleccionar la ciudad.';
    return null;
  }

  function handleBuyerNext() {
    setError(null);
    const err = validateBuyer();
    if (err) { setError(err); return; }
    setStep('lines');
  }

  async function triggerDownload(type: 'xml' | 'zip') {
    if (!result) return;
    setDownloading(type);
    setError(null);
    try {
      const blob     = type === 'xml'
        ? await downloadInvoiceXml(result.documentId)
        : await downloadInvoiceZip(result.documentId);
      const filename = `factura-${result.documentId}.${type}`;
      const url      = URL.createObjectURL(blob);
      const a        = document.createElement('a');
      a.href         = url;
      a.download     = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Error al descargar el ${type.toUpperCase()}`);
    } finally {
      setDownloading(null);
    }
  }

  async function handleEmit() {
    setError(null);
    setLoading(true);
    try {
      const buyerDto: BuyerDto = {
        name:           buyer.name,
        nit:            buyer.nit,
        nitDv:          buyer.nitDv || undefined,
        email:          buyer.email,
        phone:          buyer.phone || undefined,
        address:        buyer.address,
        cityCode:       buyer.cityCode,
        cityName:       buyer.cityName,
        departmentCode: buyer.departmentCode,
        departmentName: buyer.departmentName,
        countryCode:    'CO',
      };
      const dto: CreateInvoiceFromSaleDto = {
        currency:       'COP',
        paymentMeans:   '1',
        orderReference: sale.code,
        notes:          sale.notes || undefined,
        buyer:          buyerDto,
        lines,
      };

      const res = await emitInvoice(dto);
      setResult(res);
      setStep('result');

      try {
        await linkSaleToInvoice(sale.id, res.documentId, res.cufe);
        onSuccess?.(res);
      } catch { /* non critical */ }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al emitir la factura');
    } finally {
      setLoading(false);
    }
  }

  const labelCls = "text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.16em] ml-1 mb-2 block";
  const inputCls = "w-full h-14 px-4 bg-white border-2 border-zinc-200 rounded-2xl text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm";

  return (
    <Modal isOpen onClose={onClose} size="xl" className="bg-zinc-50 border-zinc-200">

      {/* ── Steps Navigation ── */}
      <div className="flex items-center justify-between mb-12 pl-2 pr-14">
        {STEP_LABELS.map((s, i) => {
          const isActive = step === s;
          const isDone   = STEP_LABELS.indexOf(step) > i;
          return (
            <div key={s} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-2 relative">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm border-2",
                  isActive ? "bg-primary border-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20" 
                  : isDone ? "bg-emerald-500 border-emerald-500 text-white" 
                  : "bg-white border-zinc-200 text-zinc-500"
                )}>
                  {isDone ? <CheckCircle className="w-6 h-6" /> : <span className="text-sm font-black">{i + 1}</span>}
                </div>
                <span className={cn(
                  "absolute -bottom-7 text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap transition-colors",
                  isActive ? "text-primary" : "text-zinc-500"
                )}>
                  {STEP_TITLES[s]}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className="flex-1 h-0.5 mx-6 bg-zinc-200 relative overflow-hidden rounded-full">
                  <div className={cn(
                    "absolute inset-0 bg-emerald-500 transition-transform duration-700 origin-left",
                    isDone ? "translate-x-0" : "-translate-x-full"
                  )} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center gap-4 mb-8 p-5 bg-white border-2 border-rose-100 rounded-3xl text-rose-600 text-sm font-bold animate-fadeIn shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          {error}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          STEP 1: Receptor
      ════════════════════════════════════════════════════════════ */}
      {step === 'buyer' && (
        <div className="space-y-10 animate-fadeIn">
          <div className="space-y-3">
            <label className={labelCls}>Cliente en CRM</label>
            <ClientPickerCombobox
              selectedName={selectedClientName}
              onSelect={handleClientSelect}
              onClear={handleClientClear}
            />
          </div>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200" /></div>
            <div className="relative flex justify-center text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500 bg-zinc-50 px-6">Información Fiscal</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
              <label className={labelCls}>Nombre o Razón Social</label>
              <div className="relative group">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-primary transition-colors" />
                <input type="text" value={buyer.name} onChange={(e) => patchBuyer({ name: e.target.value })}
                  placeholder="Ej. Comercializadora S.A.S" className={cn(inputCls, "pl-11")} />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelCls}>NIT / Documento</label>
              <div className="flex gap-2">
                <input type="text" value={buyer.nit} onChange={(e) => patchBuyer({ nit: e.target.value })}
                  placeholder="900123456" className={cn(inputCls, "flex-1")} />
                <input type="text" value={buyer.nitDv} onChange={(e) => patchBuyer({ nitDv: e.target.value })}
                  placeholder="7" maxLength={1} className={cn(inputCls, "w-20 px-0 text-center")} />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelCls}>Correo Electrónico</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-primary transition-colors" />
                <input type="email" value={buyer.email} onChange={(e) => patchBuyer({ email: e.target.value })}
                  placeholder="factura@empresa.com" className={cn(inputCls, "pl-11")} />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelCls}>Teléfono de Contacto</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-primary transition-colors" />
                <input type="tel" value={buyer.phone} onChange={(e) => patchBuyer({ phone: e.target.value })}
                  placeholder="300 123 4567" className={cn(inputCls, "pl-11")} />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelCls}>Dirección Fiscal</label>
              <div className="relative group">
                <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-primary transition-colors" />
                <input type="text" value={buyer.address} onChange={(e) => patchBuyer({ address: e.target.value })}
                  placeholder="Calle 100 # 7-33" className={cn(inputCls, "pl-11")} />
              </div>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className={labelCls}>Ciudad / Municipio (DANE)</label>
              <CityPickerCombobox selectedCity={selectedCity} onSelect={handleCitySelect} onClear={handleCityClear} />
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-zinc-100">
            <button onClick={handleBuyerNext} className="h-14 px-10 rounded-2xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-[0.2em] flex items-center gap-3 transition-all hover:opacity-90 shadow-lg shadow-primary/20 active:scale-95">
              Siguiente Paso <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          STEP 2: Impuestos
      ════════════════════════════════════════════════════════════ */}
      {step === 'lines' && (
        <div className="space-y-10 animate-fadeIn">
          <div className="p-6 bg-white rounded-3xl border-2 border-primary/10 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                 <ShieldCheck className="w-6 h-6 text-primary" />
               </div>
               <h4 className="text-sm font-black uppercase tracking-widest text-zinc-900">Resumen del Receptor</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-zinc-50">
               <div>
                 <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Nombre / Razón Social</p>
                 <p className="text-sm font-bold text-zinc-900 mt-1 uppercase">{buyer.name}</p>
               </div>
               <div>
                 <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-500">NIT / Identificación</p>
                 <p className="text-sm font-bold text-zinc-900 mt-1">{buyer.nit}{buyer.nitDv ? `-${buyer.nitDv}` : ''}</p>
               </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50 border-b border-zinc-100">
                    <th className="px-6 py-5 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Detalle Producto</th>
                    <th className="px-6 py-5 text-center text-[10px] font-semibold text-zinc-600 uppercase tracking-widest w-24">Cant.</th>
                    <th className="px-6 py-5 text-right text-[10px] font-semibold text-zinc-600 uppercase tracking-widest w-36">Unitario</th>
                    <th className="px-6 py-5 text-right text-[10px] font-semibold text-zinc-600 uppercase tracking-widest w-36">IVA</th>
                    <th className="px-6 py-5 text-right text-[10px] font-semibold text-zinc-600 uppercase tracking-widest w-36">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {lines.map((line, i) => {
                    const base    = line.quantity * line.unitPrice;
                    const taxAmt  = line.taxes?.reduce((a, t) => a + t.taxAmount, 0) ?? 0;
                    return (
                      <tr key={i} className="hover:bg-zinc-50/30 transition-colors">
                        <td className="px-6 py-5">
                          <p className="text-xs font-black text-zinc-900 uppercase tracking-tight leading-relaxed">{line.description}</p>
                        </td>
                        <td className="px-6 py-5 text-center text-xs font-bold text-zinc-500 tabular-nums">{line.quantity}</td>
                        <td className="px-6 py-5 text-right text-xs font-bold text-zinc-500 tabular-nums">{fmt(line.unitPrice)}</td>
                        <td className="px-6 py-5 text-right text-xs font-black text-emerald-600 tabular-nums">{fmt(taxAmt)}</td>
                        <td className="px-6 py-5 text-right text-xs font-black text-zinc-900 tabular-nums tracking-tight">{fmt(base + taxAmt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-zinc-900 text-white">
                    <td colSpan={2} className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Totales Facturación</td>
                    <td className="px-6 py-6 text-right font-black text-white/40 text-xs tabular-nums">{fmt(lines.reduce((a, l) => a + l.quantity * l.unitPrice, 0))}</td>
                    <td className="px-6 py-6 text-right font-black text-emerald-400 text-xs tabular-nums">{fmt(lines.reduce((a, l) => a + (l.taxes?.reduce((b, t) => b + t.taxAmount, 0) ?? 0), 0))}</td>
                    <td className="px-6 py-6 text-right text-lg font-black tracking-tighter tabular-nums">
                      {fmt(lines.reduce((a, l) => a + (l.quantity * l.unitPrice) + (l.taxes?.reduce((b, t) => b + t.taxAmount, 0) ?? 0), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-zinc-100">
            <button onClick={() => setStep('buyer')} className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-primary transition-colors active:scale-95">
              <ChevronLeft className="w-4 h-4" /> Volver a Receptor
            </button>
            <button onClick={handleEmit} disabled={loading} className="h-14 px-10 rounded-2xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-[0.2em] flex items-center gap-3 transition-all hover:opacity-90 shadow-lg shadow-primary/20 active:scale-95">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</> : <><Receipt className="w-5 h-5" /> Emitir Factura DIAN</>}
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          STEP 3: Resultado
      ════════════════════════════════════════════════════════════ */}
      {step === 'result' && result && (
        <div className="space-y-12 py-4 animate-fadeIn">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className={cn(
              "w-24 h-24 rounded-[2rem] flex items-center justify-center relative shadow-2xl",
              result.dianStatus === 'APPROVED' ? "bg-emerald-500 shadow-emerald-100" : "bg-rose-500 shadow-rose-100"
            )}>
              {result.dianStatus === 'APPROVED' ? (
                <Sparkles className="w-12 h-12 text-white animate-pulse" />
              ) : (
                <XCircle className="w-12 h-12 text-white" />
              )}
              <div className="absolute inset-0 rounded-[2rem] bg-white/20 animate-ping opacity-20" />
            </div>
            <div className="space-y-3">
              <DianStatusBadge status={result.dianStatus} />
              <h3 className="text-3xl font-black text-zinc-900 tracking-tight leading-tight">
                {result.dianStatus === 'APPROVED' ? '¡Facturación Exitosa!' : 'Atención Requerida'}
              </h3>
              {result.statusMessage && (
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
                  {result.statusMessage}
                </p>
              )}
            </div>
          </div>

          <div className="p-8 bg-white rounded-[2.5rem] border border-zinc-200 shadow-sm space-y-8">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-zinc-400" />
                </div>
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Identificador Documento</span>
              </div>
              <span className="text-sm font-black text-zinc-900 font-mono bg-zinc-50 px-4 py-2 rounded-xl border border-zinc-100">#{result.documentId}</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 ml-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Código Único (CUFE)</p>
              </div>
              <div className="p-5 bg-zinc-50 border-2 border-zinc-100 rounded-3xl break-all font-mono text-[10px] font-bold text-zinc-500 leading-relaxed shadow-inner select-all">
                {result.cufe}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <button onClick={() => triggerDownload('xml')} disabled={!!downloading}
              className="h-16 rounded-2xl border-2 border-primary flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all active:scale-95">
              {downloading === 'xml' ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
              XML Firmado
            </button>
            <button onClick={() => triggerDownload('zip')} disabled={!!downloading}
              className="h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95">
              {downloading === 'zip' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              Descargar ZIP
            </button>
          </div>

          <div className="flex justify-center pt-4">
            <button onClick={onClose} className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] hover:text-primary transition-all active:scale-95 underline underline-offset-8 decoration-zinc-200 hover:decoration-primary">
              Finalizar Proceso
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
