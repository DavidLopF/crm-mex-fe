export interface OrderVariant {
  id: number;
  sku: string;
  variantName: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  variantId: number;
  qty: number;
  unitPrice: string;
  listPrice: string;
  currency: string;
  lineTotal: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  variant: OrderVariant;
}

export interface OrderClient {
  id: number;
  name: string;
  document: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  code: string;
  client: OrderClient;
  total: string;
  currency: string;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderStatus {
  statusId: number;
  statusCode: string;
  statusLabel: string;
  orderCount: number;
  orders: Order[];
}

export interface GetOrdersResponse {
  data: OrderStatus[];
}

export interface CreateOrderDto {
  clientId: number;
  items: {
    variantId: number;
    qty: number;
    unitPrice: number;
    listPrice: number;
    description?: string;
  }[];
  currency?: string;
}

// ── Códigos de estado de pedidos (según DB) ────────────────────────
export enum OrderStatusCode {
  COTIZADO = 1,
  TRANSMITIDO = 2,
  EN_CURSO = 3,
  CANCELADO = 4,
  ENVIADO = 5,
}

export const ORDER_STATUS_LABELS: Record<OrderStatusCode, string> = {
  [OrderStatusCode.COTIZADO]: 'COTIZADO',
  [OrderStatusCode.TRANSMITIDO]: 'TRANSMITIDO',
  [OrderStatusCode.EN_CURSO]: 'EN_CURSO',
  [OrderStatusCode.CANCELADO]: 'CANCELADO',
  [OrderStatusCode.ENVIADO]: 'ENVIADO',
};

// ── DTO para cambio de estado ──────────────────────────────────────
export interface ChangeOrderStatusDto {
  newStatusCode: number;
  userId: number;
}

// ── Reglas de transición de estados ────────────────────────────────
export interface StatusTransitionRule {
  allowedFrom: OrderStatusCode[];
  errorMessage: string;
}

export const STATUS_TRANSITION_RULES: Record<OrderStatusCode, StatusTransitionRule> = {
  [OrderStatusCode.COTIZADO]: {
    allowedFrom: [OrderStatusCode.CANCELADO], // Permitir retomar desde cancelado
    errorMessage: 'Solo se puede retomar a COTIZADO desde CANCELADO',
  },
  [OrderStatusCode.TRANSMITIDO]: {
    allowedFrom: [OrderStatusCode.COTIZADO],
    errorMessage: 'La orden debe estar en estado COTIZADO para cambiar a TRANSMITIDO',
  },
  [OrderStatusCode.EN_CURSO]: {
    allowedFrom: [OrderStatusCode.TRANSMITIDO],
    errorMessage: 'La orden debe estar en estado TRANSMITIDO para cambiar a EN_CURSO',
  },
  [OrderStatusCode.ENVIADO]: {
    allowedFrom: [OrderStatusCode.EN_CURSO],
    errorMessage: 'La orden debe estar en estado EN_CURSO para cambiar a ENVIADO',
  },
  [OrderStatusCode.CANCELADO]: {
    allowedFrom: [OrderStatusCode.COTIZADO, OrderStatusCode.TRANSMITIDO, OrderStatusCode.EN_CURSO],
    errorMessage: 'Solo se puede cancelar desde COTIZADO, TRANSMITIDO o EN_CURSO',
  },
};

/**
 * Valida si una transición de estado es válida según las reglas de negocio
 */
export function canTransitionToStatus(
  currentStatusCode: string,
  newStatusCode: OrderStatusCode
): { valid: boolean; error?: string } {
  const rule = STATUS_TRANSITION_RULES[newStatusCode];
  
  if (!rule) {
    return { valid: false, error: 'Código de estado no válido' };
  }

  // Convertir el código actual a número
  const currentCode = Object.entries(ORDER_STATUS_LABELS).find(
    ([, label]) => label === currentStatusCode
  )?.[0];

  if (!currentCode) {
    return { valid: false, error: 'Estado actual no válido' };
  }

  const currentCodeNum = parseInt(currentCode) as OrderStatusCode;

  if (!rule.allowedFrom.includes(currentCodeNum)) {
    return { valid: false, error: rule.errorMessage };
  }

  return { valid: true };
}

/**
 * Obtiene los estados disponibles para transicionar desde el estado actual
 */
export function getAvailableTransitions(currentStatusCode: string): OrderStatusCode[] {
  const currentCode = Object.entries(ORDER_STATUS_LABELS).find(
    ([, label]) => label === currentStatusCode
  )?.[0];

  if (!currentCode) {
    return [];
  }

  const currentCodeNum = parseInt(currentCode) as OrderStatusCode;

  // Retornar los estados que permiten transición desde el estado actual
  return Object.entries(STATUS_TRANSITION_RULES)
    .filter(([, rule]) => rule.allowedFrom.includes(currentCodeNum))
    .map(([code]) => parseInt(code) as OrderStatusCode);
}
