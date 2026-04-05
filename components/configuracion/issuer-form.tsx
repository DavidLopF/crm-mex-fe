'use client';

import { useState, useEffect } from 'react';
import { FileText, Globe, Settings, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import type { IssuerDto, UpsertIssuerDto } from '@/services/issuer';

interface IssuerFormProps {
  issuer: IssuerDto | null;
  onSave: (data: UpsertIssuerDto) => Promise<void>;
  submitting?: boolean;
}

const TAX_REGIMES = [
  { value: '48', label: '48 – Responsable de IVA' },
  { value: '49', label: '49 – No responsable de IVA' },
];

const TAX_LIABILITIES = [
  { value: 'O-13', label: 'O-13 – Gran contribuyente' },
  { value: 'O-15', label: 'O-15 – Autorretenedor' },
  { value: 'O-23', label: 'O-23 – Agente de retención en el impuesto sobre las ventas' },
  { value: 'O-47', label: 'O-47 – Régimen simple de tributación' },
  { value: 'R-99-PN', label: 'R-99-PN – No aplica – Otros' },
];

function Field({
  label, required, hint, children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-50 disabled:text-zinc-400"
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
    />
  );
}

export function IssuerForm({ issuer, onSave, submitting }: IssuerFormProps) {
  // ── Datos empresa ─────────────────────────────────────────────────────────
  const [companyName, setCompanyName]           = useState(issuer?.companyName ?? '');
  const [nit, setNit]                           = useState(issuer?.nit ?? '');
  const [nitDv, setNitDv]                       = useState(issuer?.nitDv ?? '');
  const [address, setAddress]                   = useState(issuer?.address ?? '');
  const [cityCode, setCityCode]                 = useState(issuer?.cityCode ?? '');
  const [cityName, setCityName]                 = useState(issuer?.cityName ?? '');
  const [departmentCode, setDepartmentCode]     = useState(issuer?.departmentCode ?? '');
  const [departmentName, setDepartmentName]     = useState(issuer?.departmentName ?? '');
  const [phone, setPhone]                       = useState(issuer?.phone ?? '');
  const [email, setEmail]                       = useState(issuer?.email ?? '');
  const [taxRegime, setTaxRegime]               = useState(issuer?.taxRegime ?? '48');
  const [taxLiability, setTaxLiability]         = useState(issuer?.taxLiability ?? 'R-99-PN');

  // ── Software DIAN ─────────────────────────────────────────────────────────
  const [softwareId, setSoftwareId]             = useState(issuer?.softwareId ?? '');
  const [softwarePin, setSoftwarePin]           = useState('');  // write-only, nunca se pre-rellena
  const [resolutionNumber, setResolutionNumber] = useState(issuer?.resolutionNumber ?? '');
  const [resolutionDate, setResolutionDate]     = useState(
    issuer?.resolutionDate ? issuer.resolutionDate.slice(0, 10) : '',
  );
  const [prefix, setPrefix]                     = useState(issuer?.prefix ?? '');
  const [rangeStart, setRangeStart]             = useState(String(issuer?.rangeStart ?? ''));
  const [rangeEnd, setRangeEnd]                 = useState(String(issuer?.rangeEnd ?? ''));
  const [testSetId, setTestSetId]               = useState(issuer?.testSetId ?? '');
  const [isProduction, setIsProduction]         = useState(issuer?.isProduction ?? false);

  // Sincronizar si el prop cambia (tras guardar)
  useEffect(() => {
    if (!issuer) return;
    setCompanyName(issuer.companyName);
    setNit(issuer.nit);
    setNitDv(issuer.nitDv);
    setAddress(issuer.address);
    setCityCode(issuer.cityCode);
    setCityName(issuer.cityName);
    setDepartmentCode(issuer.departmentCode);
    setDepartmentName(issuer.departmentName);
    setPhone(issuer.phone ?? '');
    setEmail(issuer.email ?? '');
    setTaxRegime(issuer.taxRegime);
    setTaxLiability(issuer.taxLiability);
    setSoftwareId(issuer.softwareId);
    setResolutionNumber(issuer.resolutionNumber);
    setResolutionDate(issuer.resolutionDate.slice(0, 10));
    setPrefix(issuer.prefix);
    setRangeStart(String(issuer.rangeStart));
    setRangeEnd(String(issuer.rangeEnd));
    setTestSetId(issuer.testSetId ?? '');
    setIsProduction(issuer.isProduction);
  }, [issuer]);

  // ── Validación básica ─────────────────────────────────────────────────────
  const requiredFields = [
    companyName, nit, nitDv, address, cityCode, cityName,
    departmentCode, departmentName, taxRegime, taxLiability,
    softwareId, resolutionNumber, resolutionDate, prefix, rangeStart, rangeEnd,
  ];
  // softwarePin es requerido solo en creación; en edición es opcional (vacío = no cambiar)
  // isNew = nunca se completaron los datos DIAN (softwareId vacío = esqueleto inicial)
  const isNew = !issuer?.softwareId;
  const canSubmit = requiredFields.every((v) => v.trim() !== '') &&
    (!isNew || softwarePin.trim() !== '') &&
    Number(rangeStart) > 0 && Number(rangeEnd) > Number(rangeStart);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    await onSave({
      companyName: companyName.trim(),
      nit: nit.trim(),
      nitDv: nitDv.trim(),
      address: address.trim(),
      cityCode: cityCode.trim(),
      cityName: cityName.trim(),
      departmentCode: departmentCode.trim(),
      departmentName: departmentName.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      taxRegime,
      taxLiability,
      softwareId: softwareId.trim(),
      softwarePin: softwarePin.trim(),
      resolutionNumber: resolutionNumber.trim(),
      resolutionDate,
      prefix: prefix.trim(),
      rangeStart: Number(rangeStart),
      rangeEnd: Number(rangeEnd),
      testSetId: testSetId.trim() || undefined,
      isProduction,
    });
    // Limpiar PIN tras guardar (campo write-only)
    setSoftwarePin('');
  };

  return (
    <div className="max-w-3xl space-y-8">

      {/* ─── Estado del certificado ──────────────────────────────── */}
      {issuer && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
          issuer.hasCertificate
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          {issuer.hasCertificate ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          )}
          <div>
            <p className="text-sm font-medium">
              {issuer.hasCertificate ? 'Certificado DIAN cargado' : 'Sin certificado DIAN'}
            </p>
            <p className="text-xs opacity-75">
              {issuer.hasCertificate
                ? 'El certificado .p12 está configurado. Para reemplazarlo contacta al Super Admin.'
                : 'Necesitas un certificado .p12 para emitir facturas. Solicítalo al Super Admin.'}
            </p>
          </div>
        </div>
      )}

      {/* ─── Datos del emisor ────────────────────────────────────── */}
      <section className="bg-white rounded-lg border border-zinc-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-zinc-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-900">Datos del emisor</h3>
            <p className="text-sm text-zinc-500">Información fiscal registrada ante la DIAN</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <Field label="Razón social" required>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Nombre completo según RUT"
                maxLength={255}
              />
            </Field>
          </div>

          <Field label="NIT" required hint="Sin dígito de verificación">
            <Input
              value={nit}
              onChange={(e) => setNit(e.target.value.replace(/\D/g, ''))}
              placeholder="900123456"
              maxLength={20}
            />
          </Field>

          <Field label="Dígito de verificación (DV)" required>
            <Input
              value={nitDv}
              onChange={(e) => setNitDv(e.target.value.replace(/\D/g, '').slice(0, 1))}
              placeholder="7"
              maxLength={1}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Dirección" required>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Calle 10 # 5-40"
                maxLength={255}
              />
            </Field>
          </div>

          <Field label="Código municipio DANE" required hint="Ej: 05001 (Medellín)">
            <Input
              value={cityCode}
              onChange={(e) => setCityCode(e.target.value)}
              placeholder="05001"
              maxLength={10}
            />
          </Field>

          <Field label="Municipio" required>
            <Input
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              placeholder="Medellín"
              maxLength={100}
            />
          </Field>

          <Field label="Código departamento DANE" required hint="Ej: 05 (Antioquia)">
            <Input
              value={departmentCode}
              onChange={(e) => setDepartmentCode(e.target.value)}
              placeholder="05"
              maxLength={5}
            />
          </Field>

          <Field label="Departamento" required>
            <Input
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              placeholder="Antioquia"
              maxLength={100}
            />
          </Field>

          <Field label="Teléfono">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="3001234567"
              maxLength={20}
            />
          </Field>

          <Field label="Correo electrónico">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="facturacion@empresa.com"
              maxLength={100}
            />
          </Field>

          <Field label="Régimen fiscal" required>
            <Select value={taxRegime} onChange={(e) => setTaxRegime(e.target.value)}>
              {TAX_REGIMES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </Select>
          </Field>

          <Field label="Responsabilidad fiscal" required>
            <Select value={taxLiability} onChange={(e) => setTaxLiability(e.target.value)}>
              {TAX_LIABILITIES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </Select>
          </Field>
        </div>
      </section>

      {/* ─── Software DIAN ───────────────────────────────────────── */}
      <section className="bg-white rounded-lg border border-zinc-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-zinc-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-900">Software de facturación</h3>
            <p className="text-sm text-zinc-500">Datos del software registrado ante la DIAN</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="ID Software" required hint="UUID asignado por la DIAN">
            <Input
              value={softwareId}
              onChange={(e) => setSoftwareId(e.target.value.trim())}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              maxLength={100}
            />
          </Field>

          <Field
            label={isNew ? 'PIN Software' : 'PIN Software (dejar vacío para no cambiar)'}
            required={isNew}
            hint="Clave del software registrado en DIAN"
          >
            <Input
              type="password"
              value={softwarePin}
              onChange={(e) => setSoftwarePin(e.target.value)}
              placeholder={isNew ? 'PIN del software' : '••••••••'}
              autoComplete="new-password"
            />
          </Field>

          <Field label="Número de resolución" required>
            <Input
              value={resolutionNumber}
              onChange={(e) => setResolutionNumber(e.target.value)}
              placeholder="18764000001"
              maxLength={50}
            />
          </Field>

          <Field label="Fecha de resolución" required>
            <Input
              type="date"
              value={resolutionDate}
              onChange={(e) => setResolutionDate(e.target.value)}
            />
          </Field>

          <Field label="Prefijo de factura" required hint="Ej: SETP o vacío si no aplica">
            <Input
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
              placeholder="SETP"
              maxLength={10}
            />
          </Field>

          <div />

          <Field label="Rango inicial" required>
            <Input
              type="number"
              min={1}
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              placeholder="1"
            />
          </Field>

          <Field label="Rango final" required>
            <Input
              type="number"
              min={1}
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              placeholder="1000"
            />
          </Field>
        </div>
      </section>

      {/* ─── Ambiente DIAN ───────────────────────────────────────── */}
      <section className="bg-white rounded-lg border border-zinc-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-zinc-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-900">Ambiente DIAN</h3>
            <p className="text-sm text-zinc-500">Configuración del ambiente de habilitación</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="TestSetId" hint="ID del set de pruebas asignado por la DIAN (solo ambiente de pruebas)">
            <Input
              value={testSetId}
              onChange={(e) => setTestSetId(e.target.value.trim())}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              maxLength={100}
              disabled={isProduction}
            />
          </Field>

          <Field label="Ambiente">
            <label className="flex items-center gap-3 mt-2 cursor-pointer select-none">
              <div
                onClick={() => setIsProduction((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  isProduction ? 'bg-blue-600' : 'bg-zinc-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    isProduction ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
              <span className="text-sm text-zinc-700">
                {isProduction ? 'Producción' : 'Habilitación (pruebas)'}
              </span>
            </label>
            {isProduction && (
              <p className="mt-2 text-xs text-amber-600">
                Las facturas emitidas en modo producción son documentos fiscales válidos.
              </p>
            )}
          </Field>
        </div>
      </section>

      {/* ─── Acción ──────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
          {submitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </span>
          ) : (
            isNew ? 'Configurar emisor' : 'Guardar cambios'
          )}
        </Button>
      </div>
    </div>
  );
}
