'use client';

import { ReactNode } from 'react';
import { CompanyProvider } from '@/lib/company-context';
import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/lib/toast-context';
import { OfflineProvider } from '@/lib/offline/offline-provider';
import { ConnectivityBanner } from '@/components/ui/connectivity-banner';
import { ThemeProvider } from '@/lib/theme-context';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <CompanyProvider>
          <ToastProvider>
            <OfflineProvider>
              <ConnectivityBanner />
              {children}
            </OfflineProvider>
          </ToastProvider>
        </CompanyProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
