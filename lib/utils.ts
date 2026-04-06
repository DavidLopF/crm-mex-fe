import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { EstadoPedido } from '@/types';

const NUMBER_LOCALE = 'es-CO';
const CURRENCY_CODE = 'COP';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  },
): string {
  return new Intl.NumberFormat(NUMBER_LOCALE, {
    style: 'currency',
    currency: CURRENCY_CODE,
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(amount);
}

export function formatNumber(
  value: number,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  },
): string {
  return new Intl.NumberFormat(NUMBER_LOCALE, {
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(value);
}

export function formatPercentage(
  value: number,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  },
): string {
  return `${formatNumber(value * 100, {
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  })}%`;
}

export function formatCompactCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `${value < 0 ? '-' : ''}$${formatNumber(abs / 1_000_000)}M`;
  }
  if (abs >= 1_000) {
    return `${value < 0 ? '-' : ''}$${formatNumber(abs / 1_000)}k`;
  }
  return formatCurrency(value);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(NUMBER_LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Validar que la fecha sea válida
  if (isNaN(dateObj.getTime())) {
    return 'Fecha inválida';
  }
  
  return new Intl.DateTimeFormat(NUMBER_LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(dateObj);
}

export function getEstadoColor(estado: EstadoPedido): string {
  const colors: Record<EstadoPedido, string> = {
    cotizado: 'bg-blue-100 text-blue-700',
    transmitido: 'bg-purple-100 text-purple-700',
    en_curso: 'bg-orange-100 text-orange-700',
    enviado: 'bg-cyan-100 text-cyan-700',
    cancelado: 'bg-red-100 text-red-700',
  };
  return colors[estado];
}

export function getEstadoLabel(estado: EstadoPedido): string {
  const labels: Record<EstadoPedido, string> = {
    cotizado: 'Cotizado',
    transmitido: 'Transmitido',
    en_curso: 'En Curso',
    enviado: 'Enviado',
    cancelado: 'Cancelado',
  };
  return labels[estado];
}
