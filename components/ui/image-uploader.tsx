"use client";

import React, { useRef, useState, useCallback } from "react";
import { uploadImage, fileToBase64 } from "@/services/upload/upload.service";

interface ImageUploaderProps {
  /** Carpeta destino en S3: "products" | "users" | "clients" | "suppliers" */
  folder: string;
  /** URL actual (para mostrar preview) */
  currentUrl?: string | null;
  /** Callback cuando la URL cambia (tras subir o al limpiar) */
  onUrlChange: (url: string | null) => void;
  /** Texto de ayuda bajo el botón */
  hint?: string;
  /** Dimensiones del preview */
  previewSize?: "sm" | "md" | "lg";
}

const PREVIEW_SIZES = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
};

const MAX_FILE_SIZE_MB = 5;

export function ImageUploader({
  folder,
  currentUrl,
  onUrlChange,
  hint,
  previewSize = "md",
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      // Validar tipo
      if (!file.type.startsWith("image/")) {
        setError("Solo se permiten imágenes (JPG, PNG, WEBP, etc.)");
        return;
      }

      // Validar tamaño
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`El archivo no puede superar ${MAX_FILE_SIZE_MB}MB`);
        return;
      }

      setError(null);
      setUploading(true);

      try {
        // Preview local inmediato
        const base64 = await fileToBase64(file);
        setPreviewUrl(base64);

        // Subir a S3
        const url = await uploadImage(base64, folder);
        setPreviewUrl(url);
        onUrlChange(url);
      } catch {
        setError("Error al subir la imagen. Intenta de nuevo.");
        setPreviewUrl(currentUrl ?? null);
      } finally {
        setUploading(false);
      }
    },
    [folder, currentUrl, onUrlChange],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input para permitir seleccionar el mismo archivo de nuevo
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onUrlChange(null);
    setError(null);
  };

  const sizeClass = PREVIEW_SIZES[previewSize];

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`
          relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 transition-colors cursor-pointer
          ${dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
          ${uploading ? "pointer-events-none opacity-60" : ""}
        `}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      >
        {/* Preview */}
        {previewUrl ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview"
              className={`${sizeClass} rounded-lg object-cover shadow`}
            />
            {!uploading && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs shadow hover:bg-red-600"
                title="Eliminar imagen"
              >
                ✕
              </button>
            )}
          </div>
        ) : (
          <div className={`${sizeClass} flex flex-col items-center justify-center rounded-lg bg-gray-100`}>
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Estado de carga */}
        {uploading && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Subiendo…
          </div>
        )}

        {/* Texto de arrastrar/soltar */}
        {!uploading && !previewUrl && (
          <p className="text-xs text-gray-500 text-center">
            Arrastra una imagen o haz clic para seleccionar
          </p>
        )}

        {!uploading && previewUrl && (
          <p className="text-xs text-gray-400 text-center">Clic para cambiar imagen</p>
        )}

        {/* Input oculto */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {/* Hint */}
      {hint && !error && (
        <p className="text-xs text-gray-400">{hint}</p>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
