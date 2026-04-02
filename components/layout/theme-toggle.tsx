'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="inline-flex h-9 flex-shrink-0 items-center gap-1 rounded-full border border-zinc-200 bg-white p-1 text-xs font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-600"
    >
      <span
        className={[
          'inline-flex h-7 min-w-[62px] items-center justify-center gap-1 rounded-full px-2 transition-colors',
          !isDark
            ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900'
            : 'text-zinc-500 dark:text-zinc-400',
        ].join(' ')}
      >
        <Sun className="h-3.5 w-3.5" />
        <span>Claro</span>
      </span>

      <span
        className={[
          'inline-flex h-7 min-w-[70px] items-center justify-center gap-1 rounded-full px-2 transition-colors',
          isDark
            ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900'
            : 'text-zinc-500 dark:text-zinc-400',
        ].join(' ')}
      >
        <Moon className="h-3.5 w-3.5" />
        <span>Oscuro</span>
      </span>
    </button>
  );
}
