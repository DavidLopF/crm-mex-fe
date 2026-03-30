'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { login as loginService } from '@/services/auth';
import { useCompany } from '@/lib/company-context';
import {
  Package,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const REMEMBER_KEY = 'crm-remember-me';

function loadRemembered(): { email: string; password: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(REMEMBER_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

export default function LoginPage() {
  const { setSession } = useAuth();
  const { settings } = useCompany();

  const remembered = loadRemembered();
  const [email, setEmail] = useState(remembered?.email ?? '');
  const [password, setPassword] = useState(remembered?.password ?? '');
  const [rememberMe, setRememberMe] = useState(!!remembered);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!rememberMe) localStorage.removeItem(REMEMBER_KEY);
  }, [rememberMe]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }
    if (rememberMe) {
      localStorage.setItem(REMEMBER_KEY, JSON.stringify({ email, password }));
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
    setLoading(true);
    try {
      const data = await loginService({ email, password });
      setSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">

      {/* ═══ Panel Izquierdo — Branding ═══ */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center"
        style={{
          background: `linear-gradient(140deg, ${settings.primaryColor} 0%, ${settings.accentColor} 60%, ${settings.primaryColor}cc 100%)`,
        }}
      >
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        {/* Blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-white/5 blur-3xl" />

        {/* Content */}
        <div className="relative z-10 text-center px-12 animate-fadeIn">
          <div className="flex justify-center mb-8">
            <div style={{ animation: 'float 6s ease-in-out infinite' }}>
              <svg width="200" height="200" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
                <ellipse cx="110" cy="200" rx="70" ry="12" fill="rgba(0,0,0,0.1)" />
                <path d="M110 170 L50 135 L50 75 L110 110 Z" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                <path d="M110 170 L170 135 L170 75 L110 110 Z" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                <path d="M110 110 L50 75 L110 40 L170 75 Z" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                <rect x="72" y="65" width="10" height="25" rx="2" fill="rgba(255,255,255,0.6)" transform="skewY(-30) translate(32, 55)" />
                <rect x="88" y="55" width="10" height="35" rx="2" fill="rgba(255,255,255,0.8)" transform="skewY(-30) translate(32, 55)" />
                <rect x="104" y="60" width="10" height="30" rx="2" fill="rgba(255,255,255,0.5)" transform="skewY(-30) translate(32, 55)" />
                <rect x="120" y="50" width="10" height="40" rx="2" fill="rgba(255,255,255,0.9)" transform="skewY(-30) translate(32, 55)" />
                <circle cx="185" cy="55" r="2" fill="rgba(255,255,255,0.6)">
                  <animate attributeName="opacity" values="0.6;0.1;0.6" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="30" cy="110" r="1.5" fill="rgba(255,255,255,0.5)">
                  <animate attributeName="opacity" values="0.5;0.1;0.5" dur="3s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            {settings.companyName}
          </h1>
          <p className="text-base text-white/70 mb-10 max-w-xs mx-auto leading-relaxed">
            Sistema integral de gestión de inventarios, ventas y clientes
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            {['Inventario', 'Pedidos', 'Clientes', 'Reportes'].map((f) => (
              <span
                key={f}
                className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/85 text-xs font-medium backdrop-blur-sm"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Panel Derecho — Formulario ═══ */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-zinc-50">
        <div className="w-full max-w-sm animate-slideUp">

          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
              style={{ backgroundColor: settings.primaryColor }}
            >
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight tracking-tight">
              Bienvenido de nuevo
            </h2>
            <p className="text-sm text-zinc-500">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm animate-slideUp">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-zinc-700 block">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  autoComplete="email"
                  className={cn(
                    'w-full h-10 pl-10 pr-4 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900',
                    'placeholder:text-zinc-400 transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-zinc-900/15 focus:border-zinc-400'
                  )}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-zinc-700 block">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={cn(
                    'w-full h-10 pl-10 pr-11 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900',
                    'placeholder:text-zinc-400 transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-zinc-900/15 focus:border-zinc-400'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember + forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 accent-zinc-900 cursor-pointer"
                />
                <span className="text-sm text-zinc-600">Recordarme</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full h-10 px-4 rounded-lg text-white font-semibold text-sm',
                'flex items-center justify-center gap-2',
                'transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-[0.98]',
                'disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:active:scale-100'
              )}
              style={{
                background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.accentColor})`,
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Iniciando sesión…
                </>
              ) : (
                <>
                  Iniciar sesión
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-zinc-400">
            © {new Date().getFullYear()} {settings.companyName}. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
