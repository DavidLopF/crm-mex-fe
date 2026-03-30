'use client';

import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Download, CheckCircle, XCircle, AlertTriangle, FileSpreadsheet, Layers } from 'lucide-react';
import { Modal, Button, Badge } from '@/components/ui';
import type { BulkPriceTierRow, BulkPriceTiersResult } from '@/services/products';

// ── Tipos internos ────────────────────────────────────────────────────────────

interface ParsedTierRow extends BulkPriceTierRow {
  _rowNum: number;
  _valid: boolean;
  _error?: string;
}

// Tiers agrupados por SKU para el preview
interface SkuGroup {
  sku: string;
  tiers: ParsedTierRow[];
  hasErrors: boolean;
}

interface BulkPriceTiersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (rows: BulkPriceTierRow[]) => Promise<BulkPriceTiersResult>;
}

// ── Plantilla Excel ───────────────────────────────────────────────────────────

function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const data = [
    ['SKU', 'CantidadMinima', 'Precio', 'Etiqueta'],
    // Ejemplo: PROD-001 con 3 tiers de mayoreo
    ['PROD-001', 1,  299.99, 'Precio unitario'],
    ['PROD-001', 5,  269.99, 'Por 5 o más'],
    ['PROD-001', 10, 249.99, 'Al mayoreo'],
    // Ejemplo: PROD-002 con 2 tiers
    ['PROD-002', 1,  149.00, 'Precio unitario'],
    ['PROD-002', 12, 129.00, 'Por docena'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 18 }, { wch: 16 }, { wch: 12 }, { wch: 22 }];

  // Cabecera en negrita (sólo estilo visual — SheetJS básico)
  XLSX.utils.book_append_sheet(wb, ws, 'PreciosMayoreo');
  XLSX.writeFile(wb, 'plantilla_precios_mayoreo.xlsx');
}

// ── Parser Excel ──────────────────────────────────────────────────────────────

function parseExcel(file: File): Promise<ParsedTierRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        const rows: ParsedTierRow[] = raw.map((r, i) => {
          // Normalizar cabeceras de forma case-insensitive
          const get = (keys: string[]) => {
            for (const k of keys) {
              const found = Object.keys(r).find(
                (rk) => rk.toLowerCase().replace(/\s+/g, '') === k.toLowerCase().replace(/\s+/g, ''),
              );
              if (found !== undefined) return r[found];
            }
            return undefined;
          };

          const sku = String(get(['sku']) ?? '').trim();
          const minQtyRaw = get(['cantidadminima', 'minqty', 'cantidad', 'qty', 'cantidad_minima']);
          const precioRaw = get(['precio', 'price']);
          const etiquetaRaw = get(['etiqueta', 'label', 'tierlabel', 'tier']);

          const minQty = minQtyRaw !== '' && minQtyRaw !== undefined ? Number(minQtyRaw) : NaN;
          const price = precioRaw !== '' && precioRaw !== undefined ? Number(precioRaw) : NaN;
          const tierLabel = etiquetaRaw !== '' && etiquetaRaw !== undefined
            ? String(etiquetaRaw).trim()
            : undefined;

          let error: string | undefined;
          if (!sku) error = 'SKU vacío';
          else if (isNaN(minQty) || !Number.isInteger(minQty) || minQty < 1)
            error = 'CantidadMinima debe ser un entero ≥ 1';
          else if (isNaN(price) || price < 0)
            error = 'Precio inválido (debe ser número ≥ 0)';

          return {
            _rowNum: i + 2,
            _valid: !error,
            _error: error,
            sku,
            minQty: isNaN(minQty) ? 0 : minQty,
            price: isNaN(price) ? 0 : price,
            ...(tierLabel ? { tierLabel } : {}),
          };
        });

        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ── Agrupador por SKU ─────────────────────────────────────────────────────────

