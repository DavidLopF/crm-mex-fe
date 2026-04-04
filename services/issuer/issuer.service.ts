import { get, put } from '@/services/http-client';
import type { IssuerDto, UpsertIssuerDto } from './issuer.types';

const BASE = '/api/issuer';

export async function getIssuer(): Promise<IssuerDto | null> {
  try {
    return await get<IssuerDto>(BASE);
  } catch (e: any) {
    if (e?.status === 404) return null;
    throw e;
  }
}

export async function upsertIssuer(data: UpsertIssuerDto): Promise<IssuerDto> {
  return put<IssuerDto>(BASE, data);
}
