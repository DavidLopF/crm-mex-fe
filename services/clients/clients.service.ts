import { get } from '@/services/http-client';
import { ClientListItem, PriceHistoryItem } from './clients.types';

const BASE_PATH = '/api/clients';

/**
 * Obtener lista simple de todos los clientes (para selects/dropdowns)
 * GET /api/clients
 */
export async function getAllClients(): Promise<ClientListItem[]> {
  try {
    const response = await get<ClientListItem[]>(BASE_PATH);
    return response;
  } catch (err) {
    console.error('Error al obtener clientes:', err);
    throw err;
  }
}

/**
 * Obtener historial de precios de un producto para un cliente específico
 * GET /api/clients/:clientId/price-history/:productId
 */
export async function getClientPriceHistory(
  clientId: number | string,
  productId: number | string
): Promise<PriceHistoryItem[]> {
  try {
    const response = await get<PriceHistoryItem[]>(
      `${BASE_PATH}/${clientId}/price-history/${productId}`
    );
    return response;
  } catch (err) {
    console.error('Error al obtener historial de precios:', err);
    throw err;
  }
}
