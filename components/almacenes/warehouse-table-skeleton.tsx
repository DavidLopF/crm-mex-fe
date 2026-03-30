'use client';

import { Card } from '@/components/ui';

export function WarehouseTableSkeleton() {
  return (
    <Card className="overflow-hidden">
      {/* Toolbar skeleton */}
      <div className="p-4 border-b border-zinc-200 flex items-center justify-between gap-3">
        <div className="h-9 w-56 bg-zinc-200 rounded-lg animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-zinc-200 rounded-lg animate-pulse" />
          <div className="h-9 w-32 bg-zinc-200 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              {['Nombre', 'Estado', 'Creado', 'Acciones'].map((h) => (
                <th key={h} className="px-4 py-3 text-left">
                  <div className="h-4 w-20 bg-zinc-200 rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <div className="h-4 w-40 bg-zinc-200 rounded animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-5 w-16 bg-zinc-200 rounded-full animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-24 bg-zinc-200 rounded animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <div className="h-7 w-7 bg-zinc-200 rounded animate-pulse" />
                    <div className="h-7 w-7 bg-zinc-200 rounded animate-pulse" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
