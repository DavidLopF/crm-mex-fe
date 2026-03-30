'use client';

import { Building2, CheckCircle, XCircle, Users } from 'lucide-react';
import type { CompanyListItem } from '@/services/super-admin';

interface CompanyStatsProps {
  companies: CompanyListItem[];
  total: number;
}

export function CompanyStats({ companies = [], total }: CompanyStatsProps) {
  const active   = companies.filter((c) => c.isActive).length;
  const inactive = companies.filter((c) => !c.isActive).length;
  const totalUsers = companies.reduce((sum, c) => sum + (c.userCount || 0), 0);

  const cards = [
    {
      label: 'Total Empresas',
      value: total,
      icon: Building2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Activas',
      value: active,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Inactivas',
      value: inactive,
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
    {
      label: 'Usuarios Totales',
      value: totalUsers,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
            </div>
            <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
