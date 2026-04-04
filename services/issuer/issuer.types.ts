export interface IssuerDto {
  id: number;
  companyId: number;
  companyName: string;
  nit: string;
  nitDv: string;
  address: string;
  cityCode: string;
  cityName: string;
  departmentCode: string;
  departmentName: string;
  phone?: string | null;
  email?: string | null;
  taxRegime: string;
  taxLiability: string;
  softwareId: string;
  resolutionNumber: string;
  resolutionDate: string;
  prefix: string;
  rangeStart: number;
  rangeEnd: number;
  currentNumber: number;
  testSetId?: string | null;
  isProduction: boolean;
  hasCertificate: boolean;
  updatedAt: string;
}

export interface UpsertIssuerDto {
  companyName: string;
  nit: string;
  nitDv: string;
  address: string;
  cityCode: string;
  cityName: string;
  departmentCode: string;
  departmentName: string;
  phone?: string;
  email?: string;
  taxRegime: string;
  taxLiability: string;
  softwareId: string;
  softwarePin: string;
  resolutionNumber: string;
  resolutionDate: string;
  prefix: string;
  rangeStart: number;
  rangeEnd: number;
  testSetId?: string;
  isProduction?: boolean;
}
