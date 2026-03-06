'use client';

import { ReactNode } from 'react';
import { CompanyProvider } from '@/lib/company-context';
import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/lib/toast-context';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CompanyProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </CompanyProvider>
    </AuthProvider>
  );
}
