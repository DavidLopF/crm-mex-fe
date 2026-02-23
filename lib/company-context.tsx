'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import type { CompanySettings } from '@/services/company';
import { DEFAULT_COMPANY_SETTINGS } from '@/services/company';

const STORAGE_KEY = 'crm-company-settings';

interface CompanyContextValue {
  settings: CompanySettings;
  updateSettings: (newSettings: CompanySettings) => void;
}

const CompanyContext = createContext<CompanyContextValue>({
  settings: DEFAULT_COMPANY_SETTINGS,
  updateSettings: () => {},
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

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CompanySettings>(() => loadFromStorage());
  const appliedRef = useRef(false);

  // Apply CSS custom properties whenever settings change
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', settings.primaryColor);
    root.style.setProperty('--accent-color', settings.accentColor);
    appliedRef.current = true;
  }, [settings]);

  const updateSettings = (newSettings: CompanySettings) => {
    setSettings(newSettings);
    saveToStorage(newSettings);
  };

  return (
    <CompanyContext.Provider value={{ settings, updateSettings }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  return useContext(CompanyContext);
}
