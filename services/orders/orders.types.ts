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
