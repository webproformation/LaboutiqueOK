'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingCart, Gamepad2, Ticket, Star, MessageSquare, FolderTree, FileText } from 'lucide-react';

export default function BoutiqueAdminPage() {
  const sections = [
    {
      title: 'Produits',
      description: 'Gérer le catalogue de produits',
      icon: Package,
      href: '/admin/products',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Catégories',
      description: 'Gérer les catégories de produits',
      icon: FolderTree,
      href: '/admin/categories-management',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Commandes',
      description: 'Suivre et gérer les commandes clients',
      icon: ShoppingCart,
      href: '/admin/orders',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Factures',
      description: 'Consulter et gérer les factures',
      icon: FileText,
      href: '/admin/factures',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
    },
    {
      title: 'Gestion des Jeux',
      description: 'Configurer les jeux et récompenses',
      icon: Gamepad2,
      href: '/admin/games',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Coupons',
      description: 'Créer et gérer les codes promotionnels',
      icon: Ticket,
      href: '/admin/coupons',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Avis clients',
      description: 'Modérer les avis et commentaires',
      icon: Star,
      href: '/admin/reviews',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Messages de contact',
      description: 'Consulter les messages des clients',
      icon: MessageSquare,
      href: '/admin/contact-messages',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion de la Boutique</h1>
        <p className="text-gray-600 mt-2">
          Gérez tous les aspects de votre boutique en ligne
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
