'use client';

import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Download, CheckCircle, XCircle, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { Modal, Button, Badge } from '@/components/ui';
import type { BulkImportRow, BulkImportResult } from '@/services/products';

// ── Columnas del Excel de importación ────────────────────────────────────────
// Nombre | SKU | Precio | Costo | Categoria | Descripcion | NombreVariante |
// Barcode | Stock | Moneda | RequiereIVA

interface ParsedImportRow extends BulkImportRow {
  _rowNum: number;
  _valid: boolean;
  _error?: string;
}

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (rows: BulkImportRow[]) => Promise<BulkImportResult>;
}

// ── Plantilla ────────────────────────────────────────────────────────────────
function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const headers = [
    'Nombre', 'SKU', 'Precio', 'Costo', 'Categoria',
    'Descripcion', 'NombreVariante', 'Barcode', 'Stock', 'Moneda', 'RequiereIVA',
  ];
  const example1 = ['Laptop HP ProBook', 'LAP-HP-001', 999.99, 650.0, 'Electrónica', 'Laptop de 14 pulgadas', 'Color: Plata', '7501234567890', 5, 'MXN', 'No'];
  const example2 = ['Mouse USB Logitech', 'MOU-LOG-001', 299.0, 180.0, 'Electrónica', '', 'Negro', '', 20, 'MXN', 'No'];
  const ws = XLSX.utils.aoa_to_sheet([headers, example1, example2]);
  ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 2, 16) }));
  XLSX.utils.book_append_sheet(wb, ws, 'Productos');
  XLSX.writeFile(wb, 'plantilla_importacion_productos.xlsx');
}

