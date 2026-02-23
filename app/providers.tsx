'use client';

import { ReactNode } from 'react';
import { CompanyProvider } from '@/lib/company-context';

export function Providers({ children }: { children: ReactNode }) {
  return <CompanyProvider>{children}</CompanyProvider>;
}
