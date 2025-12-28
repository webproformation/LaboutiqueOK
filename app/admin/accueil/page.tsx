'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderTree, Image } from 'lucide-react';

export default function AccueilAdminPage() {
  const sections = [
    {
      title: 'Catégories Accueil',
      description: 'Gérer les catégories affichées sur la page d\'accueil',
      icon: FolderTree,
      href: '/admin/home-categories',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Slides Accueil',
      description: 'Gérer le carrousel d\'images de la page d\'accueil',
      icon: Image,
      href: '/admin/slides',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion de l'Accueil</h1>
        <p className="text-gray-600 mt-2">
          Gérez le contenu de votre page d'accueil
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