// ── Parser ────────────────────────────────────────────────────────────────────
function parseExcel(file: File): Promise<ParsedImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        const get = (r: Record<string, unknown>, keys: string[]) => {
          for (const k of keys) {
            const found = Object.keys(r).find((rk) => rk.toLowerCase().trim() === k.toLowerCase());
            if (found !== undefined) return r[found];
          }
          return undefined;
        };

        const rows: ParsedImportRow[] = raw.map((r, i) => {
          const name = String(get(r, ['nombre', 'name']) ?? '').trim();
          const sku = String(get(r, ['sku']) ?? '').trim();
          const precioRaw = get(r, ['precio', 'price', 'defaultprice']);
          const costoRaw = get(r, ['costo', 'cost']);
          const categoryName = String(get(r, ['categoria', 'category', 'categoryname']) ?? '').trim();
          const description = String(get(r, ['descripcion', 'description']) ?? '').trim() || undefined;
          const variantName = String(get(r, ['nombrevariante', 'variantname', 'variante']) ?? '').trim() || undefined;
          const barcode = String(get(r, ['barcode', 'codigobarra', 'codigo_barra']) ?? '').trim() || undefined;
          const stockRaw = get(r, ['stock', 'existencia']);
          const currency = String(get(r, ['moneda', 'currency']) ?? 'MXN').trim() || 'MXN';
          const ivaRaw = String(get(r, ['requiereiva', 'iva', 'requiresiva']) ?? '').toLowerCase().trim();

          const defaultPrice = precioRaw !== '' && precioRaw !== undefined ? Number(precioRaw) : NaN;
          const cost = costoRaw !== '' && costoRaw !== undefined ? Number(costoRaw) : undefined;
          const stock = stockRaw !== '' && stockRaw !== undefined ? Number(stockRaw) : 0;
          const requiresIva = ['si', 'sí', 'yes', 'true', '1'].includes(ivaRaw);

          let error: string | undefined;
          if (!name) error = 'Nombre vacío';
          else if (!sku) error = 'SKU vacío';
          else if (isNaN(defaultPrice) || defaultPrice < 0) error = 'Precio inválido';
          else if (!categoryName) error = 'Categoría vacía';
          else if (cost !== undefined && isNaN(cost)) error = 'Costo inválido';
          else if (isNaN(stock) || stock < 0) error = 'Stock inválido';

          return {
            _rowNum: i + 2,
            _valid: !error,
            _error: error,
            name,
            sku,
            defaultPrice: isNaN(defaultPrice) ? 0 : defaultPrice,
            cost: cost !== undefined && !isNaN(cost) ? cost : undefined,
            categoryName,
            description,
            variantName,
            barcode,
            stock: isNaN(stock) ? 0 : stock,
            currency,
            requiresIva,
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

// ── Componente ────────────────────────────────────────────────────────────────
export function BulkImportModal({ isOpen, onClose, onConfirm }: BulkImportModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [rows, setRows] = useState<ParsedImportRow[]>([]);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [parseError, setParseError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const validRows = rows.filter((r) => r._valid);
  const invalidRows = rows.filter((r) => !r._valid);

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
      const payload = validRows.map(({ name, sku, defaultPrice, cost, categoryName, description, variantName, barcode, stock, currency, requiresIva }) => ({
        name, sku, defaultPrice, cost, categoryName, description, variantName, barcode, stock, currency, requiresIva,
      }));
      const res = await onConfirm(payload);
      setResult(res);
      setStep('result');
    } catch {
      setParseError('Error al procesar la importación. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar Productos por Excel" size="xl">
      <div className="space-y-4">

        {/* ── STEP 1: Upload ───────────────────────────────────────── */}
        {step === 'upload' && (
          <>
            <div className="flex justify-between items-start gap-3">
              <p className="text-sm text-zinc-500">
                Sube un Excel con: <strong>Nombre</strong>, <strong>SKU</strong>, <strong>Precio</strong>, <strong>Categoria</strong> (requeridos) y campos opcionales como Costo, NombreVariante, Stock, etc.
              </p>
              <Button variant="outline" size="sm" onClick={downloadTemplate} className="flex items-center gap-1.5 whitespace-nowrap flex-shrink-0">
                <Download className="w-4 h-4" />
                Descargar Plantilla
              </Button>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-zinc-300 rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
            >
              <FileSpreadsheet className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-zinc-700">Arrastra tu archivo aquí o haz clic para seleccionar</p>
              <p className="text-xs text-zinc-400 mt-1">Formatos soportados: .xlsx, .xls</p>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
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
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                <CheckCircle className="w-4 h-4" /> {validRows.length} productos válidos
              </span>
              {invalidRows.length > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                  <XCircle className="w-4 h-4" /> {invalidRows.length} filas con error
                </span>
              )}
            </div>

            <div className="border border-zinc-200 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 sticky top-0">
                  <tr>
                    {['#', 'Nombre', 'SKU', 'Precio', 'Categoría', 'Variante', 'Stock', 'Estado'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {rows.map((r) => (
                    <tr key={r._rowNum} className={r._valid ? '' : 'bg-red-50'}>
                      <td className="px-3 py-2 text-zinc-400">{r._rowNum}</td>
                      <td className="px-3 py-2 font-medium text-zinc-900 max-w-32 truncate">{r.name || '—'}</td>
                      <td className="px-3 py-2 font-mono text-zinc-700">{r.sku || '—'}</td>
                      <td className="px-3 py-2 text-zinc-700">{r._valid ? `$${r.defaultPrice.toFixed(2)}` : '—'}</td>
                      <td className="px-3 py-2 text-zinc-600 max-w-24 truncate">{r.categoryName || '—'}</td>
                      <td className="px-3 py-2 text-zinc-500 max-w-24 truncate">{r.variantName || '—'}</td>
                      <td className="px-3 py-2 text-zinc-600">{r.stock ?? 0}</td>
                      <td className="px-3 py-2">
                        {r._valid ? (
                          <Badge variant="success">Válida</Badge>
                        ) : (
                          <span className="text-xs text-red-600">{r._error}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {invalidRows.length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Las filas con error serán omitidas. Solo se importarán los {validRows.length} productos válidos.
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('upload')} className="flex-1" disabled={submitting}>
                Volver
              </Button>
              <Button onClick={handleConfirm} className="flex-1" disabled={submitting || validRows.length === 0}>
                {submitting ? 'Importando...' : `Importar ${validRows.length} producto(s)`}
              </Button>
            </div>
          </>
        )}

        {/* ── STEP 3: Result ──────────────────────────────────────── */}
        {step === 'result' && result && (
          <>
            <div className="text-center space-y-3 py-2">
              <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center ${result.created > 0 ? 'bg-green-100' : 'bg-amber-100'}`}>
                {result.created > 0
                  ? <CheckCircle className="w-7 h-7 text-green-600" />
                  : <AlertTriangle className="w-7 h-7 text-amber-600" />}
              </div>
              <div>
                <p className="text-base font-semibold text-zinc-900">
                  {result.created} producto{result.created !== 1 ? 's' : ''} importado{result.created !== 1 ? 's' : ''}
                </p>
                {result.errors.length > 0 && (
                  <p className="text-sm text-red-600">{result.errors.length} fila(s) con error durante la importación</p>
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

            <Button onClick={handleClose} className="w-full">Cerrar</Button>
          </>
        )}
      </div>
    </Modal>
  );
}
