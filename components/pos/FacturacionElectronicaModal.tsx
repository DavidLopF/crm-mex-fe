'use client';

/**
 * FacturacionElectronicaModal
 *
 * Flujo en 3 pasos:
 *  1. Datos del receptor — buscador de clientes CRM + formulario de buyer DIAN
 *     - CityPickerCombobox auto-completa cityCode/cityName/departmentCode/departmentName
 *     - Seleccionar cliente pre-llena TODOS los campos del formulario
 *  2. Revisión de líneas e impuestos — mapea desde la venta POS
 *  3. Resultado — CUFE, estado DIAN y links de descarga autenticada
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText, CheckCircle, XCircle, Clock, Download,
  ChevronRight, ChevronLeft, Loader2, AlertCircle, Receipt,
  Search, ChevronDown, User, UserCheck, X, MapPin,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { getClients } from '@/services/clients';
import type { ClientDetail } from '@/services/clients/clients.types';
import {
  emitInvoice, downloadInvoiceXml, downloadInvoiceZip, linkSaleToInvoice,
  type BuyerDto, type InvoiceLineDto, type CreateInvoiceFromSaleDto,
  type EmitInvoiceResult, type DianStatus,
} from '@/services/facturacion';
import type { SaleResponseDto } from '@/services/pos';
import { searchDaneCities, type DaneCity } from '@/lib/dane-cities';

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(n);

function DianStatusBadge({ status }: { status: DianStatus }) {
  const map: Record<DianStatus, { label: string; cls: string; icon: typeof CheckCircle }> = {
    APPROVED: { label: 'Aprobada por DIAN',  cls: 'bg-green-100 text-green-800',   icon: CheckCircle },
    PENDING:  { label: 'Pendiente en DIAN',  cls: 'bg-yellow-100 text-yellow-800', icon: Clock       },
    REJECTED: { label: 'Rechazada por DIAN', cls: 'bg-red-100 text-red-800',       icon: XCircle     },
    ERROR:    { label: 'Error de envío',      cls: 'bg-red-100 text-red-800',       icon: XCircle     },
  };
  const { label, cls, icon: Icon } = map[status] ?? map.ERROR;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${cls}`}>
      <Icon className="w-4 h-4" />
      {label}
    </span>
  );
}

/** Mapea los items de la venta POS a líneas de factura UBL, distribuyendo el IVA */
function mapSaleToInvoiceLines(sale: SaleResponseDto): InvoiceLineDto[] {
  const taxRatePct = Math.round(sale.taxRate * 100); // 0.16 → 16
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
      <div className="flex items-center gap-3 px-3 py-2.5 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
          <UserCheck className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-900 truncate">{selectedName}</p>
          <p className="text-xs text-primary/70">Cliente seleccionado — datos prellenados</p>
        </div>
        <button type="button" onClick={onClear}
          className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors"
          title="Cambiar cliente">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-3.5 h-3.5 text-zinc-400 pointer-events-none z-10" />
        <input
          type="text"
          placeholder="Buscar cliente por nombre o NIT..."
          className="w-full pl-9 pr-8 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          autoComplete="off"
        />
        <ChevronDown className={`absolute right-2.5 w-3.5 h-3.5 text-zinc-400 pointer-events-none transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-xl overflow-hidden">
          <div className="max-h-48 overflow-y-auto">
            {searching ? (
              <div className="flex items-center justify-center gap-2 py-5 text-zinc-400 text-sm">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />Buscando...
              </div>
            ) : options.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-5">
                {query ? `Sin resultados para "${query}"` : 'Escribe para buscar clientes...'}
              </p>
            ) : (
              options.map((c) => (
                <button key={c.id} type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { onSelect(c); setIsOpen(false); setQuery(''); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 text-left transition-colors border-b border-zinc-50 last:border-0">
                  <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 text-zinc-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-800 truncate">{c.name}</p>
                    {c.document && <p className="text-xs text-zinc-400">NIT: {c.document}</p>}
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
      <div className="flex items-center gap-3 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
        <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-900">{selectedCity.cityName}</p>
          <p className="text-xs text-emerald-700">
            {selectedCity.departmentName} · Cód. {selectedCity.cityCode}
          </p>
        </div>
        <button type="button" onClick={onClear}
          className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors"
          title="Cambiar ciudad">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative z-[80]" ref={containerRef}>
      <div className="relative flex items-center">
        <MapPin className="absolute left-3 w-3.5 h-3.5 text-zinc-400 pointer-events-none z-10" />
        <input
          type="text"
          placeholder="Buscar ciudad o municipio..."
          className="w-full pl-9 pr-8 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-colors"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          autoComplete="off"
        />
        <ChevronDown className={`absolute right-2.5 w-3.5 h-3.5 text-zinc-400 pointer-events-none transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="absolute z-[90] w-full bottom-full mb-1 bg-white border border-zinc-200 rounded-lg shadow-xl overflow-hidden">
          <div className="max-h-52 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-5">
                Sin resultados para &quot;{query}&quot;
              </p>
            ) : (
              results.map((city) => (
                <button key={city.cityCode} type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { onSelect(city); setIsOpen(false); setQuery(''); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 text-left transition-colors border-b border-zinc-50 last:border-0">
                  <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-800">{city.cityName}</p>
                    <p className="text-xs text-zinc-400">{city.departmentName} · {city.cityCode}</p>
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

// ── Tipos internos del formulario ─────────────────────────────────────────────

interface BuyerForm {
  name: string; nit: string; nitDv: string; email: string; phone: string;
  address: string; cityCode: string; cityName: string;
  departmentCode: string; departmentName: string;
}

const EMPTY_BUYER: BuyerForm = {
  name: '', nit: '', nitDv: '', email: '', phone: '',
  address: '', cityCode: '', cityName: '', departmentCode: '', departmentName: '',
};

// ── Componente principal ──────────────────────────────────────────────────────

interface Props {
  sale: SaleResponseDto;
  onClose: () => void;
  /** Se llama tras emitir FE con éxito — permite al padre refrescar la venta */
  onSuccess?: (result: EmitInvoiceResult) => void;
}

type Step = 'buyer' | 'lines' | 'result';

const STEP_LABELS: Step[]               = ['buyer', 'lines', 'result'];
const STEP_TITLES: Record<Step, string> = {
  buyer:  'Datos del Receptor',
  lines:  'Líneas e Impuestos',
  result: 'Resultado DIAN',
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

  // ── Helpers para actualizar buyer ────────────────────────────────────────
  function patchBuyer(patch: Partial<BuyerForm>) {
    setBuyer((prev) => ({ ...prev, ...patch }));
  }

  // ── Selección de cliente ─────────────────────────────────────────────────
  function handleClientSelect(client: ClientDetail) {
    setSelectedClientName(client.name);
    patchBuyer({
      name:           client.name,
      nit:            client.document ?? '',
      nitDv:          client.nitDv ?? '',
      email:          (client as any).email ?? '',
      phone:          client.phone ?? '',
      address:        client.address ?? '',
      cityCode:       client.cityCode ?? '',
      cityName:       client.cityName ?? '',
      departmentCode: client.departmentCode ?? '',
      departmentName: client.departmentName ?? '',
    });

    // Si el cliente tiene cityCode, buscar la ciudad DANE para mostrar el chip
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

  // ── Selección de ciudad DANE ─────────────────────────────────────────────
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

  // ── Validación ──────────────────────────────────────────────────────────
  function validateBuyer(): string | null {
    if (!buyer.name.trim())           return 'El nombre del comprador es requerido.';
    if (!buyer.nit.trim())            return 'El NIT del comprador es requerido.';
    if (!buyer.email.trim())          return 'El correo electrónico es requerido.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email))
                                      return 'El correo electrónico no es válido.';
    if (!buyer.address.trim())        return 'La dirección es requerida.';
    if (!buyer.cityCode.trim())       return 'Selecciona la ciudad del comprador.';
    return null;
  }

  function handleBuyerNext() {
    setError(null);
    const err = validateBuyer();
    if (err) { setError(err); return; }
    setStep('lines');
  }

  // ── Descarga autenticada (fetch + Blob → <a> programático) ──────────────
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

  // ── Emitir la factura ────────────────────────────────────────────────────
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

      // Vincular el documento FE a la venta (guarda feInvoiceId + feCufe en el CRM)
      try {
        await linkSaleToInvoice(sale.id, res.documentId, res.cufe);
        // Notificar al padre para que refresque la venta en la lista/detalle
        onSuccess?.(res);
      } catch {
        // No crítico — la FE ya fue emitida, solo falló el registro local
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al emitir la factura');
    } finally {
      setLoading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  const inputCls = 'w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30';

  return (
    <Modal isOpen onClose={onClose} title="Generar Factura Electrónica DIAN" size="xl">

      {/* ── Stepper ── */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {STEP_LABELS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
              step === s ? 'text-primary'
              : STEP_LABELS.indexOf(step) > i ? 'text-green-600'
              : 'text-zinc-400'
            }`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
                step === s ? 'bg-primary text-white border-primary'
                : STEP_LABELS.indexOf(step) > i ? 'bg-green-600 text-white border-green-600'
                : 'border-zinc-300 text-zinc-400'
              }`}>{i + 1}</span>
              {STEP_TITLES[s]}
            </div>
            {i < STEP_LABELS.length - 1 && (
              <ChevronRight className="w-4 h-4 text-zinc-300 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* ── Error global ── */}
      {error && (
        <div className="flex items-start gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          PASO 1: Datos del Receptor
      ════════════════════════════════════════════════════════════ */}
      {step === 'buyer' && (
        <div className="space-y-4">

          {/* Buscador de clientes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wide">
              Seleccionar cliente existente
            </label>
            <ClientPickerCombobox
              selectedName={selectedClientName}
              onSelect={handleClientSelect}
              onClear={handleClientClear}
            />
          </div>

          {/* Divisor */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-zinc-400">
                o completa los datos manualmente
              </span>
            </div>
          </div>

          {/* Formulario buyer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Nombre o Razón Social <span className="text-red-500">*</span>
              </label>
              <input type="text" value={buyer.name}
                onChange={(e) => patchBuyer({ name: e.target.value })}
                placeholder="EMPRESA S.A.S." className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                NIT <span className="text-red-500">*</span>
              </label>
              <input type="text" value={buyer.nit}
                onChange={(e) => patchBuyer({ nit: e.target.value })}
                placeholder="900123456" className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Dígito de Verificación
              </label>
              <input type="text" value={buyer.nitDv}
                onChange={(e) => patchBuyer({ nitDv: e.target.value })}
                placeholder="7" maxLength={1} className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Correo Electrónico <span className="text-red-500">*</span>
              </label>
              <input type="email" value={buyer.email}
                onChange={(e) => patchBuyer({ email: e.target.value })}
                placeholder="contacto@empresa.com" className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Teléfono
              </label>
              <input type="tel" value={buyer.phone}
                onChange={(e) => patchBuyer({ phone: e.target.value })}
                placeholder="3001234567" className={inputCls} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Dirección <span className="text-red-500">*</span>
              </label>
              <input type="text" value={buyer.address}
                onChange={(e) => patchBuyer({ address: e.target.value })}
                placeholder="Calle 100 # 7-33" className={inputCls} />
            </div>

            {/* ── Ciudad DANE — autocompletado ── */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Ciudad / Municipio <span className="text-red-500">*</span>
                <span className="text-zinc-400 font-normal ml-1">
                  (los códigos DANE se llenan automáticamente)
                </span>
              </label>
              <CityPickerCombobox
                selectedCity={selectedCity}
                onSelect={handleCitySelect}
                onClear={handleCityClear}
              />
              {/* Muestra los códigos DANE si están seleccionados */}
              {buyer.cityCode && (
                <div className="mt-1.5 flex gap-3 text-xs text-zinc-400">
                  <span>Ciudad: <span className="font-mono text-zinc-600">{buyer.cityCode}</span></span>
                  <span>Dpto.: <span className="font-mono text-zinc-600">{buyer.departmentCode}</span></span>
                  <span>{buyer.departmentName}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleBuyerNext} className="flex items-center gap-2">
              Siguiente <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          PASO 2: Revisión de Líneas
      ════════════════════════════════════════════════════════════ */}
      {step === 'lines' && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-500">
            Revisa las líneas de la factura para la venta{' '}
            <span className="font-mono font-medium">{sale.code}</span>.
            Los impuestos se calcularon automáticamente.
          </p>

          {/* Resumen comprador */}
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm">
            <p className="font-medium text-blue-900">{buyer.name}</p>
            <p className="text-blue-700 text-xs mt-0.5">
              NIT: {buyer.nit}{buyer.nitDv ? `-${buyer.nitDv}` : ''} · {buyer.email}
            </p>
            <p className="text-blue-700 text-xs">
              {buyer.address}, {buyer.cityName}
              {buyer.departmentName ? `, ${buyer.departmentName}` : ''}
            </p>
          </div>

          {/* Tabla de líneas */}
          <div className="overflow-x-auto border border-zinc-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50">
                <tr className="text-xs uppercase text-zinc-500 tracking-wide">
                  <th className="text-left px-3 py-2">Descripción</th>
                  <th className="text-center px-3 py-2 w-16">Cant.</th>
                  <th className="text-right px-3 py-2 w-28">P. Unit.</th>
                  <th className="text-right px-3 py-2 w-28">Base</th>
                  <th className="text-right px-3 py-2 w-28">Impuesto</th>
                  <th className="text-right px-3 py-2 w-28">Total</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => {
                  const base    = line.quantity * line.unitPrice;
                  const taxAmt  = line.taxes?.reduce((a, t) => a + t.taxAmount, 0) ?? 0;
                  const taxCode = line.taxes?.[0]?.taxCode;
                  const taxPct  = line.taxes?.[0]?.taxRate ?? 0;
                  return (
                    <tr key={i} className="border-t border-zinc-100">
                      <td className="px-3 py-2.5 text-zinc-900">{line.description}</td>
                      <td className="px-3 py-2.5 text-center text-zinc-600">{line.quantity}</td>
                      <td className="px-3 py-2.5 text-right text-zinc-600">{fmt(line.unitPrice)}</td>
                      <td className="px-3 py-2.5 text-right text-zinc-600">{fmt(base)}</td>
                      <td className="px-3 py-2.5 text-right">
                        {taxAmt > 0 ? (
                          <span className="text-amber-700">
                            {fmt(taxAmt)}
                            <span className="text-xs text-zinc-400 ml-1">
                              ({taxCode === '01' ? 'IVA' : taxCode} {taxPct}%)
                            </span>
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-xs">Exento</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold">{fmt(base + taxAmt)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-zinc-50 border-t-2 border-zinc-200">
                <tr>
                  <td colSpan={3} />
                  <td className="px-3 py-2 text-right text-xs font-medium text-zinc-500">
                    Base: {fmt(lines.reduce((a, l) => a + l.quantity * l.unitPrice, 0))}
                  </td>
                  <td className="px-3 py-2 text-right text-xs font-medium text-amber-700">
                    IVA: {fmt(lines.reduce((a, l) => a + (l.taxes?.reduce((b, t) => b + t.taxAmount, 0) ?? 0), 0))}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-zinc-900">
                    {fmt(lines.reduce((a, l) => {
                      const base = l.quantity * l.unitPrice;
                      const tax  = l.taxes?.reduce((b, t) => b + t.taxAmount, 0) ?? 0;
                      return a + base + tax;
                    }, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep('buyer')} className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />Anterior
            </Button>
            <Button onClick={handleEmit} disabled={loading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enviando a DIAN...</>
              ) : (
                <><Receipt className="w-4 h-4" /> Emitir Factura Electrónica</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          PASO 3: Resultado
      ════════════════════════════════════════════════════════════ */}
      {step === 'result' && result && (
        <div className="space-y-5">
          <div className="flex flex-col items-center text-center py-4">
            {result.dianStatus === 'APPROVED' ? (
              <CheckCircle className="w-16 h-16 text-green-500 mb-3" />
            ) : result.dianStatus === 'PENDING' ? (
              <Clock className="w-16 h-16 text-yellow-500 mb-3" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500 mb-3" />
            )}
            <DianStatusBadge status={result.dianStatus} />
            {result.statusMessage && (
              <p className="text-sm text-zinc-500 mt-2 max-w-md">{result.statusMessage}</p>
            )}
          </div>

          <div className="border border-zinc-200 rounded-lg divide-y divide-zinc-100">
            <div className="flex justify-between items-center px-4 py-3 text-sm">
              <span className="text-zinc-500">Documento ID</span>
              <span className="font-medium font-mono">#{result.documentId}</span>
            </div>
            <div className="px-4 py-3 text-sm">
              <p className="text-zinc-500 mb-1">CUFE</p>
              <p className="font-mono text-xs text-zinc-700 break-all bg-zinc-50 p-2 rounded">
                {result.cufe}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button type="button" onClick={() => triggerDownload('xml')}
              disabled={downloading !== null}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm font-medium">
              {downloading === 'xml'
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Descargando...</>
                : <><FileText className="w-4 h-4" /> Descargar XML firmado</>
              }
            </button>

            <button type="button" onClick={() => triggerDownload('zip')}
              disabled={downloading !== null}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-zinc-200 bg-zinc-50 text-zinc-700 rounded-lg hover:bg-zinc-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm font-medium">
              {downloading === 'zip'
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Descargando...</>
                : <><Download className="w-4 h-4" /> Descargar ZIP DIAN</>
              }
            </button>
          </div>

          <div className="flex justify-end pt-1">
            <Button onClick={onClose} variant="secondary">Cerrar</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
