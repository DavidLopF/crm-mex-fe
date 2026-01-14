import { EstadoPedido } from '@/types';

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getEstadoColor(estado: EstadoPedido): string {
  const colors: Record<EstadoPedido, string> = {
    borrador: 'bg-gray-100 text-gray-700',
    pendiente: 'bg-amber-100 text-amber-700',
    confirmado: 'bg-green-100 text-green-700',
    cancelado: 'bg-red-100 text-red-700',
  };
  return colors[estado];
}

export function getEstadoLabel(estado: EstadoPedido): string {
  const labels: Record<EstadoPedido, string> = {
    borrador: 'Borrador',
    pendiente: 'Pendiente',
    confirmado: 'Confirmado',
    cancelado: 'Cancelado',
  };
  return labels[estado];
}
