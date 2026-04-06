'use client';

import { Card } from '@/components/ui';

export function ParafiscalTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="h-10 bg-zinc-100 rounded-lg flex-1 max-w-md" />
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 w-20 bg-zinc-100 rounded-lg" />
          ))}
        </div>
        <div className="h-10 w-36 bg-zinc-100 rounded-lg ml-auto" />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                {['Entidad', 'Tipo', 'Documento', 'Teléfono', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} className="px-6 py-4 text-left">
                    <div className="h-3 w-16 bg-zinc-200 rounded" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {Array.from({ length: rows }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-zinc-100 rounded-full" />
                      <div className="space-y-1.5">
                        <div className="h-3 w-36 bg-zinc-200 rounded" />
                        <div className="h-2.5 w-24 bg-zinc-100 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><div className="h-6 w-16 bg-zinc-100 rounded-full" /></td>
                  <td className="px-6 py-4"><div className="h-3 w-24 bg-zinc-100 rounded" /></td>
                  <td className="px-6 py-4"><div className="h-3 w-20 bg-zinc-100 rounded" /></td>
                  <td className="px-6 py-4"><div className="h-6 w-14 bg-zinc-100 rounded-full" /></td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      <div className="h-8 w-8 bg-zinc-100 rounded-lg" />
                      <div className="h-8 w-8 bg-zinc-100 rounded-lg" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center px-6 py-4 border-t border-zinc-100">
          <div className="h-3 w-32 bg-zinc-100 rounded" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-8 w-8 bg-zinc-100 rounded-lg" />)}
          </div>
        </div>
      </Card>
    </div>
  );
}
