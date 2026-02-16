import { get, post } from '../http-client';
import { CreateOrderDto, Order, OrderStatus } from './orders.types';

/**
 * Obtiene todos los pedidos agrupados por estado
 * El backend responde con { success: true, data: OrderStatus[] }
 * El http-client automáticamente extrae y devuelve solo el .data
 */
export async function getOrders(): Promise<OrderStatus[]> {
  return get<OrderStatus[]>('/api/orders');
}

/**
 * Crea un nuevo pedido
 */
export async function createOrder(dto: CreateOrderDto): Promise<Order> {
  return post<Order>('/orders', dto);
}
