'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import type { CreateCompanyDto, CompanyDetail } from '@/services/super-admin';
import { searchDaneCities, type DaneCity } from '@/lib/dane-cities';

// ─── Opciones fijas ────────────────────────────────────────────────────────────

const TAX_REGIMES = [
  { value: '', label: 'Seleccionar régimen...' },
  { value: 'SIMPLE', label: 'Régimen Simple de Tributación' },
  { value: 'ORDINARIO', label: 'Régimen Ordinario' },
];

const TAX_LIABILITIES = [
  { value: '', label: 'Seleccionar responsabilidad...' },
  { value: 'R-99-PN', label: 'No responsable de IVA' },
  { value: '0-13-IVA', label: 'IVA – Responsable' },
  { value: '0-14-INC', label: 'INC – Impuesto al Consumo' },
  { value: '0-15-IVA-INC', label: 'IVA e INC' },
  { value: '0-23-RETEIVA', label: 'Agente Retenedor IVA' },
  { value: '0-24-RETEICA', label: 'Agente Retenedor ICA' },
];

const CURRENCIES = [
  { value: 'COP', label: 'COP – Peso colombiano' },
  { value: 'USD', label: 'USD – Dólar estadounidense' },
  { value: 'EUR', label: 'EUR – Euro' },
];

// ─── Tipo del formulario ───────────────────────────────────────────────────────

export type CompanyFormValues = CreateCompanyDto;

interface CompanyFormProps {
  /** Si se pasa, el formulario inicia pre-llenado (modo edición). */
  initialData?: CompanyDetail;
  onSubmit: (data: CompanyFormValues) => Promise<void>;
  submitting: boolean;
  submitLabel?: string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function CompanyForm({ initialData, onSubmit, submitting, submitLabel = 'Guardar' }: CompanyFormProps) {
  const [form, setForm] = useState<CompanyFormValues>({
    nit: initialData?.nit ?? '',
    nitDv: initialData?.nitDv ?? '',
    companyName: initialData?.companyName ?? '',
    tradeName: initialData?.tradeName ?? '',
    address: initialData?.address ?? '',
    cityCode: initialData?.cityCode ?? '',
    cityName: initialData?.cityName ?? '',
    departmentCode: initialData?.departmentCode ?? '',
    departmentName: initialData?.departmentName ?? '',
    phone: initialData?.phone ?? '',
    email: initialData?.email ?? '',
    website: initialData?.website ?? '',
    taxRegime: initialData?.taxRegime ?? '',
    taxLiability: initialData?.taxLiability ?? '',
    defaultIvaRate: initialData?.defaultIvaRate ?? 0.19,
    defaultCurrency: initialData?.defaultCurrency ?? 'COP',
    logoUrl: initialData?.logoUrl ?? '',
  });

  const [citySearch, setCitySearch] = useState(
    initialData?.cityName
      ? `${initialData.cityName} — ${initialData.departmentName}`
      : ''
  );
  const [cityResults, setCityResults] = useState<DaneCity[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CompanyFormValues, string>>>({});

  // ── Búsqueda de municipio DANE ─────────────────────────────────────────────
  const searchCities = useCallback((q: string) => {
    if (!q || q.length < 2) {
      setCityResults([]);
      return;
    }
    setCityResults(searchDaneCities(q, 10));
  }, []);

  useEffect(() => {
    searchCities(citySearch);
  }, [citySearch, searchCities]);

  function selectCity(city: DaneCity) {
    setCitySearch(`${city.cityName} — ${city.departmentName}`);
    setForm((prev) => ({
      ...prev,
      cityCode: city.cityCode,
      cityName: city.cityName,
      departmentCode: city.departmentCode,
      departmentName: city.departmentName,
    }));
    setCityResults([]);
    setShowCityDropdown(false);
  }

  // ── Validación básica ──────────────────────────────────────────────────────
  function validate(): boolean {
    const errs: Partial<Record<keyof CompanyFormValues, string>> = {};
    if (!form.nit.trim())         errs.nit = 'El NIT es requerido';
    if (!form.nitDv.trim())       errs.nitDv = 'El dígito de verificación es requerido';
    if (!form.companyName.trim()) errs.companyName = 'La razón social es requerida';
    const iva = form.defaultIvaRate ?? 0;
    if (iva < 0 || iva > 1)
      errs.defaultIvaRate = 'La tasa IVA debe estar entre 0 y 100 %';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
  }

  function set<K extends keyof CompanyFormValues>(key: K, value: CompanyFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Identificación ── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100">
          Identificación
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* NIT */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              NIT <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.nit}
              onChange={(e) => set('nit', e.target.value)}
              placeholder="900123456"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.nit ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.nit && <p className="mt-1 text-xs text-red-500">{errors.nit}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DV <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.nitDv}
              onChange={(e) => set('nitDv', e.target.value.replace(/\D/, ''))}
              placeholder="7"
              maxLength={1}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.nitDv ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.nitDv && <p className="mt-1 text-xs text-red-500">{errors.nitDv}</p>}
          </div>
        </div>
      </section>

