'use client';

import Link from 'next/link';
import { Package, Clock } from 'lucide-react';
import { useOpenPackage } from '@/hooks/use-open-package';

export function OpenPackageBanner() {
  const { hasActivePackage, timeRemaining, loading } = useOpenPackage();

  if (loading || !hasActivePackage) return null;

  const { days, hours, minutes } = timeRemaining;

  return (
    <div className="bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-white py-2 px-4 shadow-md">
      <div className="container mx-auto flex items-center justify-center gap-4 text-sm md:text-base">
        <Package className="w-5 h-5 flex-shrink-0" />
        <span className="font-medium">Votre colis ouvert est actif</span>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span className="font-mono font-bold">
            {days}j : {hours.toString().padStart(2, '0')}h : {minutes.toString().padStart(2, '0')}m
          </span>
        </div>
        <Link
          href="/account/open-package"
          className="ml-2 underline hover:no-underline"
        >
          Voir les détails
        </Link>
      </div>
    </div>
  );
}
