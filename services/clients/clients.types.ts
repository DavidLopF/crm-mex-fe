// ── Lista simple de clientes para selects ──────────────────────────
export interface ClientListItem {
  id: number;
  name: string;
}

// ── Historial de precios de un cliente para un producto ────────────
export interface PriceHistoryItem {
  id: number;
  productId: number;
  productName: string;
  clientId: number;
  price: number;
  quantity: number;
  orderId: number;
  orderNumber: string;
  orderDate: string;
  currency: string;
}
