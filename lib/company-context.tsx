'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import type { CompanySettings } from '@/services/company';
import { DEFAULT_COMPANY_SETTINGS, getCompanySettings } from '@/services/company';
import { useAuth } from '@/lib/auth-context';

const COMPANY_PUBLIC_PAGES = ['/login', '/forgot-password', '/reset-password'];

const STORAGE_KEY = 'crm-configurations';

interface CompanyContextValue {
  settings: CompanySettings;
  isLoading: boolean;
  updateSettings: (newSettings: CompanySettings) => void;
  refreshSettings: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextValue>({
  settings: DEFAULT_COMPANY_SETTINGS,
  isLoading: true,
  updateSettings: () => {},
  refreshSettings: async () => {},
});

function loadFromStorage(): CompanySettings {
  if (typeof window === 'undefined') return DEFAULT_COMPANY_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_COMPANY_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return DEFAULT_COMPANY_SETTINGS;
}

function saveToStorage(settings: CompanySettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

function applyThemeVars(settings: CompanySettings) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--primary-color', settings.primaryColor);
  root.style.setProperty('--accent-color', settings.accentColor);
}

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CompanySettings>(() => loadFromStorage());
  const [isLoading, setIsLoading] = useState(true);
  const fetchedRef = useRef(false);
  const { isSuperAdmin, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const isPublicPage = COMPANY_PUBLIC_PAGES.includes(pathname);

  // Apply CSS custom properties whenever settings change
  useEffect(() => {
    applyThemeVars(settings);
  }, [settings]);

  // Fetch settings from API on mount (only once).
  // Super Admins no tienen empresa asociada — omitir la llamada para evitar el 403.
  // En páginas públicas (login, forgot-password, reset-password) no hacer fetch:
  // evita disparar 'auth-session-expired' cuando hay tokens expirados en localStorage.
  useEffect(() => {
    if (!isAuthenticated || isPublicPage) {
      setIsLoading(false);
      return;
    }
    if (isSuperAdmin) {
      setIsLoading(false);
      return;
    }
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    getCompanySettings()
      .then((remote) => {
        setSettings(remote);
        saveToStorage(remote);
      })
      .catch(() => {
        // API failed — keep localStorage / default values (already loaded)
      })
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, isSuperAdmin, isPublicPage]);

  const updateSettings = useCallback((newSettings: CompanySettings) => {
    setSettings(newSettings);
    saveToStorage(newSettings);
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const remote = await getCompanySettings();
      setSettings(remote);
      saveToStorage(remote);
    } catch {
      // keep current
    }
  }, []);

  return (
    <CompanyContext.Provider value={{ settings, isLoading, updateSettings, refreshSettings }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  return useContext(CompanyContext);
}
