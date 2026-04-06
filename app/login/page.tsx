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
  UserCircle,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const REMEMBER_KEY = 'crm-remember-me';

function loadRemembered(): { login: string; password: string } | null {
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
  const [login, setLogin] = useState(remembered?.login ?? '');
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
    if (!login.trim() || !password.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }
    if (rememberMe) {
      localStorage.setItem(REMEMBER_KEY, JSON.stringify({ login, password }));
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
    setLoading(true);
    try {
      const data = await loginService({ login, password });
      setSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const primaryColor = settings.primaryColor ?? '#2563eb';
  const accentColor = settings.accentColor ?? '#3b82f6';

  return (
    <div className="min-h-screen flex bg-zinc-50 font-sans selection:bg-primary selection:text-primary-foreground">

      {/* ═══ Left Panel — Branding & Atmosphere ═══ */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-primary items-center justify-center">
        
        {/* Deep Mesh Gradient Background */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full opacity-40 blur-[120px]" 
            style={{ backgroundColor: primaryColor }}
          />
          <div 
            className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-30 blur-[100px]" 
            style={{ backgroundColor: accentColor }}
          />
          <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px]" />
        </div>

        {/* Decorative Grid */}
        <div className="absolute inset-0 z-1 opacity-[0.15] mix-blend-overlay"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />

        {/* Content */}
        <div className="relative z-10 w-full max-w-lg px-12 animate-fadeIn space-y-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
               <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl">
                 <ShieldCheck className="w-7 h-7 text-white" />
               </div>
               <div className="h-px w-12 bg-white/20" />
               <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.3em]">Sistema de Gestión</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-black text-white leading-[1.1] tracking-tighter">
              Potencia tu <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-white via-white to-white/40">Negocio Hoy.</span>
            </h1>
            
            <p className="text-lg text-white/60 font-medium leading-relaxed max-w-md">
              La plataforma CRM diseñada para escalar empresas con control absoluto de inventario y ventas.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Control Total', icon: Zap },
              { label: 'Tiempo Real', icon: Package },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <item.icon className="w-5 h-5 text-white mb-3" />
                <p className="text-sm font-bold text-white tracking-tight">{item.label}</p>
              </div>
            ))}
          </div>
          
        </div>
      </div>

      {/* ═══ Right Panel — Form ═══ */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 md:p-12 relative">
        {/* Mobile decorative blobs */}
        <div className="lg:hidden absolute top-0 right-0 w-64 h-64 bg-zinc-200 rounded-full blur-3xl opacity-50 -z-10" />
        
        <div className="w-full max-w-md space-y-10 animate-slideUp">
          
          <div className="space-y-3">
             <div className="lg:hidden w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl mb-6" style={{ backgroundColor: primaryColor }}>
                <Package className="w-7 h-7 text-white" />
             </div>
             <h2 className="text-4xl font-black text-zinc-900 tracking-tight">Ingresar</h2>
             <p className="text-base font-medium text-zinc-500">Bienvenido. Por favor introduce tus credenciales.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold animate-fadeIn">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-5">
              {/* Login — correo o usuario */}
              <div className="space-y-2">
                <label htmlFor="login" className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">
                  Correo o Usuario
                </label>
                <div className="relative group">
                  <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-primary transition-colors" />
                  <input
                    id="login"
                    type="text"
                    autoComplete="username"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    placeholder="ejemplo@empresa.com o juan.escamilla"
                    className="w-full h-14 pl-12 pr-4 bg-white border-2 border-zinc-100 rounded-2xl text-sm font-bold text-zinc-900 placeholder:text-zinc-300 transition-all focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 shadow-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">
                  Contraseña
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-primary transition-colors" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-14 pl-12 pr-12 bg-white border-2 border-zinc-100 rounded-2xl text-sm font-bold text-zinc-900 placeholder:text-zinc-300 transition-all focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-primary transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer w-5 h-5 rounded-lg border-2 border-zinc-200 checked:bg-primary checked:border-primary transition-all cursor-pointer appearance-none"
                  />
                  <ShieldCheck className="w-3 h-3 text-primary-foreground absolute opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                </div>
                <span className="text-sm font-bold text-zinc-500 group-hover:text-primary transition-colors">Recordarme</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-bold text-zinc-400 hover:text-primary transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all hover:opacity-90 hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 shadow-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  Entrar ahora
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="pt-8 text-center">
             <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
               © {new Date().getFullYear()} {settings.companyName}
             </p>
             <p className="text-[10px] font-medium text-zinc-300 mt-2 italic">
               Hecho con pasión para empresas que crecen.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
