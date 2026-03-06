'use client';

/**
 * Global toast system — renderiza notificaciones en un portal al nivel del <body>.
 * Cualquier componente puede llamar a useGlobalToast() sin necesidad de un ToastContainer local.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Receipt,
  BadgeCheck,
  X,
  Copy,
  Check,
} from 'lucide-react';

// ── Tipos ────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  /** Tipo / color del toast */
  type?: ToastType;
  /** Título en negrita (opcional) */
  title?: string;
  /** Mensaje principal */
  message: string;
  /** Código para mostrar con botón copiar (ej. VTA-20260306-0001) */
  code?: string;
  /** Duración en ms (default 5 000) */
  duration?: number;
}

interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  code?: string;
  duration: number;
  exiting: boolean;
}

interface ToastContextValue {
  show: (opts: ToastOptions) => void;
  success: (message: string, opts?: Partial<Omit<ToastOptions, 'type' | 'message'>>) => void;
  error:   (message: string, opts?: Partial<Omit<ToastOptions, 'type' | 'message'>>) => void;
  warning: (message: string, opts?: Partial<Omit<ToastOptions, 'type' | 'message'>>) => void;
  info:    (message: string, opts?: Partial<Omit<ToastOptions, 'type' | 'message'>>) => void;
}

// ── Context ──────────────────────────────────────────────────────

const ToastCtx = createContext<ToastContextValue | null>(null);

// ── Estilos por tipo ─────────────────────────────────────────────

const STYLES: Record<ToastType, {
  wrapper: string;
  icon: React.ReactNode;
  bar: string;
}> = {
  success: {
    wrapper: 'bg-white border border-green-200 shadow-[0_4px_24px_rgba(0,0,0,0.12)]',
    icon: <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />,
    bar: 'bg-green-500',
  },
  error: {
    wrapper: 'bg-white border border-red-200 shadow-[0_4px_24px_rgba(0,0,0,0.12)]',
    icon: <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />,
    bar: 'bg-red-500',
  },
  warning: {
    wrapper: 'bg-white border border-amber-200 shadow-[0_4px_24px_rgba(0,0,0,0.12)]',
    icon: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />,
    bar: 'bg-amber-400',
  },
  info: {
    wrapper: 'bg-white border border-blue-200 shadow-[0_4px_24px_rgba(0,0,0,0.12)]',
    icon: <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />,
    bar: 'bg-blue-500',
  },
};

// ── Componente individual de toast ───────────────────────────────

function ToastCard({
  toast,
  onRemove,
}: {
  toast: ToastItem;
  onRemove: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(100);
  const startRef = useRef(Date.now());
  const rafRef = useRef<number>(0);

  const style = STYLES[toast.type];

  // Barra de progreso animada
  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.max(0, 100 - (elapsed / toast.duration) * 100);
      setProgress(pct);
      if (pct > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [toast.duration]);

  const handleCopy = () => {
    if (!toast.code) return;
    navigator.clipboard.writeText(toast.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl pointer-events-auto w-80
        ${style.wrapper}
        ${toast.exiting ? 'animate-toast-out' : 'animate-toast-in'}
      `}
      role="alert"
    >
      {/* Body */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        {style.icon}

        <div className="flex-1 min-w-0">
          {toast.title && (
            <p className="text-sm font-semibold text-gray-900 leading-snug">{toast.title}</p>
          )}
          <p className={`text-sm text-gray-600 leading-snug ${toast.title ? 'mt-0.5' : ''}`}>
            {toast.message}
          </p>

          {/* Código con botón copiar */}
          {toast.code && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium tracking-wide">
                {toast.code}
              </span>
              <button
                onClick={handleCopy}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
                title="Copiar código"
              >
                {copied
                  ? <Check className="w-3 h-3 text-green-500" />
                  : <Copy className="w-3 h-3" />
                }
              </button>
            </div>
          )}
        </div>

        {/* Cerrar */}
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-gray-600 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Barra de progreso */}
      <div className="h-1 w-full bg-gray-100">
        <div
          className={`h-full transition-none ${style.bar}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ── Provider ─────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const remove = useCallback((id: string) => {
    // Anima la salida antes de quitar del DOM
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const show = useCallback((opts: ToastOptions) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const item: ToastItem = {
      id,
      type: opts.type ?? 'info',
      title: opts.title,
      message: opts.message,
      code: opts.code,
      duration: opts.duration ?? 5000,
      exiting: false,
    };
    setToasts((prev) => [...prev, item]);
    setTimeout(() => remove(id), item.duration);
  }, [remove]);

  const success = useCallback(
    (message: string, opts?: Partial<Omit<ToastOptions, 'type' | 'message'>>) =>
      show({ ...opts, type: 'success', message }),
    [show],
  );
  const error = useCallback(
    (message: string, opts?: Partial<Omit<ToastOptions, 'type' | 'message'>>) =>
      show({ ...opts, type: 'error', message }),
    [show],
  );
  const warning = useCallback(
    (message: string, opts?: Partial<Omit<ToastOptions, 'type' | 'message'>>) =>
      show({ ...opts, type: 'warning', message }),
    [show],
  );
  const info = useCallback(
    (message: string, opts?: Partial<Omit<ToastOptions, 'type' | 'message'>>) =>
      show({ ...opts, type: 'info', message }),
    [show],
  );

  const value: ToastContextValue = { show, success, error, warning, info };

  return (
    <ToastCtx.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <div
            className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 items-end pointer-events-none"
            aria-live="polite"
            aria-label="Notificaciones"
          >
            {toasts.map((t) => (
              <ToastCard key={t.id} toast={t} onRemove={remove} />
            ))}
          </div>,
          document.body,
        )}
    </ToastCtx.Provider>
  );
}

// ── Hook público ─────────────────────────────────────────────────

export function useGlobalToast(): ToastContextValue {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useGlobalToast must be used inside <ToastProvider>');
  return ctx;
}