function groupBySku(rows: ParsedTierRow[]): SkuGroup[] {
  const map = new Map<string, ParsedTierRow[]>();
  for (const row of rows) {
    const key = row.sku.toUpperCase().trim() || `__ROW_${row._rowNum}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  }
  return Array.from(map.entries()).map(([, tiers]) => ({
    sku: tiers[0].sku,
    tiers: [...tiers].sort((a, b) => a.minQty - b.minQty),
    hasErrors: tiers.some((t) => !t._valid),
  }));
}

// ── Componente principal ──────────────────────────────────────────────────────

export function BulkPriceTiersModal({ isOpen, onClose, onConfirm }: BulkPriceTiersModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [rows, setRows] = useState<ParsedTierRow[]>([]);
  const [result, setResult] = useState<BulkPriceTiersResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [parseError, setParseError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const validRows = rows.filter((r) => r._valid);
  const invalidRows = rows.filter((r) => !r._valid);
  const skuGroups = groupBySku(rows);
  const validSkuCount = skuGroups.filter((g) => g.tiers.some((t) => t._valid)).length;

  const handleClose = () => {
    setStep('upload');
    setRows([]);
    setResult(null);
    setParseError('');
    onClose();
  };

  const handleFile = useCallback(async (file: File) => {
    setParseError('');
    try {
      const parsed = await parseExcel(file);
      if (parsed.length === 0) {
        setParseError('El archivo no contiene filas de datos.');
        return;
      }
      setRows(parsed);
      setStep('preview');
    } catch {
      setParseError('No se pudo leer el archivo. Asegúrate de que sea un .xlsx válido.');
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleConfirm = async () => {
    if (validRows.length === 0) return;
    setSubmitting(true);
    try {
      const payload: BulkPriceTierRow[] = validRows.map(({ sku, minQty, price, tierLabel }) => ({
        sku,
        minQty,
        price,
        ...(tierLabel ? { tierLabel } : {}),
      }));
      const res = await onConfirm(payload);
      setResult(res);
      setStep('result');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al procesar los precios. Inténtalo de nuevo.';
      setParseError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Precios por Mayoreo — Importar Excel" size="xl">
      <div className="space-y-4">

        {/* ── STEP 1: Upload ──────────────────────────────────────── */}
        {step === 'upload' && (
          <>
            <div className="flex justify-between items-start gap-3">
              <div className="text-sm text-zinc-500 space-y-1">
                <p>
                  Sube un Excel con columnas: <strong>SKU</strong>, <strong>CantidadMinima</strong>,{' '}
                  <strong>Precio</strong> y opcionalmente <strong>Etiqueta</strong>.
                </p>
                <p className="text-xs text-zinc-400">
                  Un SKU puede tener <em>múltiples filas</em> — cada fila es un tier de precio según cantidad.
                  Los tiers existentes serán reemplazados completamente.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="flex items-center gap-1.5 whitespace-nowrap flex-shrink-0"
              >
                <Download className="w-4 h-4" />
                Descargar Plantilla
              </Button>
            </div>

            {/* Zona de drag & drop */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-zinc-300 rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
            >
              <FileSpreadsheet className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-zinc-700">
                Arrastra tu archivo aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-zinc-400 mt-1">Formatos soportados: .xlsx, .xls</p>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>

            {/* Ejemplo visual rápido */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs text-zinc-500">
              <p className="font-semibold text-zinc-600 mb-2 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> Ejemplo de estructura:
              </p>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-zinc-400">
                    <th className="pr-4 pb-1">SKU</th>
                    <th className="pr-4 pb-1">CantidadMinima</th>
                    <th className="pr-4 pb-1">Precio</th>
                    <th className="pb-1">Etiqueta</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-600">
                  <tr><td className="pr-4">PROD-001</td><td className="pr-4">1</td><td className="pr-4">$299.99</td><td>Precio unitario</td></tr>
                  <tr><td className="pr-4">PROD-001</td><td className="pr-4">5</td><td className="pr-4">$269.99</td><td>Por 5 o más</td></tr>
                  <tr><td className="pr-4">PROD-001</td><td className="pr-4">10</td><td className="pr-4">$249.99</td><td>Al mayoreo</td></tr>
                </tbody>
              </table>
            </div>

            {parseError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                {parseError}
              </div>
            )}
          </>
        )}

        {/* ── STEP 2: Preview ─────────────────────────────────────── */}
        {step === 'preview' && (
          <>
            {/* Resumen */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-sm text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                <Layers className="w-4 h-4" /> {validSkuCount} SKU(s) a actualizar
              </span>
              <span className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                <CheckCircle className="w-4 h-4" /> {validRows.length} tier(s) válidos
              </span>
              {invalidRows.length > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                  <XCircle className="w-4 h-4" /> {invalidRows.length} fila(s) con error
                </span>
              )}
            </div>

            {/* Tabla agrupada por SKU */}
            <div className="border border-zinc-200 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase w-8">#</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase">SKU</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-zinc-500 uppercase">Cant. Mín.</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-zinc-500 uppercase">Precio</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase">Etiqueta</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {skuGroups.map((group, gi) =>
                    group.tiers.map((tier, ti) => (
                      <tr
                        key={tier._rowNum}
                        className={[
                          tier._valid ? '' : 'bg-red-50',
                          // Separador visual entre grupos de SKU
                          ti === 0 && gi > 0 ? 'border-t-2 border-zinc-300' : '',
                        ].join(' ')}
                      >
                        <td className="px-3 py-2 text-zinc-400 text-xs">{tier._rowNum}</td>
                        {/* SKU sólo en la primera fila del grupo */}
                        <td className="px-3 py-2 font-mono text-zinc-900">
                          {ti === 0 ? (
                            <span className="flex items-center gap-1">
                              {tier.sku || '—'}
                              {group.tiers.length > 1 && (
                                <span className="text-xs text-zinc-400 font-normal">
                                  ×{group.tiers.length}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-zinc-300 pl-3">└</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-zinc-700">
                          {tier._valid ? tier.minQty : '—'}
                        </td>
                        <td className="px-3 py-2 text-right text-zinc-700">
                          {tier._valid ? `$${tier.price.toFixed(2)}` : '—'}
                        </td>
                        <td className="px-3 py-2 text-zinc-500 text-xs">
                          {tier.tierLabel || '—'}
                        </td>
                        <td className="px-3 py-2">
                          {tier._valid ? (
                            <Badge variant="success">OK</Badge>
                          ) : (
                            <span className="text-xs text-red-600">{tier._error}</span>
                          )}
                        </td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>

            {invalidRows.length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Las filas con error serán omitidas. Solo se procesarán los {validRows.length} tier(s) válidos.
              </div>
            )}

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
              <strong>Importante:</strong> Al confirmar, los tiers actuales de cada SKU serán <em>reemplazados
              completamente</em> por los nuevos. Esta acción no se puede deshacer.
            </div>

            {parseError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                {parseError}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setStep('upload'); setParseError(''); }} className="flex-1" disabled={submitting}>
                Volver
              </Button>
              <Button onClick={handleConfirm} className="flex-1" disabled={submitting || validRows.length === 0}>
                {submitting
                  ? 'Actualizando...'
                  : `Actualizar ${validSkuCount} SKU(s) — ${validRows.length} tier(s)`}
              </Button>
            </div>
          </>
        )}

        {/* ── STEP 3: Result ──────────────────────────────────────── */}
        {step === 'result' && result && (
          <>
            <div className="text-center space-y-3 py-2">
              <div
                className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center ${
                  result.updatedSkus > 0 ? 'bg-green-100' : 'bg-amber-100'
                }`}
              >
                {result.updatedSkus > 0 ? (
                  <CheckCircle className="w-7 h-7 text-green-600" />
                ) : (
                  <AlertTriangle className="w-7 h-7 text-amber-600" />
                )}
              </div>
              <div>
                <p className="text-base font-semibold text-zinc-900">
                  {result.updatedSkus} SKU{result.updatedSkus !== 1 ? 's' : ''} actualizado
                  {result.updatedSkus !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-zinc-500">
                  {result.tiersCreated} tier{result.tiersCreated !== 1 ? 's' : ''} de precio creado
                  {result.tiersCreated !== 1 ? 's' : ''}
                </p>
                {result.errors.length > 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    {result.errors.length} SKU(s) con error
                  </p>
                )}
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="border border-red-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-red-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-red-700">SKU</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-red-700">Razón</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {result.errors.map((e, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-mono text-zinc-700">{e.sku}</td>
                        <td className="px-3 py-2 text-red-600">{e.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Button onClick={handleClose} className="w-full">
              Cerrar
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
