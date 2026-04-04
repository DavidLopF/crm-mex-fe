'use client';

import { useState, useRef, useCallback } from 'react';
import { ShieldCheck, ShieldAlert, Upload, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';

interface CertificateCardProps {
  companyId: number;
  hasCertificate: boolean;
  onUpload: (certificateB64: string, password: string) => Promise<void>;
  submitting?: boolean;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target!.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function CertificateCard({ hasCertificate, onUpload, submitting }: CertificateCardProps) {
  const [file, setFile]               = useState<File | null>(null);
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fileError, setFileError]     = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((selected: File) => {
    setFileError('');
    if (!selected.name.endsWith('.p12') && !selected.name.endsWith('.pfx')) {
      setFileError('Solo se aceptan archivos .p12 o .pfx');
      return;
    }
    if (selected.size > 2 * 1024 * 1024) {
      setFileError('El archivo supera el límite de 2 MB');
      return;
    }
    setFile(selected);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f) handleFileSelect(f);
    },
    [handleFileSelect],
  );

  const handleSubmit = async () => {
    if (!file || !password.trim() || submitting) return;
    try {
      const b64 = await readFileAsBase64(file);
      await onUpload(b64, password.trim());
      // Limpiar tras éxito
      setFile(null);
      setPassword('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      // El error ya lo maneja el padre con toast
    }
  };

  const canSubmit = !!file && password.trim().length > 0 && !submitting && !fileError;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          hasCertificate ? 'bg-green-100' : 'bg-amber-100'
        }`}>
          {hasCertificate ? (
            <ShieldCheck className="w-5 h-5 text-green-600" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-amber-600" />
          )}
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-800">Certificado DIAN (.p12)</h2>
          <p className={`text-sm ${hasCertificate ? 'text-green-600' : 'text-amber-600'}`}>
            {hasCertificate ? 'Certificado cargado' : 'Sin certificado — no puede emitir facturas'}
          </p>
        </div>
      </div>

      {/* Zona de upload */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
          file
            ? 'border-green-400 bg-green-50'
            : 'border-zinc-200 hover:border-blue-400 hover:bg-blue-50/40'
        }`}
      >
        <Upload className={`w-6 h-6 mx-auto mb-2 ${file ? 'text-green-500' : 'text-zinc-400'}`} />
        {file ? (
          <p className="text-sm text-green-700 font-medium">
            {file.name} ({(file.size / 1024).toFixed(0)} KB)
          </p>
        ) : (
          <>
            <p className="text-sm text-zinc-600 font-medium">
              {hasCertificate ? 'Arrastrar nuevo certificado aquí o hacer clic' : 'Arrastrar certificado aquí o hacer clic'}
            </p>
            <p className="text-xs text-zinc-400 mt-1">Archivos .p12 o .pfx · máx. 2 MB</p>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".p12,.pfx"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
      />

      {fileError && (
        <p className="text-xs text-red-600">{fileError}</p>
      )}

      {/* Contraseña */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
          Contraseña del certificado
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña del .p12"
            autoComplete="new-password"
            className="w-full px-3 py-2 pr-10 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Acción */}
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {submitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Subiendo...
            </span>
          ) : (
            hasCertificate ? 'Reemplazar certificado' : 'Subir certificado'
          )}
        </Button>
      </div>
    </div>
  );
}