      {/* ── Datos de la empresa ── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100">
          Datos de la Empresa
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Razón Social <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => set('companyName', e.target.value)}
              placeholder="Empresa S.A.S."
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.companyName ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.companyName && <p className="mt-1 text-xs text-red-500">{errors.companyName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Comercial</label>
            <input
              type="text"
              value={form.tradeName ?? ''}
              onChange={(e) => set('tradeName', e.target.value)}
              placeholder="Marca o nombre visible"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input
              type="email"
              value={form.email ?? ''}
              onChange={(e) => set('email', e.target.value)}
              placeholder="contacto@empresa.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="text"
              value={form.phone ?? ''}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="+57 300 000 0000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sitio Web</label>
            <input
              type="url"
              value={form.website ?? ''}
              onChange={(e) => set('website', e.target.value)}
              placeholder="https://empresa.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      {/* ── Dirección ── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100">
          Dirección
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input
              type="text"
              value={form.address ?? ''}
              onChange={(e) => set('address', e.target.value)}
              placeholder="Calle 123 # 45-67, Piso 2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Municipio (DANE)</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={citySearch}
                onChange={(e) => {
                  setCitySearch(e.target.value);
                  setShowCityDropdown(true);
                  if (!e.target.value) {
                    set('cityCode', '');
                    set('cityName', '');
                    set('departmentCode', '');
                    set('departmentName', '');
                  }
                }}
                onFocus={() => setShowCityDropdown(true)}
                placeholder="Buscar municipio..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {showCityDropdown && cityResults.length > 0 && (
              <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {cityResults.map((city) => (
                  <li key={city.cityCode}>
                    <button
                      type="button"
                      onMouseDown={() => selectCity(city)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors"
                    >
                      <span className="font-medium text-gray-800">{city.cityName}</span>
                      <span className="text-gray-500 ml-1">— {city.departmentName}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {form.departmentName && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
              <input
                readOnly
                value={form.departmentName}
                className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-600 cursor-not-allowed"
              />
            </div>
          )}
        </div>
      </section>

      {/* ── Configuración Fiscal ── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100">
          Configuración Fiscal
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Régimen Tributario</label>
            <select
              value={form.taxRegime ?? ''}
              onChange={(e) => set('taxRegime', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {TAX_REGIMES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Responsabilidad Fiscal</label>
            <select
              value={form.taxLiability ?? ''}
              onChange={(e) => set('taxLiability', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {TAX_LIABILITIES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tasa IVA por defecto (%)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={Number(((form.defaultIvaRate ?? 0) * 100).toFixed(2))}
                onChange={(e) => set('defaultIvaRate', Number(e.target.value) / 100)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.defaultIvaRate ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              <span className="text-gray-500 text-sm font-medium">%</span>
            </div>
            {errors.defaultIvaRate && (
              <p className="mt-1 text-xs text-red-500">{errors.defaultIvaRate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Moneda por defecto</label>
            <select
              value={form.defaultCurrency ?? 'COP'}
              onChange={(e) => set('defaultCurrency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ── Logo ── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100">
          Personalización
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL del Logo</label>
          <input
            type="url"
            value={form.logoUrl ?? ''}
            onChange={(e) => set('logoUrl', e.target.value)}
            placeholder="https://cdn.empresa.com/logo.png"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {form.logoUrl && (
            <div className="mt-3 flex items-center gap-3">
              <img
                src={form.logoUrl}
                alt="Vista previa del logo"
                className="h-12 w-auto object-contain border border-gray-200 rounded-lg p-1"
                onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
              />
              <span className="text-xs text-gray-500">Vista previa</span>
            </div>
          )}
        </div>
      </section>

      {/* ── Submit ── */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
