'use client';

import { Card } from '@/components/ui';

export function WarehouseTableSkeleton() {
  return (
    <Card className="overflow-hidden">
      {/* Toolbar skeleton */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-3">
        <div className="h-9 w-56 bg-gray-200 rounded-lg animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-9 w-32 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Nombre', 'Estado', 'Creado', 'Acciones'].map((h) => (
                <th key={h} className="px-4 py-3 text-left">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <div className="h-7 w-7 bg-gray-200 rounded animate-pulse" />
                    <div className="h-7 w-7 bg-gray-200 rounded animate-pulse" />
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
