'use client';

import { PosDashboardCards, SalesList, CierreCajaModerno, CashCloseHistory } from '@/components/pos';
import { PermissionGuard } from '@/components/layout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { BarChart3, History, Lock, Receipt } from 'lucide-react';

export default function PosReportesPage() {
  return (
    <PermissionGuard moduleCode="POS">
      <main className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Reportes POS</h1>
            <p className="text-zinc-500 text-sm font-medium">Gestiona tus ventas y cierres de caja en un solo lugar</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-zinc-100 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Datos en Tiempo Real</span>
          </div>
        </div>

        <Tabs defaultValue="ventas" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="ventas" className="gap-2">
              <Receipt className="w-4 h-4" />
              Historial de Ventas
            </TabsTrigger>
            <TabsTrigger value="cierre" className="gap-2">
              <Lock className="w-4 h-4" />
              Cierre de Caja
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: VENTAS (Prioridad) */}
          <TabsContent value="ventas" className="space-y-10">
            {/* Dashboard Cards Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 ml-1">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">Indicadores Clave</h2>
              </div>
              <PosDashboardCards />
            </section>

            {/* Lista de ventas */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 ml-1">
                <History className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">Transacciones Recientes</h2>
              </div>
              <SalesList />
            </section>
          </TabsContent>

          {/* TAB 2: CIERRE DE CAJA */}
          <TabsContent value="cierre" className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Formulario de cierre actual */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-2 ml-1">
                  <Lock className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">Nuevo Cierre</h2>
                </div>
                <CierreCajaModerno />
              </div>

              {/* Histórico de cierres */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-2 ml-1">
                  <History className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">Histórico de Cierres</h2>
                </div>
                <CashCloseHistory />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </PermissionGuard>
  );
}
