'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Database, BarChart } from 'lucide-react';

export default function SiteAdminPage() {
  const sections = [
    {
      title: 'Clients',
      description: 'Gérer les comptes et profils clients',
      icon: Users,
      href: '/admin/customers',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Sauvegardes',
      description: 'Gérer les sauvegardes de la base de données',
      icon: Database,
      href: '/admin/backups',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Analytics',
      description: 'Consulter les statistiques du site',
      icon: BarChart,
      href: '/admin/analytics',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion du Site</h1>
        <p className="text-gray-600 mt-2">
          Gérez les paramètres et données globales du site
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-[#b8933d]">
              <CardHeader>
                <div className={`w-12 h-12 ${section.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                  <section.icon className={`w-6 h-6 ${section.color}`} />
                </div>
                <CardTitle className="text-xl">{section.title}</CardTitle>
                <CardDescription className="text-base">
                  {section.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-[#b8933d] font-medium hover:underline">
                  Accéder à la gestion →
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
